import React, { useState, useEffect, useRef } from "react";
import { Modal, Typography } from "antd";
import { QRCodeCanvas } from "qrcode.react";
import { LuX, LuDownload, LuSend, LuLoader } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import bakongLogo from "../assets/bakong.png";
import * as qrService from "../services/qrPaymentService";
import handleDownload from "../services/imageDowload";
import api from "../services/api";
import { currencyFormat } from "../services/serviceFunction";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { FiAlertCircle } from "react-icons/fi";
import { BiCheckCircle } from "react-icons/bi";

const { Text } = Typography;

const BANK_MAPPING = {
    abaa: "ABA Bank",
    acld: "ACLEDA Bank",
    canadia: "Canadia Bank",
    wing: "Wing Bank",
    ftb: "FTB Bank",
    sathapana: "Sathapana Bank",
    vattanak: "Vattanac Bank",
    jtrust: "J Trust Royal Bank",
    bkrt: "Bakong",
};

const QrPaymentModal = ({ open, onClose, orderData, exchangeRate, token, onSuccess }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [qrValue, setQrValue] = useState("");
    const [md5Hash, setMd5Hash] = useState("");
    const [countdown, setCountdown] = useState(300);
    const [status, setStatus] = useState("idle"); // idle, loading, waiting, paid, expired, error
    const [saveLoading, setSaveLoading] = useState(false);

    const qrRef = useRef();
    const timerRef = useRef();
    const verifyRef = useRef();

    const clearTimers = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (verifyRef.current) clearInterval(verifyRef.current);
    };

    useEffect(() => {
        if (open) {
            handleGetQr();
        } else {
            clearTimers();
            setStatus("idle");
            setCountdown(300);
        }
        return () => clearTimers();
    }, [open]);

    const handleGetQr = async () => {
        try {
            setStatus("loading");
            const rawAmount = orderData.order_payment_status === "paid" ? orderData.order_total : orderData.payment;
            const rate = exchangeRate?.usd_to_khr || null;
            const amount = rate ? Math.round(rawAmount * rate) : rawAmount;
            const currency = rate ? "KHR" : "USD";

            const data = await qrService.fetchQrCode(token, amount, currency);
            if (data?.qr && data?.md5) {
                setQrValue(data.qr);
                setMd5Hash(data.md5);
                setStatus("waiting");
                startCountdown();
                startVerification(data.md5);
            } else {
                throw new Error("Invalid QR data received");
            }
        } catch (error) {
            setStatus("error");
            toast.error(error.message || "Failed to generate QR code");
        }
    };

    const startCountdown = () => {
        setCountdown(300);
        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearTimers();
                    setStatus("expired");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const startVerification = (hash) => {
        verifyRef.current = setInterval(async () => {
            try {
                const isPaid = await qrService.verifyQrPayment(token, hash);
                if (isPaid) {
                    clearTimers();
                    setStatus("paid");
                    handleSaveOrder(hash);
                }
            } catch (error) {
                console.error("Verification error:", error);
            }
        }, 3000);
    };

    const handleSaveOrder = async (transactionId) => {
        setSaveLoading(true);
        try {
            const itemsWithAttributes = orderData.items.map(item => {
                const attributeData = [];
                if (item.attribute_selections) {
                    Object.values(item.attribute_selections).forEach(selection => {
                        if (selection) {
                            attributeData.push({ name_id: selection.attribute_id, value_id: selection.value_id });
                        }
                    });
                }
                return {
                    item_id: item.id,
                    quantity: item.quantity,
                    total_price: item.price / item.quantity,
                    discount: item.discount || 0,
                    item_name: item.name,
                    item_cost: item.cost || 0,
                    item_price: (orderData.sale_type === 'sale' ? item.original_price : item.wholesale_price) || 0,
                    expire_date: dayjs().format("YYYY-MM-DD"),
                    attributes: attributeData
                };
            });

            const payload = {
                ...orderData,
                payment_method: 'bank',
                transection_id: transactionId,
                order_tel: orderData.order_tel || "0",
                online: 0,
                status: 6,
                order_address: orderData.order_address || "unknown",
                order_date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                items: itemsWithAttributes
            };

            const res = await api.post("/retail", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.status === 200) {
                toast.success(t("orderSavedSuccessfully"));
                const orderId = res.data.id || res.data.data?.order_id;
                
                // Clear cart via parent callback
                if (onSuccess) onSuccess(res.data);
                
                // Auto redirect
                const path = orderData.sale_type === "sale" ? `/receipt/${orderId}` : `/invoice/${orderId}`;
                navigate(path);
            } else {
                throw new Error(res.data.message || "Failed to save order");
            }
        } catch (error) {
            toast.error(error.message || "Error saving order after payment");
            setStatus("waiting"); // Let user try again or stay on screen
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDownloadQr = () => {
        handleDownload(qrRef, "png", `KHQR-${dayjs().format("YYYYMMDD-HHmmss")}`);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <Modal
            open={open}
            onCancel={status === "paid" || saveLoading ? undefined : onClose}
            footer={null}
            centered
            width={400}
            styles={{
                content: { padding: 0, overflow: "hidden", borderRadius: "12px" },
                header: { display: "none" }
            }}
        >
            <div className="relative">
                {/* Status Overlay for Auto-Confirm */}
                <AnimatePresence>
                    {(status === "paid" || saveLoading) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-8 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", damping: 12 }}
                                className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500 mb-6"
                            >
                                {saveLoading ? (
                                    <LuLoader size={48} className="animate-spin" />
                                ) : (
                                    <BiCheckCircle size={48} />
                                )}
                            </motion.div>
                            <h3 className="text-xl font-bold dark:text-white mb-2">
                                {saveLoading ? t("processingOrder") : t("paymentVerified")}
                            </h3>
                            <Text className="text-slate-500 dark:text-slate-400">
                                {saveLoading ? t("pleaseWaitWhileWeFinalizeYourOrder") : t("redirectingToReceipt")}
                            </Text>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                        disabled={status === "paid" || saveLoading}
                    >
                        <LuX size={24} />
                    </button>
                    <div className="inline-block bg-white p-2 rounded-xl shadow-lg mb-4">
                        <img src={bakongLogo} alt="Bakong" className="h-8 object-contain" />
                    </div>
                    <h2 className="text-xl font-bold uppercase tracking-wider">{t("scanToPay")}</h2>
                    <div className="text-3xl font-black mt-1">
                        ${currencyFormat(orderData.order_payment_status === "paid" ? orderData.order_total : orderData.payment)}
                    </div>
                    {exchangeRate?.usd_to_khr && (
                        <div className="text-sm font-medium opacity-80 mt-1">
                            ≈ ៛ {currencyFormat((orderData.order_payment_status === "paid" ? orderData.order_total : orderData.payment) * exchangeRate.usd_to_khr)}
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col items-center bg-white dark:bg-slate-800">
                    <div className="relative -mt-16 bg-white dark:bg-slate-700 p-4 rounded-3xl shadow-2xl border-4 border-white dark:border-slate-800">
                        {status === "loading" ? (
                            <div className="w-[240px] h-[240px] flex flex-col items-center justify-center gap-4">
                                <LuLoader size={40} className="animate-spin text-blue-500" />
                                <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("generatingQr")}</Text>
                            </div>
                        ) : status === "error" ? (
                            <div className="w-[240px] h-[240px] flex flex-col items-center justify-center gap-4 text-red-500">
                                <FiAlertCircle size={48} />
                                <Text className="text-xs font-bold text-red-500 uppercase tracking-widest text-center">{t("failedToGenerateQr")}</Text>
                                <button className="mt-2 px-4 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold" onClick={handleGetQr}>{t("retry")}</button>
                            </div>
                        ) : (
                            <div ref={qrRef} className="relative p-2 bg-white rounded-xl">
                                <QRCodeCanvas value={qrValue} size={240} level="H" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-lg shadow-md border border-slate-100">
                                    <img src={bakongLogo} className="w-8 h-8 object-contain" alt="logo" />
                                </div>
                                {status === "expired" && (
                                    <div className="absolute inset-0 bg-white/90 dark:bg-slate-800/90 flex flex-col items-center justify-center p-4 rounded-xl backdrop-blur-sm">
                                        <FiAlertCircle size={40} className="text-orange-500 mb-2" />
                                        <Text className="text-sm font-bold text-slate-800 dark:text-white mb-4">{t("qrExpired")}</Text>
                                        <button className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold" onClick={handleGetQr}>{t("refreshQr")}</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 w-full space-y-4">
                        <div className="flex items-center justify-center gap-2">
                            {status === "waiting" && (
                                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full border border-blue-100 dark:border-blue-800">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                                    <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                        {t("waitingForPayment")} ({formatTime(countdown)})
                                    </Text>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                className="h-11 font-bold rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-white border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors disabled:opacity-50"
                                onClick={handleDownloadQr}
                                disabled={status !== "waiting"}
                            >
                                <LuDownload size={18} />
                                {t("download")}
                            </button>
                            <button
                                className="h-11 font-bold border border-blue-500 text-blue-500 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                onClick={() => {
                                    const rawAmount = orderData.order_payment_status === "paid" ? orderData.order_total : orderData.payment;
                                    const rate = exchangeRate?.usd_to_khr || null;
                                    const amount = rate ? Math.round(rawAmount * rate) : rawAmount;
                                    const currency = rate ? "KHR" : "USD";
                                    qrService.sendQrToTelegram(token, { ref: qrRef, qrValue, amount, currency })
                                        .then(() => toast.success("QR sent to Telegram"))
                                        .catch(() => toast.error("Failed to send QR"));
                                }}
                                disabled={status !== "waiting"}
                            >
                                <LuSend size={18} />
                                {t("telegram")}
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap justify-center gap-4 opacity-30">
                        {Object.entries(BANK_MAPPING).slice(0, 5).map(([key, name]) => (
                            <Text key={key} className="text-[10px] font-black uppercase dark:text-white">{name}</Text>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default QrPaymentModal;
