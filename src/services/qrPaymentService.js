import html2canvas from "html2canvas-pro";
import api from "./api";

/**
 * Fetches a KHQR code for a specific amount and currency
 */
export const fetchQrCode = async (token, amount, currency) => {
  const res = await api.get("/get-qrcode", {
    params: { amount, currency },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

/**
 * Verifies if a payment has been completed via Bakong/ABA
 */
export const verifyQrPayment = async (token, md5Hash) => {
  const res = await api.get(`/verify-payment/${md5Hash}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  return (
    res?.data?.status === "PAID" ||
    res?.data?.responseCode === 0 ||
    res?.data?.raw?.responseCode === 0 ||
    res?.data?.raw?.status?.code === 0
  );
};

/**
 * Captures a DOM element (like the QR card) and sends it to Telegram as a photo
 */
export const sendQrToTelegram = async (token, { ref, qrValue, amount, currency }) => {
  if (!ref.current) throw new Error("Reference to element not found");

  // Capture the element as a high-quality PNG
  const canvas = await html2canvas(ref.current, {
    scale: 3,
    useCORS: true,
    backgroundColor: null,
    logging: false
  });
  
  const qrImage = canvas.toDataURL("image/png");

  return api.post("/send-qr-to-telegram", {
    qr_string: qrValue,
    amount,
    currency,
    qr_image: qrImage
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
