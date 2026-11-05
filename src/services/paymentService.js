import api from "./api";

export const paymentService = {
  /**
   * Dynamically loads the official Razorpay Checkout SDK if not already loaded on window
   * @returns {Promise<boolean>}
   */
  loadRazorpaySdk: () => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        // Check again in case it loaded while attaching
        if (window.Razorpay) return resolve(true);
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  /**
   * Create a Payment Intent (Razorpay standard checkout)
   * @param {Object} params
   * @param {string} params.bookingId
   * @param {string} [params.gateway="RAZORPAY"]
   * @param {string} [params.redirectUrl]
   * @param {string} [params.paymentMode]
   * @returns {Promise<{ paymentId: string, merchantTxnId: string, amount: number, currency: string, gateway: string, paymentUrl: string, gatewayOrderId: string, sdkPayload: Object }>}
   */
  createPaymentIntent: async ({ bookingId, gateway = "RAZORPAY", redirectUrl, paymentMode }) => {
    const response = await api.post("/api/v1/payments/intent", {
      bookingId,
      gateway,
      ...(redirectUrl ? { redirectUrl } : {}),
      ...(paymentMode ? { paymentMode: paymentMode.toUpperCase() } : {}),
    });
    return response.data?.data || response.data;
  },

  /**
   * Launches Razorpay Standard Checkout modal directly inside the website
   * @param {Object} params
   * @param {Object} params.intent
   * @param {Object} [params.traveller]
   * @param {Function} params.onPaymentSuccess
   * @param {Function} [params.onPaymentFailure]
   * @param {Function} [params.onDismiss]
   */
  openRazorpayCheckout: async ({
    intent,
    traveller,
    onPaymentSuccess,
    onPaymentFailure,
    onDismiss,
  }) => {
    const isLoaded = await paymentService.loadRazorpaySdk();
    if (!isLoaded || !window.Razorpay) {
      if (intent?.paymentUrl) {
        window.location.href = intent.paymentUrl;
        return;
      }
      throw new Error("Razorpay Checkout SDK could not be loaded. Please check your network connection.");
    }

    const keyId =
      intent?.sdkPayload?.key ||
      import.meta.env.VITE_RAZORPAY_KEY_ID ||
      "rzp_live_TWgFvnrInb44VX";

    const mode = (intent.paymentMode || "").toUpperCase();
    const isUpi = mode === "UPI" || !mode || mode === "ALL";

    const options = {
      ...(intent.sdkPayload || {}),
      key: keyId,
      name: "AiBus",
      description: intent?.sdkPayload?.description || `Bus Booking #${intent.bookingNumber || ""}`,
      order_id: intent.gatewayOrderId || intent.sdkPayload?.order_id,
      amount: intent.sdkPayload?.amount || Math.round((intent.amount || 0) * 100),
      currency: intent.currency || "INR",
      prefill: {
        name: traveller?.name || intent.sdkPayload?.prefill?.name || "",
        email: traveller?.email || intent.sdkPayload?.prefill?.email || "",
        contact: traveller?.phone || intent.sdkPayload?.prefill?.contact || "",
      },
      theme: {
        color: "#013C9A",
      },
      // Ensure web browser checkout activates and renders the dynamic UPI QR Code
      upi: {
        flow: isUpi ? "qr" : "qr",
      },
      config: {
        display: {
          blocks: {
            upi_qr: {
              name: "Pay using UPI QR Code",
              instruments: [
                {
                  method: "upi",
                  flows: ["qr"],
                },
              ],
            },
            other: {
              name: "Other Payment Options",
              instruments: [
                {
                  method: "upi",
                  flows: ["collect", "intent"],
                },
                {
                  method: "card",
                },
                {
                  method: "netbanking",
                },
              ],
            },
          },
          sequence: isUpi ? ["block.upi_qr", "block.other"] : ["block.other", "block.upi_qr"],
          preferences: {
            show_default_blocks: true,
          },
        },
      },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          if (onDismiss) onDismiss();
        },
      },
      handler: (response) => {
        if (onPaymentSuccess) {
          onPaymentSuccess({
            ...response,
            merchantTxnId: intent.merchantTxnId,
            bookingId: intent.bookingId,
          });
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      if (onPaymentFailure) {
        onPaymentFailure(response);
      }
    });
    rzp.open();
    return rzp;
  },

  /**
   * Verify Payment status with backend and Razorpay gateway
   * @param {Object} params
   * @param {string} params.bookingId
   * @param {string} params.merchantTxnId
   * @param {string} [params.gatewayOrderId]
   * @param {string} [params.gatewayPaymentId]
   * @param {string} [params.gatewaySignature]
   * @returns {Promise<{ status: 'SUCCESS' | 'FAILED' | 'PENDING', payment: Object, booking: Object }>}
   */
  verifyPayment: async ({
    bookingId,
    merchantTxnId,
    gatewayOrderId,
    gatewayPaymentId,
    gatewaySignature,
  }) => {
    const response = await api.post("/api/v1/payments/verify", {
      bookingId,
      merchantTxnId,
      ...(gatewayOrderId ? { gatewayOrderId } : {}),
      ...(gatewayPaymentId ? { gatewayPaymentId } : {}),
      ...(gatewaySignature ? { gatewaySignature } : {}),
    });
    return response.data?.data || response.data;
  },
};

export default paymentService;
