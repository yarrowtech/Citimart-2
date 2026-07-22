import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import styles from "./MainLayout.module.css";
import { FaUser, FaShoppingCart, FaHeart, FaCog } from "react-icons/fa";
import logo from "../assets/log.JPG";

const brandsData = {
  "Popular Brands": ["Nike", "Adidas", "Levi's", "Zara"],
  "Luxury Brands": ["Gucci", "Prada", "Louis Vuitton"]
};

const MainLayout = () => {
  const [customer, setCustomer] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeMenu, setActiveMenu] = useState("");
  const [hoveredCategory, setHoveredCategory] = useState("");
  const [hoveredBrandGroup, setHoveredBrandGroup] = useState("Popular Brands");

  const navigate = useNavigate();
  const location = useLocation();

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/categories"); 
        const data = await res.json();
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else if (data.categories && typeof data.categories === "object") {
          // Convert object to array
          const catArray = Object.values(data.categories).map((cat) =>
            typeof cat === "string" ? { name: cat, subCategories: [] } : cat
          );
          setCategories(catArray);
        }
        if (data.categories.length > 0) setHoveredCategory(data.categories[0].name);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Customer authentication
  useEffect(() => {
    const stored = localStorage.getItem("customer");
    setCustomer(stored ? JSON.parse(stored) : null);

    const handlePopState = () => {
      const customerCheck = localStorage.getItem("customer");
      if (!customerCheck && ["/cart", "/wishlist", "/customer-settings"].includes(window.location.pathname)) {
        navigate("/login", { replace: true });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, location]);

  const handleLogout = () => {
    localStorage.removeItem("customer");
    localStorage.removeItem("wishlist");
    localStorage.removeItem("cart");
    setCustomer(null);
    navigate("/login", { replace: true });
    window.history.pushState(null, "", "/login");
    window.location.reload();
  };

  const handleProtectedClick = (path) => {
    if (!customer) navigate("/login");
    else navigate(path);
  };

  const handleCategoryClick = (category) => {
    navigate(`/products?category=${category.toLowerCase().replace(/ /g, "-")}`);
  };

  const handleSubcategoryClick = (category, subcategory) => {
    navigate(
      `/products?category=${category.toLowerCase().replace(/ /g, "-")}&subcategory=${subcategory
        .toLowerCase()
        .replace(/ /g, "-")}`
    );
  };

  const handleChildcategoryClick = (category, subcategory, childcategory) => {
    navigate(
      `/products?category=${category.toLowerCase().replace(/ /g, "-")}&subcategory=${subcategory
        .toLowerCase()
        .replace(/ /g, "-")}&childcategory=${childcategory
        .toLowerCase()
        .replace(/ /g, "-")}`
    );
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.topContainer}>
            {!customer && <Link to="/register-vendor">Become a Seller</Link>}
            <div className={styles.right}>
              {customer && <span className={styles.greeting}>Hello, {customer.name?.split(" ")[0]}</span>}

              <button className={styles.iconLink} onClick={() => handleProtectedClick("/wishlist")}>
                <FaHeart /> Wishlist
              </button>
              <button className={styles.iconLink} onClick={() => handleProtectedClick("/cart")}>
                <FaShoppingCart /> Cart
              </button>

              {customer ? (
                <>
                  <Link to="/customer-settings" className={styles.settingsIcon}>
                    <FaCog />
                  </Link>
                  <button onClick={handleLogout} className={styles.logoutBtn}>
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className={styles.iconLink}>
                  <FaUser /> Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className={styles.mainNav}>
          <div className={styles.navContainer}>
            <Link to="/" className={styles.logo}>
           
              <img src={logo} alt="CitiMart Logo" className={styles.logoImage} />
             <div className={styles.logoText}>Value for Money Re-Defined</div>
            </Link>

            <div className={styles.navLinks}>
              {/* Categories */}
              <div
                className={styles.megaMenuWrapper}
                onMouseEnter={() => setActiveMenu("categories")}
                onMouseLeave={() => {
                  setActiveMenu("");
                  setHoveredCategory(categories.length > 0 ? categories[0].name : "");
                }}
              >
                <span className={styles.menuTitle}>Categories ▾</span>

                {activeMenu === "categories" && (
                  <div className={`${styles.dropdownMenu} ${styles.show}`}>
                    {/* LEFT COLUMN: MAIN CATEGORIES */}
                    <div className={styles.categoryList}>
                      {categories.map((cat) => (
                        <div
                          key={cat.name}
                          className={`${styles.categoryItem} ${hoveredCategory === cat.name ? styles.active : ""}`}
                          onMouseEnter={() => setHoveredCategory(cat.name)}
                          onClick={() => handleCategoryClick(cat.name)}
                          style={{ cursor: "pointer" }}
                        >
                          {cat.name}
                        </div>
                      ))}
                    </div>

                    {/* MIDDLE COLUMN: SUBCATEGORIES */}
                    <div className={styles.subcategoryList}>
                      <h4>{hoveredCategory}</h4>
                      {categories
                        .find((c) => c.name === hoveredCategory)
                        ?.subCategories.map((sub) => (
                          <div
                            key={sub.name}
                            className={styles.subCategoryBlock}
                            style={{ cursor: "pointer" }}
                            onClick={() => handleSubcategoryClick(hoveredCategory, sub.name)}
                          >
                            <strong>{sub.name}</strong>
                            <div className={styles.subLinks}>
                              {sub.childCategories?.map((child) => (
                                <div
                                  key={child}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleChildcategoryClick(hoveredCategory, sub.name, child);
                                  }}
                                  style={{ cursor: "pointer" }}
                                >
                                  {child}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Brands */}
              <div
                className={styles.megaMenuWrapper}
                onMouseEnter={() => setActiveMenu("brands")}
                onMouseLeave={() => setActiveMenu("")}
              >
                <span className={styles.menuTitle}>Brands ▾</span>
                {activeMenu === "brands" && (
                  <div className={`${styles.dropdownMenu} ${styles.show}`}>
                    <div className={styles.categoryList}>
                      {Object.keys(brandsData).map((group) => (
                        <div
                          key={group}
                          className={`${styles.categoryItem} ${hoveredBrandGroup === group ? styles.active : ""}`}
                          onMouseEnter={() => setHoveredBrandGroup(group)}
                        >
                          {group}
                        </div>
                      ))}
                    </div>
                    <div className={styles.subcategoryList}>
                      <h4>{hoveredBrandGroup}</h4>
                      {brandsData[hoveredBrandGroup].map((brand) => (
                        <Link key={brand} to={`/brands/${brand.toLowerCase()}`}>
                          {brand}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.search}>
              <input type="text" placeholder="Search for products, brands and more" />
            </div>
          </div>
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerSection}>
              <h3>ONLINE SHOPPING</h3>
              {categories.map((cat) => (
                <Link key={cat.name} to={`/products?category=${cat.name.toLowerCase().replace(/ /g, "-")}`}>
                  {cat.name}
                </Link>
              ))}
            </div>

            <div className={styles.footerSection}>
              <h3>CUSTOMER POLICIES</h3>
              <Link to="/contact">Contact Us</Link>
              <Link to="/faq">FAQ</Link>
              <Link to="/terms">Terms of Use</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>

            <div className={styles.footerSection}>
              <h3>SOCIAL</h3>
              <a href="https://facebook.com" target="_blank" rel="noreferrer">
                Facebook
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer">
                Twitter
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                Instagram
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer">
                YouTube
              </a>
            </div>

            <div className={`${styles.footerSection} ${styles.storeLocation}`}>
              <h3>STORE LOCATION</h3>
              <div className={styles.address}>
                <p>
                  1, हुमायूँ प्लेस, कोलकाता-700087, 3A, Bertram St, Esplanade, Dharmatala, Kolkata, WB
                </p>
              </div>
              <div className={styles.mapContainer}>
                <iframe
                  title="CitiMart Store Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3683.103256802933!2d88.357253!3d22.572646!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a0277b41b1b1b1b%3A0x1234567890abcdef!2sEsplanade%2C%20Kolkata!5e0!3m2!1sen!2sin!4v1710000000000"
                  width="100%"
                  height="120"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
          <div className={styles.copyright}>© 2025 CITIMART All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
