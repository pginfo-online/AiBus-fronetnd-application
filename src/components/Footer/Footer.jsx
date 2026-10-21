import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bus,
  Mail,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import "./Footer.css";

function Footer() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail("");
      setSubscribed(false);
    }, 4000);
  };

  const handleScrollToSearch = () => {
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById("bus-search-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      const el = document.getElementById("bus-search-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScrollToOffers = () => {
    window.dispatchEvent(new CustomEvent("openOffersModal"));
  };

  return (
    <footer className="ogl-footer-wrapper" id="footer-support-section">
      <div className="ogl-footer-container">
        {/* ================================
            STAY UPDATED (NEWSLETTER BANNER)
        ================================= */}
        <div className="ogl-newsletter-card">
          <div className="ogl-newsletter-left">
            <div className="ogl-newsletter-icon">
              <Bus size={22} />
            </div>
            <div>
              <h3 className="ogl-newsletter-title">Stay Updated</h3>
              <p className="ogl-newsletter-sub">
                Get the latest offers, new routes and travel tips.
              </p>
            </div>
          </div>

          <form className="ogl-newsletter-form" onSubmit={handleSubscribe}>
            {subscribed ? (
              <div className="ogl-subscribed-msg">
                <CheckCircle2 size={18} />
                <span>Thank you for subscribing! Check your inbox soon.</span>
              </div>
            ) : (
              <div className="ogl-newsletter-input-group">
                <Mail size={18} className="ogl-input-mail-icon" />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="ogl-subscribe-btn">
                  <span>Subscribe</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </form>
        </div>

        {/* ================================
            MAIN FOOTER GRID
        ================================= */}
        <div className="ogl-footer-grid">
          {/* Brand Col */}
          <div className="ogl-footer-col ogl-brand-col">
            <Link to="/" className="ogl-footer-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <div className="ogl-logo-badge">
                <Bus size={18} strokeWidth={2.4} />
              </div>
              <span className="ogl-logo-text light">
                Ai<span className="ogl-logo-accent">Bus</span>
              </span>
            </Link>
            <p className="ogl-footer-tagline">
              Travel Smarter, Travel Together.
            </p>
          </div>

          {/* Quick Links */}
          <div className="ogl-footer-col">
            <h4 className="ogl-col-title">Quick Links</h4>
            <ul className="ogl-col-links">
              <li>
                <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  Home
                </Link>
              </li>
              <li>
                <button type="button" className="ogl-link-btn" onClick={handleScrollToSearch}>
                  Bus Tickets
                </button>
              </li>
              <li>
                <button type="button" className="ogl-link-btn" onClick={handleScrollToOffers}>
                  Offers
                </button>
              </li>
              <li>
                <Link to="/my-bookings">Track Bus</Link>
              </li>
              <li>
                <button type="button" className="ogl-link-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  Help
                </button>
              </li>
            </ul>
          </div>

          {/* About Us */}
          <div className="ogl-footer-col">
            <h4 className="ogl-col-title">About Us</h4>
            <ul className="ogl-col-links">
              <li><Link to="/">Our Story</Link></li>
              <li><Link to="/">Why Choose Us</Link></li>
              <li><Link to="/">Careers</Link></li>
              <li><Link to="/">Partner With Us</Link></li>
              <li><Link to="/">Contact Us</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="ogl-footer-col">
            <h4 className="ogl-col-title">Support</h4>
            <ul className="ogl-col-links">
              <li><Link to="/">FAQs</Link></li>
              <li><Link to="/">Cancellation Policy</Link></li>
              <li><Link to="/">Refund Policy</Link></li>
              <li><Link to="/">Terms & Conditions</Link></li>
              <li><Link to="/">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Follow Us */}
          <div className="ogl-footer-col">
            <h4 className="ogl-col-title">Follow Us</h4>
            <div className="ogl-social-icons">
              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="ogl-social-link">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>

              {/* Facebook */}
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="ogl-social-link">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>

              {/* X / Twitter */}
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="X (Twitter)" className="ogl-social-link">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                </svg>
              </a>

              {/* YouTube */}
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="ogl-social-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
              </a>

              {/* LinkedIn */}
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="ogl-social-link">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* ================================
            FOOTER BOTTOM COPYRIGHT
        ================================= */}
        <div className="ogl-footer-bottom">
          <p className="ogl-copyright">
            © 2026 AiBus. All rights reserved.
          </p>
          <p className="ogl-footer-note">
            Made with <span className="heart-icon">❤️</span> for every journey
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
