import React, { useState } from "react";
import "./FAQ.css";

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "🛍️ What is Citimart?",
      answer:
        "Citimart is your trusted online store for groceries, fashion, electronics, and household items — delivering quality and convenience right to your doorstep.",
    },
    {
      question: "🚚 How can I track my order?",
      answer:
        "After your order is shipped, you'll receive an SMS or email with a tracking link. You can also check your order status anytime under 'My Orders' in your Citimart account.",
    },
    {
      question: "💸 What are the delivery charges?",
      answer:
        "Delivery is free for orders above ₹499. For smaller orders, a small delivery fee is applied depending on your location.",
    },
    {
      question: "🔁 How can I return or exchange a product?",
      answer:
        "You can request a return or exchange within 7 days of delivery if the product is unused and in its original packaging.",
    },
    {
      question: "💳 What payment methods are accepted?",
      answer:
        "We accept all major debit/credit cards, UPI, wallets, net banking, and Cash on Delivery (for select areas).",
    },
    {
      question: "☎️ How can I contact Citimart support?",
      answer:
        "You can email us at support@citimart.in or call +91-99999-99999 from 9 AM to 9 PM (Mon–Sat).",
    },
  ];

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
