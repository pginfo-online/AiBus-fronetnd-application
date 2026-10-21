import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bus, Search, Menu, X, User as UserIcon } from "lucide-react";
import authService from "../../services/authService";
import "./Header.css";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() => authService.getLoggedInUser());
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const checkLoginStatus = () => {
      setUser(authService.getLoggedInUser());
    };

    window.addEventListener("storage", checkLoginStatus);
    window.addEventListener("loginStatusChanged", checkLoginStatus);

    return () => {
      window.removeEventListener("storage", checkLoginStatus);
      window.removeEventListener("loginStatusChanged", checkLoginStatus);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close mobile menu on page change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate("/");
  };

  const handleScrollToSection = (sectionId) => {
    if (location.pathname !== "/") {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className={`header ${isHomePage ? "header-home" : "header-page"} ${isScrolled ? "header-scrolled" : ""}`}>
      <div className="header-container">
        {/* ================================
            LOGO
        ================================= */}
        <Link to="/" className="ogl-logo" aria-label="AiBus Home">
          <div className="ogl-logo-badge">
            <Bus size={19} strokeWidth={2.4} />
          </div>
          <span className="ogl-logo-text">
            Ai<span className="ogl-logo-accent">Bus</span>
          </span>
        </Link>

        {/* ================================
            DESKTOP NAVIGATION
        ================================= */}
        <nav className="ogl-nav">
          <Link to="/" className={`ogl-nav-link ${isHomePage ? "active" : ""}`}>
            Home
          </Link>

          <button
            type="button"
            className="ogl-nav-link"
            onClick={() => handleScrollToSection("bus-search-section")}
          >
            Bus Tickets
          </button>

          <button
            type="button"
            className="ogl-nav-link"
            onClick={() => window.dispatchEvent(new CustomEvent("openOffersModal"))}
          >
            Offers
          </button>

          <Link to="/my-bookings" className="ogl-nav-link">
            Track Bus
          </Link>

          <button
            type="button"
            className="ogl-nav-link"
            onClick={() => handleScrollToSection("footer-support-section")}
          >
            Help
          </button>
        </nav>

        {/* ================================
            RIGHT ACTIONS
        ================================= */}
        <div className="ogl-header-actions">
          <button
            type="button"
            className="ogl-search-btn"
            aria-label="Search"
            onClick={() => handleScrollToSection("bus-search-section")}
          >
            <Search size={18} strokeWidth={2.2} />
          </button>

          {user ? (
            <div className="ogl-user-menu">
              <span className="ogl-user-badge">
                <UserIcon size={15} />
                <span className="ogl-user-name">
                  {user.firstName
                    ? `${user.firstName} ${user.lastName || ""}`.trim()
                    : user.name || (user.phone ? `+91 ${user.phone.slice(-4)}` : "Traveller")}
                </span>
              </span>
              <button type="button" className="ogl-logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="ogl-login-pill">
              Login / Sign Up
            </Link>
          )}

          <button
            type="button"
            className="ogl-hamburger"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ================================
          MOBILE MENU DRAWER
      ================================= */}
      {mobileMenuOpen && (
        <div className="ogl-mobile-drawer">
          <nav className="ogl-mobile-nav">
            <Link to="/" className={`ogl-mobile-link ${isHomePage ? "active" : ""}`}>
              Home
            </Link>
            <button
              type="button"
              className="ogl-mobile-link"
              onClick={() => handleScrollToSection("bus-search-section")}
            >
              Bus Tickets
            </button>
            <button
              type="button"
              className="ogl-mobile-link"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("openOffersModal"));
                setMobileMenuOpen(false);
              }}
            >
              Offers
            </button>
            <Link to="/my-bookings" className="ogl-mobile-link">
              Track Bus
            </Link>
            <button
              type="button"
              className="ogl-mobile-link"
              onClick={() => handleScrollToSection("footer-support-section")}
            >
              Help
            </button>

            <div className="ogl-mobile-auth">
              {user ? (
                <button type="button" className="ogl-logout-btn full" onClick={handleLogout}>
                  Logout ({user.firstName || user.name || "User"})
                </button>
              ) : (
                <Link to="/login" className="ogl-login-pill full">
                  Login / Sign Up
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;