import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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
            <Route path="/" element={<Home />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/owner" element={<OwnerDashboard />} />
            <Route path="/post-listing" element={<PostListing />} />
            <Route path="/listings/:id/edit" element={<EditListing />} />
            <Route path="/my-listings" element={<MyListings />} />
            <Route path="/listings/:id/book" element={<BookingPage />} />
            <Route path="/booking/:id/confirmation" element={<BookingConfirmation />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/booking-requests" element={<BookingRequests />} />
            <Route path="/review/:bookingId" element={<LeaveReview />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:id" element={<Conversation />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/profile/:id" element={<PublicProfile />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/listings" element={<AdminListings />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/disputes" element={<AdminDisputes />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}