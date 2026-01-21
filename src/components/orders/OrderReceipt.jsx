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

const OrderReceipt = () => {
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
      <div className="w-full h-full flex justify-center items-center">
        <Spin tip="Loading" size="large">
          <div className="p-10 bg-gray-100 rounded" />
        </Spin>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <p className="text-red-500">No order data found</p>
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
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* Header with navigation and action buttons */}
      <div className="flex justify-between items-center mb-4 no-print">
        <button
          onClick={() => navigator(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <IoArrowBackCircle className="mr-2" size={24} />
          Back
        </button>
        <div className="flex space-x-2">
          <button
            onClick={() =>
              handleDownload(
                receiptRef,
                "jpg",
                "reciept",
                data?.data?.order_no || id
              )
            }
            className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            <FaDownload className="mr-2" />
            Download
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            <FaPrint className="mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Receipt Content */}
      <div
        ref={receiptRef}
        id="receipt-print"
        className="bg-white px-5 rounded-lg shadow-md print:m-0 print:shadow-none max-w-md text-xs mx-auto w-[58mm]"
      >
        {/* Company Logo and Header */}
        <div className="text-center mb-6 border-b pb-4">
          <div className="flex justify-center mb-2">
            {profileData?.data?.image && !logoError ? (
              <img
                src={logoLoaded}
                className="h-16 w-16 object-fit rounded-full"
                alt=""
              />
            ) : (
              <div className="h-16 w-16 flex items-center justify-center bg-gray-200 rounded">
                <span className="text-gray-500 text-sm">No Logo</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold">
            {profileData?.data?.profile_name || "Company Name"}
          </h1>
          <p className="text-black">
            #123 Business Street, Pnom Penh, Cambodia
          </p>
          <p className="text-black">
            Phone: {profileData?.data?.telephone} | Email: info@company.com
          </p>
          <div className="mt-4">
            <h2 className="text-xl font-semibold">ORDER RECEIPT</h2>
            <p className="text-black">Thank you for your purchase!</p>
          </div>
        </div>

        {/* Order Information */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Order Number:</span>
            <span>{order.order_no}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Order Date:</span>
            <span>{formatDate(order.order_date)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Payment Method:</span>
            <span className="capitalize">{order.order_payment_method}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Payment Status:</span>
            <span
              className={`capitalize ${order.order_payment_status === "paid"
                ? "text-green-600  print:text-black"
                : "text-red-600 print:text-black"
                }`}
            >
              {order.order_payment_status}
            </span>
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-6 border-t pt-4">
          <h2 className="font-bold mb-2">CUSTOMER INFORMATION</h2>
          <div className="mb-1">
            <span className="font-semibold">Phone:</span> {order.order_tel}
          </div>
          <div>
            <span className="font-semibold">Address:</span>{" "}
            {order.order_address}
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6 border-t pt-4">
          <h2 className="font-bold mb-3">ORDER ITEMS</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-2">Item</th>
                <th className="text-right pb-2">Qty</th>
                <th className="text-right pb-2">Price</th>
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">
                    <div>{item.item_name}</div>
                    <div className=" text-black">
                      {item.size_name && `Size: ${item.size_name}`}
                      {/* {item.color_pick && ` | Color: ${item.color_pick}`} */}
                    </div>
                    {/* <div className=" text-black">Code: {item.item_code}</div> */}
                  </td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2">${parseFloat(item.price).toFixed(2)}</td>
                  <td className="text-right py-2">
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div className="border-t pt-4">
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Subtotal:</span>
            <span>${parseFloat(order.order_subtotal).toFixed(2)}</span>
          </div>
          {order.order_discount > 0 && (
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Discount ($):</span>
              <span className="text-red-600">
                -$
                {parseFloat(order.order_discount).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Delivery Fee:</span>
            <span>${parseFloat(order.delivery_fee).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
            <span>TOTAL:</span>
            <span>${parseFloat(order.order_total).toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-4 border-t text-black text-sm">
          <p>For questions about this order, please contact us</p>
          <p className="mt-1">Thank you for your business!</p>
          <p className="mt-2 text-xs">Receipt ID: {order.order_no}</p>
        </div>
      </div>
    </div>
  );
};

export default OrderReceipt;
