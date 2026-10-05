import React, { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../../config";
import s from "../subuser/SubuserShared.module.css";

const FILTERS = [
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All" },
];

const AdminErrors = () => {
  const [filter, setFilter] = useState("open");
  const [data, setData] = useState({ logs: [], counts: { open: 0, resolved: 0 } });
  const [selectedId, setSelectedId] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
    "Content-Type": "application/json",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/error-center?status=${filter}`, { headers: authHeaders() });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load error logs");
      setData(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const selected = data.logs.find((log) => log.id === selectedId) || null;

  useEffect(() => {
    setNoteDraft(selected?.note || "");
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = async (id, payload) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/error-center/${id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Could not update this error");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Error Center</h2>
          <p className={s.panelSubtitle}>
            Server errors, explained in plain language. Open one to understand the cause, fix it, then mark it resolved.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={filter === f.key ? s.btnPrimary : s.btnSecondary}
              onClick={() => { setFilter(f.key); setSelectedId(null); }}
            >
              {f.label}{f.key === "open" ? ` (${data.counts.open})` : f.key === "resolved" ? ` (${data.counts.resolved})` : ""}
            </button>
          ))}
        </div>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading errors…</div>
      ) : data.logs.length === 0 ? (
        <div className={s.emptyState}>
          <span className={s.emptyIcon}>✅</span>
          {filter === "open" ? "No open errors. The system is running clean." : "No errors in this view."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr", gap: 16 }}>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead><tr><th>When</th><th>Issue</th><th>Where</th><th>Status</th></tr></thead>
              <tbody>
                {data.logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedId(log.id)}
                    style={{ cursor: "pointer", background: log.id === selectedId ? "#f5f3ff" : undefined }}
                  >
                    <td style={{ whiteSpace: "nowrap" }}>{log.created_at ? new Date(log.created_at).toLocaleString() : "—"}</td>
                    <td><strong>{log.title}</strong></td>
                    <td>{log.method} {log.path}</td>
                    <td>
                      <span className={`${s.badge} ${log.resolved ? s.badgeGreen : s.badgeRed}`}>
                        {log.resolved ? "Resolved" : "Open"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <div className={s.card}>
              <div className={s.panelHeader}>
                <h3 className={s.panelTitle} style={{ fontSize: 16 }}>{selected.title}</h3>
                <button className={s.btnSecondary} onClick={() => setSelectedId(null)}>Close</button>
              </div>
              <p><strong>What happened:</strong> {selected.explanation}</p>
              <p><strong>How to fix:</strong> {selected.fix}</p>
              <p><strong>Request:</strong> {selected.method} {selected.path} · HTTP {selected.status_code}</p>
              <p><strong>Raw message:</strong></p>
              <pre style={{ whiteSpace: "pre-wrap", background: "#0f172a", color: "#e2e8f0", padding: 12, borderRadius: 10, fontSize: 12, maxHeight: 180, overflow: "auto" }}>
                {selected.error_message || "(no message)"}
              </pre>

              <label style={{ display: "block", fontWeight: 600, margin: "12px 0 6px" }}>Admin note</label>
              <textarea
                className={s.textarea}
                rows={3}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="What did you do to fix this?"
              />

              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button className={s.btnSecondary} disabled={saving} onClick={() => update(selected.id, { note: noteDraft })}>
                  Save note
                </button>
                {selected.resolved ? (
                  <button className={s.btnPrimary} disabled={saving} onClick={() => update(selected.id, { resolved: false })}>
                    Reopen
                  </button>
                ) : (
                  <button className={s.btnSuccess} disabled={saving} onClick={() => update(selected.id, { resolved: true, note: noteDraft })}>
                    Mark resolved
                  </button>
                )}
              </div>
              {selected.resolved_at && (
                <p style={{ marginTop: 10, color: "#6b7280", fontSize: 12 }}>
                  Resolved {new Date(selected.resolved_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminErrors;
