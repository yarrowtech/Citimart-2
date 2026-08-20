import React, { useState, useEffect } from "react";
import "./FAQ.css";
import { API_BASE } from "../config";

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/faq`)
      .then((res) => res.json())
      .then((data) => setFaqs(data.faqs || []))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
      <div className="faq-container">
        <h1 className="faq-title">Frequently Asked Questions</h1>
        <p className="faq-subtitle">
          Need help? Here are some common questions about Citimart.
        </p>

        {loading ? (
          <p style={{ textAlign: "center", color: "#888" }}>Loading…</p>
        ) : faqs.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888" }}>
            No FAQs published yet — check back soon.
          </p>
        ) : (
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${activeIndex === index ? "active" : ""}`}
              onClick={() => toggleFAQ(index)}
            >
              <div className="faq-question">
                {faq.question}
                <span className="faq-icon">
                  {activeIndex === index ? "▲" : "▼"}
                </span>
              </div>
              <div
                className="faq-answer"
                style={{
                  maxHeight: activeIndex === index ? "200px" : "0",
                  opacity: activeIndex === index ? "1" : "0",
                }}
              >
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
        )}

        <div className="faq-footer">
          Still have questions?{" "}
          <a href="/contact" className="faq-link">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
