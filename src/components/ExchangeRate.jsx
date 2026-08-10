import React, { useEffect, useState } from "react";
import { HiOutlineRefresh, HiOutlineSave, HiOutlinePencil } from "react-icons/hi";
import {
  useGetExchangeRateByIdQuery,
  useUpdateExchangeRateMutation,
} from "@/features/system/exchangeRatesSlice";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useOutletsContext } from "../layouts/Management";
import { getToken } from '@/utils/tokenStore';

const ExchangeRate = () => {
  const { t, i18n } = useTranslation();
  const { darkMode } = useOutletsContext();
  const token = getToken();
  const proId = localStorage.getItem("profileId");
  const [usdToKhr, setUsdToKhr] = useState();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const isKhmer = i18n.language === "kh";

  const { data, refetch } = useGetExchangeRateByIdQuery({ id: proId, token });
  const [updateExchageRate] = useUpdateExchangeRateMutation();

  useEffect(() => {
    if (data?.data?.usd_to_khr) {
      setUsdToKhr(data.data.usd_to_khr);
      setInputValue(data.data.usd_to_khr);
    }
  }, [data]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const val = Number(inputValue);
      if (!isNaN(val) && val > 0) {
        const res = await updateExchageRate({
          id: proId,
          itemData: { usd_to_khr: val },
          token,
        });

        if (res?.data?.status == 200) {
          refetch();
          setUsdToKhr(val);
          toast.success(t("exchange_rate_updated") || "Change exchange rate successfully!");
          setIsEditing(false);
        }
      } else {
        toast.error(t("invalid_number") || "Please enter a valid positive number");
      }
    } catch (error) {
      toast.error(error.message || error);
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="w-full group"
    >
      <div className={`p-6 rounded-[2rem] border transition-all duration-300 
        ${darkMode ? "bg-gray-800/40 border-gray-700" : "bg-white border-gray-100 shadow-sm"}`}>
        
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Icon Container */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 shrink-0">
            <HiOutlineRefresh className="w-8 h-8" />
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <h3 className={`text-lg font-black uppercase tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
              {isKhmer ? "អត្រាប្តូរប្រាក់ (USD ទៅ KHR)" : "USD to KHR Exchange Rate"}
            </h3>
            
            <div className="flex items-center justify-center md:justify-start gap-4">
              {isEditing ? (
                <div className="flex items-center gap-2 w-full max-w-xs">
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className={`w-full px-4 py-2 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all
                      ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                    placeholder="Enter rate"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    className="p-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors shrink-0"
                    title={t("save") || "Save"}
                  >
                    <HiOutlineSave className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className={`p-2.5 rounded-xl border transition-colors shrink-0
                      ${darkMode ? "border-gray-600 text-gray-400 hover:bg-gray-700" : "border-gray-200 text-gray-500 hover:bg-gray-100"}`}
                  >
                    <span className="text-xs font-bold uppercase">{t("cancel") || "Cancel"}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <p className={`text-2xl font-black ${darkMode ? "text-cyan-400" : "text-cyan-600"}`}>
                    1 USD = <span className="underline decoration-dotted underline-offset-4">{usdToKhr?.toLocaleString()}</span> KHR
                  </p>
                  <button
                    onClick={handleEditClick}
                    className={`p-2 rounded-xl transition-all duration-200
                      ${darkMode ? "hover:bg-gray-700 text-gray-400 hover:text-white" : "hover:bg-cyan-50 text-gray-400 hover:text-cyan-600"}`}
                    aria-label="Edit exchange rate"
                  >
                    <HiOutlinePencil size={20} />
                  </button>
                </div>
              )}
            </div>
            
            {!isEditing && (
              <p className={`text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                {isKhmer ? "កំណត់អត្រាប្តូរប្រាក់សម្រាប់ប្រើប្រាស់ក្នុងប្រព័ន្ធ" : "Set the global exchange rate for system-wide calculations."}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ExchangeRate;
