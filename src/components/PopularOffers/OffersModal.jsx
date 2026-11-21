import { useState, useEffect } from "react";
import offersService, { FALLBACK_OFFERS } from "../../services/offersService";
import "./PopularOffers.css";

function OffersModal({ isOpen, onClose, onCopyCode }) {
  const [offersList, setOffersList] = useState(FALLBACK_OFFERS);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      offersService
        .getOffers()
        .then((data) => {
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setOffersList(data);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredOffers = offersList.filter((offer) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "flat") return offer.type === "FLAT";
    if (selectedCategory === "new") return offer.category?.toLowerCase().includes("new");
    if (selectedCategory === "festive") {
      return (
        offer.type === "PERCENTAGE" ||
        offer.category?.toLowerCase().includes("weekend") ||
        offer.category?.toLowerCase().includes("festive")
      );
    }
    return true;
  });

  const toggleTerms = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCopy = (offer) => {
    setCopiedId(offer.id || offer.code);
    if (typeof onCopyCode === "function") {
      onCopyCode(offer.code);
    } else {
      navigator.clipboard.writeText(offer.code);
    }
    setTimeout(() => {
      setCopiedId((current) => (current === (offer.id || offer.code) ? null : current));
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
            All Offers ({offersList.length})
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
            {filteredOffers.map((offer) => {
              const cardId = offer.id || offer.code;
              const minSpendText = offer.subtitle || (offer.minOrderValue ? `Min. spend ₹${offer.minOrderValue}` : "No min. booking");
              const validityText = offer.formattedExpiry || "Valid today";
              const terms = Array.isArray(offer.termsAndConditions)
                ? offer.termsAndConditions
                : Array.isArray(offer.terms)
                ? offer.terms
                : [];

              return (
                <div key={cardId} className="offer-modal-card">
                  <div className="offer-card-top">
                    <div className="offer-icon-box badge-red">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                    </div>
                    <div className="offer-info">
                      <div className="offer-title-row">
                        <h4>{offer.title}</h4>
                        <span className="offer-tag-pill">{offer.category || offer.discountBadge || "Deal"}</span>
                      </div>
                      <p className="offer-desc">{offer.description || offer.subtitle}</p>
                      <div className="offer-meta">
                        <span>• {minSpendText}</span>
                        <span>• {validityText}</span>
                      </div>
                    </div>
                  </div>

                  <div className="offer-card-bottom">
                    <div className="coupon-code-pill">
                      <span className="code-text">{offer.code}</span>
                      <button
                        type="button"
                        className={`modal-copy-btn ${copiedId === cardId ? "copied" : ""}`}
                        onClick={() => handleCopy(offer)}
                        title={`Copy ${offer.code}`}
                      >
                        {copiedId === cardId ? (
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

                    {terms.length > 0 && (
                      <button
                        type="button"
                        className="terms-toggle-btn"
                        onClick={() => toggleTerms(cardId)}
                      >
                        {expandedId === cardId ? "Hide T&C ▲" : "View T&C ▼"}
                      </button>
                    )}
                  </div>

                  {expandedId === cardId && terms.length > 0 && (
                    <ul className="offer-terms-list">
                      {terms.map((term, index) => (
                        <li key={index}>{term}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
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
