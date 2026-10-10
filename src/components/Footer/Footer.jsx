import { Link, useNavigate } from "react-router-dom";
import { Bus, ShieldCheck, Zap, Phone, Mail } from "lucide-react";
import "./Footer.css";

function Footer() {
  const navigate = useNavigate();

  const handleRouteClick = (from, to) => {
    const today = new Date().toISOString().split("T")[0];
    navigate(`/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${today}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScrollToOffers = () => {
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById("offers-and-more");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      const el = document.getElementById("offers-and-more");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="app-footer">
      <div className="footer-container">
        {/* Main Grid: 4 Clean Columns */}
        <div className="footer-grid">
          {/* Column 1: Brand & Mission */}
          <div className="footer-col brand-col">
            <Link to="/" className="footer-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <div className="footer-bus-icon">
                <Bus size={18} />
              </div>
              <span className="logo-text">
                <span className="logo-text-accent">AI</span>
                <span className="logo-text-light">Bus</span>
              </span>
            </Link>
            <p className="footer-tagline">
              Fast, reliable and comfortable intercity bus travel with real-time AI tracking and verified operators across India.
            </p>

            <div className="trust-badges-row">
              <span className="trust-badge">
                <ShieldCheck size={14} className="badge-icon-blue" /> 256-Bit Encrypted Payments
              </span>
              <span className="trust-badge">
                <Zap size={14} className="badge-icon-cyan" /> Instant QR M-Tickets
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  Search Buses
                </Link>
              </li>
              <li>
                <Link to="/my-bookings">My Bookings</Link>
              </li>
              <li>
                <button type="button" className="footer-link-btn" onClick={handleScrollToOffers}>
                  Exclusive Offers
                </button>
              </li>
              <li>
                <Link to="/login">Login / Sign Up</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Top Bus Routes */}
          <div className="footer-col">
            <h4 className="footer-col-title">Popular Routes</h4>
            <ul className="footer-links-list">
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => handleRouteClick("Delhi", "Jaipur")}
                >
                  Delhi → Jaipur
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => handleRouteClick("Delhi", "Dehradun")}
                >
                  Delhi → Dehradun
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => handleRouteClick("Delhi", "Agra")}
                >
                  Delhi → Agra
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => handleRouteClick("Bengaluru", "Goa")}
                >
                  Bengaluru → Goa
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: 24/7 Support */}
          <div className="footer-col support-col">
            <h4 className="footer-col-title">24/7 Customer Care</h4>
            <p className="support-desc">Need assistance with your booking or refund?</p>
            <a href="tel:18001202428" className="contact-item">
              <div className="contact-icon">
                <Phone size={16} />
              </div>
              <div>
                <span className="contact-label">Toll Free Helpline</span>
                <strong className="contact-val">1800-120-AIBUS</strong>
              </div>
            </a>
            <a href="mailto:support@aibus.in" className="contact-item">
              <div className="contact-icon">
                <Mail size={16} />
              </div>
              <div>
                <span className="contact-label">Email Support</span>
                <strong className="contact-val">support@aibus.in</strong>
              </div>
            </a>
          </div>
        </div>

        {/* Bottom Bar: Clean Copyright & Status */}
        <div className="footer-bottom-bar">
          <p className="copyright-text">
            © {new Date().getFullYear()} AIBus Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            <span className="live-status-pill">
              <span className="live-status-dot"></span> All Systems Operational
            </span>
            <span className="dot-sep">•</span>
            <span>Safe & Verified Travel Partner</span>
            <span className="dot-sep">•</span>
            <Link to="/" className="legal-link">Privacy & Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
