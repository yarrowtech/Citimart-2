import React from "react";
import SupportInbox from "../../components/chat/SupportInbox";

const AdminSupportCenter = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>Support Center</h2>
      <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
        Customer chats, vendor threads, and internal staff messages. Viewing a thread you are not part of is logged.
      </p>
    </div>
    <SupportInbox token={localStorage.getItem("adminToken")} />
  </div>
);

export default AdminSupportCenter;
