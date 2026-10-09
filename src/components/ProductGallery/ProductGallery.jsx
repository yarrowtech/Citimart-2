import React, { useEffect, useRef, useState } from "react";
import { FaShareAlt, FaTimes, FaSearchPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import styles from "./ProductGallery.module.css";

/**
 * Product image gallery: every image renders in the same fixed-aspect
 * frame (object-fit: contain) so products with different source image
 * sizes/ratios no longer look mismatched. Desktop gets a hover-zoom lens;
 * any device gets a tap/click-to-open lightbox with pinch/wheel/double-tap
 * zoom and drag-to-pan. Below 768px the main frame becomes a swipeable,
 * scroll-snap carousel with dot indicators instead of the thumbnail strip.
 */
const ProductGallery = ({ images = [], alt = "", onShare }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lensVisible, setLensVisible] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const frameRef = useRef(null);
  const carouselRef = useRef(null);
  const panStart = useRef(null);
  const pinchStart = useRef(null);
  const [zoomScale, setZoomScale] = useState(2);

  const safeImages = images.length ? images : [""];
  const activeImage = safeImages[activeIndex] || "";

  // ── Desktop hover-zoom lens ──
  const handleMouseMove = (e) => {
    const rect = frameRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLensPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  // ── Mobile swipe carousel: keep activeIndex in sync with scroll ──
  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex((prev) => (prev === index ? prev : index));
  };

  const scrollToIndex = (index) => {
    const el = carouselRef.current;
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
    setActiveIndex(index);
  };

  // ── Lightbox: open/close, reset zoom state ──
  const openLightbox = (index) => {
    setActiveIndex(index);
    setZoomed(false);
    setZoomScale(2);
    setPan({ x: 0, y: 0 });
    setLightboxOpen(true);
  };
  const closeLightbox = () => setLightboxOpen(false);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") setActiveIndex((i) => Math.min(i + 1, safeImages.length - 1));
      if (e.key === "ArrowLeft") setActiveIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, safeImages.length]);

  useEffect(() => {
    setZoomed(false);
    setPan({ x: 0, y: 0 });
  }, [activeIndex, lightboxOpen]);

  // ── Lightbox interactions: double-click/tap toggles zoom, wheel zooms,
  // drag pans while zoomed, two-finger pinch zooms on touch. ──
  const toggleZoom = () => {
    setZoomed((z) => !z);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    setZoomScale((s) => Math.max(1.2, Math.min(4, s + (e.deltaY < 0 ? 0.25 : -0.25))));
    setZoomed(true);
  };

  const handleMouseDownLightbox = (e) => {
    if (!zoomed) return;
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const handleMouseMoveLightbox = (e) => {
    if (!zoomed || !panStart.current) return;
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  };
  const handleMouseUpLightbox = () => { panStart.current = null; };

  const touchDistance = (touches) => {
    const [a, b] = touches;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      pinchStart.current = { dist: touchDistance(e.touches), scale: zoomScale };
    } else if (zoomed && e.touches.length === 1) {
      panStart.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStart.current) {
      const ratio = touchDistance(e.touches) / pinchStart.current.dist;
      setZoomScale(Math.max(1.2, Math.min(4, pinchStart.current.scale * ratio)));
      setZoomed(true);
    } else if (zoomed && e.touches.length === 1 && panStart.current) {
      setPan({ x: e.touches[0].clientX - panStart.current.x, y: e.touches[0].clientY - panStart.current.y });
    }
  };
  const handleTouchEnd = () => { panStart.current = null; pinchStart.current = null; };

  return (
    <div className={styles.gallery}>
      {/* Desktop/tablet: fixed-frame main image + hover-zoom lens */}
      <div className={styles.desktopOnly}>
        <div
          ref={frameRef}
          className={styles.frame}
          onMouseEnter={() => setLensVisible(true)}
          onMouseLeave={() => setLensVisible(false)}
          onMouseMove={handleMouseMove}
          onClick={() => openLightbox(activeIndex)}
        >
          <img src={activeImage} alt={alt} className={styles.frameImg} />
          {lensVisible && activeImage && (
            <div
              className={styles.lens}
              style={{
                backgroundImage: `url(${activeImage})`,
                backgroundPosition: `${lensPos.x}% ${lensPos.y}%`,
              }}
            />
          )}
          <span className={styles.zoomHint}><FaSearchPlus /> Click to zoom</span>
          {onShare && (
            <button
              className={styles.shareIcon}
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              aria-label="Share product"
            >
              <FaShareAlt />
            </button>
          )}
        </div>

        {safeImages.length > 1 && (
          <div className={styles.thumbnails}>
            {safeImages.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                onClick={() => setActiveIndex(i)}
                className={`${styles.thumb} ${i === activeIndex ? styles.thumbActive : ""}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile: swipeable carousel + dots, same fixed frame per slide */}
      <div className={styles.mobileOnly}>
        <div className={styles.carousel} ref={carouselRef} onScroll={handleCarouselScroll}>
          {safeImages.map((url, i) => (
            <div key={i} className={styles.carouselSlide} onClick={() => openLightbox(i)}>
              <img src={url} alt={alt} className={styles.frameImg} />
            </div>
          ))}
        </div>
        {onShare && (
          <button className={styles.shareIconMobile} onClick={onShare} aria-label="Share product">
            <FaShareAlt />
          </button>
        )}
        {safeImages.length > 1 && (
          <div className={styles.dots}>
            {safeImages.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ""}`}
                onClick={() => scrollToIndex(i)}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          <button className={styles.lightboxClose} onClick={closeLightbox} aria-label="Close">
            <FaTimes />
          </button>

          {activeIndex > 0 && (
            <button
              className={`${styles.lightboxNav} ${styles.navLeft}`}
              onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => Math.max(i - 1, 0)); }}
            >
              <FaChevronLeft />
            </button>
          )}
          {activeIndex < safeImages.length - 1 && (
            <button
              className={`${styles.lightboxNav} ${styles.navRight}`}
              onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => Math.min(i + 1, safeImages.length - 1)); }}
            >
              <FaChevronRight />
            </button>
          )}

          <div
            className={styles.lightboxStage}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={toggleZoom}
            onWheel={handleWheel}
            onMouseDown={handleMouseDownLightbox}
            onMouseMove={handleMouseMoveLightbox}
            onMouseUp={handleMouseUpLightbox}
            onMouseLeave={handleMouseUpLightbox}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={safeImages[activeIndex]}
              alt={alt}
              className={styles.lightboxImg}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomed ? zoomScale : 1})`,
                cursor: zoomed ? "grab" : "zoom-in",
              }}
              draggable={false}
            />
          </div>
          <div className={styles.lightboxHint}>
            {zoomed ? "Drag to pan · double-click to reset" : "Double-click, scroll, or pinch to zoom"}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
