import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bookingService from "../../services/bookingService";
import authService from "../../services/authService";
import "./MyBookings.css";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(() => authService.getLoggedInUser());
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadBookings = (currentUser) => {
    const localGuest = bookingService.getGuestBookings();
    setLoading(true);

    bookingService
      .getMyBookings()
      .then((data) => {
        const existingIds = new Set(data.map((b) => b.bookingId || b.bookingReference));
        const unmergedGuest = localGuest.filter(
          (gb) => !existingIds.has(gb.bookingId || gb.bookingReference)
        );
        setBookings([...data, ...unmergedGuest]);
      })
      .catch((err) => {
        console.warn("Failed to load backend bookings, showing guest storage:", err);
        setBookings(localGuest);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const handleLoginChange = () => {
      const loggedInUser = authService.getLoggedInUser();
      setUser(loggedInUser);
      loadBookings(loggedInUser);
    };

    handleLoginChange();

    window.addEventListener("loginStatusChanged", handleLoginChange);

    return () => {
      window.removeEventListener("loginStatusChanged", handleLoginChange);
    };
  }, []);

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await bookingService.cancelBooking(bookingId);
      if (user) {
        loadBookings(user);
      }
    } catch (err) {
      alert(err.message || "Failed to cancel booking. Please try again.");
    }
  };

  return (
    <main className="my-bookings-page">
      <div className="my-bookings-container">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

        <div className="my-bookings-header-row">
          <h1>My Bookings</h1>
          {user && (
            <span className="user-indicator-badge">
              Logged in as: +91 {user.mobile || "User"}
            </span>
          )}
        </div>

        {/* Case 1: Not logged in */}
        {!user ? (
          <section className="empty-bookings-simple">
            <p className="simple-login-msg">Please log in to view your bookings.</p>
            <button
              type="button"
              className="simple-login-btn"
              onClick={() => navigate("/login?returnTo=/my-bookings")}
            >
              Log In
            </button>
          </section>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#666", fontSize: "1.1rem" }}>
            ⏳ Loading your bookings...
          </div>
        ) : bookings.length === 0 ? (
          <section className="empty-bookings">
            <div className="empty-icon-wrap">🚌</div>
            <h2>No Bookings Yet</h2>
            <p>You haven&apos;t booked any tickets yet. Explore routes and start your journey!</p>
            <button
              type="button"
              className="search-buses-button"
              onClick={() => navigate("/")}
            >
              Search Buses
            </button>
          </section>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <article key={booking.bookingId || booking.bookingReference} className="booking-card">
                <div className="booking-card-header">
                  <div>
                    <div className="operator-guest-tag">
                      <h2>{booking.bus?.operator || "AIBus Travels"}</h2>
                      {booking.isGuest && (
                        <span className="guest-local-pill">Linked from Device</span>
                      )}
                    </div>
                    <p>{booking.bus?.busType || "AC Seater"}</p>
                  </div>

                  <span
                    className={`booking-status ${
                      booking.status === "Cancelled" ? "cancelled" : ""
                    }`}
                  >
                    {booking.status || "Confirmed"}
                  </span>
                </div>

                <div className="booking-route">
                  <div>
                    <strong>{booking.bus?.departureTime || "08:00"}</strong>
                    <span>{booking.bus?.from || "Delhi"}</span>
                  </div>

                  <span className="route-arrow">→</span>

                  <div>
                    <strong>{booking.bus?.arrivalTime || "12:00"}</strong>
                    <span>{booking.bus?.to || "Jaipur"}</span>
                  </div>
                </div>

                <div className="booking-details">
                  <div>
                    <span>Booking ID</span>
                    <strong>{booking.bookingId || booking.bookingReference}</strong>
                  </div>

                  <div>
                    <span>Passenger</span>
                    <strong>{booking.traveller?.name || "Passenger"}</strong>
                  </div>

                  <div>
                    <span>Seats</span>
                    <strong>
                      {Array.isArray(booking.seats)
                        ? booking.seats.join(", ")
                        : booking.seats || "A1"}
                    </strong>
                  </div>

                  <div>
                    <span>Total</span>
                    <strong>₹{booking.totalAmount}</strong>
                  </div>
                </div>

                <div className="booking-card-actions">
                  <button
                    type="button"
                    className="view-details-button"
                    onClick={() =>
                      navigate(`/booking-details?bookingId=${booking.bookingId || booking.bookingReference}`)
                    }
                  >
                    View Ticket Details
                  </button>

                  {booking.status !== "Cancelled" && (
                    <button
                      type="button"
                      className="cancel-booking-button"
                      onClick={() => handleCancelBooking(booking.bookingId || booking.bookingReference)}
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default MyBookings;