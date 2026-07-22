
const API_URL = 'http://localhost:5000/api/products/'; // ✅ if Flask blueprint has url_prefix='/api'


export const fetchProducts = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const deleteProduct = async (id) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const addProduct = async (formData) => {
  const token = localStorage.getItem('token');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
};

export const updateProduct = async (id, formData) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
};
