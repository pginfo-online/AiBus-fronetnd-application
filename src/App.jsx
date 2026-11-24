import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Home from "./pages/Home/Home";
import SearchResults from "./pages/SearchResults/SearchResults";
import SeatSelection from "./pages/SeatSelection/SeatSelection";
import TravellerDetails from "./pages/TravellerDetails/TravellerDetails";
import BookingConfirmation from "./pages/BookingConfirmation/BookingConfirmation";
import BookingSuccess from "./pages/BookingSuccess/BookingSuccess";
import MyBookings from "./pages/MyBookings/MyBookings";
import Login from "./pages/Login/Login";
import BookingDetails from "./pages/BookingDetails/BookingDetails";
import PaymentResult from "./pages/PaymentResult/PaymentResult";
import CancellationPolicy from "./pages/CancellationPolicy/CancellationPolicy";
import Offers from "./pages/Offers/Offers";
import authService from "./services/authService";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function NavigationLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

/** Redirects unauthenticated users to /login?returnTo=<current path+search> */
function ProtectedRoute({ children }) {
  const location = useLocation();
  const isAuth =
    authService.isAuthenticated() ||
    Boolean(authService.getLoggedInUser()) ||
    Boolean(localStorage.getItem("aibus_auth_tokens")) ||
    Boolean(localStorage.getItem("loggedInUser"));

  if (!isAuth) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <NavigationLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/seat-selection" element={<SeatSelection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cancellation-policy" element={<CancellationPolicy />} />
          <Route path="/offers" element={<Offers />} />

          {/* ── Protected routes (login required) ── */}
          <Route path="/traveller-details" element={<ProtectedRoute><TravellerDetails /></ProtectedRoute>} />
          <Route path="/booking-confirmation" element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />
          <Route path="/payment-result" element={<ProtectedRoute><PaymentResult /></ProtectedRoute>} />
          <Route path="/booking-success" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/booking-details" element={<ProtectedRoute><BookingDetails /></ProtectedRoute>} />
        </Routes>
      </NavigationLayout>
    </BrowserRouter>
  );
}

export default App;