import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bus } from "lucide-react";
import authService from "../../services/authService";
import "./Header.css";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() => authService.getLoggedInUser());
  const [isScrolled, setIsScrolled] = useState(false);

  // Transparent header ONLY on Home page
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
    if (!isHomePage) {
      setIsScrolled(false);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isHomePage]);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate("/");
  };

  return (
    <header
      className={`header ${
        isHomePage
          ? isScrolled
            ? "header-home-transparent header-home-scrolled"
            : "header-home-transparent"
          : ""
      }`}
    >
      <div className="header-container">

        {/* ================================
            LOGO
        ================================= */}
        <Link
          to="/"
          className="logo"
          aria-label="AIBus Home"
        >
          <div className="logo-bus-icon">
            <Bus size={20} />
          </div>

          <span className="logo-text">
            <span className="logo-text-accent">AI</span>
            <span className="logo-text-dark">Bus</span>
          </span>
        </Link>

        {/* ================================
            NAVIGATION
        ================================= */}
        <nav className="header-nav">

          <Link
            to="/my-bookings"
            className="my-bookings-link"
          >
            My Bookings
          </Link>

          {user ? (
            <div className="user-logged-nav">
              <span className="logged-in-mobile">
                <svg
                  className="user-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>

                {user.firstName
                  ? `${user.firstName} ${user.lastName || ""}`.trim()
                  : user.name || user.email || (user.phone ? `+91 ${user.phone.slice(-4)}` : "Traveller")}
              </span>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="login-button"
            >
              Login
            </Link>
          )}

        </nav>
      </div>
    </header>
  );
}

export default Header;