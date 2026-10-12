import React, { useEffect, useState } from "react";
import { API_BASE } from "../../config";

export default function Storefront() {
  const [form, setForm] = useState({slug: "", name: "", description: "", banner: "", published: false, logo: ""});
  const [message, setMessage] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const token = localStorage.getItem("token") || localStorage.getItem("vendorToken");

  const loadStorefront = () => {
    fetch(`${API_BASE}/api/vendor/storefront`, {headers: {Authorization: `Bearer ${token}`}})
      .then((res) => res.json()).then((data) => setForm((old) => ({...old, ...(data.storefront || {})})));
  };
  useEffect(loadStorefront, [token]);
  const update = (event) => setForm({...form, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value});

  const uploadLogo = async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    setLogoError(""); setLogoUploading(true);
    try {
      const body = new FormData();
      body.append("logo", file);
      const res = await fetch(`${API_BASE}/api/vendor/storefront/logo`, {
        method: "PUT", headers: {Authorization: `Bearer ${token}`}, body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not upload logo");
      setForm((old) => ({...old, logo: data.logo}));
    } catch (err) {
      setLogoError(err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const removeLogo = async () => {
    setLogoError(""); setLogoUploading(true);
    try {
      const res = await fetch(`${API_BASE}/api/vendor/storefront/logo`, {
        method: "DELETE", headers: {Authorization: `Bearer ${token}`},
      });
      if (!res.ok) throw new Error("Could not remove logo");
      setForm((old) => ({...old, logo: ""}));
    } catch (err) {
      setLogoError(err.message);
    } finally {
      setLogoUploading(false);
    }
  };
  const save = async (event) => {
    event.preventDefault(); setMessage("");
    const res = await fetch(`${API_BASE}/api/vendor/storefront`, {method: "PUT", headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`}, body: JSON.stringify(form)});
    const data = await res.json();
    setMessage(res.ok ? `Saved. Your store is ${data.url}` : data.error || "Could not save storefront");
  };
  const url = `${window.location.origin}/store/${form.slug || "your-store"}`;
  return <section style={{maxWidth: 760, padding: 12}}><h1>My Storefront</h1><p>Publish your Citimart-hosted store and share its link with customers.</p>
    <aside style={{margin: "18px 0", padding: 16, background: "#fff8e7", borderRadius: 8}}>
      <strong>How your storefront works</strong>
      <ol><li>Choose a short, unique Store URL and add your store details.</li>
        <li>Tick <em>Publish storefront</em> and save. Customers can then open and share your public link.</li>
        <li>Use Preview to check what shoppers see. Products are shown automatically unless you hide them in product storefront controls.</li>
        <li>Mark important products as featured to use them in future storefront highlights.</li>
        <li>When an order arrives, update its status from Orders. It changes only your items, not another vendor?s items.</li>
      </ol>
    </aside>
    <div style={{display: "flex", alignItems: "center", gap: 16, margin: "18px 0", padding: 16, background: "#f5f7fb", borderRadius: 8}}>
      {form.logo ? (
        <img src={form.logo} alt="Store logo" style={{width: 72, height: 72, objectFit: "cover", borderRadius: "50%", border: "1px solid #ddd"}} />
      ) : (
        <div style={{width: 72, height: 72, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12}}>No logo</div>
      )}
      <div>
        <strong style={{display: "block", marginBottom: 6}}>Store logo</strong>
        <label style={{display: "inline-block", cursor: "pointer"}}>
          <span style={{textDecoration: "underline"}}>{logoUploading ? "Uploading…" : form.logo ? "Change logo" : "Upload logo"}</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo} disabled={logoUploading} style={{display: "none"}} />
        </label>
        {form.logo && <>{" · "}<button type="button" onClick={removeLogo} disabled={logoUploading} style={{border: "none", background: "none", color: "#b91c1c", textDecoration: "underline", cursor: "pointer", padding: 0}}>Remove</button></>}
        <p style={{margin: "4px 0 0", fontSize: 12, color: "#6b7280"}}>PNG, JPEG or WEBP, up to 5MB. Shown on your public store page.</p>
        {logoError && <p role="alert" style={{color: "#b91c1c", fontSize: 13, margin: "4px 0 0"}}>{logoError}</p>}
      </div>
    </div>
    <form onSubmit={save} style={{display: "grid", gap: 14}}>
      <label>Store URL<input name="slug" value={form.slug} onChange={update} placeholder="fashion-by-ravi" /></label>
      <label>Store name<input name="name" value={form.name} onChange={update} placeholder="Fashion by Ravi" /></label>
      <label>Description<textarea name="description" value={form.description} onChange={update} /></label>
      <label>Banner image URL<input name="banner" value={form.banner} onChange={update} placeholder="https://..." /></label>
      <label><input name="published" type="checkbox" checked={form.published} onChange={update} /> Publish storefront</label>
      <button type="submit">Save storefront</button>
    </form>
    <div style={{marginTop: 24, padding: 16, background: "#f5f7fb", borderRadius: 8}}><strong>Public link</strong><p>{url}</p>
      <button onClick={() => navigator.clipboard.writeText(url)}>Copy link</button>{" "}
      {form.slug && <a href={`/store/${form.slug}`} target="_blank" rel="noreferrer">Preview storefront</a>}
    </div>{message && <p role="status">{message}</p>}
  </section>;
}
