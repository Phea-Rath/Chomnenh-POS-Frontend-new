// src/components/OrderInvoice.jsx
import React, { useEffect, useRef, useState } from "react";
import { FaPrint, FaDownload } from "react-icons/fa";
import moment from "moment";
import { useReactToPrint } from "react-to-print";
import handleDownload from "../../services/imageDowload";
import { useGetOrderByIdQuery } from "../../../app/Features/ordersSlice";
import { useGetUserProfileQuery } from "../../../app/Features/usersSlice";
import { useNavigate, useParams } from "react-router";
import { IoArrowBackCircle } from "react-icons/io5";

const OrderInvoice = () => {
  const navigator = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const profileId = localStorage.getItem("prifileId");
  const invoiceRef = useRef();
  const [data, setData] = useState({});
  const { data: invoiceData, isLoading } = useGetOrderByIdQuery({
    id,
    token,
  });
  const { data: profileData } = useGetUserProfileQuery({
    id: profileId,
    token,
  });

  useEffect(() => {
    setData(invoiceData?.data);
  }, [invoiceData]);

  // Handle Print
  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    contentRef: invoiceRef,
  });

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigator(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <IoArrowBackCircle className="mr-2" size={24} />
          Back
        </button>
        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mb-6 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FaPrint className="mr-2" /> Print
          </button>
          <button
            onClick={() =>
              handleDownload(invoiceRef, "pdf", "invoice", data.order_no)
            }
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <FaDownload className="mr-2" /> Download PDF
          </button>
          <button
            onClick={() =>
              handleDownload(invoiceRef, "png", "invoice", data.order_no)
            }
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            <FaDownload className="mr-2" /> Download PNG
          </button>
          <button
            onClick={() =>
              handleDownload(invoiceRef, "jpg", "invoice", data.order_no)
            }
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            <FaDownload className="mr-2" /> Download JPG
          </button>
        </div>

        {/* Invoice Content */}
        <div
          ref={invoiceRef}
          className="bg-white shadow-lg print:shadow-none rounded-lg p-8"
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Invoice</h1>
              <p className="text-gray-600">Order No: {data?.order_no}</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-semibold">Chomnenh POS</h2>
              <p className="text-gray-600">123 Business St, Phnom Penh</p>
              <p className="text-gray-600">contact@company.com</p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {data?.customer_name}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {data?.customer_email || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {data?.order_tel}
                </p>
              </div>
              <div>
                <p>
                  <span className="font-medium">Address:</span>{" "}
                  {data?.order_address}
                </p>
                <p>
                  <span className="font-medium">Order Date:</span>{" "}
                  {moment(data?.order_date).format("MMMM D, YYYY")}
                </p>
                <p>
                  <span className="font-medium">Payment Method:</span>{" "}
                  {data?.order_payment_method}
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left">Item</th>
                    <th className="border p-3 text-left">Category</th>
                    <th className="border p-3 text-left">Size</th>
                    <th className="border p-3 text-right">Quantity</th>
                    <th className="border p-3 text-right">Price</th>
                    <th className="border p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="border p-3">
                        {item.item_name} ({item.item_code})
                      </td>
                      <td className="border p-3">{item.category_name}</td>
                      <td className="border p-3">{item.size_name}</td>
                      <td className="border p-3 text-right">{item.quantity}</td>
                      <td className="border p-3 text-right">
                        ${parseFloat(item.item_price).toFixed(2)}
                      </td>
                      <td className="border p-3 text-right">
                        $
                        {parseFloat(
                          item.quantity * parseFloat(item.item_price)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="flex justify-end">
            <div className="w-1/3">
              <div className="flex justify-between py-2">
                <span className="font-medium">Subtotal:</span>
                <span>${parseFloat(data?.order_subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium">Discount:</span>
                <span>${parseFloat(data?.order_discount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium">Delivery Fee:</span>
                <span>${parseFloat(data?.delivery_fee).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium">Tax:</span>
                <span>${parseFloat(data?.order_tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold border-t">
                <span>Total:</span>
                <span>${parseFloat(data?.order_total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium">Payment:</span>
                <span>${parseFloat(data?.payment).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium">Balance:</span>
                <span>${parseFloat(data?.balance).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderInvoice;
