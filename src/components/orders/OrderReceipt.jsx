import React, { useRef, useState, useEffect } from "react";
import { toPng } from "html-to-image";
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
  const [isImageReady, setIsImageReady] = useState(false);

  // Preload the logo image
  useEffect(() => {
    if (profileData?.data?.image) {
      convertImageToBase64(profileData?.data?.image).then(setLogoLoaded);
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

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="view-page p-4 bg-transparent min-h-screen">
      {/* Header with navigation and action buttons */}
      <div className="flex justify-between items-center mb-4 no-print max-w-md mx-auto">
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
        className="bg-white dark:bg-gray-800 px-5 py-6 rounded-lg shadow-md print:m-0 print:shadow-none max-w-md text-xs mx-auto w-[58mm] border border-gray-100 dark:border-gray-700"
      >
        {/* Company Logo and Header */}
        <div className="text-center mb-6 border-b dark:border-gray-700 pb-4">
          <div className="flex justify-center mb-2">
            {profileData?.data?.image && !logoError ? (
              <img
                src={logoLoaded || profileData?.data?.image}
                className="h-16 w-16 object-fit rounded-full"
                alt=""
              />
            ) : (
              <div className="h-16 w-16 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
                <span className="text-gray-500 dark:text-gray-400 text-[10px]">{t("noImage")}</span>
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold dark:text-white">
            {profileData?.data?.profile_name || t("company")}
          </h1>
          <p className="text-black dark:text-gray-300 mt-1">
            {profileData?.data?.address || "#123 Business Street, Phnom Penh, Cambodia"}
          </p>
          <p className="text-black dark:text-gray-300">
            {t("tel")}: {profileData?.data?.telephone}
          </p>
          <div className="mt-4">
            <h2 className="text-lg font-semibold dark:text-white">{t("orderReceipt")}</h2>
            <p className="text-black dark:text-gray-400 italic">{t("thankYouPurchase")}</p>
          </div>
        </div>

        {/* Order Information */}
        <div className="mb-6 space-y-1 dark:text-gray-200">
          <div className="flex justify-between">
            <span className="font-semibold">{t("orderNumber")}:</span>
            <span>{order.order_no}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">{t("orderDate")}:</span>
            <span className="text-right">{formatDate(order.order_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">{t("paymentMethod")}:</span>
            <span className="capitalize">{t(order.order_payment_method)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">{t("paymentStatus")}:</span>
            <span
              className={`capitalize font-bold ${order.order_payment_status === "paid"
                ? "text-green-600 dark:text-green-400 print:text-black"
                : "text-red-600 dark:text-red-400 print:text-black"
                }`}
            >
              {t(order.order_payment_status)}
            </span>
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-6 border-t dark:border-gray-700 pt-4 dark:text-gray-200">
          <h2 className="font-bold mb-2 uppercase text-[10px] text-gray-500 dark:text-gray-400">{t("customerInformation")}</h2>
          <div className="mb-1">
            <span className="font-semibold">{t("customer")}:</span> {order.customer_name || order.customer?.customer_name || t("walkInCustomer")}
          </div>
          <div className="mb-1">
            <span className="font-semibold">{t("tel")}:</span> {order.order_tel || "N/A"}
          </div>
          <div>
            <span className="font-semibold">{t("address")}:</span>{" "}
            {order.order_address || "N/A"}
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6 border-t dark:border-gray-700 pt-4">
          <h2 className="font-bold mb-3 uppercase text-[10px] text-gray-500 dark:text-gray-400">{t("orderItems")}</h2>
          <table className="w-full dark:text-gray-200">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left pb-2 font-bold">{t("item")}</th>
                <th className="text-right pb-2 font-bold">{t("quantity")}</th>
                <th className="text-right pb-2 font-bold">{t("price")}</th>
                <th className="text-right pb-2 font-bold">{t("total")}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="border-b dark:border-gray-700 last:border-0">
                  <td className="py-2 pr-1">
                    <div className="font-medium">{item.item_name}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {item.size_name && `${t("size") || "Size"}: ${item.size_name}`}
                    </div>
                  </td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2">${parseFloat(item.price).toFixed(2)}</td>
                  <td className="text-right py-2 font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div className="border-t dark:border-gray-700 pt-4 dark:text-gray-200">
          <div className="flex justify-between mb-1">
            <span className="font-semibold">{t("subtotal")}:</span>
            <span>${parseFloat(order.order_subtotal).toFixed(2)}</span>
          </div>
          {order.order_discount > 0 && (
            <div className="flex justify-between mb-1">
              <span className="font-semibold">{t("discount")} ($):</span>
              <span className="text-red-600 dark:text-red-400">
                -$
                {parseFloat(order.order_discount).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between mb-1">
            <span className="font-semibold">{t("deliveryFee")}:</span>
            <span>${parseFloat(order.delivery_fee).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm border-t dark:border-gray-700 pt-2 mt-2 dark:text-white">
            <span className="uppercase">{t("total")}:</span>
            <span>${parseFloat(order.order_total).toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-4 border-t dark:border-gray-700 text-black dark:text-gray-400 text-[10px]">
          <p>{t("forQuestions")}</p>
          <p className="mt-1 font-medium">{t("thankYouBusiness")}</p>
          <p className="mt-2 opacity-70">{t("receiptId")}: {order.order_no}</p>
        </div>
      </div>
    </div>
  );
};

export default OrderReceipt;
