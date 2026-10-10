import { useState, useEffect } from "react";
import OffersModal from "./OffersModal";
import NearbyBusesModal from "./NearbyBusesModal";
import EcoTravelModal from "./EcoTravelModal";
import "./PopularOffers.css";

function PopularOffers() {
  const [activeModal, setActiveModal] = useState(null); // 'offers' | 'nearby' | 'eco' | null
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Trigger temporary toast notification
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2800);
  };

  const handleCopyCode = (code = "AIBUS100", e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    triggerToast(`Coupon code '${code}' copied to clipboard! 🎉`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScrollToSearch = () => {
    const searchSection = document.querySelector(".search-box-hero-wrapper") || document.querySelector(".search-box");
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveModal(null);
      }
    };
    if (activeModal) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [activeModal]);

  return (
    <section className="offers-section" id="offers-and-more">
      <div className="offers-container">
        <div className="offers-header">
          <div>
            <h2>
              <span className="text-accent">Offers & More</span> for Your Journey
            </h2>
            <p className="offers-subtitle">Save more, travel smarter.</p>
          </div>

          <button
            type="button"
            className="view-all-offers-btn"
            onClick={() => setActiveModal("offers")}
            id="view-all-offers-btn"
          >
            View All Offers &rarr;
          </button>
        </div>

        <div className="offers-grid">
          {/* CARD 1: Flat 100 OFF */}
          <article
            className="offer-card card-red clickable-card"
            onClick={() => setActiveModal("offers")}
            tabIndex={0}
            role="button"
            aria-label="Open Flat 100 OFF offers"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveModal("offers");
              }
            }}
          >
            <div className="card-content">
              <div className="card-badge badge-red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>

              <h3>Flat ₹100 OFF</h3>
              <p>On all bus bookings</p>

              <div className="code-box" onClick={(e) => e.stopPropagation()}>
                <span>Use Code <strong>AIBUS100</strong></span>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={(e) => handleCopyCode("AIBUS100", e)}
                  title="Copy Code"
                  aria-label="Copy Code AIBUS100"
                >
                  {copied ? (
                    <span className="copied-text">✓ Copied</span>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>

              <button
                type="button"
                className="action-btn btn-solid-red"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveModal("offers");
                }}
              >
                View Offers &rarr;
              </button>
            </div>

            <div className="card-graphic graphic-red">%</div>
          </article>

          {/* CARD 2: Buses Near You */}
          <article
            className="offer-card card-blue clickable-card"
            onClick={() => setActiveModal("nearby")}
            tabIndex={0}
            role="button"
            aria-label="Open Buses Near You"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveModal("nearby");
              }
            }}
          >
            <div className="card-content">
              <div className="card-badge badge-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>

              <h3>Buses Near You</h3>
              <p>Find buses departing from your current location.</p>

              <button
                type="button"
                className="action-btn btn-outline-blue"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveModal("nearby");
                }}
              >
                Use My Location &rarr;
              </button>
            </div>

            <div className="card-graphic graphic-blue">📍</div>
          </article>

          {/* CARD 3: Eco-Friendly Travel */}
          <article
            className="offer-card card-green clickable-card"
            onClick={() => setActiveModal("eco")}
            tabIndex={0}
            role="button"
            aria-label="Open Eco-Friendly Travel details"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveModal("eco");
              }
            }}
          >
            <div className="card-content">
              <div className="card-badge badge-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>

              <h3>Eco-Friendly Travel</h3>
              <p>Choose bus travel for a cleaner, greener tomorrow.</p>

              <button
                type="button"
                className="action-btn btn-outline-green"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveModal("eco");
                }}
              >
                Learn More &rarr;
              </button>
            </div>

            <div className="card-graphic graphic-green">🌱</div>
          </article>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      <OffersModal
        isOpen={activeModal === "offers"}
        onClose={() => setActiveModal(null)}
        onCopyCode={(code) => handleCopyCode(code)}
      />

      <NearbyBusesModal
        isOpen={activeModal === "nearby"}
        onClose={() => setActiveModal(null)}
      />

      <EcoTravelModal
        isOpen={activeModal === "eco"}
        onClose={() => setActiveModal(null)}
        onSearchBuses={handleScrollToSearch}
      />

      {/* ================= TOAST NOTIFICATION ================= */}
      {showToast && (
        <div className="offers-toast-notification" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  );
}

export default PopularOffers;
