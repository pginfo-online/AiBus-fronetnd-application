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
import bookingService from "../../services/bookingService";
import BookingStepper from "../../components/BookingStepper/BookingStepper";
import "./PaymentResult.css";

const BACKOFF_DELAYS = [2000, 3000, 4500, 6000, 8000];

function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [statusNote, setStatusNote] = useState("Connecting to payment gateway...");
  const [isVerifying, setIsVerifying] = useState(true);
  const [resultStatus, setResultStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const isCancelledRef = useRef(false);

  const executeVerification = useCallback(async () => {
    isCancelledRef.current = false;
    setIsVerifying(true);
    setResultStatus(null);
    setErrorMessage(null);
    setStep(1);
    setStatusNote("Initiating transaction verification...");

    const checkoutStatus = searchParams.get("status")?.toUpperCase();
    if (checkoutStatus === "FAILED") {
      localStorage.removeItem("aibus_pending_payment");
      setIsVerifying(false);
      setResultStatus("FAILED");
      setErrorMessage(
        searchParams.get("reason") ||
          "Your payment was not completed. Please check your payment method before trying again."
      );
      return;
    }

    // 1. Resolve identifiers: URL params or persistent pending payment storage
    let bookingId = searchParams.get("bookingId");
    let merchantTxnId = searchParams.get("merchantTxnId") || searchParams.get("merchantOrderId");
    let gatewayOrderId = searchParams.get("gatewayOrderId") || searchParams.get("razorpay_order_id") || searchParams.get("orderId");
    let gatewayPaymentId = searchParams.get("gatewayPaymentId") || searchParams.get("razorpay_payment_id");
    let gatewaySignature = searchParams.get("gatewaySignature") || searchParams.get("razorpay_signature");

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
      setStatusNote("Verifying transaction status with Razorpay & banking partner...");

      let verifiedSuccess = false;
      let finalStatus = "PENDING";
      let lastError = null;
      let finalResponse = null;

      for (let i = 0; i < BACKOFF_DELAYS.length; i++) {
        if (isCancelledRef.current) return;

        try {
          const res = await paymentService.verifyPayment({
            bookingId,
            merchantTxnId,
            gatewayOrderId,
            gatewayPaymentId,
            gatewaySignature,
          });

          finalResponse = res;
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
        setStatusNote("Payment confirmed! Your booking is complete.");
        if (finalResponse?.booking) {
          const mapped = bookingService.mapBackendBooking
            ? bookingService.mapBackendBooking(finalResponse.booking)
            : finalResponse.booking;
          bookingService.saveGuestBooking(mapped);
        } else if (bookingId) {
          try {
            await bookingService.getBookingById(bookingId);
          } catch {
            // Ignore prefetch error
          }
        }
        localStorage.removeItem("aibus_pending_payment");
        setResultStatus("SUCCESS");
        setIsVerifying(false);
      } else if (finalStatus === "FAILED") {
        localStorage.removeItem("aibus_pending_payment");
        setIsVerifying(false);
        setResultStatus("FAILED");
        setErrorMessage(
          "Your payment could not be confirmed. Check your bank or payment app before trying again. If you were charged, contact support with your booking details."
        );
      } else {
        // Still pending after backoff
        setIsVerifying(false);
        setResultStatus("PENDING");
        setErrorMessage(
          lastError?.response?.data?.message ||
            "Payment confirmation is taking longer than expected. Check My Bookings before making another payment. If you were charged but the booking is not confirmed, contact support."
        );
      }
    } catch (err) {
      if (isCancelledRef.current) return;
      setIsVerifying(false);
      setResultStatus("PENDING");
      setErrorMessage(
        err.response?.data?.message ||
          "Payment could not be verified. Check My Bookings before making another payment. If you were charged but the booking is not confirmed, contact support."
      );
    }
  }, [searchParams]);

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
                    <span className="step-desc">Razorpay transaction session initiated</span>
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
          ) : resultStatus === "SUCCESS" ? (
            <div className="result-alert-box">
              <div className="result-icon-circle success">
                <CheckCircle2 size={44} />
              </div>
              <h1 className="payment-result-title">Payment Successful!</h1>
              <p className="payment-result-desc">
                Your payment is confirmed and your booking is complete. You can view your ticket and booking
                details in My Bookings.
              </p>
              <div className="result-actions-group">
                <button
                  type="button"
                  className="result-btn primary"
                  onClick={() => navigate("/my-bookings", { replace: true })}
                >
                  <Ticket size={18} />
                  <span>Go to My Bookings</span>
                </button>
                <button
                  type="button"
                  className="result-btn text"
                  onClick={() => navigate("/", { replace: true })}
                >
                  <Home size={16} />
                  <span>Return to Home</span>
                </button>
              </div>
            </div>
          ) : (
            /* Failed / Pending Alert View */
            <div className="result-alert-box">
              <div className="result-icon-circle warning">
                <AlertCircle size={44} />
              </div>

              <h1 className="payment-result-title">
                {resultStatus === "FAILED" ? "Payment Not Successful" : "Payment Status Unconfirmed"}
              </h1>
              <p className="payment-result-desc">{errorMessage}</p>

              {resultStatus !== "FAILED" && (
                <div className="result-guarantee-card">
                  <ShieldCheck size={20} className="guarantee-shield" />
                  <div className="guarantee-text">
                    <strong>What to do next</strong>
                    <span>
                      Check My Bookings before making another payment. If you were charged but the booking is not
                      confirmed, contact support with your booking details.
                    </span>
                  </div>
                </div>
              )}

              <div className="result-actions-group">
                {resultStatus !== "FAILED" && (
                  <button
                    type="button"
                    className="result-btn primary"
                    onClick={() => executeVerification()}
                  >
                    <RefreshCw size={18} />
                    <span>Retry Verification</span>
                  </button>
                )}

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
