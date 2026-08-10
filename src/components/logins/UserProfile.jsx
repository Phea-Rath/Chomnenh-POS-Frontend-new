import React, { useEffect, useState } from "react";
import {
  FiEdit2,
  FiSave,
  FiX,
  FiPhone,
  FiCalendar,
  FiClock,
  FiKey,
  FiUpload,
  FiMapPin,
  FiUser,
  FiCheck,
  FiShield,
  FiActivity,
  FiCopy,
  FiRefreshCw,
  FiExternalLink,
} from "react-icons/fi";
import { PiBuildingsLight, PiQrCodeLight } from "react-icons/pi";
import { LiaTelegram } from "react-icons/lia";
import { IoSparklesOutline } from "react-icons/io5";
import { BsCheckCircleFill } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Progress, Tooltip } from "antd";

import { useGetUserProfileQuery } from "@/features/auth/usersSlice";
import {
  useUpdateAddressMutation,
  useUpdateImageMutation,
  useUpdateNameMutation,
  useUpdateNumberPhoneMutation,
  useUpdateQrCodeMutation,
  useUpdateTelegramServiceMutation,
} from "@/features/auth/userProfileSlice";
import { useOutletsContext } from "../../layouts/Management";
import { getToken } from '@/utils/tokenStore';

const UserProfile = () => {
  const { t } = useTranslation();
  const { darkMode, setLoading } = useOutletsContext();
  const { id } = useParams();
  const token = getToken();

  const [viewImage, setViewImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [viewQr, setViewQr] = useState("");
  const [qrFile, setQrFile] = useState(null);

  const { data: profileData, refetch, isFetching } = useGetUserProfileQuery({ id, token });

  const [updateImage] = useUpdateImageMutation();
  const [updateTelegramService] = useUpdateTelegramServiceMutation();
  const [updateQrCode] = useUpdateQrCodeMutation();
  const [updateNumberPhone] = useUpdateNumberPhoneMutation();
  const [updateName] = useUpdateNameMutation();
  const [updateAddress] = useUpdateAddressMutation();

  const [data, setData] = useState(null);
  const [editing, setEditing] = useState({
    profile_name: false,
    telephone: false,
    address: false,
    image: false,
    telegram_service: false,
    qr_code: false,
  });

  const [tempData, setTempData] = useState({
    profile_name: "",
    telephone: "",
    address: "",
    bot_token: "",
    chat_id: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'subscription' | 'telegram'

  useEffect(() => {
    if (profileData?.data) {
      const p = profileData.data;
      setData(p);
      setViewImage(p.image || "");
      setViewQr(p.qr_code || "");
      setTempData({
        profile_name: p.profile_name || "",
        telephone: p.telephone || "",
        address: p.address || "",
        bot_token: p.bot_token || "",
        chat_id: p.chat_id || "",
      });
    }
  }, [profileData]);

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const calcDaysRemaining = (end) => {
    if (!end) return 0;
    const diff = Math.ceil((new Date(end) - new Date()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const calcProgress = () => {
    if (!data?.start_date || !data?.end_date) return 0;
    const total = new Date(data.end_date) - new Date(data.start_date);
    const elapsed = new Date() - new Date(data.start_date);
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const getSubStatus = () => {
    const d = calcDaysRemaining(data?.end_date);
    if (d <= 0)
      return {
        text: t("subscriptionExpired") || "Expired",
        color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        badge: "bg-red-500",
      };
    if (d <= 7)
      return {
        text: t("subscriptionExpiringSoonLabel") || "Expiring Soon",
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        badge: "bg-amber-500",
      };
    return {
      text: t("subscriptionActive") || "Active Plan",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      badge: "bg-emerald-500",
    };
  };

  const handleEdit = (field) => setEditing((prev) => ({ ...prev, [field]: true }));

  const handleCancel = (field) => {
    setEditing((prev) => ({ ...prev, [field]: false }));
    setTempData((prev) => ({
      ...prev,
      profile_name: data?.profile_name || "",
      telephone: data?.telephone || "",
      address: data?.address || "",
      bot_token: data?.bot_token || "",
      chat_id: data?.chat_id || "",
    }));
    if (field === "image") setViewImage(data?.image || "");
    if (field === "qr_code") setViewQr(data?.qr_code || "");
  };

  const handleSave = async (field) => {
    setIsSaving(true);
    if (setLoading) setLoading(true);
    try {
      let response;
      if (field === "image") {
        const fd = new FormData();
        fd.append("image", imageFile);
        response = await updateImage({ id, itemData: fd, path: "/profile/image", token });
      } else if (field === "qr_code") {
        const fd = new FormData();
        fd.append("qr_code", qrFile);
        response = await updateQrCode({ id, itemData: fd, path: "/profile/qr_code", token });
      } else if (field === "profile_name") {
        response = await updateName({
          id,
          itemData: { profile_name: tempData.profile_name },
          path: "/profile/name",
          token,
        });
      } else if (field === "telegram_service") {
        response = await updateTelegramService({
          id,
          itemData: { bot_token: tempData.bot_token, chat_id: tempData.chat_id },
          path: "/profile/telegram_service",
          token,
        });
      } else if (field === "telephone") {
        response = await updateNumberPhone({
          id,
          itemData: { number_phone: tempData.telephone },
          path: "/profile/number_phone",
          token,
        });
      } else if (field === "address") {
        response = await updateAddress({
          id,
          itemData: { address: tempData.address },
          path: "/profile/address",
          token,
        });
      }

      if (response?.data?.status === 200 || response?.data?.success) {
        await refetch();
        setEditing((prev) => ({ ...prev, [field]: false }));
        toast.success(response.data.message || `${field.replace("_", " ")} updated successfully!`);
        if (field === "image") setImageFile(null);
        if (field === "qr_code") setQrFile(null);
      } else {
        toast.error(response?.data?.message || `Failed to update ${field}`);
      }
    } catch (err) {
      toast.error(err.message || `Error updating ${field}`);
    } finally {
      setIsSaving(false);
      if (setLoading) setLoading(false);
    }
  };

  const handleImageUpload = (e, field = "image") => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image size exceeds 3MB");
      return;
    }
    if (!["image/jpeg", "image/jpg", "image/png", "image/gif"].includes(file.type)) {
      toast.error("Invalid image format");
      return;
    }
    if (field === "image") {
      setImageFile(file);
      setViewImage(URL.createObjectURL(file));
      setEditing((prev) => ({ ...prev, image: true }));
    } else {
      setQrFile(file);
      setViewQr(URL.createObjectURL(file));
      setEditing((prev) => ({ ...prev, qr_code: true }));
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.info(`Copied ${label} to clipboard!`);
  };

  const daysRemaining = calcDaysRemaining(data?.end_date);
  const subStatus = getSubStatus();

  return (
    <div className="min-h-screen pb-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* ════════════════════════════════════════════════════════════ */}
      {/* 1. HERO HEADER COVER BANNER                                */}
      {/* ════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 shadow-sm"
      >
        {/* Cover Background Gradient */}
        <div className="h-44 sm:h-52 w-full bg-gradient-to-br from-slate-600/30 via-slate-600/40 to-gray-600/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/30" />
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-10 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Header Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              title="Refresh Data"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <IoSparklesOutline className="text-yellow-300" />
              <span>ID: #{data?.id || id}</span>
            </div>
          </div>
        </div>

        {/* Profile Info Row (Overlapping Header) */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
          {/* Avatar & Title */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            {/* Avatar container */}
            <div className="relative group">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl border-4 border-white dark:border-gray-800 shadow-2xl overflow-hidden bg-gradient-to-br from-cyan-50 to-indigo-100 dark:from-gray-700 dark:to-gray-900 relative">
                {viewImage ? (
                  <img src={viewImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-extrabold text-cyan-600 dark:text-cyan-400">
                    {data?.profile_name?.[0]?.toUpperCase() || "P"}
                  </div>
                )}

                {/* Upload Overlay */}
                <label
                  htmlFor="hero-profile-upload"
                  className="absolute inset-0 bg-black/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer gap-1"
                >
                  <FiUpload className="w-6 h-6" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Change Logo</span>
                </label>
                <input
                  type="file"
                  id="hero-profile-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "image")}
                />
              </div>

              {/* Status Indicator */}
              <span
                className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 ${subStatus.badge} shadow-md`}
                title={subStatus.text}
              />
            </div>

            {/* Profile Title & Subtitle */}
            <div className="mb-1 space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {data?.profile_name || "Company Store"}
                </h1>
                <BsCheckCircleFill className="text-cyan-500 w-5 h-5" title="Verified Account" />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                <FiMapPin className="text-cyan-500" />
                {data?.address || "Address not provided"}
              </p>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-1">
            <span
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold border backdrop-blur-xs flex items-center gap-1.5 ${subStatus.color}`}
            >
              <FiShield className="w-3.5 h-3.5" />
              {subStatus.text}
            </span>
            <span className="px-3 py-1.5 rounded-2xl text-xs font-bold bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300 border border-cyan-100 dark:border-cyan-800/40 flex items-center gap-1.5">
              <FiCalendar className="w-3.5 h-3.5" />
              {daysRemaining} Days Left
            </span>
          </div>
        </div>

        {/* Floating Save/Cancel bar for Image edit */}
        <AnimatePresence>
          {editing.image && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-cyan-50 dark:bg-cyan-950/40 border-t border-cyan-100 dark:border-cyan-900/50 px-6 py-3 flex items-center justify-between"
            >
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                <FiUpload className="w-4 h-4 animate-bounce" /> New profile image selected! Ready to save.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCancel("image")}
                  className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave("image")}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 text-white font-bold text-xs shadow hover:bg-cyan-700 transition flex items-center gap-1 disabled:opacity-50"
                >
                  <FiSave className="w-3.5 h-3.5" /> Save Photo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* 2. MAIN CONTENT GRID: LEFT SUMMARY & RIGHT DETAILS          */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN: QUICK SUMMARY & BANK QR ── */}
        <div className="lg:col-span-1 space-y-6">
          {/* Company Contact & Address Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-3xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/60">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PiBuildingsLight className="text-cyan-500 w-5 h-5" />
                {t("companyInformation") || "Company Info"}
              </h3>
            </div>

            {/* Profile Name Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>{t("fullName") || "Store / Company Name"}</span>
                {!editing.profile_name && (
                  <button
                    onClick={() => handleEdit("profile_name")}
                    className="text-cyan-500 hover:text-cyan-600 p-1 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {editing.profile_name ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={tempData.profile_name}
                    onChange={(e) => setTempData({ ...tempData, profile_name: e.target.value })}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    onClick={() => handleSave("profile_name")}
                    disabled={isSaving}
                    className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                  >
                    <FiCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCancel("profile_name")}
                    className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 transition"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                  {data?.profile_name || "—"}
                </p>
              )}
            </div>

            {/* Phone Number Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <FiPhone className="w-3 h-3 text-cyan-500" /> {t("phoneNumber") || "Contact Phone"}
                </span>
                {!editing.telephone && (
                  <button
                    onClick={() => handleEdit("telephone")}
                    className="text-cyan-500 hover:text-cyan-600 p-1 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {editing.telephone ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="tel"
                    value={tempData.telephone}
                    onChange={(e) => setTempData({ ...tempData, telephone: e.target.value })}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    onClick={() => handleSave("telephone")}
                    disabled={isSaving}
                    className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                  >
                    <FiCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCancel("telephone")}
                    className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 transition"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-sm font-extrabold text-gray-900 dark:text-white tabular-nums">
                  {data?.telephone || t("notProvided") || "Not set"}
                </p>
              )}
            </div>

            {/* Address Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <FiMapPin className="w-3 h-3 text-cyan-500" /> {t("address") || "Location Address"}
                </span>
                {!editing.address && (
                  <button
                    onClick={() => handleEdit("address")}
                    className="text-cyan-500 hover:text-cyan-600 p-1 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {editing.address ? (
                <div className="flex items-center gap-2 pt-1">
                  <textarea
                    rows={2}
                    value={tempData.address}
                    onChange={(e) => setTempData({ ...tempData, address: e.target.value })}
                    className="flex-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleSave("address")}
                      disabled={isSaving}
                      className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCancel("address")}
                      className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 transition"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-relaxed">
                  {data?.address || "Not provided"}
                </p>
              )}
            </div>
          </motion.div>

          {/* Payment Bank QR Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/60">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PiQrCodeLight className="text-cyan-500 w-5 h-5" />
                {t("bankQrCode") || "Payment Bank QR Code"}
              </h3>
              {!editing.qr_code ? (
                <button
                  onClick={() => handleEdit("qr_code")}
                  className="text-xs text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1"
                >
                  <FiEdit2 className="w-3 h-3" /> Edit QR
                </button>
              ) : (
                <button
                  onClick={() => handleCancel("qr_code")}
                  className="text-xs text-gray-400 font-bold hover:underline"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-dashed border-gray-200 dark:border-gray-700 relative group">
              <div className="w-40 h-40 rounded-xl overflow-hidden bg-white p-2 border border-gray-100 shadow-inner flex items-center justify-center">
                {viewQr ? (
                  <img src={viewQr} alt="Payment QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center p-3 text-gray-400 space-y-1">
                    <PiQrCodeLight className="w-10 h-10 mx-auto text-gray-300" />
                    <p className="text-[11px] font-medium">{t("noQr") || "No QR Code Uploaded"}</p>
                  </div>
                )}
              </div>

              {editing.qr_code && (
                <div className="mt-4 w-full space-y-2">
                  <label
                    htmlFor="qr-file-input"
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-cyan-100 transition"
                  >
                    <FiUpload className="w-4 h-4" /> Upload New QR Image
                  </label>
                  <input
                    id="qr-file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "qr_code")}
                  />
                  <button
                    onClick={() => handleSave("qr_code")}
                    disabled={isSaving}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <FiSave className="w-4 h-4" /> Save Bank QR Code
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Account Metadata Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-6 rounded-3xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-3 text-xs"
          >
            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] pb-2 border-b border-gray-100 dark:border-gray-700/60 flex items-center gap-2">
              <FiShield className="text-cyan-500" /> Account Audit Metadata
            </h4>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500 dark:text-gray-400">Created At</span>
              <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{formatDate(data?.created_at)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500 dark:text-gray-400">Last Updated</span>
              <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{formatDate(data?.updated_at)}</span>
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT COLUMN: SUBSCRIPTION & INTEGRATIONS ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Status & Progress Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-6 rounded-3xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700/60">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiActivity className="text-cyan-500 w-5 h-5" />
                  {t("subscriptionDetails") || "Subscription Plan & License"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Track license period, remaining days, and validity dates.
                </p>
              </div>
              <span className={`self-start sm:self-center px-3 py-1 rounded-xl text-xs font-extrabold border ${subStatus.color}`}>
                {subStatus.text}
              </span>
            </div>

            {/* Subscription Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400">
                <span>{t("subscriptionTimeline") || "License Timeline Progress"}</span>
                <span className="text-cyan-600 dark:text-cyan-400">{calcProgress().toFixed(1)}% Completed</span>
              </div>
              <Progress
                percent={calcProgress()}
                strokeColor={{ "0%": "#3b82f6", "100%": "#8b5cf6" }}
                strokeWidth={10}
                showInfo={false}
                className="m-0"
              />
            </div>

            {/* Grid Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/40 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  {t("startDate") || "Start Date"}
                </span>
                <span className="text-xs font-extrabold text-gray-900 dark:text-white mt-2">
                  {formatDate(data?.start_date)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  {t("endDate") || "End Date"}
                </span>
                <span className="text-xs font-extrabold text-gray-900 dark:text-white mt-2">
                  {formatDate(data?.end_date)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t("termDuration") || "Term Plan"}
                </span>
                <span className="text-xs font-extrabold text-gray-900 dark:text-white mt-2">
                  {data?.term || 0} {t("months") || "Months"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {t("daysRemaining") || "Remaining"}
                </span>
                <span className="text-xs font-extrabold text-gray-900 dark:text-white mt-2 tabular-nums">
                  {daysRemaining} Days
                </span>
              </div>
            </div>

            {/* Expiration Alert Warning */}
            {daysRemaining <= 30 && daysRemaining > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-center gap-3">
                <FiCalendar className="w-6 h-6 flex-shrink-0 text-amber-500" />
                <div className="text-xs">
                  <p className="font-bold">{t("subscriptionExpiringSoon") || "License Expiring Soon"}</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    Your store license will expire in {daysRemaining} days. Please contact support to renew your subscription.
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Telegram Service Integration Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700/60">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <LiaTelegram className="text-cyan-500 w-6 h-6" />
                  {t("telegramService") || "Telegram Bot Notification Service"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Configure Bot Token & Chat ID for instant sale notifications.
                </p>
              </div>

              {!editing.telegram_service ? (
                <button
                  onClick={() => handleEdit("telegram_service")}
                  className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300 font-bold text-xs hover:bg-cyan-100 transition flex items-center gap-1"
                >
                  <FiEdit2 className="w-3.5 h-3.5" /> Edit Bot
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCancel("telegram_service")}
                    className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-xs hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave("telegram_service")}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow hover:bg-emerald-600 transition flex items-center gap-1 disabled:opacity-50"
                  >
                    <FiSave className="w-3.5 h-3.5" /> Save Bot
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Bot Token Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  {t("botToken") || "Telegram Bot Token"}
                </label>
                {editing.telegram_service ? (
                  <input
                    type="text"
                    value={tempData.bot_token}
                    onChange={(e) => setTempData({ ...tempData, bot_token: e.target.value })}
                    placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-mono text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
                    <span className="font-mono text-xs text-gray-800 dark:text-gray-200 truncate max-w-[80%]">
                      {data?.bot_token || t("notProvided") || "Not Configured"}
                    </span>
                    {data?.bot_token && (
                      <button
                        onClick={() => copyToClipboard(data.bot_token, "Bot Token")}
                        className="text-gray-400 hover:text-cyan-500 transition p-1"
                        title="Copy Token"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Chat ID Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  {t("chatId") || "Telegram Chat ID / Group ID"}
                </label>
                {editing.telegram_service ? (
                  <input
                    type="text"
                    value={tempData.chat_id}
                    onChange={(e) => setTempData({ ...tempData, chat_id: e.target.value })}
                    placeholder="e.g. -100123456789 or 987654321"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-mono text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
                    <span className="font-mono text-xs text-gray-800 dark:text-gray-200 truncate max-w-[80%]">
                      {data?.chat_id || t("notProvided") || "Not Configured"}
                    </span>
                    {data?.chat_id && (
                      <button
                        onClick={() => copyToClipboard(data.chat_id, "Chat ID")}
                        className="text-gray-400 hover:text-cyan-500 transition p-1"
                        title="Copy Chat ID"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;