import React, { useState, useEffect } from 'react';
import styles from './Users.module.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: '' });
  const [reviewUser, setReviewUser] = useState(null); // for segment review modal

  // Fetch users
  useEffect(() => {
    fetch('http://localhost:5000/admin/users')
      .then(res => res.json())
      .then(data => setUsers(data.users))
      .catch(err => console.error('Failed to fetch users:', err));
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`http://localhost:5000/admin/users/${userId}`, {
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
      const res = await fetch(`http://localhost:5000/admin/users/${userId}`, {
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
    const res = await fetch(`http://localhost:5000/admin/users/${userId}/segment/approve`, {
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
    const res = await fetch(`http://localhost:5000/admin/users/${userId}/segment/reject`, {
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


  return (
    <div className={styles.users}>
      <h1>Users</h1>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Join Date</th>
              <th>Status</th>
              <th>Current Segment</th>
              <th>Requested Segment</th>
              <th>Request Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.joinDate}</td>
               <td>
  <span className={`${styles.status} ${
    user.segment_request?.status === 'approved'
      ? styles.active
      : ['pending', 'pending_admin'].includes(user.segment_request?.status)
      ? styles.pending
      : styles.inactive
  }`}>
    {user.segment_request?.status || '-'}
  </span>
</td>


                <td>{user.segment || 'all'}</td>
                <td>
                  {user.segment_request?.requested_segment ? (
                    <button
                      className={styles.reviewButton}
                      onClick={() => setReviewUser(user)}
                    >
                      Review
                    </button>
                  ) : (
                    '-'
                  )}
                </td>
               <td>
  <span className={`${styles.status} ${
    user.segment_request?.status === 'approved'
      ? styles.active
      : ['pending', 'pending_admin'].includes(user.segment_request?.status)
      ? styles.pending
      : styles.inactive
  }`}>
    {user.segment_request?.status || '-'}
  </span>
</td>


                <td>
                  <button className={styles.editButton} onClick={() => openEditForm(user)}>Edit</button>
                  <button className={styles.deleteButton} onClick={() => handleDelete(user.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Segment Review Modal */}
      {reviewUser && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Segment Review</h2>
            <p><strong>Name:</strong> {reviewUser.name}</p>
            <p><strong>Email:</strong> {reviewUser.email}</p>
            <p><strong>Requested Segment:</strong> {reviewUser.segment_request?.requested_segment}</p>
            {reviewUser.segment_request?.proof_image && (
              <div className={styles.proofImage}>
                <img src={reviewUser.segment_request.proof_image} alt="Proof" />
              </div>
            )}
            <p>
              <strong>Status:</strong>{" "}
              <span className={`${styles.status} ${
                reviewUser.segment_request?.status === 'approved'
                  ? styles.active
                  : reviewUser.segment_request?.status === 'pending'
                  ? styles.pending
                  : styles.inactive
              }`}>
                {reviewUser.segment_request?.status}
              </span>
            </p>

            {/* Approve/Reject only if pending */}
           {reviewUser.segment_request?.status === 'pending_admin' && (
  <div className={styles.modalActions}>
    <button className={styles.approveButton} onClick={() => handleApprove(reviewUser.id)}>Approve</button>
    <button className={styles.rejectButton} onClick={() => handleReject(reviewUser.id)}>Reject</button>
  </div>
)}



            <button className={styles.closeButton} onClick={() => setReviewUser(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className={styles.editModal}>
          <h3>Edit User</h3>
          <label>Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <label>Email:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <div className={styles.modalButtons}>
            <button onClick={() => handleEditSubmit(editUser.id)}>Save</button>
            <button onClick={() => setEditUser(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
