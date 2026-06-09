import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ShopProvider } from '../context/ShopContext';
import { Layout } from '../components/layout/Layout';
import { Home } from '../pages/Home';
import { Shop } from '../pages/Shop';
import { ProductDetails } from '../pages/ProductDetails';
import { Cart } from '../pages/Cart';
import { Wishlist } from '../pages/Wishlist';
import { About } from '../pages/About';
import { Contact } from '../pages/Contact';
import { Login } from '../pages/Login';
import { Signup } from '../pages/Signup';
import { AIPreview } from '../pages/AIPreview';
import RoomEditor from '../pages/RoomEditor';
import { Checkout } from '../pages/Checkout';
import { Profile } from '../pages/Profile';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { ProductsManagement } from '../pages/admin/ProductsManagement';
import { AddProduct } from '../pages/admin/AddProduct';
import { EditProduct } from '../pages/admin/EditProduct';
import { OrdersManagement } from '../pages/admin/OrdersManagement';
import { OrderDetails } from '../pages/admin/OrderDetails';
import { UsersManagement } from '../pages/admin/UsersManagement';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { PublicRoute } from './PublicRoute';
import ProtectedRoutes from './ProtectedRoutes';
import { AdminRoute } from './AdminRoutes';
import { VerifyEmail } from './VerifyEmail';
import { EmailVerifiedRoute } from './EmailVerifiedRoute';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {
  return (
    <Router>
      <ShopProvider>
        <ScrollToTop />
        <Routes>
          {/* Customer Routes */}
          <Route
            path="/verify-email"
            element={<VerifyEmail />}
          />
          
          <Route
            path="/"
            element={
                <Layout>
                  <Home />
                </Layout>
            }
          />

          <Route
            path="/about"
            element={
                <Layout>
                  <About />
                </Layout>
            }
          />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <Layout>
                  <Login />
                </Layout>
              </PublicRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Layout>
                  <Signup />
                </Layout>
              </PublicRoute>
            }
          />

          <Route
            path="/shop"
            element={
              // <ProtectedRoutes>
                <Layout>
                  <Shop />
                </Layout>
              // </ProtectedRoutes>
            }
          />

          <Route
            path="/product/:id"
            element={
              <ProtectedRoutes>
                <Layout>
                  <ProductDetails />
                </Layout>
              </ProtectedRoutes>
            }
          />

          <Route
            path="/cart"
            element={
              <ProtectedRoutes>
                <Layout>
                  <Cart />
                </Layout>
              </ProtectedRoutes>
            }
          />

          <Route
            path="/wishlist"
            element={
              <ProtectedRoutes>
                <Layout>
                  <Wishlist />
                </Layout>
              </ProtectedRoutes>
            }
          />

          <Route
            path="/contact"
            element={
              <ProtectedRoutes>
                <Layout>
                  <Contact />
                </Layout>
              </ProtectedRoutes>
            }
          />

          <Route
            path="/ai-preview"
            element={
              <ProtectedRoutes>
                <EmailVerifiedRoute>
                  <Layout>
                    <AIPreview />
                  </Layout>
                </EmailVerifiedRoute>
              </ProtectedRoutes>
            }
          />

          <Route
            path="/room-editor/:roomId"
            element={
              <ProtectedRoutes>
                <EmailVerifiedRoute>
                  <RoomEditor />
                </EmailVerifiedRoute>
              </ProtectedRoutes>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoutes>
                <EmailVerifiedRoute>
                  <Layout>
                    <Checkout />
                  </Layout>
                </EmailVerifiedRoute>
              </ProtectedRoutes>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoutes>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoutes>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <ProductsManagement />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/add-product"
            element={
              <AdminRoute>
                <AddProduct />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/edit-product/:id"
            element={
              <AdminRoute>
                <EditProduct />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <OrdersManagement />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/orders/:id"
            element={
              <AdminRoute>
                <OrderDetails />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UsersManagement />
              </AdminRoute>
            }
          />
        </Routes>
      </ShopProvider>
    </Router>
  );
};

export default App;