import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE } from "../config";

export default function VendorStorefront() {
  const { vendorId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`${API_BASE}/api/storefront/${vendorId}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Store unavailable");
        return body;
      })
      .then(setData).catch((err) => setError(err.message));
  }, [vendorId]);
  if (error) return <main style={{padding: 40}}><h1>Store unavailable</h1><p>{error}</p></main>;
  if (!data) return <main style={{padding: 40}}>Loading store?</main>;
  const { store, products } = data;
  return <main style={{maxWidth: 1200, margin: "0 auto", padding: "32px 20px"}}>
    <header style={{borderBottom: "1px solid #e5e7eb", paddingBottom: 24, marginBottom: 28}}>
      {store.logo && <img src={store.logo} alt="" style={{width: 68, height: 68, objectFit: "cover", borderRadius: "50%"}} />}
      <h1>{store.name}</h1>{store.description && <p>{store.description}</p>}
      {store.website_url && <a href={store.website_url} target="_blank" rel="noreferrer">Visit seller website</a>}
    </header>
    <h2>Shop products</h2>
    {products.length === 0 ? <p>This seller has no products available yet.</p> : <section style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 20}}>
      {products.map((product) => <article key={product._id} style={{border: "1px solid #e5e7eb", borderRadius: 10, padding: 14}}>
        {product.image && <img src={product.image} alt={product.name} style={{width: "100%", height: 180, objectFit: "cover"}} />}
        <h3>{product.name}</h3><p>?{product.price}</p>
        <Link to={`/products/${product._id}`}>View product</Link>
      </article>)}
    </section>}
  </main>;
}
