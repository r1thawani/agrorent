import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
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

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
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
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}