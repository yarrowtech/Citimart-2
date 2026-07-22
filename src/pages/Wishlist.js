import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Wishlist.module.css';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();

  const customerId = localStorage.getItem('customer_id');
  const token = localStorage.getItem('token');

  // Redirect if not logged in
  useEffect(() => {
    if (!customerId || !token) {
      navigate('/login');
    }
  }, [customerId, token, navigate]);

  const fetchWishlist = async () => {
    try {
      const res = await fetch(`http://localhost:5000/customer/wishlist/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('customer_id');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const data = await res.json();
      if (data.items) {
        setWishlist(data.items);
      } else {
        setWishlist([]);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    }
  };

  const removeFromWishlist = async (productId, size, color) => {
    try {
      const res = await fetch(`http://localhost:5000/customer/wishlist/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          product_id: productId,
          size,
          color,
        }),
      });
      if (res.ok) {
        fetchWishlist();
      }
    } catch (err) {
      console.error('Failed to remove from wishlist', err);
    }
  };

  const moveToCart = async (productId, size, color) => {
    try {
      await fetch('http://localhost:5000/customer/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          product_id: productId,
          size,
          color,
          quantity: 1,
        }),
      });

      await removeFromWishlist(productId, size, color);
    } catch (err) {
      console.error('Failed to move to cart', err);
    }
  };

  useEffect(() => {
    if (customerId && token) {
      fetchWishlist();
    }
  }, [customerId, token]);

  if (!customerId || !token) {
    return null;
  }

  if (wishlist.length === 0) {
    return (
      <div className={styles.emptyWishlistContainer}>
        <div className={styles.emptyEmoji}>💔</div>
        <h3>Your wishlist is empty</h3>
        <a href="/products" className={styles.shopLink}>🛒 Start Shopping</a>
      </div>
    );
  }

  return (
    <div className={styles.wishlistPage}>
      <div className={styles.wishlistMain}>
        <h2 className={styles.wishlistTitle}>❤️ Your Wishlist</h2>
        <div className={styles.wishlistList}>
          {wishlist.map((item, idx) => {
            const product = item.product || {};

            // Robust category/subcategory check
            const category = product.category?.trim().toLowerCase();
            const subcategory = product.subcategory?.trim().toLowerCase();
            const showSize = category === 'clothing' || (category === 'handmade' && subcategory === 'jewelry');

            return (
              <div key={idx} className={styles.wishlistItem}>
                <img
                  src={product.images?.[0] || '/images/logo.png'}
                  alt={product.name}
                  className={styles.productImg}
                />
                <div className={styles.productInfo}>
                  <a href={`/product/${product._id}`} className={styles.productName}>
                    {product.name}
                  </a>
                  <div className={styles.productPrice}>₹{product.price}</div>

                  {/* Show size only for Clothing or Handmade → Jewelry */}
                  {showSize && item.size && <div>Size: {item.size}</div>}

                  {/* Show color for all items */}
                  {item.color && (
                    <div className={styles.colorContainer}>
                      <span>Color:</span>
                      <div
                        className={styles.colorBox}
                        style={{ backgroundColor: item.color }}
                        title={item.color}
                      ></div>
                    </div>
                  )}

                  <div className={styles.actions}>
                    <button
                      className={styles.moveBtn}
                      onClick={() => moveToCart(product._id, item.size, item.color)}
                    >
                      ➕ Move to Cart
                    </button>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeFromWishlist(product._id, item.size, item.color)}
                    >
                      ❌ Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
