import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bookingService from "../../services/bookingService";
import authService from "../../services/authService";
import "./MyBookings.css";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(() => authService.getLoggedInUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterTab, setFilterTab] = useState("ALL");
  const navigate = useNavigate();

  const loadBookings = (currentUser) => {
    if (!currentUser || !authService.isAuthenticated()) {
      setBookings([]);
      return;
    }

    setLoading(true);
    setError("");

    bookingService
      .getMyBookings()
      .then((data) => {
        setBookings(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load bookings:", err);
        if (err?.response?.status === 401) {
          setError("Session expired. Please log in again.");
        } else {
          setError(err.message || "Failed to load bookings. Please try again.");
        }
        setBookings([]);
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
      "Are you sure you want to cancel this booking? Refund will be calculated as per operator policy."
    );

    if (!confirmed) {
      return;
    }

    try {
      await bookingService.cancelBooking(bookingId);
      if (user) {
        loadBookings(user);
      }
      alert("Booking cancelled successfully. Refund has been initiated.");
    } catch (err) {
      alert(err.message || "Failed to cancel booking. Please try again.");
    }
  };

  const handleShareTicket = async (booking) => {
    const bRef = booking.bookingId || booking.bookingReference;
    const shareText = `🚌 AiBus Ticket\nBooking ID: ${bRef}\nRoute: ${booking.bus?.from} → ${booking.bus?.to}\nDate: ${booking.bus?.date}\nSeats: ${Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats}`;
    const url = `${window.location.origin}/booking-details?bookingId=${bRef}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `AiBus Ticket – ${bRef}`,
          text: shareText,
          url,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          await navigator.clipboard.writeText(`${shareText}\n${url}`);
          alert("Ticket details copied to clipboard!");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
        alert("Ticket details copied to clipboard!");
      } catch {
        alert("Unable to copy ticket URL. Please copy from the address bar.");
      }
    }
  };

  const handleDownloadTicket = (booking) => {
    const bRef = booking.bookingId || booking.bookingReference;
    navigate(`/booking-details?bookingId=${bRef}`);
  };

  const today = new Date().toISOString().slice(0, 10);
  const filteredBookings = bookings.filter((b) => {
    if (filterTab === "ALL") return true;
    const journeyDate = b.bus?.date ? String(b.bus.date).slice(0, 10) : "";
    const isCancelled = b.status?.toLowerCase() === "cancelled";

    if (filterTab === "UPCOMING") {
      return !isCancelled && (!journeyDate || journeyDate >= today);
    }
    if (filterTab === "COMPLETED") {
      return !isCancelled && journeyDate && journeyDate < today;
    }
    if (filterTab === "CANCELLED") {
      return isCancelled;
    }
    return true;
  });

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

        {/* Tab Filters matching Mobile Journey */}
        {user && bookings.length > 0 && (
          <div className="bookings-tabs-bar">
            {[
              { id: "ALL", label: `All (${bookings.length})` },
              {
                id: "UPCOMING",
                label: `Upcoming (${
                  bookings.filter(
                    (b) =>
                      b.status?.toLowerCase() !== "cancelled" &&
                      (!b.bus?.date || String(b.bus.date).slice(0, 10) >= today)
                  ).length
                })`,
              },
              {
                id: "COMPLETED",
                label: `Completed (${
                  bookings.filter(
                    (b) =>
                      b.status?.toLowerCase() !== "cancelled" &&
                      b.bus?.date &&
                      String(b.bus.date).slice(0, 10) < today
                  ).length
                })`,
              },
              {
                id: "CANCELLED",
                label: `Cancelled (${
                  bookings.filter((b) => b.status?.toLowerCase() === "cancelled").length
                })`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`booking-tab-btn ${filterTab === tab.id ? "active" : ""}`}
                onClick={() => setFilterTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

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
        ) : error ? (
          <section className="empty-bookings">
            <div className="empty-icon-wrap">⚠️</div>
            <h2>Unable to Load Bookings</h2>
            <p>{error}</p>
            <button type="button" className="search-buses-button" onClick={() => loadBookings(user)}>
              Try Again
            </button>
          </section>
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
        ) : filteredBookings.length === 0 ? (
          <section className="empty-bookings">
            <div className="empty-icon-wrap">🔍</div>
            <h2>No {filterTab.toLowerCase()} bookings found</h2>
            <p>You do not have any bookings in this category.</p>
            <button
              type="button"
              className="search-buses-button"
              onClick={() => setFilterTab("ALL")}
            >
              View All Bookings
            </button>
          </section>
        ) : (
          <div className="bookings-list">
            {filteredBookings.map((booking) => {
              const isCancelled = booking.status?.toLowerCase() === "cancelled";
              const refId = booking.bookingId || booking.bookingReference;

              return (
                <article key={refId} className="booking-card">
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
                        isCancelled ? "cancelled" : "confirmed"
                      }`}
                    >
                      {isCancelled ? "Cancelled" : booking.status || "Confirmed"}
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
                      <strong>{refId}</strong>
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
                      <span>Total Paid</span>
                      <strong>₹{booking.totalAmount}</strong>
                    </div>
                  </div>

                  {/* Dedicated Refund Status Box for Cancelled Bookings */}
                  {isCancelled && (
                    <div className="booking-refund-summary-box">
                      <div className="refund-summary-header">
                        <span className="refund-badge-pill">
                          {booking.refundStatus || "REFUND INITIATED"}
                        </span>
                        <span className="refund-amount-text">
                          Refund: <strong>₹{booking.refundAmount || booking.totalAmount}</strong>
                        </span>
                      </div>
                      <p className="refund-summary-note">
                        Processed to original payment method. Amount will credit within 3-5 business days.
                      </p>
                    </div>
                  )}

                  <div className="booking-card-actions">
                    <button
                      type="button"
                      className="share-ticket-btn"
                      title="Share Ticket"
                      onClick={() => handleShareTicket(booking)}
                    >
                      ↗ Share
                    </button>

                    <button
                      type="button"
                      className="download-ticket-btn"
                      title="Download Ticket"
                      onClick={() => handleDownloadTicket(booking)}
                    >
                      📄 Download
                    </button>

                    <button
                      type="button"
                      className="view-details-button"
                      onClick={() =>
                        navigate(`/booking-details?bookingId=${refId}`)
                      }
                    >
                      View Details
                    </button>

                    {!isCancelled && (
                      <button
                        type="button"
                        className="cancel-booking-button"
                        onClick={() => handleCancelBooking(refId)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default MyBookings;