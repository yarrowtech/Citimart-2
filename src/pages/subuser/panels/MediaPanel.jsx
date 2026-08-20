import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { API_BASE } from "../../../config";
import s from "../SubuserShared.module.css";

const MediaPanel = ({ token }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/subuser/media`, { headers: authHeader });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setMedia(data.media || []);
    } catch (err) {
      setError(err.message || "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`${API_BASE}/subuser/media`, { method: "POST", headers: authHeader, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      await fetchMedia();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      const res = await fetch(`${API_BASE}/subuser/media/${id}`, { method: "DELETE", headers: authHeader });
      if (!res.ok) throw new Error("Delete failed");
      await fetchMedia();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Media Library</h2>
          <p className={s.panelSubtitle}>Images uploaded here are stored on Cloudinary and reusable across content.</p>
        </div>
        <label className={s.btnPrimary} style={{ cursor: "pointer" }}>
          {uploading ? "Uploading…" : "⬆ Upload"}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} hidden disabled={uploading} />
        </label>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading media…</div>
      ) : media.length === 0 ? (
        <div className={s.emptyState}><span className={s.emptyIcon}>🖼️</span>No media uploaded yet.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
          {media.map((m) => (
            <div key={m._id} className={s.card} style={{ padding: 10 }}>
              <img src={m.url} alt={m.filename} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 10 }} />
              <p style={{ fontSize: 11.5, color: "#6b7280", margin: "8px 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {m.filename}
              </p>
              <button className={s.btnDanger} style={{ width: "100%" }} onClick={() => handleDelete(m._id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaPanel;
