import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import styles from './App.module.css';
import { CartProvider } from './contexts/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import VendorLayout from './layouts/VendorLayout';

// Public Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import CollectionPage from "./pages/CollectionPage";
import CollectionsListPage from "./pages/CollectionsListPage";  
import CustomerLogin from './pages/CustomerLogin';
import VendorLogin from './pages/VendorLogin';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SetPassword from './pages/vendor/SetPassword';
import Offers from './pages/Offers';
import OfferProducts from './pages/OfferProducts';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import VendorSettings from './pages/VendorSettings';
import AdminSettings from './pages/AdminSettings';
import CustomerSettings from './pages/CustomerSettings';
import Complaints from './pages/Complaints';
import VerifyOtp from './pages/VerifyOtp';
import ContactUs from "./pages/ContactUs";
import PopupOffer from "./pages/PopupOffer"; 
import FAQ from './pages/FAQ';



// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminVendors from './pages/admin/Vendors';
import AdminUsers from './pages/admin/Users';
import AdminOrders from './pages/admin/AdminOrders';
import AdminAddProduct from './pages/admin/AdminAddProduct';
import EditProduct from './pages/admin/EditProduct';
import AdminOffers from './pages/admin/AdminOffers';
import CategoryAdmin from './pages/admin/CategoryAdmin';
import AdminCollections from './pages/admin/AdminCollections';
import AdminInventory from './pages/admin/AdminInventory'; 
import AdminSubusers from './pages/admin/AdminSubusers';
import AdminComplaints from "./pages/admin/AdminComplaints";
import HomepageCatalog from "./pages/admin/HomepageCatalog";
import AdminProtectedRoute from "./AdminProtectedRoute";



// Vendor Pages
import VendorDashboard from './pages/vendor/Dashboard';
import VendorProducts from './pages/vendor/Products';
import VendorOrders from './pages/vendor/Orders';
import VendorAnalytics from './pages/vendor/Analytics';
import RegisterVendor from './pages/vendor/RegisterVendor';
import VendorAddProduct from './pages/vendor/AddProduct';
import EditProducts from './pages/vendor/EditProducts';
import VendorForgotPassword from './pages/VendorForgotPassword';

// Subuser Pages
import SubuserSetup from './pages/subuser/SubuserSetup';
import SubuserLogin from './pages/subuser/SubuserLogin';
import SubuserDashboard from './pages/subuser/SubuserDashboard';
import CustomerSubuserDashboard from './pages/subuser/CustomerSubuserDashboard';
import VendorSubuserDashboard from './pages/subuser/VendorSubuserDashboard';
import MerchandiseDashboard from './pages/subuser/MerchandiseDashboard';
import HeadOfficeSubuser from './pages/subuser/HeadOfficeSubuser';


function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent back-button caching
    window.history.replaceState(null, null, window.location.href);
    window.onpageshow = (event) => {
      if (event.persisted) window.location.reload();
    };
  }, []);

 const handleLogout = (role) => {
  try {
    // 🧹 Completely clear storage
    localStorage.clear();
    sessionStorage.clear();

    // 🧾 Optional feedback
    import('react-toastify').then(({ toast }) =>
      toast.info('You have been logged out successfully.', { autoClose: 1500 })
    );

    //  Hard redirect (ensures fresh app state)
    switch (role) {
      case 'admin':
        window.location.href = '/admin/login';
        break;
      case 'vendor':
        window.location.href = '/vendor/login';
        break;
      case 'subuser':
        window.location.href = '/subuser/login';
        break;
      default:
        window.location.href = '/login';
        break;
    }
  } catch (err) {
    console.error('Logout failed:', err);
  }
};


  return (
    <CartProvider>
      <div className={styles.app}>
        <ToastContainer />

        <PopupOffer />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="collections" element={<CollectionsListPage />} />  
            <Route path="collections/:collectionSlug" element={<CollectionPage />} />
            <Route path="/login" element={<CustomerLogin />} />
            <Route path="/vendor/login" element={<VendorLogin />} />
            
            <Route path="register" element={<Register />} />
           <Route path="/forgot-password" element={<ForgotPassword />} />       {/* Customer */}
            <Route path="/vendor/forgot-password" element={<ForgotPassword />} /> {/* Vendor */}

            <Route path="offers" element={<Offers />} />
            <Route path="/offers/:offerId" element={<OfferProducts />} />
            <Route path="cart" element={<Cart />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="/customer-settings" element={<CustomerSettings />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/faq" element={<FAQ />} />
          </Route>
           <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/set-password/:token" element={<SetPassword />} />
          <Route path="register-vendor" element={<RegisterVendor />} />
         


          {/* Admin Routes */}
         <Route
  path="/admin"
  element={
    <AdminProtectedRoute>
      <AdminLayout handleLogout={() => handleLogout('admin')} />
    </AdminProtectedRoute>
  }
>
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="products" element={<AdminProducts />} />
  <Route path="inventory" element={<AdminInventory />} />
  <Route path="vendors" element={<AdminVendors />} />
  <Route path="users" element={<AdminUsers />} />
  <Route path="subusers" element={<AdminSubusers />} />
  <Route path="orders" element={<AdminOrders />} />
  <Route path="add-product" element={<AdminAddProduct />} />
  <Route path="edit-product/:id" element={<EditProduct />} />
  <Route path="offers" element={<AdminOffers />} />
  <Route path="categories" element={<CategoryAdmin />} />
  <Route path="collections" element={<AdminCollections />} />
  <Route path="complaints" element={<AdminComplaints />} />
  <Route path="homepage" element={<HomepageCatalog />} />
  
</Route>


          {/* Admin Settings outside layout */}
          <Route path="/admin-settings" element={<AdminSettings />} />

          {/* Vendor Routes */}
          <Route path="/vendor" element={<VendorLayout handleLogout={() => handleLogout('vendor')} />}>
            <Route index element={<VendorDashboard />} />
            <Route path="products" element={<VendorProducts />} />
            <Route path="orders" element={<VendorOrders />} />
            <Route path="analytics" element={<VendorAnalytics />} />
            <Route path="add-product" element={<VendorAddProduct />} />
            <Route path="edit-product/:productId" element={<EditProducts />} />
          </Route>

          {/* Vendor Settings outside layout */}
          <Route path="/vendor-settings" element={<VendorSettings />} />

          {/* Subuser Routes */}
          <Route path="/subuser/setup" element={<SubuserSetup />} />
          <Route path="/subuser/login" element={<SubuserLogin />} />
          <Route path="/subuser/dashboard" element={<SubuserDashboard />} />
          <Route path="/subuser/customer" element={<CustomerSubuserDashboard />} />
          <Route path="/subuser/vendor" element={<VendorSubuserDashboard />} />
          <Route path="/subuser/merchandise" element={<MerchandiseDashboard />} />
          <Route path="/subuser/headoffice" element={<HeadOfficeSubuser />} />
        </Routes>
      </div>
    </CartProvider>
  );
}

export default App;
