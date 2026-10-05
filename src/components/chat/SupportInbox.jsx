import React, { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "../../config";
import styles from "./SupportInbox.module.css";

const POLL_MS = 10000;
const CHANNELS = [
  { key: "all", label: "All" },
  { key: "support", label: "Customer support" },
  { key: "vendor", label: "Vendors" },
  { key: "internal", label: "Internal" },
];
const STATUSES = [
  { key: "waiting", label: "Waiting" },
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All" },
];
const SENDER_LABEL = { customer: "Customer", vendor: "Vendor", admin: "Admin", subuser: "Staff" };

const formatTime = (iso) => (iso ? new Date(iso).toLocaleString() : "");

const SupportInbox = ({ token }) => {
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("waiting");
  const [list, setList] = useState([]);
  const [counts, setCounts] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [staff, setStaff] = useState([]);
  const [newChatTo, setNewChatTo] = useState("");
  const [newChatBody, setNewChatBody] = useState("");
  const [starting, setStarting] = useState(false);
  const threadEndRef = useRef(null);

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const loadList = useCallback(async () => {
    const params = new URLSearchParams();
    if (channel !== "all") params.set("channel", channel);
    if (status !== "all") params.set("status", status);
    try {
      const res = await fetch(`${API_BASE}/chat/conversations?${params}`, { headers: headers() });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not load conversations");
      setList(body.conversations);
      setCounts(body.counts || {});
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [channel, status, headers]);

  const loadDetail = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/${id}`, { headers: headers() });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not open conversation");
      setDetail(body);
    } catch (err) {
      setError(err.message);
    }
  }, [headers]);

  useEffect(() => {
    loadList();
    const timer = setInterval(loadList, POLL_MS);
    return () => clearInterval(timer);
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return undefined; }
    loadDetail(selectedId);
    const timer = setInterval(() => loadDetail(selectedId), POLL_MS);
    return () => clearInterval(timer);
  }, [selectedId, loadDetail]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [detail?.messages?.length]);

  const openComposer = async () => {
    setComposerOpen(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/chat/staff-directory`, { headers: headers() });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not load staff list");
      setStaff(body.people);
    } catch (err) {
      setError(err.message);
    }
  };

  const startInternalChat = async () => {
    const body = newChatBody.trim();
    const person = staff.find((p) => `${p.kind}:${p.id}` === newChatTo);
    if (!body || !person) return;
    setStarting(true);
    try {
      const res = await fetch(`${API_BASE}/chat/conversations`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({
          channel: "internal", subject: `Chat with ${person.name}`, body,
          participantIds: [{ id: person.id, kind: person.kind }],
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Could not start chat");
      setComposerOpen(false);
      setNewChatTo("");
      setNewChatBody("");
      setChannel("internal");
      setStatus("all");
      await loadList();
      setSelectedId(payload.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  const send = async () => {
    const body = reply.trim();
    if (!body || !selectedId) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/${selectedId}/messages`, {
        method: "POST", headers: headers(), body: JSON.stringify({ body }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Message not sent");
      setReply("");
      await loadDetail(selectedId);
      loadList();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const setConversationStatus = async (next) => {
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/${selectedId}/status`, {
        method: "POST", headers: headers(), body: JSON.stringify({ status: next }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Could not update status");
      await loadDetail(selectedId);
      loadList();
    } catch (err) {
      setError(err.message);
    }
  };

  const channelLabel = (key) => CHANNELS.find((c) => c.key === key)?.label || key;

  return (
    <div className={styles.inbox}>
      <aside className={styles.sidebar}>
        <button className={styles.newChatBtn} onClick={openComposer}>+ New internal chat</button>
        {composerOpen && (
          <div className={styles.newChatBox}>
            <select
              className={styles.select}
              value={newChatTo}
              onChange={(e) => setNewChatTo(e.target.value)}
            >
              <option value="">Choose a teammate…</option>
              {staff.map((p) => (
                <option key={`${p.kind}:${p.id}`} value={`${p.kind}:${p.id}`}>{p.name}</option>
              ))}
            </select>
            <textarea
              className={styles.textarea}
              rows={2}
              placeholder="Say something to start the chat…"
              value={newChatBody}
              onChange={(e) => setNewChatBody(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className={styles.btnPrimary}
                disabled={starting || !newChatTo || !newChatBody.trim()}
                onClick={startInternalChat}
              >
                {starting ? "Starting…" : "Start chat"}
              </button>
              <button className={styles.btnSecondary} onClick={() => setComposerOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
        <div className={styles.filterGroup}>
          {CHANNELS.map((c) => (
            <button
              key={c.key}
              className={`${styles.chip} ${channel === c.key ? styles.chipActive : ""}`}
              onClick={() => setChannel(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className={styles.statusTabs}>
          {STATUSES.map((s) => (
            <button
              key={s.key}
              className={`${styles.statusTab} ${status === s.key ? styles.statusTabActive : ""}`}
              onClick={() => setStatus(s.key)}
            >
              {s.label}
              {s.key !== "all" && <span className={styles.count}>{counts[s.key] ?? 0}</span>}
            </button>
          ))}
        </div>

        <div className={styles.list}>
          {loading && <div className={styles.muted}>Loading…</div>}
          {!loading && list.length === 0 && (
            <div className={styles.empty}>No conversations here right now.</div>
          )}
          {list.map((conv) => {
            const who = conv.participants.find((p) => p.kind !== "admin" && p.kind !== "subuser") || conv.participants[0];
            return (
              <button
                key={conv.id}
                className={`${styles.item} ${selectedId === conv.id ? styles.itemActive : ""}`}
                onClick={() => setSelectedId(conv.id)}
              >
                <div className={styles.itemTop}>
                  <strong>{conv.subject || who?.name || "Conversation"}</strong>
                  {conv.unread > 0 && <span className={styles.unread}>{conv.unread}</span>}
                </div>
                <div className={styles.itemMeta}>
                  <span className={`${styles.pill} ${styles[`channel_${conv.channel}`]}`}>{channelLabel(conv.channel)}</span>
                  <span className={`${styles.pill} ${styles[`status_${conv.status}`]}`}>{conv.status}</span>
                </div>
                <div className={styles.preview}>{conv.last_message_preview}</div>
                <div className={styles.time}>{formatTime(conv.last_message_at)}</div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className={styles.thread}>
        {error && <div className={styles.error}>{error}</div>}
        {!detail ? (
          <div className={styles.placeholder}>
            <span>💬</span>
            <p>Select a conversation to read and reply.</p>
          </div>
        ) : (
          <>
            <header className={styles.threadHeader}>
              <div>
                <h3>{detail.subject || "Conversation"}</h3>
                <p className={styles.muted}>
                  {detail.participants.map((p) => `${p.name} (${SENDER_LABEL[p.kind] || p.kind})`).join(" · ")}
                </p>
                {detail.link && (
                  <span className={styles.linkBadge}>{detail.link.type.replace("_", " ")} · {detail.link.id}</span>
                )}
              </div>
              <div className={styles.headerActions}>
                <span className={`${styles.pill} ${styles[`status_${detail.status}`]}`}>{detail.status}</span>
                {detail.status === "resolved" ? (
                  <button className={styles.btnSecondary} onClick={() => setConversationStatus("open")}>Reopen</button>
                ) : (
                  <button className={styles.btnSuccess} onClick={() => setConversationStatus("resolved")}>Mark resolved</button>
                )}
              </div>
            </header>

            <div className={styles.messages}>
              {detail.messages.map((m) => (
                <div key={m.id} className={`${styles.bubble} ${m.sender.kind === "customer" || m.sender.kind === "vendor" ? styles.bubbleOther : styles.bubbleStaff}`}>
                  <div className={styles.bubbleMeta}>
                    <strong>{m.sender.name}</strong> · {SENDER_LABEL[m.sender.kind] || m.sender.kind} · {formatTime(m.created_at)}
                  </div>
                  <div className={styles.bubbleBody}>{m.body}</div>
                </div>
              ))}
              <div ref={threadEndRef} />
            </div>

            {detail.audit?.length > 0 && (
              <div className={styles.audit}>
                Viewed by {detail.audit.slice(-3).map((a) => a.viewer.name).join(", ")} (logged)
              </div>
            )}

            <div className={styles.composer}>
              <textarea
                className={styles.textarea}
                rows={2}
                maxLength={2000}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(); }}
                placeholder="Write a reply… (Ctrl+Enter to send)"
              />
              <button className={styles.btnPrimary} disabled={sending || !reply.trim()} onClick={send}>
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default SupportInbox;
