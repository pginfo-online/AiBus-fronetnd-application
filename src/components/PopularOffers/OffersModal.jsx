import { useState } from "react";

const OFFERS = [
  {
    id: "aibus100",
    code: "AIBUS100",
    title: "Flat ₹100 OFF",
    subtitle: "On all bus bookings across India",
    minSpend: "Min. booking amount ₹500",
    validTill: "Valid till 31 Oct 2026",
    category: "flat",
    tag: "Popular",
    badgeClass: "badge-red",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    terms: ["Applicable on both AC and Non-AC buses", "Valid once per user per month", "Cannot be combined with other promo codes"],
  },
  {
    id: "firstbus",
    code: "FIRSTBUS",
    title: "Flat 15% OFF (Up to ₹150)",
    subtitle: "Exclusive welcome discount on your first booking",
    minSpend: "No minimum booking required",
    validTill: "Valid for first-time users",
    category: "new",
    tag: "New Users",
    badgeClass: "badge-blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <polyline points="17 11 19 13 23 9" />
      </svg>
    ),
    terms: ["Valid only on primary passenger's first booking", "Maximum discount ₹150", "Instant discount applied at checkout"],
  },
  {
    id: "weekend20",
    code: "WEEKEND20",
    title: "Weekend Getaway 20% OFF",
    subtitle: "Travel on Friday, Saturday or Sunday and save big",
    minSpend: "Min. booking amount ₹700",
    validTill: "Valid on weekend departures",
    category: "festive",
    tag: "Weekend Saver",
    badgeClass: "badge-orange",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    terms: ["Travel date must be Fri/Sat/Sun", "Discount capped at ₹200", "Valid on selected top routes"],
  },
  {
    id: "return50",
    code: "RETURN50",
    title: "Round Trip Saver ₹50 OFF",
    subtitle: "Book your return journey together and get instant cashback",
    minSpend: "Applicable on round trip journeys",
    validTill: "Valid till 30 Nov 2026",
    category: "flat",
    tag: "Round Trip",
    badgeClass: "badge-green",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
    terms: ["Both onward and return tickets must be in single booking", "Instant ₹50 deduction on total fare"],
  },
];

function OffersModal({ isOpen, onClose, onCopyCode }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen) return null;

  const filteredOffers =
    selectedCategory === "all"
      ? OFFERS
      : OFFERS.filter((offer) => offer.category === selectedCategory);

  const toggleTerms = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCopy = (offer) => {
    setCopiedId(offer.id);
    onCopyCode(offer.code);
    setTimeout(() => {
      setCopiedId((current) => (current === offer.id ? null : current));
    }, 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container offers-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-badge-icon badge-red">🏷️</span>
            <div>
              <h3>Exclusive Offers & Discounts</h3>
              <p>Copy coupon codes and apply during checkout to save more!</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`tab-btn ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            All Offers ({OFFERS.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${selectedCategory === "flat" ? "active" : ""}`}
            onClick={() => setSelectedCategory("flat")}
          >
            Flat Discounts
          </button>
          <button
            type="button"
            className={`tab-btn ${selectedCategory === "new" ? "active" : ""}`}
            onClick={() => setSelectedCategory("new")}
          >
            New Users
          </button>
          <button
            type="button"
            className={`tab-btn ${selectedCategory === "festive" ? "active" : ""}`}
            onClick={() => setSelectedCategory("festive")}
          >
            Weekend & Festive
          </button>
        </div>

        {/* Offers List */}
        <div className="modal-body-scroll">
          <div className="offers-modal-list">
            {filteredOffers.map((offer) => (
              <div key={offer.id} className="offer-modal-card">
                <div className="offer-card-top">
                  <div className={`offer-icon-box ${offer.badgeClass}`}>
                    {offer.icon}
                  </div>
                  <div className="offer-info">
                    <div className="offer-title-row">
                      <h4>{offer.title}</h4>
                      <span className="offer-tag-pill">{offer.tag}</span>
                    </div>
                    <p className="offer-desc">{offer.subtitle}</p>
                    <div className="offer-meta">
                      <span>• {offer.minSpend}</span>
                      <span>• {offer.validTill}</span>
                    </div>
                  </div>
                </div>

                <div className="offer-card-bottom">
                  <div className="coupon-code-pill">
                    <span className="code-text">{offer.code}</span>
                    <button
                      type="button"
                      className={`modal-copy-btn ${copiedId === offer.id ? "copied" : ""}`}
                      onClick={() => handleCopy(offer)}
                      title={`Copy ${offer.code}`}
                    >
                      {copiedId === offer.id ? (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="terms-toggle-btn"
                    onClick={() => toggleTerms(offer.id)}
                  >
                    {expandedId === offer.id ? "Hide T&C ▲" : "View T&C ▼"}
                  </button>
                </div>

                {expandedId === offer.id && (
                  <ul className="offer-terms-list">
                    {offer.terms.map((term, index) => (
                      <li key={index}>{term}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <p className="footer-note">💡 Tip: You can paste the copied code directly at checkout!</p>
          <button type="button" className="action-btn btn-solid-red" onClick={onClose}>
            Got it, Let's Book
          </button>
        </div>
      </div>
    </div>
  );
}

export default OffersModal;
