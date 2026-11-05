import { useState, useEffect } from "react";
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

  const [activeTab, setActiveTab] = useState("otp"); // 'otp' | 'login'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Show/Hide Password States
  const [showPassword, setShowPassword] = useState(false);

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // SMS OTP Form State
  const [otpStep, setOtpStep] = useState("request"); // 'request' | 'verify'
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).");
      return;
    }

    try {
      setLoading(true);
      const data = await authService.sendOtp({ phone: cleanPhone });
      setOtpStep("verify");
      setResendCooldown(data?.resendCooldownSeconds || 30);
      setSuccessMessage(
        data?.debugOtp
          ? `OTP sent! (Test OTP: ${data.debugOtp})`
          : `6-digit verification code sent to +91 ${cleanPhone}.`
      );
    } catch (err) {
      setErrorMessage(err.message || "Failed to send OTP. Please check your number.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 4 || cleanOtp.length > 6) {
      setErrorMessage("Please enter the 6-digit OTP received on your mobile.");
      return;
    }

    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || undefined;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

    try {
      setLoading(true);
      const data = await authService.verifyOtp({
        phone: cleanPhone,
        otp: cleanOtp,
        firstName,
        lastName,
      });

      setSuccessMessage(
        data?.isNewUser
          ? "Welcome to AiBus! Your account is ready."
          : "Verified successfully! Logging in..."
      );

      setTimeout(() => {
        navigate(returnTo);
      }, 600);
    } catch (err) {
      setErrorMessage(err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

          {/* Navigation Tabs: Mobile OTP vs Email & Password */}
          <div className="auth-tab-group" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "otp"}
              className={`auth-tab ${activeTab === "otp" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("otp");
                setErrorMessage("");
                setSuccessMessage("");
              }}
            >
              Mobile OTP
            </button>
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
              Email & Password
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

          {/* Tab 1: SMS OTP VERIFICATION (FAST LOGIN & REGISTRATION) */}
          {activeTab === "otp" ? (
            otpStep === "request" ? (
              /* Step 1: Request OTP */
              <form onSubmit={handleSendOtp} className="auth-form" noValidate>
                <div className="auth-input-group">
                  <label htmlFor="otp-phone">Mobile Number</label>
                  <div className="auth-phone-input-row">
                    <span className="auth-country-prefix">+91</span>
                    <div className="auth-input-container auth-phone-container">
                      <Phone size={18} className="auth-input-icon" />
                      <input
                        id="otp-phone"
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={phone}
                        disabled={loading}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setPhone(val);
                          setErrorMessage("");
                        }}
                        autoFocus
                      />
                    </div>
                  </div>
                  <span className="auth-field-hint">
                    We will send a 6-digit verification code to your phone via SMS.
                  </span>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading || phone.replace(/\D/g, "").length !== 10}
                >
                  {loading ? (
                    <span className="auth-btn-spinner-text">Sending OTP...</span>
                  ) : (
                    <>
                      <span>Get Verification Code</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Verify OTP */
              <form onSubmit={handleVerifyOtp} className="auth-form" noValidate>
                <div className="auth-otp-edit-row">
                  <div className="auth-otp-phone-badge">
                    <span>Sent to: <strong>+91 {phone}</strong></span>
                  </div>
                  <button
                    type="button"
                    className="auth-change-phone-btn"
                    onClick={() => {
                      setOtpStep("request");
                      setOtp("");
                      setErrorMessage("");
                    }}
                  >
                    Change Number
                  </button>
                </div>

                <div className="auth-input-group">
                  <label htmlFor="otp-code">Enter 6-digit OTP</label>
                  <div className="auth-input-container">
                    <ShieldCheck size={18} className="auth-input-icon" />
                    <input
                      id="otp-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                      placeholder="• • • • • •"
                      className="auth-otp-code-input"
                      value={otp}
                      disabled={loading}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setOtp(val);
                        setErrorMessage("");
                      }}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Optional full name if user is new */}
                <div className="auth-input-group">
                  <label htmlFor="otp-fullName">Your Name (Optional for New Users)</label>
                  <div className="auth-input-container">
                    <User size={18} className="auth-input-icon" />
                    <input
                      id="otp-fullName"
                      type="text"
                      placeholder="Jane Doe"
                      value={fullName}
                      disabled={loading}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="auth-resend-row">
                  {resendCooldown > 0 ? (
                    <span className="auth-resend-timer">
                      Resend OTP in <strong>{resendCooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="auth-resend-btn"
                      disabled={loading}
                      onClick={handleSendOtp}
                    >
                      Resend OTP via SMS
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading || otp.length < 4}
                >
                  {loading ? (
                    <span className="auth-btn-spinner-text">Verifying...</span>
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )
          ) : (
            /* Tab 2: EMAIL & PASSWORD SIGN IN */
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
                    <span>Sign In with Password</span>
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