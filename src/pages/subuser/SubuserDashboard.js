import React from "react";
import { Navigate } from "react-router-dom";

const SubuserDashboard = () => {
  const token = localStorage.getItem("subuserToken");
  const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");

  if (!token) return <Navigate to="/subuser/login" />;

  return (
    <div>
      <h1>Subuser Dashboard</h1>
      <ul>
        {permissions.segmentation && <li>Segmentation Page</li>}
        {permissions.promotions && <li>Promotions Page</li>}
        {permissions.content && <li>Content Page</li>}
        {permissions.reports && <li>Reports Page</li>}
        {permissions.merchandise && <li>Merchandise Page</li>}
        {permissions.complaints && <li>Complaints Page</li>}
        {permissions.analytics && <li>Analytics Page</li>}
        {permissions.campaigns && <li>Campaigns Page</li>}
        {permissions.faq && <li>FAQ Page</li>}
      </ul>
    </div>
  );
};

export default SubuserDashboard;
