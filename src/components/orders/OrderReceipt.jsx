import React, { useRef, useState, useEffect } from "react";
import { FaPrint, FaDownload } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import { useGetOrderByIdQuery } from "../../../app/Features/ordersSlice";
import { useNavigate, useParams } from "react-router";
import { Spin } from "antd";
import { IoArrowBackCircle } from "react-icons/io5";
import { useGetUserProfileQuery } from "../../../app/Features/usersSlice";
import handleDownload from "../../services/imageDowload";
import { convertImageToBase64 } from "../../services/serviceFunction";
import { useTranslation } from "react-i18next";

const OrderReceipt = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigator = useNavigate();
  const token = localStorage.getItem("token");
  const profileId = Number(localStorage.getItem("profileId"));
  const receiptRef = useRef();
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { data, isLoading } = useGetOrderByIdQuery({ id, token });
  const { data: profileData } = useGetUserProfileQuery({
    id: profileId,
    token,
  });

  useEffect(() => {
    if (profileData?.data?.qr_code) {
      convertImageToBase64(profileData?.data?.qr_code).then(setLogoLoaded);
    }
  }, [profileData?.data?.image]);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    contentRef: receiptRef,
  });

  if (isLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center py-20">
        <Spin tip={t("loadingDetails")} size="large">
          <div className="p-10 bg-gray-100 dark:bg-gray-800 rounded" />
        </Spin>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="w-full h-full flex justify-center items-center py-20">
        <p className="text-red-500">{t("noOrdersFound")}</p>
      </div>
    );
  }

  const order = data.data;
  const profile = profileData?.data || {};
  const items = order.items || [];
  const subtotal = Number(order.order_subtotal || 0);
  const total = Number(order.order_total || 0);
  const discount = Number(order.order_discount || 0);
  const deliveryFee = Number(order.delivery_fee || 0);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

  return (
    <div className="view-page p-4 bg-transparent min-h-screen">
      <div className="flex justify-between items-center mb-4 no-print max-w-xl mx-auto">
        <button
          onClick={() => navigator(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <IoArrowBackCircle className="mr-2" size={24} />
          {t("back")}
        </button>
        <div className="flex space-x-2">
          <button
            onClick={() =>
              handleDownload(
                receiptRef,
                "jpg",
                "receipt",
                data?.data?.order_no || id
              )
            }
            className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
          >
            <FaDownload className="mr-2" />
            {t("download")}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            <FaPrint className="mr-2" />
            {t("print")}
          </button>
        </div>
      </div>

      {/* Receipt Content */}
      <div
        ref={receiptRef}
        id="receipt-print"
        className="mx-auto max-w-xl rounded-[28px] border border-slate-200 bg-white px-8 py-10 text-slate-900 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.28)] print:m-0 print:max-w-none print:rounded-none print:border-0 print:shadow-none sm:px-10"
      >
        <div className="text-center">
          {profile.image && !logoError && (
            <div className="mb-5 flex justify-center">
              <img
                src={profile.image}
                className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                alt={profile.profile_name || "Company logo"}
                onError={() => setLogoError(true)}
              />
            </div>
          )}
          <h1 className="text-[2.1rem] font-bold tracking-tight text-[#1e88e5]">
            វិក្កយបត្រ
          </h1>
          <p className="mt-1 text-[2rem] font-light uppercase tracking-[0.08em] text-[#1e88e5]">
            Invoice
          </p>
          {profile.profile_name && (
            <p className="mt-3 text-sm font-medium text-slate-600">{profile.profile_name}</p>
          )}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 text-[15px] leading-8 sm:text-[17px]">
          <div>
            <p className="font-semibold text-slate-900">លេខរៀងបញ្ជាទិញ#:</p>
            <p className="text-[1.1em]">{order.order_no || id}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">កាលបរិច្ឆេទ:</p>
            <p className="text-[1.1em]">{formatDate(order.order_date)}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">លេខទូរស័ព្ទ:</p>
            <p className="text-[1.1em]">{order.order_tel || profile.telephone || "N/A"}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">អតិថិជន:</p>
            <p className="text-[1.1em]">{order.customer_name || order.customer?.customer_name || order.order_tel || t("walkInCustomer")}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">ទីតាំង:</p>
            <p className="text-[1.1em]">{order.order_address || profile.address || "N/A"}</p>
          </div>
        </div>

        <div className="my-8 h-px bg-slate-200" />

        <div>
          <table className="w-full border-separate border-spacing-0 text-[15px] sm:text-[16px]">
            <thead>
              <tr className="bg-[#eef6ff] dark:bg-gray-700 text-slate-900">
                <th className="border-b-[3px] border-[#1e88e5] px-3 py-4 text-left text-lg font-semibold">ទំនិញ</th>
                <th className="border-b-[3px] border-[#1e88e5] px-3 py-4 text-center text-lg font-semibold">បរិមាណ</th>
                <th className="border-b-[3px] border-[#1e88e5] px-3 py-4 text-right text-lg font-semibold">តម្លៃ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="border-b border-dashed border-slate-300 px-3 py-5 align-top text-lg">
                    <div className="font-medium uppercase tracking-[0.01em]">{item.item_name}</div>
                    {item.size_name && (
                      <div className="mt-1 text-sm text-slate-500">{t("size")}: {item.size_name}</div>
                    )}
                  </td>
                  <td className="border-b border-dashed border-slate-300 px-3 py-5 text-center align-top text-lg">
                    {item.quantity} {item.scale_name}
                  </td>
                  <td className="border-b border-dashed border-slate-300 px-3 py-5 text-right align-top text-lg">
                    {formatMoney(Number(item.price || 0) * Number(item.quantity || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-0 text-[18px]">
          <div className="flex items-center justify-between border-b-[3px] border-[#1e88e5] px-2 py-4 font-medium">
            <span>សរុបដើម</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between border-b border-dashed border-slate-300 px-2 py-4 font-medium">
              <span>បញ្ចុះតម្លៃ</span>
              <span>-{formatMoney(discount)}</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex items-center justify-between border-b border-dashed border-slate-300 px-2 py-4 font-medium">
              <span>{t("deliveryFee")}</span>
              <span>{formatMoney(deliveryFee)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-b border-dashed border-slate-300 px-2 py-4 text-[20px] font-bold">
            <span>សរុបចុងក្រោយ</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>

        <div className="mt-9 flex justify-center">
          <div className="flex h-[265px] w-[265px] relative items-center justify-center border border-slate-200 bg-white">
            {profile.qr_code && !logoError ? (
              <img
                src={logoLoaded || profile.qr_code}
                className="h-[265px] w-[265px] object-contain"
                alt={profile.profile_name || "Company"}
              />
            ) : (
              <div className="text-center text-sm text-slate-300">
                <div className="mx-auto mb-2 h-16 w-16 rounded-full border border-slate-200" />
                QR / Stamp
              </div>
            )}
          </div>
        </div>

        <div className="mt-7 text-center text-[15px] text-slate-500">
          <p>សូមអរគុណអ្នកទាំងអស់គ្នា!</p>
          <p className="mt-6 text-[16px]">🙏 សូមអរគុណចំពោះការគាំទ្រ!</p>
        </div>
      </div>
    </div>
  );
};

export default OrderReceipt;
