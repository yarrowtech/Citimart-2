import React, { useState, useRef } from "react";

import { API_BASE } from "../../config";
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
const MEASUREMENT_FIELDS = ["chest", "waist", "hips", "shoulder", "length"];

// ─── SizeChartUpload ─────────────────────────────────────────────────────────
// Props:
//   productId  — string, required (the product_id returned after submit)
//   onDone     — optional callback after successful upload
// ─────────────────────────────────────────────────────────────────────────────
const SizeChartUpload = ({ productId, onDone }) => {
  const [mode, setMode]         = useState("manual"); // "manual" | "csv"
  const [rows, setRows]         = useState(
    SIZE_OPTIONS.map(s => ({ size: s, chest: "", waist: "", hips: "", shoulder: "", length: "" }))
  );
  const [csvFile, setCsvFile]   = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus]     = useState(null); // null | "loading" | "ok" | "err"
  const [message, setMessage]   = useState("");
  const fileRef                 = useRef();

  const updateCell = (rowIdx, field, value) =>
    setRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [field]: value } : r));

  const handleDrop = e => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) setCsvFile(file);
  };

  const handleSubmit = async () => {
    if (!productId) { setStatus("err"); setMessage("No product ID — save the product first."); return; }
    setStatus("loading"); setMessage("");
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      let res;
      if (mode === "csv" && csvFile) {
        const fd = new FormData();
        fd.append("file", csvFile);
        res = await fetch(`${API_BASE}/api/products/${productId}/sizechart/upload`, {
          method: "POST", credentials: "include", headers, body: fd,
        });
      } else {
        const payload = {};
        rows.forEach(r => {
          const vals = MEASUREMENT_FIELDS.reduce((acc, f) => { if (r[f]) acc[f] = r[f]; return acc; }, {});
          if (Object.keys(vals).length) payload[r.size] = vals;
        });
        if (!Object.keys(payload).length) {
          setStatus("err"); setMessage("Fill in at least one measurement row."); return;
        }
        res = await fetch(`${API_BASE}/api/products/${productId}/sizechart/upload`, {
          method: "POST", credentials: "include",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (res.ok) {
        setStatus("ok");
        setMessage(`✅ Saved for sizes: ${(data.sizes_updated || []).join(", ")}`);
        onDone && onDone();
      } else {
        setStatus("err"); setMessage("❌ " + (data.error || "Upload failed"));
      }
    } catch {
      setStatus("err"); setMessage("⚠️ Network error");
    }
  };

  const thStyle = {
    padding: "6px 8px", background: "#dcfce7",
    border: "1px solid #bbf7d0", textAlign: "center",
    fontWeight: 700, color: "#166534", fontSize: 12,
  };
  const tdStyle = { padding: "4px 6px", border: "1px solid #d1fae5", background: "white" };

  return (
    <div style={{
      marginTop: 16, padding: "16px 18px",
      background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#15803d" }}>📐 Size Chart / Measurements</span>
        <div style={{ display: "flex", gap: 6 }}>
          {["manual", "csv"].map(m => (
            <button key={m} type="button" onClick={() => setMode(m)} style={{
              padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: "1.5px solid #16a34a",
              background: mode === m ? "#16a34a" : "white",
              color: mode === m ? "white" : "#16a34a",
            }}>{m === "manual" ? "Manual Entry" : "Upload CSV"}</button>
          ))}
        </div>
      </div>

      {mode === "manual" ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={thStyle}>Size</th>
                {MEASUREMENT_FIELDS.map(f => (
                  <th key={f} style={thStyle}>{f.charAt(0).toUpperCase() + f.slice(1)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.size}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#166534", textAlign: "center" }}>{row.size}</td>
                  {MEASUREMENT_FIELDS.map(f => (
                    <td key={f} style={tdStyle}>
                      <input type="text" placeholder="—" value={row[f]}
                        onChange={e => updateCell(i, f, e.target.value)}
                        style={{
                          width: "100%", padding: "5px 6px", borderRadius: 6,
                          border: "1px solid #d1d5db", fontSize: 12,
                          background: "white", textAlign: "center", boxSizing: "border-box",
                        }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>All values in inches. Leave blank to skip a size.</p>
        </div>
      ) : (
        <div>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            style={{
              border: `2px dashed ${dragOver ? "#16a34a" : "#86efac"}`,
              borderRadius: 10, padding: "28px 16px", textAlign: "center",
              cursor: "pointer", background: dragOver ? "#dcfce7" : "white",
              transition: "all .15s",
            }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
            <div style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
              {csvFile ? csvFile.name : "Drop CSV here or click to browse"}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              Required columns: <code>size, chest, waist, hips, shoulder, length</code>
            </div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }}
              onChange={e => setCsvFile(e.target.files[0])} />
          </div>
          <button type="button" onClick={() => {
            const csv = "size,chest,waist,hips,shoulder,length\nXS,32,26,34,14,24\nS,34,28,36,15,25\nM,36,30,38,16,26\nL,38,32,40,17,27\nXL,40,34,42,18,28\nXXL,42,36,44,19,29";
            const blob = new Blob([csv], { type: "text/csv" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
            a.download = "size_chart_template.csv"; a.click();
          }} style={{ marginTop: 8, fontSize: 12, color: "#16a34a", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
            ⬇️ Download CSV template
          </button>
        </div>
      )}

      <button type="button" onClick={handleSubmit} disabled={status === "loading"} style={{
        marginTop: 14, padding: "8px 22px", borderRadius: 8,
        background: status === "loading" ? "#9ca3af" : "#16a34a",
        color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
      }}>
        {status === "loading" ? "Saving…" : "Save Size Chart"}
      </button>

      {message && (
        <div style={{
          marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: status === "ok" ? "#dcfce7" : "#fee2e2",
          color: status === "ok" ? "#166534" : "#991b1b",
        }}>{message}</div>
      )}
    </div>
  );
};

export default SizeChartUpload;