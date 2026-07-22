import React, { useState, useEffect } from "react";
import styles from "./AdminSubusers.module.css";

const rolePermissions = {
  Viewer: ["content", "reports", "faq"],
  "Order Manager": ["promotions", "complaints", "campaigns", "reports"],
  "Inventory Manager": ["merchandise", "analytics", "reports"],
  "Merchandise Manager": [
    "merchandise",
    "promotions",
    "segmentation",
    "reports",
    "analytics",
  ],
  "Marketing Manager": ["media", "promotions", "campaigns"],
  "Support Staff": ["complaints", "faq", "content", "reports"],
  Moderator: [
    "segmentation",
    "promotions",
    "content",
    "campaigns",
    "reports",
    "analytics",
  ],
};

const roleRedirects = {
  Viewer: "/customer-subuser-dashboard",
  "Order Manager": "/vendor-subuser-dashboard",
  "Inventory Manager": "/vendor-subuser-dashboard",
  "Merchandise Manager": "/merchandise-dashboard",
  "Marketing Manager": "/marketing-dashboard",
  "Support Staff": "/head-office-subuser",
  Moderator: "/head-office-subuser",
};

const AdminSubusers = () => {
  const [subusers, setSubusers] = useState([]);
  const [parentAccounts, setParentAccounts] = useState([]);

  const [form, setForm] = useState({
    email: "",
    parentType: "Customer",
    parentId: "",
    role: "Viewer",
    permissions: {
      segmentation: false,
      promotions: false,
      content: false,
      reports: false,
      merchandise: false,
      complaints: false,
      analytics: false,
      campaigns: false,
      faq: false,
      media: false,
    },
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  // Fetch all subusers
  useEffect(() => {
    fetch("http://localhost:5000/admin/subusers")
      .then((res) => res.json())
      .then((data) => setSubusers(data))
      .catch((err) => console.error("Error fetching subusers:", err));
  }, []);

  // Fetch parent accounts when parentType changes (for add form)
  useEffect(() => {
    const pt = (form.parentType || "").toLowerCase();
    if (pt && !["admin", "merchandise", "marketing", "headoffice"].includes(pt)) {
      fetch(`http://localhost:5000/admin/parent-accounts/${pt}`)
        .then((res) => res.json())
        .then((data) => setParentAccounts(data))
        .catch(() => setParentAccounts([]));
    } else {
      setParentAccounts([]);
    }
  }, [form.parentType]);

  // Fetch parent accounts when editing form changes
  useEffect(() => {
    if (!editForm) return;
    const pt = (editForm.parentType || "").toLowerCase();
    if (pt && !["admin", "merchandise", "marketing", "headoffice"].includes(pt)) {
      fetch(`http://localhost:5000/admin/parent-accounts/${pt}`)
        .then((res) => res.json())
        .then((data) => setParentAccounts(data))
        .catch(() => setParentAccounts([]));
    } else {
      setParentAccounts([]);
    }
  }, [editForm?.parentType]);

  // Handle add form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "role") {
      const newPerms = {};
      Object.keys(form.permissions).forEach((p) => {
        newPerms[p] = rolePermissions[value]?.includes(p) || false;
      });
      setForm({ ...form, role: value, permissions: newPerms });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Handle checkbox permissions (add)
  const handlePermissionChange = (e) => {
    setForm({
      ...form,
      permissions: { ...form.permissions, [e.target.name]: e.target.checked },
    });
  };

  // Add Subuser
  const handleAddSubuser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/admin/subusers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, redirectUrl: roleRedirects[form.role] }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Subuser added! Email sent for password setup.");
        setSubusers([...subusers, data.subuser]);
        setForm({
          email: "",
          parentType: "Customer",
          parentId: "",
          role: "Viewer",
          permissions: Object.fromEntries(
            Object.keys(form.permissions).map((p) => [p, false])
          ),
        });
      } else {
        alert(data.error || "Failed to add subuser");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding subuser");
    }
  };

  // Delete subuser
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this subuser?")) return;
    try {
      const res = await fetch(`http://localhost:5000/admin/subusers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSubusers(subusers.filter((su) => su._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit subuser
  const handleEdit = (subuser) => {
    setEditingId(subuser._id);
    setEditForm({ ...subuser });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "role") {
      const newPerms = {};
      Object.keys(editForm.permissions).forEach((p) => {
        newPerms[p] = rolePermissions[value]?.includes(p) || false;
      });
      setEditForm({ ...editForm, role: value, permissions: newPerms });
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleEditPermissionChange = (e) => {
    setEditForm({
      ...editForm,
      permissions: {
        ...editForm.permissions,
        [e.target.name]: e.target.checked,
      },
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/admin/subusers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, redirectUrl: roleRedirects[editForm.role] }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubusers(subusers.map((su) => (su._id === id ? data.subuser : su)));
        setEditingId(null);
        setEditForm(null);
      } else {
        alert(data.error || "Failed to update subuser");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset password
  const handleResetPassword = async (id) => {
    if (!window.confirm("Send password reset link to this subuser?")) return;
    try {
      const res = await fetch(
        `http://localhost:5000/admin/subusers/${id}/reset-password`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok) alert("Password reset link sent!");
      else alert(data.error || "Failed to reset password");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Manage Subusers</h2>

      {/* Add Subuser Form */}
      <form className={styles.form} onSubmit={handleAddSubuser}>
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleFormChange}
          required
        />

        <label>Assign To</label>
        <select name="parentType" value={form.parentType} onChange={handleFormChange}>
          <option value="Customer">Customer</option>
          <option value="Vendor">Vendor</option>
          <option value="Admin">Admin</option>
          <option value="Merchandise">Merchandise</option>
          <option value="Marketing">Marketing</option>
          <option value="HeadOffice">Head Office</option>
        </select>

        <label>Parent Account</label>
        {["Admin", "Merchandise", "Marketing", "HeadOffice"].includes(form.parentType) ? (
          <p>No parent account required</p>
        ) : (
          <select
            name="parentId"
            value={form.parentId}
            onChange={handleFormChange}
            required
          >
            <option value="">-- Select Parent --</option>
            {parentAccounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.email}
              </option>
            ))}
          </select>
        )}

        <label>Role</label>
        <select name="role" value={form.role} onChange={handleFormChange}>
          {Object.keys(rolePermissions).map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>

        <label>Permissions</label>
        <div className={styles.checkboxGroup}>
          {Object.keys(form.permissions).map((perm) => (
            <label key={perm}>
              <input
                type="checkbox"
                name={perm}
                checked={form.permissions[perm]}
                onChange={handlePermissionChange}
              />
              {perm.charAt(0).toUpperCase() + perm.slice(1)}
            </label>
          ))}
        </div>

        <button type="submit">Add Subuser</button>
      </form>

      {/* List of Subusers */}
      <h3>Existing Subusers</h3>
      {subusers.length === 0 ? (
        <p>No subusers found.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Type</th>
              <th>Parent</th>
              <th>Role</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subusers.map((su) => (
              <tr key={su._id}>
                <td>
                  {editingId === su._id ? (
                    <input
                      name="email"
                      value={editForm?.email || ""}
                      onChange={handleEditFormChange}
                    />
                  ) : (
                    su.email
                  )}
                </td>
                <td>
                  {editingId === su._id ? (
                    <select
                      name="parentType"
                      value={editForm.parentType}
                      onChange={handleEditFormChange}
                    >
                      <option value="Customer">Customer</option>
                      <option value="Vendor">Vendor</option>
                      <option value="Admin">Admin</option>
                      <option value="Merchandise">Merchandise</option>
                    </select>
                  ) : (
                    su.parentType
                  )}
                </td>
                <td>{su.parentId || "N/A"}</td>
                <td>
                  {editingId === su._id ? (
                    <select
                      name="role"
                      value={editForm.role}
                      onChange={handleEditFormChange}
                    >
                      {Object.keys(rolePermissions).map((role) => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                  ) : (
                    su.role
                  )}
                </td>
                <td>
                  {editingId === su._id ? (
                    <div className={styles.checkboxGroup}>
                      {Object.keys(editForm.permissions).map((perm) => (
                        <label key={perm}>
                          <input
                            type="checkbox"
                            name={perm}
                            checked={editForm.permissions[perm]}
                            onChange={handleEditPermissionChange}
                          />
                          {perm.charAt(0).toUpperCase() + perm.slice(1)}
                        </label>
                      ))}
                    </div>
                  ) : (
                    Object.keys(su.permissions)
                      .filter((p) => su.permissions[p])
                      .join(", ") || "None"
                  )}
                </td>
                <td>
                  {editingId === su._id ? (
                    <>
                      <button onClick={() => handleSaveEdit(su._id)}>Save</button>
                      <button onClick={handleCancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(su)}>Edit</button>
                      <button onClick={() => handleDelete(su._id)}>Delete</button>
                      <button onClick={() => handleResetPassword(su._id)}>
                        Reset Password
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminSubusers;
