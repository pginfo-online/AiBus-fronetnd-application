import api from "./api";

export const paymentService = {
  /**
   * Create a Payment Intent (PhonePe standard checkout)
   * @param {Object} params
   * @param {string} params.bookingId
   * @param {string} [params.gateway="PHONEPE"]
   * @param {string} [params.redirectUrl]
   * @returns {Promise<{ paymentId: string, merchantTxnId: string, amount: number, currency: string, gateway: string, paymentUrl: string }>}
   */
  createPaymentIntent: async ({ bookingId, gateway = "PHONEPE", redirectUrl }) => {
    const response = await api.post("/api/v1/payments/intent", {
      bookingId,
      gateway,
      ...(redirectUrl ? { redirectUrl } : {}),
    });
    return response.data?.data || response.data;
  },

  /**
   * Verify Payment status with backend and gateway
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
