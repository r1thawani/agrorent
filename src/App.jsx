import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollManager from "./components/ScrollManager";
import Home from "./pages/Home";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import PostListing from "./pages/PostListing";
import EditListing from "./pages/EditListing";
import MyListings from "./pages/MyListings";
import BookingPage from "./pages/BookingPage";
import BookingConfirmation from "./pages/BookingConfirmation";
import MyBookings from "./pages/MyBookings";
import BookingRequests from "./pages/BookingRequests";
import LeaveReview from "./pages/LeaveReview";
import Messages from "./pages/Messages";
import Conversation from "./pages/Conversation";
import Notifications from "./pages/Notifications";
import EditProfile from "./pages/EditProfile";
import PublicProfile from "./pages/PublicProfile";
import Earnings from "./pages/Earnings";
import Wishlist from "./pages/Wishlist";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminListings from "./pages/admin/AdminListings";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminDisputes from "./pages/admin/AdminDisputes";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

// Everything that needs to know the current route lives in here, inside
// <BrowserRouter>, since useLocation() only works below the Router.
//
// Admin pages (/admin/*) bring their own top bar — AdminTopNav, rendered by
// each Admin*.jsx page — plus their own back-office feel. Stacking the
// public marketing Navbar (Browse/How it works/renter dashboard link) and
// Footer (Browse Equipment/List Your Equipment/etc.) on top of that used to
// make the admin section feel like two different, disconnected products.
// So for any /admin/* route, this is the ONLY place those are hidden.
function Layout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <ScrollManager />
      {!isAdminRoute && <Navbar />}
      <main style={{ flex: "1" }}>
        <Routes>
          {/* Public — no login required */}
          <Route path="/" element={<Home />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile/:id" element={<PublicProfile />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          {/* Any logged-in user */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/listings/:id/book" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/booking/:id/confirmation" element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/review/:bookingId" element={<ProtectedRoute><LeaveReview /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/:id" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />

          {/* Owner role required */}
          <Route path="/dashboard/owner" element={<ProtectedRoute requireRole="owner"><OwnerDashboard /></ProtectedRoute>} />
          <Route path="/post-listing" element={<ProtectedRoute requireRole="owner"><PostListing /></ProtectedRoute>} />
          <Route path="/listings/:id/edit" element={<ProtectedRoute requireRole="owner"><EditListing /></ProtectedRoute>} />
          <Route path="/my-listings" element={<ProtectedRoute requireRole="owner"><MyListings /></ProtectedRoute>} />
          <Route path="/booking-requests" element={<ProtectedRoute requireRole="owner"><BookingRequests /></ProtectedRoute>} />
          <Route path="/earnings" element={<ProtectedRoute requireRole="owner"><Earnings /></ProtectedRoute>} />

          {/* Admin role required */}
          <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireRole="admin"><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/listings" element={<ProtectedRoute requireRole="admin"><AdminListings /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute requireRole="admin"><AdminBookings /></ProtectedRoute>} />
          <Route path="/admin/disputes" element={<ProtectedRoute requireRole="admin"><AdminDisputes /></ProtectedRoute>} />

          {/* Unmatched routes — was previously blank instead of a real 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}