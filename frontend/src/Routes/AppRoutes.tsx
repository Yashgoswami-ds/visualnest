import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";

import Home from "../pages/Home";
import Gallery from "../pages/Gallery";
import About from "../pages/About";
import Contact from "../pages/Contact";
import AdminLogin from "../pages/AdminLogin";
import AdminCreateUser from "../pages/AdminCreateUser";
import AdminExistingAccess from "../pages/AdminExistingAccess";
import AdminSetPassword from "../pages/AdminSetPassword";
import AdminForgotPassword from "../pages/AdminForgotPassword";
import AdminDashboard from "../pages/AdminDashboard";
import Services from "../pages/Services";
import ResetPassword from "../pages/ResetPassword";
import Videos from "../pages/Videos";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/videos" element={<Videos />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/services" element={<Services />} />
      <Route path="/reset-password" element={<ResetPassword />} />



      {/* Admin Routes */}
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin-create-user" element={<AdminCreateUser />} />
      <Route path="/admin-set-password" element={<AdminSetPassword />} />
      <Route path="/admin-existing-access" element={<AdminExistingAccess />} />
      <Route path="/admin-forgot-password" element={<AdminForgotPassword />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

    </Routes>
  );
};

export default AppRoutes;
