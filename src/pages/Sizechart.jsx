// src/components/SizeChart.jsx
// Myntra/Meesho style size chart modal
// import React from "react";

// // Size data per category
// const SIZE_DATA = {
//   tops: {
//     label: "Tops / T-Shirts / Shirts",
//     headers: ["Size", "Chest (in)", "Shoulder (in)", "Length (in)"],
//     rows: [
//       ["XS",  "34",  "14",  "26"],
//       ["S",   "36",  "15",  "27"],
//       ["M",   "38",  "16",  "28"],
//       ["L",   "40",  "17",  "29"],
//       ["XL",  "42",  "18",  "30"],
//       ["XXL", "44",  "19",  "31"],
//     ],
//   },
//   bottoms: {
//     label: "Jeans / Trousers / Shorts",
//     headers: ["Size", "Waist (in)", "Hip (in)", "Inseam (in)"],
//     rows: [
//       ["28", "28", "36", "30"],
//       ["30", "30", "38", "30"],
//       ["32", "32", "40", "31"],
//       ["34", "34", "42", "31"],
//       ["36", "36", "44", "32"],
//       ["38", "38", "46", "32"],
//     ],
//   },
//   dress: {
//     label: "Dresses / Kurtas",
//     headers: ["Size", "Bust (in)", "Waist (in)", "Hip (in)", "Length (in)"],
//     rows: [
//       ["XS",  "32", "26", "36", "52"],
//       ["S",   "34", "28", "38", "53"],
//       ["M",   "36", "30", "40", "54"],
//       ["L",   "38", "32", "42", "55"],
//       ["XL",  "40", "34", "44", "56"],
//       ["XXL", "42", "36", "46", "57"],
//     ],
//   },
//   jewelry: {
//     label: "Jewelry / Rings",
//     headers: ["Size", "Circumference (mm)", "Diameter (mm)", "India Size"],
//     rows: [
//       ["5",  "49.3", "15.7", "9"],
//       ["6",  "51.8", "16.5", "11"],
//       ["7",  "54.4", "17.3", "13"],
//       ["8",  "57.0", "18.2", "15"],
//       ["9",  "59.5", "18.9", "17"],
//       ["10", "62.1", "19.8", "20"],
//     ],
//   },
//   footwear: {
//     label: "Footwear / Shoes",
//     headers: ["UK Size", "US Size", "EU Size", "Foot Length (cm)"],
//     rows: [
//       ["4",  "5",   "37", "23.5"],
//       ["5",  "6",   "38", "24.1"],
//       ["6",  "7",   "39", "24.8"],
//       ["7",  "8",   "40", "25.4"],
//       ["8",  "9",   "41", "26.0"],
//       ["9",  "10",  "42", "26.7"],
//       ["10", "11",  "43", "27.3"],
//     ],
//   },
// };

// const resolveChart = (category = "", subcategory = "") => {
//   const cat = (category || "").toLowerCase();
//   const sub = (subcategory || "").toLowerCase();

//   if (sub.includes("jeans") || sub.includes("trouser") || sub.includes("bottom") || sub.includes("short"))
//     return SIZE_DATA.bottoms;
//   if (sub.includes("dress") || sub.includes("kurta") || sub.includes("saree") || sub.includes("lehenga"))
//     return SIZE_DATA.dress;
//   if (sub.includes("jewelry") || sub.includes("ring") || sub.includes("jewel"))
//     return SIZE_DATA.jewelry;
//   if (cat.includes("footwear") || sub.includes("shoe") || sub.includes("sandal") || sub.includes("boot"))
//     return SIZE_DATA.footwear;
//   // default for clothing tops
//   return SIZE_DATA.tops;
// };

// const SizeChart = ({ category, subcategory, onClose }) => {
//   const chart = resolveChart(category, subcategory);

//   return (
//     <>
//       {/* Backdrop */}
//       <div
//         onClick={onClose}
//         style={{
//           position: "fixed", inset: 0,
//           background: "rgba(0,0,0,0.5)",
//           zIndex: 9998,
//         }}
//       />

//       {/* Modal */}
//       <div style={{
//         position: "fixed",
//         top: "50%", left: "50%",
//         transform: "translate(-50%,-50%)",
//         zIndex: 9999,
//         background: "#fff",
//         borderRadius: 16,
//         width: "min(92vw, 520px)",
//         maxHeight: "85vh",
//         overflow: "hidden",
//         display: "flex", flexDirection: "column",
//         boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
//         animation: "scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
//       }}>
//         <style>{`
//           @keyframes scaleIn {
//             from { opacity:0; transform:translate(-50%,-50%) scale(0.9); }
//             to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
//           }
//         `}</style>

//         {/* Header */}
//         <div style={{
//           padding: "18px 20px",
//           background: "linear-gradient(135deg,#ff3f6c,#ff8c42)",
//           display: "flex", alignItems: "center", justifyContent: "space-between",
//           flexShrink: 0,
//         }}>
//           <div>
//             <h3 style={{ margin: 0, color: "#fff", fontSize: 17, fontWeight: 700 }}>
//               📏 Size Chart
//             </h3>
//             <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
//               {chart.label}
//             </p>
//           </div>
//           <button
//             onClick={onClose}
//             style={{
//               background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
//               width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
//               fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
//               fontWeight: 700,
//             }}
//           >×</button>
//         </div>

//         {/* How to measure tip */}
//         <div style={{
//           background: "#fff8f0", borderBottom: "1px solid #ffe4cc",
//           padding: "10px 20px", fontSize: 12, color: "#92400e", flexShrink: 0,
//         }}>
//           💡 <strong>How to measure:</strong> Use a soft tape measure. Keep it snug but not tight.
//           All measurements are in inches unless noted.
//         </div>

//         {/* Table */}
//         <div style={{ overflow: "auto", flex: 1 }}>
//           <table style={{
//             width: "100%", borderCollapse: "collapse",
//             fontSize: 13,
//           }}>
//             <thead>
//               <tr style={{ background: "#f9fafb", position: "sticky", top: 0 }}>
//                 {chart.headers.map((h, i) => (
//                   <th key={i} style={{
//                     padding: "12px 16px", textAlign: "center",
//                     fontWeight: 700, color: "#374151",
//                     borderBottom: "2px solid #e5e7eb",
//                     whiteSpace: "nowrap",
//                     background: "#f9fafb",
//                   }}>
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {chart.rows.map((row, i) => (
//                 <tr
//                   key={i}
//                   style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}
//                 >
//                   {row.map((cell, j) => (
//                     <td key={j} style={{
//                       padding: "11px 16px", textAlign: "center",
//                       borderBottom: "1px solid #f3f4f6",
//                       fontWeight: j === 0 ? 700 : 400,
//                       color: j === 0 ? "#ff3f6c" : "#374151",
//                     }}>
//                       {cell}
//                     </td>
//                   ))}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Footer note */}
//         <div style={{
//           padding: "12px 20px", background: "#f9fafb",
//           borderTop: "1px solid #e5e7eb", fontSize: 11,
//           color: "#6b7280", textAlign: "center", flexShrink: 0,
//         }}>
//           Sizes may vary slightly by brand. When in doubt, size up.
//         </div>
//       </div>
//     </>
//   );
// };

// export default SizeChart;


// src/components/SizeChart.jsx
import React, { useState, useEffect } from "react";

import { API_BASE } from "../config";
// ── Fallback dummy data ───────────────────────────────────────────────────────
const SIZE_DATA = {
  tops: {
    label: "Tops / T-Shirts / Shirts",
    headers: ["Size", "Chest (in)", "Shoulder (in)", "Length (in)"],
    rows: [
      ["XS","34","14","26"],["S","36","15","27"],["M","38","16","28"],
      ["L","40","17","29"],["XL","42","18","30"],["XXL","44","19","31"],
    ],
  },
  bottoms: {
    label: "Jeans / Trousers / Shorts",
    headers: ["Size", "Waist (in)", "Hip (in)", "Inseam (in)"],
    rows: [
      ["28","28","36","30"],["30","30","38","30"],["32","32","40","31"],
      ["34","34","42","31"],["36","36","44","32"],["38","38","46","32"],
    ],
  },
  dress: {
    label: "Dresses / Kurtas",
    headers: ["Size", "Bust (in)", "Waist (in)", "Hip (in)", "Length (in)"],
    rows: [
      ["XS","32","26","36","52"],["S","34","28","38","53"],["M","36","30","40","54"],
      ["L","38","32","42","55"],["XL","40","34","44","56"],["XXL","42","36","46","57"],
    ],
  },
  jewelry: {
    label: "Jewelry / Rings",
    headers: ["Size", "Circumference (mm)", "Diameter (mm)", "India Size"],
    rows: [
      ["5","49.3","15.7","9"],["6","51.8","16.5","11"],["7","54.4","17.3","13"],
      ["8","57.0","18.2","15"],["9","59.5","18.9","17"],["10","62.1","19.8","20"],
    ],
  },
  footwear: {
    label: "Footwear / Shoes",
    headers: ["UK Size", "US Size", "EU Size", "Foot Length (cm)"],
    rows: [
      ["4","5","37","23.5"],["5","6","38","24.1"],["6","7","39","24.8"],
      ["7","8","40","25.4"],["8","9","41","26.0"],["9","10","42","26.7"],["10","11","43","27.3"],
    ],
  },
};

const resolveFallback = (category = "", subcategory = "") => {
  const cat = category.toLowerCase();
  const sub = subcategory.toLowerCase();
  if (sub.includes("jeans") || sub.includes("trouser") || sub.includes("bottom") || sub.includes("short"))
    return SIZE_DATA.bottoms;
  if (sub.includes("dress") || sub.includes("kurta") || sub.includes("saree") || sub.includes("lehenga"))
    return SIZE_DATA.dress;
  if (sub.includes("jewelry") || sub.includes("ring") || sub.includes("jewel"))
    return SIZE_DATA.jewelry;
  if (cat.includes("footwear") || sub.includes("shoe") || sub.includes("sandal") || sub.includes("boot"))
    return SIZE_DATA.footwear;
  return SIZE_DATA.tops;
};

// ── Build chart from variant measurements ────────────────────────────────────
// variants: [{ size, measurements: { chest, waist, hips, shoulder, length } }]
const buildFromMeasurements = (variants) => {
  // collect unique sizes that have at least one measurement value
  const seen = new Set();
  const rows = [];

  for (const v of variants) {
    const s = (v.size || "").trim();
    if (!s || seen.has(s)) continue;
    const m = v.measurements || {};
    // only include if at least one field is non-empty
    if (!Object.values(m).some(Boolean)) continue;
    seen.add(s);
    rows.push([
      s,
      m.chest    || "—",
      m.waist    || "—",
      m.hips     || "—",
      m.shoulder || "—",
      m.length   || "—",
    ]);
  }

  if (!rows.length) return null;

  return {
    label: "Product Size Chart (from vendor)",
    headers: ["Size", "Chest (in)", "Waist (in)", "Hips (in)", "Shoulder (in)", "Length (in)"],
    rows,
    isReal: true,
  };
};

// ── Main component ────────────────────────────────────────────────────────────
const SizeChart = ({ category, subcategory, onClose, productId, variants = [], sizeChartUrl }) => {
  const [fetchedChart, setFetchedChart] = useState(null); // from API
  const [loadingApi,   setLoadingApi]   = useState(false);
  const [imgError,     setImgError]     = useState(false);

  // 1️⃣ Try to fetch size chart from backend (CSV/Excel parsed measurements)
  useEffect(() => {
    if (!productId) return;
    setLoadingApi(true);
    fetch(`${API_BASE}/api/products/${productId}/sizechart`)
      .then(r => r.json())
      .then(data => {
        const sc = data.size_chart || {};
        if (Object.keys(sc).length === 0) { setFetchedChart(null); return; }

        // Build rows from API response { "S": { chest, waist, ... }, "M": {...} }
        const rows = Object.entries(sc).map(([size, m]) => [
          size,
          m.chest    || "—",
          m.waist    || "—",
          m.hips     || "—",
          m.shoulder || "—",
          m.length   || "—",
        ]);

        setFetchedChart({
          label: "Product Size Chart",
          headers: ["Size", "Chest (in)", "Waist (in)", "Hips (in)", "Shoulder (in)", "Length (in)"],
          rows,
          isReal: true,
        });
      })
      .catch(() => setFetchedChart(null))
      .finally(() => setLoadingApi(false));
  }, [productId]);

  // 2️⃣ Decide what to show (priority order):
  //    a) Fetched from API (CSV/Excel uploaded)
  //    b) Built from variant measurements
  //    c) Image/PDF uploaded (sizeChartUrl)
  //    d) Dummy fallback
  const fromVariants = buildFromMeasurements(variants);
  const chart        = fetchedChart || fromVariants || resolveFallback(category, subcategory);
  const showImage    = !fetchedChart && !fromVariants && sizeChartUrl;
  const isFallback   = !fetchedChart && !fromVariants && !sizeChartUrl;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.5)", zIndex: 9998,
      }} />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 9999, background: "#fff", borderRadius: 16,
        width: "min(92vw, 560px)", maxHeight: "88vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
        animation: "scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <style>{`
          @keyframes scaleIn {
            from { opacity:0; transform:translate(-50%,-50%) scale(0.9); }
            to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: "18px 20px",
          background: "linear-gradient(135deg,#ff3f6c,#ff8c42)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{ margin: 0, color: "#fff", fontSize: 17, fontWeight: 700 }}>
              📏 Size Chart
            </h3>
            <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
              {loadingApi ? "Loading…" : chart.label}
              {isFallback && (
                <span style={{ marginLeft: 6, fontSize: 10, background: "rgba(255,255,255,0.2)",
                  padding: "1px 6px", borderRadius: 10 }}>
                  General Guide
                </span>
              )}
              {(fetchedChart || fromVariants) && (
                <span style={{ marginLeft: 6, fontSize: 10, background: "rgba(255,255,255,0.25)",
                  padding: "1px 6px", borderRadius: 10 }}>
                  ✓ Product Specific
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
            width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
          }}>×</button>
        </div>

        {/* Tip */}
        <div style={{
          background: "#fff8f0", borderBottom: "1px solid #ffe4cc",
          padding: "10px 20px", fontSize: 12, color: "#92400e", flexShrink: 0,
        }}>
          💡 <strong>How to measure:</strong> Use a soft tape measure. Keep it snug but not tight.
          {isFallback && " These are general size guidelines — actual fit may vary."}
        </div>

        {/* Loading */}
        {loadingApi && (
          <div style={{ padding: 32, textAlign: "center", color: "#6b7280", fontSize: 14 }}>
            Loading size chart…
          </div>
        )}

        {/* Image/PDF chart */}
        {!loadingApi && showImage && (
          <div style={{ overflow: "auto", flex: 1, padding: 16, textAlign: "center" }}>
            {sizeChartUrl.endsWith(".pdf") ? (
              <div>
                <p style={{ color: "#374151", fontSize: 13, marginBottom: 12 }}>
                  📄 Size chart available as PDF
                </p>
                <a href={sizeChartUrl} target="_blank" rel="noreferrer"
                  style={{ padding: "10px 24px", background: "#ff3f6c", color: "#fff",
                    borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 13 }}>
                  Open PDF ↗
                </a>
              </div>
            ) : (
              !imgError ? (
                <img
                  src={sizeChartUrl}
                  alt="Size chart"
                  onError={() => setImgError(true)}
                  style={{ maxWidth: "100%", borderRadius: 10, border: "1px solid #e5e7eb" }}
                />
              ) : (
                <p style={{ color: "#ef4444", fontSize: 13 }}>Failed to load size chart image.</p>
              )
            )}
          </div>
        )}

        {/* Table — shown when NOT image mode and not loading */}
        {!loadingApi && !showImage && (
          <div style={{ overflow: "auto", flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb", position: "sticky", top: 0 }}>
                  {chart.headers.map((h, i) => (
                    <th key={i} style={{
                      padding: "12px 16px", textAlign: "center", fontWeight: 700,
                      color: "#374151", borderBottom: "2px solid #e5e7eb",
                      whiteSpace: "nowrap", background: "#f9fafb",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.rows.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{
                        padding: "11px 16px", textAlign: "center",
                        borderBottom: "1px solid #f3f4f6",
                        fontWeight: j === 0 ? 700 : 400,
                        color: j === 0 ? "#ff3f6c" : "#374151",
                      }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: "12px 20px", background: "#f9fafb",
          borderTop: "1px solid #e5e7eb", fontSize: 11,
          color: "#6b7280", textAlign: "center", flexShrink: 0,
        }}>
          {isFallback
            ? "General size guide. Actual measurements may vary by product."
            : "Sizes provided by the brand. When in doubt, size up."}
        </div>
      </div>
    </>
  );
};

export default SizeChart;