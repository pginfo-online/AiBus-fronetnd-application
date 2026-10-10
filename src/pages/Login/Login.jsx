import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Bus,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import authService from "../../services/authService";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  const [activeTab, setActiveTab] = useState("login"); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Show/Hide Password States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // Register Form State
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!loginForm.email || !loginForm.email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!loginForm.password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      await authService.login({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });

      setSuccessMessage("Logged in successfully! Redirecting...");
      setTimeout(() => {
        navigate(returnTo);
      }, 600);
    } catch (err) {
      setErrorMessage(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const { firstName, lastName, email, phone, password, confirmPassword } = registerForm;

    if (!firstName || firstName.trim().length < 2) {
      setErrorMessage("First name must be at least 2 characters.");
      return;
    }

    if (!lastName || lastName.trim().length < 1) {
      setErrorMessage("Last name is required.");
      return;
    }

    if (!email || !email.includes("@") || !email.includes(".")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (phone && !/^[0-9]{10}$/.test(phone.replace(/\D/g, ""))) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Backend requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 digit
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      setErrorMessage(
        "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await authService.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone ? `+91${phone.replace(/\D/g, "")}` : undefined,
        password,
      });

      setSuccessMessage("Account created successfully! Redirecting...");
      setTimeout(() => {
        navigate(returnTo);
      }, 600);
    } catch (err) {
      setErrorMessage(err.message || "Registration failed. Please check the provided information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card-wrapper">
        <button
          type="button"
          className="auth-back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className="auth-card">
          {/* Header Brand Badge */}
          <div className="auth-brand-badge">
            <div className="auth-brand-icon">
              <Bus size={24} />
            </div>
            <div>
              <span className="auth-brand-title">AiBus Account</span>
              <span className="auth-brand-desc">Intercity Smart Travel</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="auth-tab-group" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "login"}
              className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("login");
                setErrorMessage("");
                setSuccessMessage("");
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "register"}
              className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("register");
                setErrorMessage("");
                setSuccessMessage("");
              }}
            >
              Create Account
            </button>
          </div>

          {/* Alert Banners */}
          {errorMessage && (
            <div className="auth-alert error" role="alert">
              <AlertCircle size={18} className="auth-alert-icon" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="auth-alert success" role="alert">
              <CheckCircle2 size={18} className="auth-alert-icon" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Tab 1: SIGN IN FORM */}
          {activeTab === "login" ? (
            <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
              <div className="auth-input-group">
                <label htmlFor="login-email">Email Address</label>
                <div className="auth-input-container">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@example.com"
                    value={loginForm.email}
                    disabled={loading}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, email: e.target.value });
                      setErrorMessage("");
                    }}
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <div className="auth-label-row">
                  <label htmlFor="login-password">Password</label>
                </div>
                <div className="auth-input-container">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={loginForm.password}
                    disabled={loading}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, password: e.target.value });
                      setErrorMessage("");
                    }}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-btn-spinner-text">Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Tab 2: SIGN UP / REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="auth-form" noValidate>
              <div className="auth-input-row">
                <div className="auth-input-group">
                  <label htmlFor="register-firstName">First Name</label>
                  <div className="auth-input-container">
                    <User size={18} className="auth-input-icon" />
                    <input
                      id="register-firstName"
                      type="text"
                      required
                      placeholder="Jane"
                      value={registerForm.firstName}
                      disabled={loading}
                      onChange={(e) => {
                        setRegisterForm({ ...registerForm, firstName: e.target.value });
                        setErrorMessage("");
                      }}
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label htmlFor="register-lastName">Last Name</label>
                  <div className="auth-input-container">
                    <User size={18} className="auth-input-icon" />
                    <input
                      id="register-lastName"
                      type="text"
                      required
                      placeholder="Doe"
                      value={registerForm.lastName}
                      disabled={loading}
                      onChange={(e) => {
                        setRegisterForm({ ...registerForm, lastName: e.target.value });
                        setErrorMessage("");
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="register-email">Email Address</label>
                <div className="auth-input-container">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@example.com"
                    value={registerForm.email}
                    disabled={loading}
                    onChange={(e) => {
                      setRegisterForm({ ...registerForm, email: e.target.value });
                      setErrorMessage("");
                    }}
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="register-phone">Mobile Number (Optional)</label>
                <div className="auth-input-container">
                  <Phone size={18} className="auth-input-icon" />
                  <input
                    id="register-phone"
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={registerForm.phone}
                    disabled={loading}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setRegisterForm({ ...registerForm, phone: digits });
                      setErrorMessage("");
                    }}
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="register-password">Password</label>
                <div className="auth-input-container">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    placeholder="At least 8 chars, 1 uppercase, 1 digit"
                    value={registerForm.password}
                    disabled={loading}
                    onChange={(e) => {
                      setRegisterForm({ ...registerForm, password: e.target.value });
                      setErrorMessage("");
                    }}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <span className="auth-field-hint">
                  Must be 8+ characters with uppercase, lowercase, and numeric digits.
                </span>
              </div>

              <div className="auth-input-group">
                <label htmlFor="register-confirmPassword">Confirm Password</label>
                <div className="auth-input-container">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="register-confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    placeholder="Confirm your password"
                    value={registerForm.confirmPassword}
                    disabled={loading}
                    onChange={(e) => {
                      setRegisterForm({ ...registerForm, confirmPassword: e.target.value });
                      setErrorMessage("");
                    }}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-btn-spinner-text">Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Security & Reassurance Footer */}
          <div className="auth-security-footer">
            <ShieldCheck size={16} className="auth-sec-icon" />
            <span>256-bit SSL encrypted • Instant booking synchronization</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login;