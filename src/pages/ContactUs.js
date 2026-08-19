import React, { useState } from "react";
import styles from "./ContactUs.module.css";

import { API_BASE } from "../config";
const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      setStatus({ success: false, message: "Please fill all required fields." });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus({ success: true, message: "Message sent successfully!" });
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus({ success: false, message: "Failed to send message." });
      }
    } catch (err) {
      setStatus({ success: false, message: "Something went wrong." });
    }
  };

  return (
    <div className={styles.contactPage}>
      <section className={styles.header}>
        <h1>📞 Contact Us</h1>
        <p>We’d love to hear from you! Reach out with any questions or feedback.</p>
      </section>

      <div className={styles.container}>
        {/* Contact Form */}
        <form onSubmit={handleSubmit} className={styles.contactForm}>
          <h2>Send us a Message</h2>
          <input
            type="text"
            name="name"
            placeholder="Your Name *"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email *"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleChange}
          />
          <textarea
            name="message"
            placeholder="Your Message *"
            value={formData.message}
            onChange={handleChange}
            required
          />
          <button type="submit">Send Message</button>

          {status && (
            <p
              className={
                status.success ? styles.successMessage : styles.errorMessage
              }
            >
              {status.message}
            </p>
          )}
        </form>

        {/* Store Info */}
        <div className={styles.storeInfo}>
          <h2>Our Store</h2>
          <p><strong>🏬 Address:</strong> 123 CitiMart Plaza, MG Road, Bengaluru, India</p>
          <p><strong>📧 Email:</strong> support@citimart.com</p>
          <p><strong>📞 Phone:</strong> +91 98765 43210</p>
          <p><strong>🕒 Hours:</strong> Mon–Sat: 10:00 AM – 8:00 PM</p>

          <div className={styles.mapContainer}>
            <iframe
              title="CitiMart Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3910.0511925639674!2d77.59456251480278!3d12.9715986908587!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670e8d58b3f%3A0x4b9cbf11e1d376af!2sMG%20Road%2C%20Bangalore!5e0!3m2!1sen!2sin!4v1703248075123!5m2!1sen!2sin"
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
