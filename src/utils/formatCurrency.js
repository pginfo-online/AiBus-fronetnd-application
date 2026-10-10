/**
 * Formats a numeric amount into Indian Rupee currency format (₹).
 * @param {number|string} amount
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "₹0.00";
  }
  const numericAmount = Number(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numericAmount);
};
