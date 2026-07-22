import React, { useState, useEffect } from "react";
import styles from "./AdminSubusers.module.css";
import { FaUserPlus, FaUsersCog, FaShieldAlt, FaEdit, FaTrash, FaKey, FaSave, FaTimes } from "react-icons/fa";

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

  const activePermissionCount = (permissions = {}) => Object.values(permissions).filter(Boolean).length;

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div><span>Access management</span><h1>Admin Subusers</h1><p>Create staff accounts and control exactly what each person can access.</p></div>
        <div className={styles.heroIcon}><FaUsersCog /></div>
      </header>

      <div className={styles.statsGrid}>
        <article><span><FaUsersCog /></span><div><strong>{subusers.length}</strong><small>Total subusers</small></div></article>
        <article><span><FaShieldAlt /></span><div><strong>{new Set(subusers.map((item) => item.role)).size}</strong><small>Roles assigned</small></div></article>
        <article><span><FaUsersCog /></span><div><strong>{subusers.filter((item) => item.parentId).length}</strong><small>Linked accounts</small></div></article>
      </div>

      <div className={styles.workspace}>
        <form className={styles.formCard} onSubmit={handleAddSubuser}>
          <div className={styles.sectionHeading}><span><FaUserPlus /></span><div><h2>Add a subuser</h2><p>An invitation will be emailed for password setup.</p></div></div>
          <div className={styles.formGrid}>
            <label className={styles.field}><span>Email address</span><input type="email" name="email" value={form.email} onChange={handleFormChange} placeholder="staff@citimart.com" required /></label>
            <label className={styles.field}><span>Assign to</span><select name="parentType" value={form.parentType} onChange={handleFormChange}><option>Customer</option><option>Vendor</option><option>Admin</option><option>Merchandise</option><option>Marketing</option><option value="HeadOffice">Head Office</option></select></label>
            <label className={styles.field}><span>Parent account</span>{["Admin","Merchandise","Marketing","HeadOffice"].includes(form.parentType) ? <div className={styles.notRequired}>No parent account required</div> : <select name="parentId" value={form.parentId} onChange={handleFormChange} required><option value="">Select parent</option>{parentAccounts.map((account) => <option key={account._id} value={account._id}>{account.email}</option>)}</select>}</label>
            <label className={styles.field}><span>Staff role</span><select name="role" value={form.role} onChange={handleFormChange}>{Object.keys(rolePermissions).map((role) => <option key={role}>{role}</option>)}</select></label>
          </div>
          <div className={styles.permissionBlock}>
            <div className={styles.permissionTitle}><span>Permissions</span><small>{activePermissionCount(form.permissions)} selected</small></div>
            <div className={styles.checkboxGrid}>{Object.keys(form.permissions).map((permission) => <label key={permission} className={form.permissions[permission] ? styles.permissionChecked : ""}><input type="checkbox" name={permission} checked={form.permissions[permission]} onChange={handlePermissionChange}/><span>{permission[0].toUpperCase()+permission.slice(1)}</span></label>)}</div>
          </div>
          <button className={styles.primaryBtn} type="submit"><FaUserPlus /> Add Subuser</button>
        </form>

        <aside className={styles.roleGuide}>
          <div className={styles.sectionHeading}><span><FaShieldAlt /></span><div><h2>Role guide</h2><p>Recommended access presets</p></div></div>
          <div className={styles.roleList}>{Object.entries(rolePermissions).map(([role, permissions], index) => <div className={styles.roleItem} key={role}><span className={`${styles.roleColor} ${styles[`roleColor${index%4}`]}`}/><div><strong>{role}</strong><small>{permissions.length} permissions</small></div></div>)}</div>
        </aside>
      </div>

      <div className={styles.listCard}>
        <div className={styles.listHeader}><div><span>Team directory</span><h2>Existing Subusers</h2></div><strong>{subusers.length} accounts</strong></div>
        {!subusers.length ? <div className={styles.emptyState}><FaUsersCog/><h3>No subusers found</h3><p>Add your first staff account above.</p></div> : <div className={styles.tableWrap}>
          <table className={styles.table}><thead><tr><th>Email</th><th>Account type</th><th>Parent</th><th>Role</th><th>Permissions</th><th>Actions</th></tr></thead><tbody>
            {subusers.map((subuser,index) => <tr key={subuser._id}>
              <td data-label="Email">{editingId===subuser._id ? <input name="email" value={editForm?.email||""} onChange={handleEditFormChange}/> : <div className={styles.userCell}><span>{subuser.email?.[0]?.toUpperCase()}</span><div><strong>{subuser.email}</strong><small>Staff account</small></div></div>}</td>
              <td data-label="Account type">{editingId===subuser._id ? <select name="parentType" value={editForm.parentType} onChange={handleEditFormChange}><option>Customer</option><option>Vendor</option><option>Admin</option><option>Merchandise</option><option>Marketing</option><option value="HeadOffice">Head Office</option></select> : <span className={styles.typeBadge}>{subuser.parentType||"Admin"}</span>}</td>
              <td data-label="Parent"><span className={styles.parentText}>{subuser.parentId||"Not required"}</span></td>
              <td data-label="Role">{editingId===subuser._id ? <select name="role" value={editForm.role} onChange={handleEditFormChange}>{Object.keys(rolePermissions).map((role)=><option key={role}>{role}</option>)}</select> : <span className={`${styles.roleBadge} ${styles[`roleBadge${index%4}`]}`}>{subuser.role}</span>}</td>
              <td data-label="Permissions">{editingId===subuser._id ? <div className={styles.editPermissions}>{Object.keys(editForm.permissions||{}).map((permission)=><label key={permission}><input type="checkbox" name={permission} checked={editForm.permissions[permission]} onChange={handleEditPermissionChange}/>{permission}</label>)}</div> : <div className={styles.permissionChips}>{Object.keys(subuser.permissions||{}).filter((permission)=>subuser.permissions[permission]).map((permission)=><span key={permission}>{permission}</span>)}{!activePermissionCount(subuser.permissions)&&<small>None</small>}</div>}</td>
              <td data-label="Actions"><div className={styles.actions}>{editingId===subuser._id ? <><button className={styles.saveBtn} type="button" onClick={()=>handleSaveEdit(subuser._id)}><FaSave/><span>Save</span></button><button className={styles.cancelBtn} type="button" onClick={handleCancelEdit}><FaTimes/><span>Cancel</span></button></> : <><button className={styles.editBtn} type="button" onClick={()=>handleEdit(subuser)}><FaEdit/><span>Edit</span></button><button className={styles.keyBtn} type="button" onClick={()=>handleResetPassword(subuser._id)}><FaKey/><span>Reset</span></button><button className={styles.deleteBtn} type="button" onClick={()=>handleDelete(subuser._id)}><FaTrash/><span>Delete</span></button></>}</div></td>
            </tr>)}
          </tbody></table>
        </div>}
      </div>
    </section>
  );
};

export default AdminSubusers;