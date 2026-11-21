import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tag,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Clock,
  ShieldCheck,
  ArrowRight,
  Bus,
} from "lucide-react";
import offersService from "../../services/offersService";
import "./Offers.css";

const CATEGORIES = [
  { id: "all", label: "All Offers" },
  { id: "FLAT", label: "Flat Discounts" },
  { id: "PERCENTAGE", label: "Percentage OFF" },
  { id: "New Users", label: "New Users" },
  { id: "Weekend", label: "Weekend Savers" },
];

export default function Offers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadOffers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await offersService.getOffers();
        if (isMounted) {
          setOffers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load active offers.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOffers();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyCode = (code, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setToastMessage(`Coupon code '${code}' copied! Apply at checkout to save.`);

    setTimeout(() => {
      setCopiedCode((current) => (current === code ? null : current));
    }, 2500);

    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleBookWithCode = (code) => {
    navigator.clipboard.writeText(code);
    navigate(`/search?coupon=${encodeURIComponent(code)}`);
  };

  const toggleTerms = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Filter offers based on category and search query
  const filteredOffers = offers.filter((offer) => {
    const matchesCategory =
      selectedCategory === "all" ||
      offer.type === selectedCategory ||
      offer.category?.toLowerCase() === selectedCategory.toLowerCase();

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      offer.code?.toLowerCase().includes(q) ||
      offer.title?.toLowerCase().includes(q) ||
      offer.description?.toLowerCase().includes(q) ||
      offer.category?.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="offers-page">
      {/* ------------------------------------------------------------------
          1. HERO HEADER WITH LIVE PROMO COUNTER
          ------------------------------------------------------------------ */}
      <section className="offers-hero">
        <div className="offers-hero-container">
          <div className="offers-hero-badge">
            <Sparkles size={14} />
            <span>Verified Bus Promo Codes</span>
          </div>

          <h1 className="offers-hero-title">
            Exclusive Offers <span className="highlight-accent">&amp; Discounts</span>
          </h1>

          <p className="offers-hero-desc">
            Save up to ₹250 on your bus tickets. Apply these verified promo codes during
            checkout for instant cash discounts on all major operators across India.
          </p>

          {/* Search & Category Filter Bar */}
          <div className="offers-filter-bar">
            <div className="offers-search-input-wrap">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search promo codes, deals, or operators (e.g. AIBUS100, Weekend)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="offers-search-input"
              />
            </div>

            <div className="offers-category-pills">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`offers-pill-btn ${selectedCategory === cat.id ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          2. OFFERS GRID SECTION
          ------------------------------------------------------------------ */}
      <section className="offers-content-section">
        <div className="offers-status-row">
          <span>
            Showing <strong className="offers-count-text">{filteredOffers.length}</strong> active deals
          </span>
          <span className="offers-live-indicator">
            <ShieldCheck size={16} style={{ color: "#16A34A", verticalAlign: "middle", marginRight: 4 }} />
            100% Tested &amp; Valid
          </span>
        </div>

        {loading ? (
          <div className="offers-grid-container">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="voucher-skeleton-card">
                <div className="skeleton-box" style={{ height: 24, width: "35%" }} />
                <div className="skeleton-box" style={{ height: 28, width: "75%" }} />
                <div className="skeleton-box" style={{ height: 18, width: "90%" }} />
                <div className="skeleton-box" style={{ height: 44, width: "100%", marginTop: "auto" }} />
              </div>
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="offers-empty-state">
            <Tag size={48} strokeWidth={1.5} />
            <h3>No Offers Found</h3>
            <p>We couldn't find any deals matching your search criteria.</p>
            <button
              type="button"
              className="offers-reset-btn"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="offers-grid-container">
            {filteredOffers.map((offer) => {
              const isCopied = copiedCode === offer.code;
              const isExpanded = expandedId === offer.id;

              return (
                <article key={offer.id || offer.code} className="offer-voucher-card">
                  {/* Ticket Notch Cutouts */}
                  <div className="voucher-notch notch-left" />
                  <div className="voucher-notch notch-right" />

                  {/* Card Top Header */}
                  <div className="voucher-top">
                    <div className="voucher-badge-row">
                      <span className="voucher-tag">
                        <Tag size={12} />
                        {offer.category || "Bus Travel"}
                      </span>
                      <span className="voucher-discount-pill">
                        {offer.discountBadge || (offer.type === "PERCENTAGE" ? `${offer.value}% OFF` : `₹${offer.value} OFF`)}
                      </span>
                    </div>

                    <h3 className="voucher-title">{offer.title}</h3>
                    <p className="voucher-desc">{offer.description || offer.subtitle}</p>

                    <div className="voucher-meta-row">
                      <span className="voucher-meta-item">
                        <Bus size={13} />
                        {offer.subtitle || (offer.minOrderValue ? `Min. spend ₹${offer.minOrderValue}` : "No min. booking")}
                      </span>
                      <span className="voucher-meta-item">
                        <Clock size={13} />
                        {offer.formattedExpiry || "Active today"}
                      </span>
                    </div>
                  </div>

                  {/* Dashed Ticket Perforation */}
                  <div className="voucher-divider">
                    <div className="voucher-dashed-line" />
                  </div>

                  {/* Card Bottom: Code Copy & Booking Action */}
                  <div className="voucher-bottom">
                    <div className="voucher-action-row">
                      <button
                        type="button"
                        className={`voucher-copy-btn ${isCopied ? "copied" : ""}`}
                        onClick={(e) => handleCopyCode(offer.code, e)}
                        title="Click to copy coupon code"
                      >
                        <span className="voucher-code-label">{offer.code}</span>
                        <span className="voucher-copy-status">
                          {isCopied ? (
                            <>
                              <Check size={14} strokeWidth={3} /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={13} /> Copy Code
                            </>
                          )}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="voucher-book-now-btn"
                        onClick={() => handleBookWithCode(offer.code)}
                      >
                        <span>Book</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>

                    {/* Expandable Terms & Conditions */}
                    {Array.isArray(offer.termsAndConditions) && offer.termsAndConditions.length > 0 && (
                      <>
                        <button
                          type="button"
                          className="voucher-terms-toggle"
                          onClick={() => toggleTerms(offer.id)}
                        >
                          <span>Terms &amp; Conditions</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {isExpanded && (
                          <div className="voucher-terms-drawer">
                            <ul className="voucher-terms-list">
                              {offer.termsAndConditions.map((term, tIdx) => (
                                <li key={tIdx}>{term}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="offers-toast-bar">
          <Check size={18} strokeWidth={3} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

