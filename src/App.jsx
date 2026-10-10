import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/seat-selection" element={<SeatSelection />} />
        <Route path="/traveller-details" element={<TravellerDetails />} />
        <Route path="/booking-confirmation" element={<BookingConfirmation />} />
        <Route path="/payment-result" element={<PaymentResult />} />
        <Route path="/booking-success" element={<BookingSuccess />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/booking-details" element={<BookingDetails />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;