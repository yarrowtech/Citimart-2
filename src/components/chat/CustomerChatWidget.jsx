import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaCommentDots, FaTimes, FaHeadset } from "react-icons/fa";
import { API_BASE } from "../../config";
import styles from "./CustomerChatWidget.module.css";

const POLL_MS = 6000;
const CLOSED_POLL_MS = 20000;
const STORAGE_KEY = "citimart_support_conversation_id";

const getToken = () => localStorage.getItem("token");

const STATUS_LABEL = {
  bot: "CitiMart Assistant",
  waiting: "Waiting for an agent…",
  open: "Chatting with support",
  resolved: "Resolved",
};

const CustomerChatWidget = () => {
  const token = getToken();
  const [open, setOpen] = useState(false);
  const [convId, setConvId] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [launcherUnread, setLauncherUnread] = useState(0);
  const bottomRef = useRef(null);

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const loadThread = useCallback(async (id) => {
    if (!id || !token) return;
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/${id}`, { headers: headers() });
      if (res.status === 404) {
        setConvId(null);
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
        return;
      }
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not load chat");
      setMessages(body.messages);
      setStatus(body.status);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [token, headers]);

  useEffect(() => {
    if (!open || !convId) return undefined;
    loadThread(convId);
    const timer = setInterval(() => loadThread(convId), POLL_MS);
    return () => clearInterval(timer);
  }, [open, convId, loadThread]);

  useEffect(() => {
    if (open || !convId || !token) { setLauncherUnread(0); return undefined; }
    const checkUnread = () => {
      fetch(`${API_BASE}/chat/conversations?channel=support`, { headers: headers() })
        .then((res) => (res.ok ? res.json() : null))
        .then((body) => {
          const mine = body?.conversations?.find((c) => c.id === convId);
          if (mine) setLauncherUnread(mine.unread);
        })
        .catch(() => {});
    };
    checkUnread();
    const timer = setInterval(checkUnread, CLOSED_POLL_MS);
    return () => clearInterval(timer);
  }, [open, convId, token, headers]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const startOrSend = async () => {
    const body = draft.trim();
    if (!body || !token) return;
    setSending(true);
    setError("");
    try {
      if (!convId) {
        const res = await fetch(`${API_BASE}/chat/conversations`, {
          method: "POST", headers: headers(),
          body: JSON.stringify({ channel: "support", subject: "Support chat", body }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Could not start chat");
        setConvId(payload.id);
        try { localStorage.setItem(STORAGE_KEY, payload.id); } catch { /* ignore */ }
        setDraft("");
        await loadThread(payload.id);
      } else {
        const res = await fetch(`${API_BASE}/chat/conversations/${convId}/messages`, {
          method: "POST", headers: headers(), body: JSON.stringify({ body }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Message not sent");
        setDraft("");
        await loadThread(convId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handoff = async () => {
    if (!convId) return;
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/${convId}/handoff`, {
        method: "POST", headers: headers(),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Could not connect to an agent");
      setStatus(payload.status);
      await loadThread(convId);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!token) return null;

  return (
    <div className={styles.wrap}>
      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <div>
              <strong>Support</strong>
              <div className={styles.statusLine}>{STATUS_LABEL[status] || "Start a conversation"}</div>
            </div>
            <button className={styles.iconBtn} onClick={() => setOpen(false)} aria-label="Close chat">
              <FaTimes />
            </button>
          </div>

          <div className={styles.body}>
            {messages.length === 0 && (
              <div className={styles.greeting}>
                👋 Hi! Ask a question about your order, products, or your account and our assistant will help.
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`${styles.bubble} ${m.sender.kind === "customer" ? styles.bubbleMine : styles.bubbleOther}`}
              >
                {m.sender.kind !== "customer" && (
                  <div className={styles.bubbleSender}>
                    {m.sender.kind === "bot" ? "🤖 " : ""}{m.sender.name}
                  </div>
                )}
                <div className={styles.bubbleBody}>{m.body}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {status === "bot" && (
            <button className={styles.handoffBtn} onClick={handoff}>
              <FaHeadset /> Talk to a person
            </button>
          )}

          <div className={styles.composer}>
            <input
              className={styles.input}
              value={draft}
              maxLength={2000}
              placeholder="Type a message…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") startOrSend(); }}
            />
            <button className={styles.sendBtn} disabled={sending || !draft.trim()} onClick={startOrSend}>
              Send
            </button>
          </div>
        </div>
      )}

      <button className={styles.launcher} onClick={() => setOpen((v) => !v)} aria-label="Open support chat">
        {open ? <FaTimes /> : <FaCommentDots />}
        {!open && launcherUnread > 0 && (
          <span className={styles.launcherBadge}>{launcherUnread > 9 ? "9+" : launcherUnread}</span>
        )}
      </button>
    </div>
  );
};

export default CustomerChatWidget;
