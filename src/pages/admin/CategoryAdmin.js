import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import styles from "./CategoryAdmin.module.css";
import { API_BASE } from "../../config";

const API_URL = `${API_BASE}/api`;

const CategoryAdminFull = () => {
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({
    category: "",
    subcategories: [{ name: "", children: [""] }],
  });
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      const data = Array.isArray(res.data.categories) ? res.data.categories : [];

      const formatted = data.map((cat) => ({
        _id: cat._id ? String(cat._id) : Date.now().toString(),
        name: cat.name || "Unnamed Category",
        subCategories: Array.isArray(cat.subCategories)
          ? cat.subCategories.map((sub) => ({
              name: sub.name || "Unnamed Subcategory",
              children: Array.isArray(sub.childCategories) ? sub.childCategories : [],
            }))
          : [],
      }));

      setCategories(formatted);
    } catch (err) {
      console.error("Error fetching categories:", err.response?.data || err.message);
      setCategories([]);
    }
  };

  // ---------------- Form Handlers ----------------
  const handleCategoryChange = (e) =>
    setCategoryForm({ ...categoryForm, category: e.target.value });

  const handleSubChange = (index, value) => {
    const newSubs = [...categoryForm.subcategories];
    newSubs[index].name = value;
    setCategoryForm({ ...categoryForm, subcategories: newSubs });
  };

  const handleChildChange = (subIndex, childIndex, value) => {
    const newSubs = [...categoryForm.subcategories];
    newSubs[subIndex].children[childIndex] = value;
    setCategoryForm({ ...categoryForm, subcategories: newSubs });
  };

  const addSubcategory = () => {
    setCategoryForm({
      ...categoryForm,
      subcategories: [...categoryForm.subcategories, { name: "", children: [""] }],
    });
  };

  const addChild = (subIndex) => {
    const newSubs = [...categoryForm.subcategories];
    newSubs[subIndex].children.push("");
    setCategoryForm({ ...categoryForm, subcategories: newSubs });
  };

  // ---------------- Add Category ----------------
  const handleAddCategory = async () => {
    if (!categoryForm.category.trim()) return alert("Category required");

    const payload = {
      category: categoryForm.category.trim(),
      subcategories: categoryForm.subcategories
        .filter((s) => s.name.trim() !== "")
        .map((s) => ({
          name: s.name.trim(),
          children: s.children.filter((c) => c.trim() !== ""),
        })),
    };

    try {
      await axios.post(`${API_URL}/categories`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      setCategories((prev) => {
        const existing = prev.find((c) => c.name === payload.category);
        if (existing) {
          payload.subcategories.forEach((newSub) => {
            let subExist = existing.subCategories.find((s) => s.name === newSub.name);
            if (subExist) {
              if (!Array.isArray(subExist.children)) subExist.children = [];
              newSub.children.forEach((child) => {
                if (!subExist.children.includes(child)) subExist.children.push(child);
              });
            } else {
              existing.subCategories.push({
                name: newSub.name,
                children: newSub.children,
              });
            }
          });
          return [...prev];
        } else {
          const newCategory = {
            _id: Date.now().toString(),
            name: payload.category,
            subCategories: payload.subcategories.map((s) => ({
              name: s.name,
              children: s.children,
            })),
          };
          return [...prev, newCategory];
        }
      });

      setCategoryForm({ category: "", subcategories: [{ name: "", children: [""] }] });
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Failed to add category");
    }
  };

  const handleEdit = async () => {
    if (!editData) return;
    try {
      await axios.put(`${API_URL}/categories/edit`, editData);
      setEditData(null);
      fetchCategories();
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Failed to update");
    }
  };

  const handleDelete = async (type, name, parentCategory, parentSub) => {
    try {
      await axios.delete(`${API_URL}/categories/delete`, {
        data: { type, name, parentCategory, parentSub },
      });
      fetchCategories();
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Failed to delete");
    }
  };

  return (
    <div className={styles.categoryAdmin}>
      <h1 className={styles.title}>Category Management</h1>

      {/* Add Category Form */}
      <div className={styles.form}>
        <input
          placeholder="Category"
          className={styles.input}
          value={categoryForm.category}
          onChange={handleCategoryChange}
        />

        {categoryForm.subcategories.map((sub, i) => (
          <div key={i} className={styles.subcategoryForm}>
            <input
              placeholder="Subcategory"
              className={styles.input}
              value={sub.name}
              onChange={(e) => handleSubChange(i, e.target.value)}
            />
            {sub.children.map((child, j) => (
              <input
                key={j}
                placeholder="Child Category"
                className={styles.inputChild}
                value={child}
                onChange={(e) => handleChildChange(i, j, e.target.value)}
              />
            ))}
            <button className={styles.addChildBtn} onClick={() => addChild(i)}>
              Add Child
            </button>
          </div>
        ))}

        <button className={styles.addSubBtn} onClick={addSubcategory}>
          Add Subcategory
        </button>
        <button className={styles.submitBtn} onClick={handleAddCategory}>
          Submit Category
        </button>
      </div>

      {/* Edit Form */}
      {editData && (
        <div className={styles.form}>
          <input
            placeholder="New Name"
            className={styles.input}
            value={editData.new_name}
            onChange={(e) => setEditData({ ...editData, new_name: e.target.value })}
          />
          <button className={styles.submitBtn} onClick={handleEdit}>
            Save
          </button>
          <button className={styles.cancelBtn} onClick={() => setEditData(null)}>
            Cancel
          </button>
        </div>
      )}

      {/* Display Categories */}
      <div className={styles.categoryList}>
        {categories.map((cat) => (
          <div key={cat._id} className={styles.category}>
            <div className={styles.categoryHeader}>
              <strong>{cat.name}</strong>
              <div className={styles.actions}>
                <FiEdit
                  onClick={() =>
                    setEditData({ type: "category", old_name: cat.name, new_name: "" })
                  }
                />
                <FiTrash2 onClick={() => handleDelete("category", cat.name)} />
              </div>
            </div>

            {cat.subCategories?.map((sub) => (
              <div key={sub.name} className={styles.subcategory}>
                <div className={styles.subcategoryHeader}>
                  {sub.name}
                  <div className={styles.actions}>
                    <FiEdit
                      onClick={() =>
                        setEditData({
                          type: "subcategory",
                          old_name: sub.name,
                          new_name: "",
                          parentCategory: cat.name,
                        })
                      }
                    />
                    <FiTrash2
                      onClick={() => handleDelete("subcategory", sub.name, cat.name)}
                    />
                  </div>
                </div>

                <div className={styles.childList}>
                  {sub.children?.map((child) => (
                    <div key={child} className={styles.child}>
                      {child}
                      <div className={styles.actions}>
                        <FiEdit
                          onClick={() =>
                            setEditData({
                              type: "child",
                              old_name: child,
                              new_name: "",
                              parentCategory: cat.name,
                              parentSub: sub.name,
                            })
                          }
                        />
                        <FiTrash2
                          onClick={() =>
                            handleDelete("child", child, cat.name, sub.name)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryAdminFull;
