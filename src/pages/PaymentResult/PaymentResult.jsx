import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Home,
  ShieldCheck,
  CreditCard,
  Ticket,
} from "lucide-react";
import paymentService from "../../services/paymentService";
import BookingStepper from "../../components/BookingStepper/BookingStepper";
import "./PaymentResult.css";

const BACKOFF_DELAYS = [2000, 3000, 4500, 6000, 8000];

function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [statusNote, setStatusNote] = useState("Connecting to payment gateway...");
  const [isVerifying, setIsVerifying] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const isCancelledRef = useRef(false);

  const executeVerification = useCallback(async () => {
    isCancelledRef.current = false;
    setIsVerifying(true);
    setErrorMessage(null);
    setStep(1);
    setStatusNote("Initiating transaction verification...");

    // 1. Resolve identifiers: URL params or persistent pending payment storage
    let bookingId = searchParams.get("bookingId");
    let merchantTxnId = searchParams.get("merchantTxnId") || searchParams.get("merchantOrderId");

    if (!bookingId || !merchantTxnId) {
      try {
        const pendingRaw = localStorage.getItem("aibus_pending_payment");
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw);
          if (!bookingId) bookingId = pending.bookingId;
          if (!merchantTxnId) merchantTxnId = pending.merchantTxnId;
        }
      } catch {
        // Ignore read error
      }
    }

    if (!bookingId || !merchantTxnId) {
      setIsVerifying(false);
      setErrorMessage(
        "Missing transaction reference. If an amount was deducted, please check your bookings or contact support."
      );
      return;
    }

    try {
      // Step 1: Processing
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (isCancelledRef.current) return;

      setStep(2);
      setStatusNote("Verifying transaction status with PhonePe & banking partner...");

      let verifiedSuccess = false;
      let finalStatus = "PENDING";
      let lastError = null;

      for (let i = 0; i < BACKOFF_DELAYS.length; i++) {
        if (isCancelledRef.current) return;

        try {
          const res = await paymentService.verifyPayment({
            bookingId,
            merchantTxnId,
          });

          finalStatus = res.status;

          if (res.status === "SUCCESS") {
            verifiedSuccess = true;
            break;
          } else if (res.status === "FAILED") {
            break;
          } else {
            // Still PENDING, poll with exponential delay
            setStatusNote(
              `Awaiting final confirmation from bank (attempt ${i + 1}/${BACKOFF_DELAYS.length})...`
            );
            await new Promise((r) => setTimeout(r, BACKOFF_DELAYS[i]));
          }
        } catch (err) {
          lastError = err;
          if (i < BACKOFF_DELAYS.length - 1) {
            await new Promise((r) => setTimeout(r, BACKOFF_DELAYS[i]));
          }
        }
      }

      if (isCancelledRef.current) return;

      if (verifiedSuccess) {
        setStep(3);
        setStatusNote("Payment confirmed! Generating your bus ticket...");
        await new Promise((resolve) => setTimeout(resolve, 800));

        localStorage.removeItem("aibus_pending_payment");
        navigate(`/booking-success?bookingId=${bookingId}`, { replace: true });
      } else if (finalStatus === "FAILED") {
        localStorage.removeItem("aibus_pending_payment");
        setIsVerifying(false);
        setErrorMessage(
          "Payment was declined or cancelled by the bank. If money was debited, it will be automatically refunded within 5-7 business days."
        );
      } else {
        // Still pending after backoff
        setIsVerifying(false);
        setErrorMessage(
          lastError?.message ||
            "Payment confirmation is taking longer than expected with your bank. If the amount was debited, your ticket will be confirmed shortly or refunded automatically."
        );
      }
    } catch (err) {
      if (isCancelledRef.current) return;
      setIsVerifying(false);
      setErrorMessage(
        err.message ||
          "Payment could not be verified. If amount was debited, it will be refunded automatically."
      );
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    executeVerification();
    return () => {
      isCancelledRef.current = true;
    };
  }, [executeVerification]);

  return (
    <main className="payment-result-page">
      <div className="payment-result-container">
        {/* Step 4 Stepper */}
        <BookingStepper currentStep={4} />

        <div className="payment-result-card">
          {isVerifying ? (
            /* Active Verification View */
            <div className="verifying-state-box">
              <div className="verifying-spinner-wrap">
                <div className="verifying-spinner" />
                <CreditCard size={28} className="spinner-center-icon" />
              </div>

              <h1 className="payment-result-title">Verifying Payment</h1>
              <p className="payment-result-desc">{statusNote}</p>

              {/* Progress Stepper List */}
              <div className="payment-verification-steps">
                <div className={`step-item ${step >= 1 ? "completed" : "pending"}`}>
                  <div className="step-item-icon">
                    {step >= 1 ? <CheckCircle2 size={18} /> : <div className="step-dot" />}
                  </div>
                  <div className="step-item-content">
                    <span className="step-name">Payment Gateway Handshake</span>
                    <span className="step-desc">PhonePe transaction session initiated</span>
                  </div>
                </div>

                <div className="step-divider" />

                <div className={`step-item ${step >= 2 ? "completed" : "pending"}`}>
                  <div className="step-item-icon">
                    {step >= 2 ? <CheckCircle2 size={18} /> : <div className="step-dot" />}
                  </div>
                  <div className="step-item-content">
                    <span className="step-name">Bank & Settlement Verification</span>
                    <span className="step-desc">Validating signature and payment status</span>
                  </div>
                </div>

                <div className="step-divider" />

                <div className={`step-item ${step >= 3 ? "completed" : "pending"}`}>
                  <div className="step-item-icon">
                    {step >= 3 ? <CheckCircle2 size={18} /> : <div className="step-dot" />}
                  </div>
                  <div className="step-item-content">
                    <span className="step-name">Issuing Confirmed Ticket</span>
                    <span className="step-desc">Generating official PNR and ticket number</span>
                  </div>
                </div>
              </div>

              <div className="verifying-footer-note">
                <ShieldCheck size={16} className="note-shield" />
                <span>Please do not close or refresh this window while we verify your transaction.</span>
              </div>
            </div>
          ) : (
            /* Failed / Pending Alert View */
            <div className="result-alert-box">
              <div className="result-icon-circle warning">
                <AlertCircle size={44} />
              </div>

              <h1 className="payment-result-title">Payment Verification Notice</h1>
              <p className="payment-result-desc">{errorMessage}</p>

              <div className="result-guarantee-card">
                <ShieldCheck size={20} className="guarantee-shield" />
                <div className="guarantee-text">
                  <strong>Zero-Risk Payment Protection</strong>
                  <span>
                    If any money was debited from your bank account or UPI handle, our automated reconciliation
                    engine will ensure your ticket is confirmed or issue a 100% full refund to the original source.
                  </span>
                </div>
              </div>

              <div className="result-actions-group">
                <button
                  type="button"
                  className="result-btn primary"
                  onClick={() => executeVerification()}
                >
                  <RefreshCw size={18} />
                  <span>Retry Verification</span>
                </button>

                <button
                  type="button"
                  className="result-btn secondary"
                  onClick={() => navigate("/my-bookings")}
                >
                  <Ticket size={18} />
                  <span>Check My Bookings</span>
                </button>

                <button
                  type="button"
                  className="result-btn text"
                  onClick={() => navigate("/")}
                >
                  <Home size={16} />
                  <span>Return to Home</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default PaymentResult;
