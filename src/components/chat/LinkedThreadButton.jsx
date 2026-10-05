import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaComments, FaTimes } from "react-icons/fa";
import { API_BASE } from "../../config";
import styles from "./LinkedThreadButton.module.css";

const POLL_MS = 6000;

/**
 * A "Message…" button that opens a small thread tied to one record (a
 * payout, a KYB application, a product). Reuses the same vendor-channel
 * backend as the Support Center; the backend dedupes by link so repeat
 * clicks reopen the same thread instead of spawning new ones.
 */
const LinkedThreadButton = ({ tokenKey, linkType, linkId, subject, vendorId, label = "Message" }) => {
  const [open, setOpen] = useState(false);
  const [convId, setConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const headers = useCallback(() => ({
    Authorization: `Bearer ${localStorage.getItem(tokenKey)}`,
    "Content-Type": "application/json",
  }), [tokenKey]);

  const loadThread = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/${id}`, { headers: headers() });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not load thread");
      setMessages(body.messages);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [headers]);

  useEffect(() => {
    if (!open || !convId) return undefined;
    loadThread(convId);
    const timer = setInterval(() => loadThread(convId), POLL_MS);
    return () => clearInterval(timer);
  }, [open, convId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const openThread = async () => {
    setOpen(true);
    if (convId) { loadThread(convId); return; }
    setSending(true);
    try {
      const payload = {
        channel: "vendor", subject, body: draft.trim() || `Starting a conversation about ${subject}`,
        link: { type: linkType, id: String(linkId) },
      };
      if (vendorId) payload.vendorId = vendorId;
      const res = await fetch(`${API_BASE}/chat/conversations`, {
        method: "POST", headers: headers(), body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not start conversation");
      setConvId(body.id);
      setDraft("");
      setMessages([]);
      await loadThread(body.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      if (!convId) {
        const res = await fetch(`${API_BASE}/chat/conversations`, {
          method: "POST", headers: headers(),
          body: JSON.stringify({
            channel: "vendor", subject, body,
            link: { type: linkType, id: String(linkId) }, ...(vendorId ? { vendorId } : {}),
          }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Could not send message");
        setConvId(payload.id);
        setDraft("");
        await loadThread(payload.id);
      } else {
        const res = await fetch(`${API_BASE}/chat/conversations/${convId}/messages`, {
          method: "POST", headers: headers(), body: JSON.stringify({ body }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Could not send message");
        setDraft("");
        await loadThread(convId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button type="button" className={styles.trigger} onClick={openThread}>
        <FaComments /> {label}
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <strong>{subject}</strong>
              <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close">
                <FaTimes />
              </button>
            </div>
            <div className={styles.body}>
              {messages.length === 0 && <div className={styles.empty}>No messages yet — say hello below.</div>}
              {messages.map((m) => (
                <div key={m.id} className={styles.bubble}>
                  <div className={styles.bubbleMeta}>{m.sender.name}</div>
                  <div className={styles.bubbleText}>{m.body}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.composer}>
              <input
                className={styles.input}
                value={draft}
                maxLength={2000}
                placeholder="Write a message…"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              />
              <button className={styles.sendBtn} disabled={sending || !draft.trim()} onClick={send}>Send</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LinkedThreadButton;
