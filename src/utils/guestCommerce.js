import { API_BASE } from "../config";

export const GUEST_CART_KEY = "citimart_guest_cart";
export const GUEST_WISHLIST_KEY = "citimart_guest_wishlist";

const read = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const write = (key, items) => {
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event("citimart:counts-changed"));
  return items;
};

const variantKey = (item) => `${item.product?._id || item.product_id}:${item.size || "N/A"}:${item.color || "N/A"}`;

export const getGuestCart = () => read(GUEST_CART_KEY);
export const getGuestWishlist = () => read(GUEST_WISHLIST_KEY);
export const setGuestCart = items => write(GUEST_CART_KEY, items);
export const setGuestWishlist = items => write(GUEST_WISHLIST_KEY, items);

export const addGuestCartItem = (product, size = "N/A", color = "N/A", quantity = 1) => {
  const items = getGuestCart();
  const candidate = { product, product_id: product._id, size: size || "N/A", color: color || "N/A", quantity };
  const existing = items.find(item => variantKey(item) === variantKey(candidate));
  if (existing) existing.quantity = Number(existing.quantity || 1) + quantity;
  else items.push(candidate);
  return write(GUEST_CART_KEY, items);
};

export const addGuestWishlistItem = (product, size = "N/A", color = "N/A") => {
  const items = getGuestWishlist();
  const candidate = { product, product_id: product._id, size: size || "N/A", color: color || "N/A" };
  if (!items.some(item => variantKey(item) === variantKey(candidate))) items.push(candidate);
  return write(GUEST_WISHLIST_KEY, items);
};

export const updateGuestCartItem = (productId, size, color, quantity) => setGuestCart(
  getGuestCart().map(item => variantKey(item) === `${productId}:${size || "N/A"}:${color || "N/A"}`
    ? { ...item, quantity }
    : item)
);

export const removeGuestCartItem = (productId, size, color) => setGuestCart(
  getGuestCart().filter(item => variantKey(item) !== `${productId}:${size || "N/A"}:${color || "N/A"}`)
);

export const removeGuestWishlistItem = (productId, size, color) => setGuestWishlist(
  getGuestWishlist().filter(item => variantKey(item) !== `${productId}:${size || "N/A"}:${color || "N/A"}`)
);

export const clearGuestCart = () => setGuestCart([]);
export const mergeGuestCommerce = async (customer) => {
  if (!customer?.id || !customer?.token) {
    throw new Error("Cannot restore your guest items because the customer session is incomplete");
  }

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${customer.token}` };
  const cart = getGuestCart();
  const wishlist = getGuestWishlist();
  if (!cart.length && !wishlist.length) return { cart_count: 0, wishlist_count: 0 };

  const mergeResponse = await fetch(`${API_BASE}/customer/guest/merge`, {
    method: "POST",
    headers,
    body: JSON.stringify({ customer_id: customer.id, cart, wishlist }),
  });

  if (mergeResponse.ok) {
    const merged = await mergeResponse.json();
    setGuestCart([]);
    setGuestWishlist([]);
    return merged;
  }

  // Keep compatibility while an older backend instance is still restarting.
  if (mergeResponse.status !== 404) {
    const data = await mergeResponse.json().catch(() => ({}));
    throw new Error(data.error || `Guest-item merge failed (${mergeResponse.status})`);
  }

  const transfer = async (endpoint, item, includeQuantity) => {
    const productId = item.product?._id || item.product_id;
    if (!productId) throw new Error("A saved item has no product ID");

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        customer_id: customer.id,
        product_id: typeof productId === "object" ? productId.$oid : productId,
        size: item.size || "N/A",
        color: item.color || "N/A",
        ...(includeQuantity ? { quantity: Number(item.quantity || 1) } : {}),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Item transfer failed (${response.status})`);
    }
  };

  const cartResults = await Promise.allSettled(
    cart.map(item => transfer("/customer/cart/add", item, true))
  );
  const wishlistResults = await Promise.allSettled(
    wishlist.map(item => transfer("/customer/wishlist/add", item, false))
  );

  const remainingCart = cart.filter((_, index) => cartResults[index]?.status !== "fulfilled");
  const remainingWishlist = wishlist.filter((_, index) => wishlistResults[index]?.status !== "fulfilled");
  setGuestCart(remainingCart);
  setGuestWishlist(remainingWishlist);

  const failure = [...cartResults, ...wishlistResults].find(result => result.status === "rejected");
  if (failure) {
    throw new Error(`Some saved items could not be restored: ${failure.reason?.message || "unknown error"}`);
  }
};