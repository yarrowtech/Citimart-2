// // src/pages/VariantSelector.jsx

// // It replaces the manual size/color picker section

// // import React, { useState } from "react";
// // import SizeChart from "../pages/Sizechart";
// // const VariantSelector = ({
// //   product,
// //   selectedSize,
// //   setSelectedSize,
// //   selectedColor,
// //   setSelectedColor,
// //   isSizeCategory,
// // }) => {
// //   const [showSizeChart, setShowSizeChart] = useState(false);

// //   const variants       = product?.variants || [];
// //   const sizeToColors   = product?.size_to_colors || {};   // from backend
// //   const colorToSizes   = product?.color_to_sizes || {};   // from backend

// //   // All unique sizes across all variants
// //   const allSizes  = [...new Set(variants.map(v => v.size).filter(Boolean))];
// //   // All unique colors across all variants
// //   const allColors = [...new Set(variants.map(v => v.color).filter(Boolean))];

// //   // When a size is selected → only show colors that exist for that size
// //   const availableColors = selectedSize
// //     ? (sizeToColors[selectedSize] || []).map(c => c.color)
// //     : allColors;

// //   // When a color is selected → only show sizes that exist for that color
// //   const availableSizes = selectedColor
// //     ? (colorToSizes[selectedColor] || []).map(s => s.size)
// //     : allSizes;

// //   // Get stock for current exact combination
// //   const getStock = () => {
// //     if (!selectedSize && !selectedColor) return null;
// //     const match = variants.find(v => {
// //       const sizeMatch  = !selectedSize  || v.size  === selectedSize;
// //       const colorMatch = !selectedColor || v.color === selectedColor;
// //       return sizeMatch && colorMatch;
// //     });
// //     if (!match) return null;
// //     let stk = match.stock;
// //     if (typeof stk === "object" && stk.$numberInt) stk = parseInt(stk.$numberInt);
// //     return parseInt(stk || 0);
// //   };

// //   const stock = getStock();

// //   const handleSizeClick = (size) => {
// //     if (selectedSize === size) {
// //       setSelectedSize("");
// //     } else {
// //       setSelectedSize(size);
// //       // If current color is not available for new size, reset color
// //       const colorsForSize = (sizeToColors[size] || []).map(c => c.color);
// //       if (selectedColor && !colorsForSize.includes(selectedColor)) {
// //         setSelectedColor("");
// //       }
// //     }
// //   };

// //   const handleColorClick = (color) => {
// //     if (selectedColor === color) {
// //       setSelectedColor("");
// //     } else {
// //       setSelectedColor(color);
// //       // If current size is not available for new color, reset size
// //       const sizesForColor = (colorToSizes[color] || []).map(s => s.size);
// //       if (selectedSize && !sizesForColor.includes(selectedSize)) {
// //         setSelectedSize("");
// //       }
// //     }
// //   };

// //   if (!variants.length) return null;

// //   return (
// //     <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

// //       {/* ── SIZE SELECTOR ── */}
// //       {isSizeCategory && allSizes.length > 0 && (
// //         <div>
// //           <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
// //             <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#333" }}>
// //               Select Size:
// //               {selectedSize && (
// //                 <span style={{ marginLeft: 8, color: "#ff3f6c", fontWeight: 700 }}>
// //                   {selectedSize}
// //                 </span>
// //               )}
// //             </h4>
// //             {/* Size Chart link — Myntra style */}
// //             <button
// //               onClick={() => setShowSizeChart(true)}
// //               style={{
// //                 background: "none", border: "none", cursor: "pointer",
// //                 fontSize: 12, color: "#3c82f6", fontWeight: 600,
// //                 textDecoration: "underline", padding: 0,
// //                 display: "flex", alignItems: "center", gap: 4,
// //               }}
// //             >
// //               📏 Size Chart
// //             </button>
// //           </div>

// //           <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
// //             {allSizes.map((size, i) => {
// //               const available  = availableSizes.includes(size);
// //               const isSelected = selectedSize === size;

// //               // Check if any stock for this size
// //               const hasStock = (sizeToColors[size] || []).some(c => c.stock > 0)
// //                 || variants.find(v => v.size === size && !v.color)?.stock > 0;

// //               return (
// //                 <button
// //                   key={i}
// //                   disabled={!available}
// //                   onClick={() => handleSizeClick(size)}
// //                   style={{
// //                     minWidth: 44, minHeight: 44,
// //                     borderRadius: "50%",
// //                     border: isSelected
// //                       ? "2px solid #ff9800"
// //                       : available ? "1px solid #d1d5db" : "1px solid #e5e7eb",
// //                     background: isSelected
// //                       ? "linear-gradient(145deg,#ffb74d,#ff9800)"
// //                       : available ? "linear-gradient(145deg,#4a90e2,#357abd)" : "#f3f4f6",
// //                     color: isSelected ? "#fff" : available ? "#fff" : "#9ca3af",
// //                     fontWeight: 700, fontSize: 13,
// //                     cursor: available ? "pointer" : "not-allowed",
// //                     position: "relative",
// //                     transition: "all 0.2s",
// //                     boxShadow: isSelected ? "0 4px 8px rgba(255,152,0,0.4)" : available ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
// //                   }}
// //                   title={!available ? "Not available with selected color" : !hasStock ? "Out of stock" : ""}
// //                 >
// //                   {size}
// //                   {/* Out of stock strikethrough line */}
// //                   {!hasStock && available && (
// //                     <span style={{
// //                       position: "absolute", top: "50%", left: 4, right: 4,
// //                       height: 1.5, background: "#ef4444", transform: "rotate(-45deg)"
// //                     }} />
// //                   )}
// //                 </button>
// //               );
// //             })}
// //           </div>
// //         </div>
// //       )}

// //       {/* ── COLOR SELECTOR ── */}
// //       {allColors.length > 0 && (
// //         <div>
// //           <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#333" }}>
// //             Select Color:
// //             {selectedColor && (
// //               <span style={{
// //                 marginLeft: 8, color: "#ff3f6c", fontWeight: 700,
// //                 textTransform: "capitalize"
// //               }}>
// //                 {selectedColor}
// //               </span>
// //             )}
// //           </h4>

// //           <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
// //             {allColors.map((color, i) => {
// //               const available  = availableColors.includes(color);
// //               const isSelected = selectedColor === color;

// //               const hasStock = (colorToSizes[color] || []).some(s => s.stock > 0)
// //                 || variants.find(v => v.color === color && !v.size)?.stock > 0;

// //               return (
// //                 <button
// //                   key={i}
// //                   disabled={!available}
// //                   onClick={() => handleColorClick(color)}
// //                   title={color}
// //                   style={{
// //                     width: 36, height: 36,
// //                     borderRadius: "50%",
// //                     backgroundColor: color,
// //                     border: isSelected
// //                       ? "3px solid #ff9800"
// //                       : available ? "2px solid #d1d5db" : "2px solid #e5e7eb",
// //                     cursor: available ? "pointer" : "not-allowed",
// //                     opacity: available ? 1 : 0.35,
// //                     position: "relative",
// //                     transition: "all 0.2s",
// //                     boxShadow: isSelected
// //                       ? "0 0 0 3px rgba(255,152,0,0.35), 0 4px 8px rgba(0,0,0,0.2)"
// //                       : "0 2px 6px rgba(0,0,0,0.2)",
// //                     transform: isSelected ? "scale(1.15)" : "scale(1)",
// //                   }}
// //                 >
// //                   {/* Strikethrough for unavailable */}
// //                   {!available && (
// //                     <span style={{
// //                       position: "absolute", top: "50%", left: 2, right: 2,
// //                       height: 2, background: "#ef4444",
// //                       transform: "rotate(-45deg)", borderRadius: 2,
// //                     }} />
// //                   )}
// //                   {/* Checkmark for selected */}
// //                   {isSelected && (
// //                     <span style={{
// //                       position: "absolute", inset: 0,
// //                       display: "flex", alignItems: "center", justifyContent: "center",
// //                       fontSize: 14, color: "#fff",
// //                       textShadow: "0 1px 3px rgba(0,0,0,0.5)",
// //                     }}>✓</span>
// //                   )}
// //                 </button>
// //               );
// //             })}
// //           </div>
// //         </div>
// //       )}

// //       {/* ── STOCK DISPLAY ── */}
// //       {selectedSize || selectedColor ? (
// //         stock === null ? (
// //           <p style={{
// //             margin: 0, fontSize: 13, color: "#ef4444", fontWeight: 600,
// //             background: "#fef2f2", padding: "6px 12px", borderRadius: 8,
// //             border: "1px solid #fecaca", display: "inline-block"
// //           }}>
// //             ⚠️ This combination is not available
// //           </p>
// //         ) : stock === 0 ? (
// //           <p style={{
// //             margin: 0, fontSize: 13, color: "#dc2626", fontWeight: 600,
// //             background: "#fef2f2", padding: "6px 12px", borderRadius: 8,
// //             border: "1px solid #fecaca", display: "inline-block"
// //           }}>
// //             ❌ Out of Stock
// //           </p>
// //         ) : stock <= 5 ? (
// //           <p style={{
// //             margin: 0, fontSize: 13, color: "#d97706", fontWeight: 600,
// //             background: "#fffbeb", padding: "6px 12px", borderRadius: 8,
// //             border: "1px solid #fde68a", display: "inline-block"
// //           }}>
// //             🔥 Only {stock} left — Hurry!
// //           </p>
// //         ) : (
// //           <p style={{
// //             margin: 0, fontSize: 13, color: "#16a34a", fontWeight: 600,
// //             background: "#f0fdf4", padding: "6px 12px", borderRadius: 8,
// //             border: "1px solid #bbf7d0", display: "inline-block"
// //           }}>
// //             ✅ In Stock ({stock} available)
// //           </p>
// //         )
// //       ) : null}

// //       {/* ── SIZE CHART MODAL ── */}
// //       {showSizeChart && (
// //         <SizeChart
// //           category={product?.category}
// //           subcategory={product?.subcategory || product?.subCategory}
// //           onClose={() => setShowSizeChart(false)}
// //         />
// //       )}
// //     </div>
// //   );
// // };

// // export default VariantSelector;

// // src/components/VariantSelector.jsx
// import React, { useState } from "react";
// import SizeChart from "../pages/Sizechart";

// const VariantSelector = ({
//   product,
//   selectedSize,
//   setSelectedSize,
//   selectedColor,
//   setSelectedColor,
//   isSizeCategory,
// }) => {
//   const [showSizeChart, setShowSizeChart] = useState(false);

//   const variants      = product?.variants || [];
//   const sizeToColors  = product?.size_to_colors || {};
//   const colorToSizes  = product?.color_to_sizes || {};

//   // All unique sizes
//   const allSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];

//   // All unique colors — build from variants keeping BOTH name and hex
//   // De-dupe by colorName (the matching key)
//   const allColorEntries = [];
//   const seen = new Set();
//   for (const v of variants) {
//     const name = (v.colorName || v.color || "").trim();
//     if (name && !seen.has(name)) {
//       seen.add(name);
//       allColorEntries.push({
//         name,                                          // used for matching
//         hex: v.colorHex || v.color || name,            // used for background
//       });
//     }
//   }

//   // When size selected → only show colors that exist for that size
//   const availableColorNames = selectedSize
//     ? (sizeToColors[selectedSize] || []).map(c => c.color)
//     : allColorEntries.map(c => c.name);

//   // When color selected → only show sizes that exist for that color
//   const availableSizes = selectedColor
//     ? (colorToSizes[selectedColor] || []).map(s => s.size)
//     : allSizes;

//   // Exact match stock
//   const getStock = () => {
//     if (!selectedSize && !selectedColor) return null;
//     const match = variants.find(v => {
//       const sizeMatch  = !isSizeCategory || v.size  === selectedSize;
//       const colorMatch = !selectedColor  || (v.colorName || v.color) === selectedColor;
//       return sizeMatch && colorMatch;
//     });
//     if (!match) return null;
//     let stk = match.stock;
//     if (typeof stk === "object" && stk.$numberInt) stk = parseInt(stk.$numberInt);
//     return parseInt(stk || 0);
//   };

//   const stock = getStock();

//   const handleSizeClick = (size) => {
//     if (selectedSize === size) {
//       setSelectedSize("");
//     } else {
//       setSelectedSize(size);
//       // Reset color if not available for new size
//       const colorsForSize = (sizeToColors[size] || []).map(c => c.color);
//       if (selectedColor && !colorsForSize.includes(selectedColor)) {
//         setSelectedColor("");
//       }
//     }
//   };

//   const handleColorClick = (colorName) => {
//     if (selectedColor === colorName) {
//       setSelectedColor("");
//     } else {
//       setSelectedColor(colorName);
//       // Reset size if not available for new color
//       const sizesForColor = (colorToSizes[colorName] || []).map(s => s.size);
//       if (selectedSize && !sizesForColor.includes(selectedSize)) {
//         setSelectedSize("");
//       }
//     }
//   };

//   if (!variants.length) return null;

//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

//       {/* ── SIZE ── */}
//       {isSizeCategory && allSizes.length > 0 && (
//         <div>
//           <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
//             <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#333" }}>
//               Select Size:
//               {selectedSize && (
//                 <span style={{ marginLeft: 8, color: "#ff3f6c", fontWeight: 700 }}>
//                   {selectedSize}
//                 </span>
//               )}
//             </h4>
//             <button
//               onClick={() => setShowSizeChart(true)}
//               style={{
//                 background: "none", border: "none", cursor: "pointer",
//                 fontSize: 12, color: "#3c82f6", fontWeight: 600,
//                 textDecoration: "underline", padding: 0,
//               }}
//             >
//               📏 Size Chart
//             </button>
//           </div>

//           <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
//             {allSizes.map((size, i) => {
//               const available  = availableSizes.includes(size);
//               const isSelected = selectedSize === size;
//               const hasStock   = (sizeToColors[size] || []).some(c => c.stock > 0)
//                 || variants.find(v => v.size === size && !v.color)?.stock > 0;

//               return (
//                 <button key={i}
//                   disabled={!available}
//                   onClick={() => handleSizeClick(size)}
//                   style={{
//                     minWidth: 44, minHeight: 44, borderRadius: "50%",
//                     border: isSelected ? "2px solid #ff9800" : available ? "1px solid #d1d5db" : "1px solid #e5e7eb",
//                     background: isSelected
//                       ? "linear-gradient(145deg,#ffb74d,#ff9800)"
//                       : available ? "linear-gradient(145deg,#4a90e2,#357abd)" : "#f3f4f6",
//                     color: isSelected ? "#fff" : available ? "#fff" : "#9ca3af",
//                     fontWeight: 700, fontSize: 13,
//                     cursor: available ? "pointer" : "not-allowed",
//                     position: "relative", transition: "all 0.2s",
//                     boxShadow: isSelected ? "0 4px 8px rgba(255,152,0,0.4)" : "none",
//                   }}
//                 >
//                   {size}
//                   {!hasStock && available && (
//                     <span style={{
//                       position: "absolute", top: "50%", left: 4, right: 4,
//                       height: 1.5, background: "#ef4444", transform: "rotate(-45deg)",
//                     }} />
//                   )}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* ── COLOR ── */}
//       {allColorEntries.length > 0 && (
//         <div>
//           <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#333" }}>
//             Select Color:
//             {selectedColor && (
//               <span style={{ marginLeft: 8, color: "#ff3f6c", fontWeight: 700, textTransform: "capitalize" }}>
//                 {selectedColor}
//               </span>
//             )}
//           </h4>

//           <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
//             {allColorEntries.map(({ name, hex }, i) => {
//               const available  = availableColorNames.includes(name);
//               const isSelected = selectedColor === name;

//               // ✅ FIX: use hex for background, name for matching
//               const bgColor = hex.startsWith("#") ? hex : name;

//               const hasStock = (colorToSizes[name] || []).some(s => s.stock > 0)
//                 || variants.find(v => (v.colorName || v.color) === name && !v.size)?.stock > 0;

//               return (
//                 <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
//                   <button
//                     disabled={!available}
//                     onClick={() => handleColorClick(name)}
//                     title={name}
//                     style={{
//                       width: 36, height: 36, borderRadius: "50%",
//                       // ✅ Use hex for visual, fallback to name for CSS named colors
//                       backgroundColor: bgColor,
//                       border: isSelected ? "3px solid #ff9800" : available ? "2px solid #d1d5db" : "2px solid #e5e7eb",
//                       cursor: available ? "pointer" : "not-allowed",
//                       opacity: available ? 1 : 0.35,
//                       position: "relative", transition: "all 0.2s",
//                       boxShadow: isSelected
//                         ? "0 0 0 3px rgba(255,152,0,0.35), 0 4px 8px rgba(0,0,0,0.2)"
//                         : "0 2px 6px rgba(0,0,0,0.2)",
//                       transform: isSelected ? "scale(1.15)" : "scale(1)",
//                     }}
//                   >
//                     {!available && (
//                       <span style={{
//                         position: "absolute", top: "50%", left: 2, right: 2,
//                         height: 2, background: "#ef4444",
//                         transform: "rotate(-45deg)", borderRadius: 2,
//                       }} />
//                     )}
//                     {isSelected && (
//                       <span style={{
//                         position: "absolute", inset: 0,
//                         display: "flex", alignItems: "center", justifyContent: "center",
//                         fontSize: 14, color: "#fff",
//                         textShadow: "0 1px 3px rgba(0,0,0,0.5)",
//                       }}>✓</span>
//                     )}
//                   </button>
//                   {/* ✅ Show color name label below swatch */}
//                   <span style={{ fontSize: 10, color: "#6b7280", textAlign: "center", maxWidth: 50, lineHeight: 1.2 }}>
//                     {name}
//                   </span>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* ── STOCK ── */}
//       {(selectedSize || selectedColor) && (
//         stock === null ? (
//           <p style={{
//             margin: 0, fontSize: 13, color: "#ef4444", fontWeight: 600,
//             background: "#fef2f2", padding: "6px 12px", borderRadius: 8,
//             border: "1px solid #fecaca", display: "inline-block",
//           }}>
//             ⚠️ This combination is not available
//           </p>
//         ) : stock === 0 ? (
//           <p style={{
//             margin: 0, fontSize: 13, color: "#dc2626", fontWeight: 600,
//             background: "#fef2f2", padding: "6px 12px", borderRadius: 8,
//             border: "1px solid #fecaca", display: "inline-block",
//           }}>
//             ❌ Out of Stock
//           </p>
//         ) : stock <= 5 ? (
//           <p style={{
//             margin: 0, fontSize: 13, color: "#d97706", fontWeight: 600,
//             background: "#fffbeb", padding: "6px 12px", borderRadius: 8,
//             border: "1px solid #fde68a", display: "inline-block",
//           }}>
//             🔥 Only {stock} left — Hurry!
//           </p>
//         ) : (
//           <p style={{
//             margin: 0, fontSize: 13, color: "#16a34a", fontWeight: 600,
//             background: "#f0fdf4", padding: "6px 12px", borderRadius: 8,
//             border: "1px solid #bbf7d0", display: "inline-block",
//           }}>
//             ✅ In Stock ({stock} available)
//           </p>
//         )
//       )}

//       {/* ── SIZE CHART MODAL ── */}
//       {showSizeChart && (
//         <SizeChart
//           category={product?.category}
//           subcategory={product?.subcategory || product?.subCategory}
//           onClose={() => setShowSizeChart(false)}
//         />
//       )}
//     </div>
//   );
// };

// export default VariantSelector;

import React, { useState } from "react";
import SizeChart from "../pages/Sizechart";

const VariantSelector = ({
  product,
  selectedSize,
  setSelectedSize,
  selectedColor,
  setSelectedColor,
  isSizeCategory,
}) => {
  const [showSizeChart, setShowSizeChart] = useState(false);

  const variants      = product?.variants || [];
  const sizeToColors  = product?.size_to_colors || {};
  const colorToSizes  = product?.color_to_sizes || {};

  const allSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];

  const allColorEntries = [];
  const seen = new Set();
  for (const v of variants) {
    const name = (v.colorName || v.color || "").trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      allColorEntries.push({
        name,
        hex: v.colorHex || v.color || name,
      });
    }
  }

  const availableColorNames = selectedSize
    ? (sizeToColors[selectedSize] || []).map(c => c.color)
    : allColorEntries.map(c => c.name);

  const availableSizes = selectedColor
    ? (colorToSizes[selectedColor] || []).map(s => s.size)
    : allSizes;

  const getStock = () => {
    if (!selectedSize && !selectedColor) return null;
    const match = variants.find(v => {
      const sizeMatch  = !isSizeCategory || v.size  === selectedSize;
      const colorMatch = !selectedColor  || (v.colorName || v.color) === selectedColor;
      return sizeMatch && colorMatch;
    });
    if (!match) return null;
    let stk = match.stock;
    if (typeof stk === "object" && stk.$numberInt) stk = parseInt(stk.$numberInt);
    return parseInt(stk || 0);
  };

  const stock = getStock();

  const handleSizeClick = (size) => {
    if (selectedSize === size) {
      setSelectedSize("");
    } else {
      setSelectedSize(size);
      const colorsForSize = (sizeToColors[size] || []).map(c => c.color);
      if (selectedColor && !colorsForSize.includes(selectedColor)) {
        setSelectedColor("");
      }
    }
  };

  const handleColorClick = (colorName) => {
    if (selectedColor === colorName) {
      setSelectedColor("");
    } else {
      setSelectedColor(colorName);
      const sizesForColor = (colorToSizes[colorName] || []).map(s => s.size);
      if (selectedSize && !sizesForColor.includes(selectedSize)) {
        setSelectedSize("");
      }
    }
  };

  if (!variants.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── SIZE ── */}
      {isSizeCategory && allSizes.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#333" }}>
              Select Size:
              {selectedSize && (
                <span style={{ marginLeft: 8, color: "#ff3f6c", fontWeight: 700 }}>
                  {selectedSize}
                </span>
              )}
            </h4>
            <button
              onClick={() => setShowSizeChart(true)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: "#3c82f6", fontWeight: 600,
                textDecoration: "underline", padding: 0,
              }}
            >
              📏 Size Chart
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {allSizes.map((size, i) => {
              const available  = availableSizes.includes(size);
              const isSelected = selectedSize === size;
              const hasStock   = (sizeToColors[size] || []).some(c => c.stock > 0)
                || variants.find(v => v.size === size && !v.color)?.stock > 0;

              return (
                <button key={i}
                  disabled={!available}
                  onClick={() => handleSizeClick(size)}
                  style={{
                    minWidth: 44, minHeight: 44, borderRadius: "50%",
                    border: isSelected ? "2px solid #ff9800" : available ? "1px solid #d1d5db" : "1px solid #e5e7eb",
                    background: isSelected
                      ? "linear-gradient(145deg,#ffb74d,#ff9800)"
                      : available ? "linear-gradient(145deg,#4a90e2,#357abd)" : "#f3f4f6",
                    color: isSelected ? "#fff" : available ? "#fff" : "#9ca3af",
                    fontWeight: 700, fontSize: 13,
                    cursor: available ? "pointer" : "not-allowed",
                    position: "relative", transition: "all 0.2s",
                    boxShadow: isSelected ? "0 4px 8px rgba(255,152,0,0.4)" : "none",
                  }}
                >
                  {size}
                  {!hasStock && available && (
                    <span style={{
                      position: "absolute", top: "50%", left: 4, right: 4,
                      height: 1.5, background: "#ef4444", transform: "rotate(-45deg)",
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── COLOR ── */}
      {allColorEntries.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#333" }}>
            Select Color:
            {selectedColor && (
              <span style={{ marginLeft: 8, color: "#ff3f6c", fontWeight: 700, textTransform: "capitalize" }}>
                {selectedColor}
              </span>
            )}
          </h4>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            {allColorEntries.map(({ name, hex }, i) => {
              const available  = availableColorNames.includes(name);
              const isSelected = selectedColor === name;
              const bgColor    = hex.startsWith("#") ? hex : name;
              const hasStock   = (colorToSizes[name] || []).some(s => s.stock > 0)
                || variants.find(v => (v.colorName || v.color) === name && !v.size)?.stock > 0;

              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <button
                    disabled={!available}
                    onClick={() => handleColorClick(name)}
                    title={name}
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
                      backgroundColor: bgColor,
                      border: isSelected ? "3px solid #ff9800" : available ? "2px solid #d1d5db" : "2px solid #e5e7eb",
                      cursor: available ? "pointer" : "not-allowed",
                      opacity: available ? 1 : 0.35,
                      position: "relative", transition: "all 0.2s",
                      boxShadow: isSelected
                        ? "0 0 0 3px rgba(255,152,0,0.35), 0 4px 8px rgba(0,0,0,0.2)"
                        : "0 2px 6px rgba(0,0,0,0.2)",
                      transform: isSelected ? "scale(1.15)" : "scale(1)",
                    }}
                  >
                    {!available && (
                      <span style={{
                        position: "absolute", top: "50%", left: 2, right: 2,
                        height: 2, background: "#ef4444",
                        transform: "rotate(-45deg)", borderRadius: 2,
                      }} />
                    )}
                    {isSelected && (
                      <span style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, color: "#fff",
                        textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                      }}>✓</span>
                    )}
                  </button>
                  <span style={{ fontSize: 10, color: "#6b7280", textAlign: "center", maxWidth: 50, lineHeight: 1.2 }}>
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STOCK ── */}
      {(selectedSize || selectedColor) && (
        stock === null ? (
          <p style={{ margin: 0, fontSize: 13, color: "#ef4444", fontWeight: 600,
            background: "#fef2f2", padding: "6px 12px", borderRadius: 8,
            border: "1px solid #fecaca", display: "inline-block" }}>
            ⚠️ This combination is not available
          </p>
        ) : stock === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "#dc2626", fontWeight: 600,
            background: "#fef2f2", padding: "6px 12px", borderRadius: 8,
            border: "1px solid #fecaca", display: "inline-block" }}>
            ❌ Out of Stock
          </p>
        ) : stock <= 5 ? (
          <p style={{ margin: 0, fontSize: 13, color: "#d97706", fontWeight: 600,
            background: "#fffbeb", padding: "6px 12px", borderRadius: 8,
            border: "1px solid #fde68a", display: "inline-block" }}>
            🔥 Only {stock} left — Hurry!
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: "#16a34a", fontWeight: 600,
            background: "#f0fdf4", padding: "6px 12px", borderRadius: 8,
            border: "1px solid #bbf7d0", display: "inline-block" }}>
            ✅ In Stock ({stock} available)
          </p>
        )
      )}

      {/* ── SIZE CHART MODAL ── */}
      {showSizeChart && (
        <SizeChart
          category={product?.category}
          subcategory={product?.subcategory || product?.subCategory}
          onClose={() => setShowSizeChart(false)}
          productId={product?._id}                  
          variants={product?.variants || []}         
          sizeChartUrl={product?.size_chart_url}     
        />
      )}
    </div>
  );
};

export default VariantSelector;