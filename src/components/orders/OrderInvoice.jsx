import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaDownload, FaPrint } from "react-icons/fa";
import { IoArrowBackCircle } from "react-icons/io5";
import { useReactToPrint } from "react-to-print";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate, useParams } from "react-router";
import { motion } from "framer-motion";
import handleDownload from "../../services/imageDowload";
import { useGetOrderByIdQuery } from "../../../app/Features/ordersSlice";
import { useGetUserProfileQuery } from "../../../app/Features/usersSlice";
import { useTranslation } from "react-i18next";

const OrderInvoice = () => {
  const { t } = useTranslation();
  const navigator = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const profileId = Number(localStorage.getItem("profileId") || localStorage.getItem("prifileId"));
  const invoiceRef = useRef(null);
  const [data, setData] = useState({});

  const { data: invoiceData, isLoading } = useGetOrderByIdQuery({ id, token });
  const { data: profileData } = useGetUserProfileQuery({ id: profileId, token });

  useEffect(() => {
    setData(invoiceData?.data || {});
  }, [invoiceData]);

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    contentRef: invoiceRef,
  });

  const money = (value) => Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formatDate = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const exchangeRate = Number(data?.exchange_rate || 4000);
  const customerName = data?.customer_name || data?.customer?.customer_name || t("walkInCustomer");
  const customerPhone = data?.order_tel || data?.customer?.customer_tel || "N/A";
  const customerAddress = data?.order_address || data?.customer?.customer_address || "N/A";
  const paymentMethod = data?.order_payment_method || "cash";
  const paymentStatus = data?.order_payment_status || (Number(data?.balance || 0) > 0 ? "partial" : "paid");
  const qrValue = useMemo(() => {
    return JSON.stringify({
      order_no: data?.order_no || id,
      customer: customerName,
      total: Number(data?.order_total || 0),
      phone: customerPhone,
    });
  }, [customerName, customerPhone, data?.order_no, data?.order_total, id]);

  const itemRows = Array.isArray(data?.items) ? data.items : [];
  const totals = {
    subtotal: Number(data?.order_subtotal || 0),
    discount: Number(data?.order_discount || 0),
    delivery: Number(data?.delivery_fee || 0),
    tax: Number(data?.order_tax || 0),
    total: Number(data?.order_total || 0),
    paid: Number(data?.payment || 0),
    balance: Number(data?.balance || 0),
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">{t("loadingInvoice")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-page bg-transparent px-4 py-8 min-h-screen">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigator(-1)}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 print:hidden"
        >
          <IoArrowBackCircle className="mr-2" size={24} />
          {t("back")}
        </button>

        <div className="mb-6 flex flex-wrap justify-end gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <FaPrint className="mr-2" /> {t("print")}
          </button>
          <button
            onClick={() => handleDownload(invoiceRef, "pdf", "invoice", data?.order_no || id)}
            className="flex items-center rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            <FaDownload className="mr-2" /> {t("downloadPDF")}
          </button>
          <button
            onClick={() => handleDownload(invoiceRef, "png", "invoice", data?.order_no || id)}
            className="flex items-center rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
          >
            <FaDownload className="mr-2" /> {t("downloadPNG")}
          </button>
          <button
            onClick={() => handleDownload(invoiceRef, "jpg", "invoice", data?.order_no || id)}
            className="flex items-center rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
          >
            <FaDownload className="mr-2" /> {t("downloadJPG")}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            ref={invoiceRef}
            className="mx-auto overflow-hidden rounded-[28px] border border-gray-200 bg-white px-6 py-8 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.35)] dark:border-gray-700 dark:bg-gray-800 print:rounded-none print:border-0 print:shadow-none sm:px-10"
          >
            <div className="mx-auto max-w-4xl">
              <div className="border-b-2 border-gray-800 dark:border-gray-600 pb-7 text-center">
                {profileData?.data?.image ? (
                  <img
                    src={profileData.data.image}
                    alt={profileData?.data?.profile_name || "Business logo"}
                    className="mx-auto mb-3 h-20 w-20 object-contain"
                  />
                ) : null}
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                  {profileData?.data?.profile_name || t("company")}
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                  {profileData?.data?.address || t("address")}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                  {t("tel")}: {profileData?.data?.telephone || "N/A"}
                </p>
                <h2 className="mt-6 text-3xl font-bold tracking-[0.08em] text-gray-700 dark:text-gray-200 uppercase">{t("invoice")}</h2>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-8 text-[15px] leading-7 text-gray-800 dark:text-gray-200 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex gap-3">
                    <span className="min-w-[130px] font-semibold text-gray-600 dark:text-gray-400">{t("invoiceNo")}:</span>
                    <span className="font-medium">{data?.order_no || "N/A"}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="min-w-[130px] font-semibold text-gray-600 dark:text-gray-400">{t("invoiceDate")}:</span>
                    <span>{formatDate(data?.order_date)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-3">
                    <span className="min-w-[130px] font-semibold text-gray-600 dark:text-gray-400">{t("customer")}:</span>
                    <span>{customerName}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="min-w-[130px] font-semibold text-gray-600 dark:text-gray-400">{t("tel")}:</span>
                    <span>{customerPhone}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="min-w-[130px] font-semibold text-gray-600 dark:text-gray-400">{t("address")}:</span>
                    <span>{customerAddress}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="min-w-[130px] font-semibold text-gray-600 dark:text-gray-400">{t("payment")}:</span>
                    <span className="capitalize">{t(paymentMethod)}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="min-w-[130px] font-semibold text-gray-600 dark:text-gray-400">{t("exchangeRate")}:</span>
                    <span>1$ = {money(exchangeRate)} ៛</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 overflow-x-auto">
                <table className="w-full border-collapse text-[15px]">
                  <thead>
                    <tr className="border-b-2 border-gray-700 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                      <th className="px-3 py-3 text-left font-bold text-gray-800 dark:text-gray-100">{t("item")}</th>
                      <th className="px-3 py-3 text-center font-bold text-gray-800 dark:text-gray-100">{t("quantity")}</th>
                      <th className="px-3 py-3 text-right font-bold text-gray-800 dark:text-gray-100">{t("price")}</th>
                      <th className="px-3 py-3 text-right font-bold text-gray-800 dark:text-gray-100">{t("amount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemRows.map((item, index) => {
                      const qty = Number(item.quantity || 0);
                      const price = Number(item.item_price || item.price || 0);
                      const rowTotal = qty * price;

                      return (
                        <tr key={item.id || index} className="border-b border-gray-100 dark:border-gray-700 align-top">
                          <td className="px-3 py-4">
                            <div className="font-semibold text-gray-900 dark:text-white">{item.item_name}</div>
                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {item.item_code || "N/A"}
                              {item.size_name ? ` | ${item.size_name}` : ""}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-center dark:text-gray-200">
                            {qty} {item.unit || ""}
                          </td>
                          <td className="px-3 py-4 text-right dark:text-gray-200">{money(price * exchangeRate)} ៛</td>
                          <td className="px-3 py-4 text-right font-medium dark:text-gray-200">{money(rowTotal * exchangeRate)} ៛</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[180px,1fr]">
                <div className="flex justify-center md:justify-start">
                  <div className="rounded-sm border border-gray-300 dark:border-gray-600 bg-white p-3">
                    {/* <QRCodeCanvas value={qrValue} size={120} level="H" /> */}
                    <img src={profileData?.data?.qr_code} width={200} height={120} alt="" />
                    <p className="mt-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {profileData?.data?.profile_name || t("invoice")}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="w-full max-w-[340px]">
                    <div className="space-y-2 text-[15px] text-gray-700 dark:text-gray-200">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-medium">{t("subtotal")}:</span>
                        <span>{money(totals.subtotal * exchangeRate)} ៛</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-medium">{t("discount")}:</span>
                        <span>- {money(totals.discount * exchangeRate)} ៛</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-medium">{t("deliveryFee")}:</span>
                        <span>+ {money(totals.delivery * exchangeRate)} ៛</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4 border-b border-gray-300 dark:border-gray-600 pb-3">
                        <span className="font-medium">{t("tax")}:</span>
                        <span>+ {money(totals.tax * exchangeRate)} ៛</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4 pt-1 text-lg font-bold text-gray-900 dark:text-white">
                        <span>{t("grandTotal")}:</span>
                        <span>{money(totals.total * exchangeRate)} ៛</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4 text-lg font-bold text-gray-700 dark:text-gray-300">
                        <span>{t("usdTotal")}:</span>
                        <span>$ {money(totals.total)}</span>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-dashed border-gray-300 dark:border-gray-600 pt-4 text-[15px]">
                      <div className="mb-2 flex items-baseline justify-between gap-4 text-green-700 dark:text-green-400">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{t("paid")}:</span>
                        <span className="font-bold">{money(totals.paid * exchangeRate)} ៛</span>
                      </div>
                      <div className="mb-2 flex items-baseline justify-between gap-4 text-gray-900 dark:text-white">
                        <span className="font-semibold">{t("balance")}:</span>
                        <span className="font-bold">{money(totals.balance * exchangeRate)} ៛</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{t("status")}:</span>
                        <span className="font-medium capitalize dark:text-gray-200">{t(paymentStatus)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-16 grid grid-cols-3 gap-8 text-center text-[15px] text-gray-700 dark:text-gray-200">
                <div>
                  <p className="mb-16 font-medium">{t("customer")}</p>
                  <div className="pt-3">
                    <p className="font-semibold">{customerName}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-16 font-medium">{t("verifiedBy")}</p>
                  <div className="mx-auto w-28 border-t border-gray-400 dark:border-gray-600 pt-3">
                    <p className="font-semibold">&nbsp;</p>
                  </div>
                </div>
                <div>
                  <p className="mb-16 font-medium">{t("seller")}</p>
                  <div className="pt-3">
                    <p className="font-semibold">Admin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderInvoice;
