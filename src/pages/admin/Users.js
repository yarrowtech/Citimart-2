import React, { useState, useEffect } from 'react';
import styles from './Users.module.css';
import { FaUsers, FaUserCheck, FaHourglassHalf, FaLayerGroup, FaSearch, FaEdit, FaTrash, FaShieldAlt, FaTimes, FaSave } from 'react-icons/fa';

import { API_BASE } from "../../config";
const Users = () => {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: '' });
  const [reviewUser, setReviewUser] = useState(null);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all'); // for segment review modal

  // Fetch users
  useEffect(() => {
    fetch(`${API_BASE}/admin/users`)
      .then(res => res.json())
      .then(data => setUsers(data.users))
      .catch(err => console.error('Failed to fetch users:', err));
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditForm = (user) => {
    setEditUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role });
  };

  const handleEditSubmit = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const updatedUser = { ...editUser, ...formData };
        setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
        setEditUser(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Approve request
const handleApprove = async (userId) => {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/segment/approve`, {
      method: 'POST'
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(prev =>
        prev.map(u =>
          u.id === userId
            ? {
                ...u,
                segment: data.segment || u.segment_request?.requested_segment, // set approved segment
                segment_request: { ...u.segment_request, status: 'approved' }
              }
            : u
        )
      );
      setReviewUser(prev =>
        prev
          ? {
              ...prev,
              segment: prev.segment_request?.requested_segment, // update modal too
              segment_request: { ...prev.segment_request, status: 'approved' }
            }
          : null
      );
    }
  } catch (err) {
    console.error(err);
  }
};

// Reject request
const handleReject = async (userId) => {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/segment/reject`, {
      method: 'POST'
    });
    if (res.ok) {
      setUsers(prev =>
        prev.map(u =>
          u.id === userId
            ? {
                ...u,
                segment: 'all', // reset to default segment
                segment_request: { ...u.segment_request, status: 'rejected' }
              }
            : u
        )
      );
      setReviewUser(prev =>
        prev
          ? {
              ...prev,
              segment: 'all',
              segment_request: { ...prev.segment_request, status: 'rejected' }
            }
          : null
      );
    }
  } catch (err) {
    console.error(err);
  }
};


  const requestStatus = (user) => user.segment_request?.status || "none";
  const pendingCount = users.filter((user) => ["pending", "pending_admin"].includes(requestStatus(user))).length;
  const approvedCount = users.filter((user) => requestStatus(user) === "approved").length;
  const segments = [...new Set(users.map((user) => user.segment || "all"))];
  const filteredUsers = users.filter((user) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || user.name?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term);
    return matchesSearch && (segmentFilter === "all" || (user.segment || "all") === segmentFilter);
  });

  const statusClass = (status) => status === "approved" ? styles.approved : ["pending", "pending_admin"].includes(status) ? styles.pending : status === "rejected" ? styles.rejected : styles.neutral;

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div><span>Customer management</span><h1>Admin Users</h1><p>Manage customer accounts and review segment verification requests.</p></div>
        <div className={styles.heroIcon}><FaUsers /></div>
      </header>

      <div className={styles.statsGrid}>
        <article><span><FaUsers /></span><div><strong>{users.length}</strong><small>Total users</small></div></article>
        <article><span><FaUserCheck /></span><div><strong>{approvedCount}</strong><small>Approved segments</small></div></article>
        <article><span><FaHourglassHalf /></span><div><strong>{pendingCount}</strong><small>Pending reviews</small></div></article>
        <article><span><FaLayerGroup /></span><div><strong>{segments.length}</strong><small>Customer segments</small></div></article>
      </div>

      <div className={styles.directoryCard}>
        <div className={styles.directoryHeader}>
          <div><span>Customer directory</span><h2>All Users</h2></div>
          <div className={styles.filters}>
            <label className={styles.searchBox}><FaSearch/><input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Search name or email"/></label>
            <select value={segmentFilter} onChange={(event)=>setSegmentFilter(event.target.value)}><option value="all">All segments</option>{segments.filter((segment)=>segment!=="all").map((segment)=><option key={segment} value={segment}>{segment}</option>)}</select>
          </div>
        </div>
        <div className={styles.resultMeta}>Showing {filteredUsers.length} of {users.length} users</div>
        {!filteredUsers.length ? <div className={styles.emptyState}><FaUsers/><h3>No users match your filters</h3><p>Try another name, email or segment.</p></div> : <div className={styles.tableWrap}>
          <table className={styles.table}><thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Current segment</th><th>Verification</th><th>Requested segment</th><th>Actions</th></tr></thead><tbody>
            {filteredUsers.map((user,index)=><tr key={user.id}>
              <td data-label="User"><div className={styles.userCell}><span className={styles[`avatar${index%4}`]}>{user.name?.[0]?.toUpperCase()||user.email?.[0]?.toUpperCase()}</span><div><strong>{user.name||"Unnamed user"}</strong><small>{user.email}</small></div></div></td>
              <td data-label="Role"><span className={styles.roleBadge}>{user.role||"customer"}</span></td>
              <td data-label="Joined"><span className={styles.muted}>{user.joinDate||"—"}</span></td>
              <td data-label="Current segment"><span className={styles.segmentBadge}>{user.segment||"all"}</span></td>
              <td data-label="Verification"><span className={`${styles.statusBadge} ${statusClass(requestStatus(user))}`}>{requestStatus(user)==="none"?"No request":requestStatus(user).replace("_"," ")}</span></td>
              <td data-label="Requested segment">{user.segment_request?.requested_segment ? <button className={styles.reviewButton} onClick={()=>setReviewUser(user)}><FaShieldAlt/> Review {user.segment_request.requested_segment}</button> : <span className={styles.muted}>—</span>}</td>
              <td data-label="Actions"><div className={styles.actions}><button className={styles.editButton} onClick={()=>openEditForm(user)} title="Edit user"><FaEdit/><span>Edit</span></button><button className={styles.deleteButton} onClick={()=>handleDelete(user.id)} title="Delete user"><FaTrash/><span>Delete</span></button></div></td>
            </tr>)}
          </tbody></table>
        </div>}
      </div>

      {reviewUser && <div className={styles.modalOverlay} onMouseDown={(event)=>event.target===event.currentTarget&&setReviewUser(null)}><div className={styles.modalContent} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}><div><span>Verification request</span><h2>Segment Review</h2></div><button onClick={()=>setReviewUser(null)} aria-label="Close"><FaTimes/></button></div>
        <div className={styles.profileSummary}><span>{reviewUser.name?.[0]?.toUpperCase()}</span><div><strong>{reviewUser.name}</strong><small>{reviewUser.email}</small></div></div>
        <div className={styles.reviewGrid}><div><small>Current segment</small><strong>{reviewUser.segment||"all"}</strong></div><div><small>Requested segment</small><strong>{reviewUser.segment_request?.requested_segment}</strong></div><div><small>Request status</small><span className={`${styles.statusBadge} ${statusClass(requestStatus(reviewUser))}`}>{requestStatus(reviewUser).replace("_"," ")}</span></div></div>
        {reviewUser.segment_request?.proof_image && <div className={styles.proofBlock}><span>Submitted proof</span><img src={reviewUser.segment_request.proof_image} alt="Segment verification proof"/></div>}
        <div className={styles.modalActions}>{["pending","pending_admin"].includes(requestStatus(reviewUser))&&<><button className={styles.approveButton} onClick={()=>handleApprove(reviewUser.id)}>Approve request</button><button className={styles.rejectButton} onClick={()=>handleReject(reviewUser.id)}>Reject</button></>}<button className={styles.closeButton} onClick={()=>setReviewUser(null)}>Close</button></div>
      </div></div>}

      {editUser && <div className={styles.modalOverlay} onMouseDown={(event)=>event.target===event.currentTarget&&setEditUser(null)}><div className={styles.editModal} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}><div><span>Account details</span><h2>Edit User</h2></div><button onClick={()=>setEditUser(null)} aria-label="Close"><FaTimes/></button></div>
        <label>Name<input type="text" value={formData.name} onChange={(event)=>setFormData({...formData,name:event.target.value})}/></label>
        <label>Email<input type="email" value={formData.email} onChange={(event)=>setFormData({...formData,email:event.target.value})}/></label>
        <label>Role<select value={formData.role} onChange={(event)=>setFormData({...formData,role:event.target.value})}><option value="customer">Customer</option><option value="admin">Admin</option><option value="subuser">Subuser</option></select></label>
        <div className={styles.modalActions}><button className={styles.saveButton} onClick={()=>handleEditSubmit(editUser.id)}><FaSave/> Save changes</button><button className={styles.closeButton} onClick={()=>setEditUser(null)}>Cancel</button></div>
      </div></div>}
    </section>
  );
};

export default Users;