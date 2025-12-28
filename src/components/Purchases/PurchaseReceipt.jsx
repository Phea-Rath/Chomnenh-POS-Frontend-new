import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { FaPrint, FaFileExcel, FaArrowLeft } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";
import api from "../../services/api";

const PurchaseReceipt = () => {
  const { id } = useParams(); // Get purchase_id from URL
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [purchase, setPurchase] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const componentRef = useRef();

  // Fetch purchase and supplier data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch purchase
        const purchaseResponse = await api.get(`/purchase/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const purchaseData = purchaseResponse.data.data;
        setPurchase({
          ...purchaseData,
          sub_total: parseFloat(purchaseData.sub_total),
          tax_rate: parseFloat(purchaseData.tax_rate),
          tax_amount: parseFloat(purchaseData.tax_amount),
          shipping_fee: parseFloat(purchaseData.shipping_fee),
          total_amount: parseFloat(purchaseData.total_amount),
          total_paid: parseFloat(purchaseData.total_paid),
          balance: parseFloat(purchaseData.balance),
          exchange_rate: parseFloat(purchaseData.exchange_rate),
          details: purchaseData.details.map((detail) => ({
            ...detail,
            quantity: parseFloat(detail.quantity),
            unit_price: parseFloat(detail.unit_price),
            subtotal: parseFloat(detail.subtotal),
          })),
          payments: purchaseData.payments.map((payment) => ({
            ...payment,
            amount: parseFloat(payment.amount),
          })),
        });

        // Fetch supplier
        const supplierResponse = await api.get(
          `/suppliers/${purchaseData.supplier_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSupplier(supplierResponse.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Error fetching purchase or supplier data."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token]);

  // Print handler
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    contentRef: componentRef,
  });

  // Excel export handler
  const handleExportExcel = () => {
    if (!purchase || !supplier) return;

    // Prepare data for Excel
    const workbook = XLSX.utils.book_new();

    // Purchase Info Sheet
    const purchaseInfo = [
      ["Purchase Receipt"],
      ["Purchase No", purchase.purchase_no],
      ["Purchase Date", purchase.purchase_date],
      ["Supplier Name", supplier.supplier_name],
      ["Supplier Address", supplier.supplier_address],
      ["Supplier Phone", supplier.supplier_tel || "N/A"],
      ["Supplier Email", supplier.supplier_email || "N/A"],
      ["Sub Total", `$${purchase.sub_total.toFixed(2)}`],
      ["Tax Rate", `${purchase.tax_rate.toFixed(2)}%`],
      ["Tax Amount", `$${purchase.tax_amount.toFixed(2)}`],
      ["Shipping Fee", `$${purchase.shipping_fee.toFixed(2)}`],
      ["Total Amount", `$${purchase.total_amount.toFixed(2)}`],
      ["Total Paid", `$${purchase.total_paid.toFixed(2)}`],
      ["Balance", `$${purchase.balance.toFixed(2)}`],
      [
        "Status",
        purchase.status === 1
          ? "Completed"
          : purchase.status === 0
            ? "Pending"
            : "Cancelled",
      ],
      ["Created At", purchase.created_at],
      ["Updated At", purchase.updated_at],
    ];
    const purchaseSheet = XLSX.utils.aoa_to_sheet(purchaseInfo);
    XLSX.utils.book_append_sheet(workbook, purchaseSheet, "Purchase Info");

    // Items Sheet
    const itemsData = [
      ["Item Name", "Item Code", "Quantity", "Unit Price", "Subtotal"],
      ...purchase.details.map((item) => [
        item.item_name,
        item.item_code,
        item.quantity.toFixed(2),
        `$${item.unit_price.toFixed(2)}`,
        `$${item.subtotal.toFixed(2)}`,
      ]),
    ];
    const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(workbook, itemsSheet, "Items");

    // Payments Sheet
    const paymentsData = [
      ["Amount", "Paid At"],
      ...purchase.payments.map((payment) => [
        `$${payment.amount.toFixed(2)}`,
        payment.paid_at,
      ]),
    ];
    const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentsData);
    XLSX.utils.book_append_sheet(workbook, paymentsSheet, "Payments");

    // Export to Excel
    XLSX.writeFile(workbook, `Purchase_Receipt_${purchase.purchase_no}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            Purchase Receipt #{purchase?.purchase_no || "Loading..."}
          </h1>
          <div className="no-print flex text-sm space-x-4">
            <button
              onClick={handleExportExcel}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center space-x-2"
              disabled={loading || !purchase || !supplier}
            >
              <FaFileExcel /> <span>Import Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
              disabled={loading || !purchase || !supplier}
            >
              <FaPrint /> <span>Print</span>
            </button>
            <button
              onClick={() => navigate("/dashboard/purchases")}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center space-x-2"
            >
              <FaArrowLeft /> <span>Back</span>
            </button>
          </div>
        </div>

        {loading && (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {purchase && supplier && (
          <div
            ref={componentRef}
            className="receipt-container bg-white shadow-lg print:shadow-none rounded-lg p-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center">
                Purchase Receipt
              </h2>
              <p className="text-sm text-gray-600 text-center">
                Purchase No: {purchase.purchase_no}
              </p>
              <p className="text-sm text-gray-600 text-center">
                Date: {purchase.purchase_date}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Supplier Information
                </h3>
                <p>
                  <strong>Name:</strong> {supplier.supplier_name}
                </p>
                <p>
                  <strong>Address:</strong> {supplier.supplier_address}
                </p>
                <p>
                  <strong>Phone:</strong> {supplier.supplier_tel || "N/A"}
                </p>
                <p>
                  <strong>Email:</strong> {supplier.supplier_email || "N/A"}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Purchase Details
                </h3>
                <p>
                  <strong>Purchase Date:</strong> {purchase.purchase_date}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {purchase.status === 1
                    ? "Completed"
                    : purchase.status === 0
                      ? "Pending"
                      : "Cancelled"}
                </p>
                <p>
                  <strong>Created At:</strong>{" "}
                  {new Date(purchase.created_at).toLocaleString()}
                </p>
                <p>
                  <strong>Updated At:</strong>{" "}
                  {new Date(purchase.updated_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Items
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchase.details.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.item_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.item_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${item.unit_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${item.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Payments
              </h3>
              {purchase.payments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No payments recorded.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchase.payments.map((payment, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${payment.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.paid_at}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div></div>
              <div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Sub Total:
                  </span>
                  <span className="text-sm text-gray-900">
                    ${purchase.sub_total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Tax Rate:
                  </span>
                  <span className="text-sm text-gray-900">
                    {purchase.tax_rate.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Tax Amount:
                  </span>
                  <span className="text-sm text-gray-900">
                    ${purchase.tax_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Shipping Fee:
                  </span>
                  <span className="text-sm text-gray-900">
                    ${purchase.shipping_fee.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-sm text-gray-900">Total Amount:</span>
                  <span className="text-sm text-gray-900">
                    ${purchase.total_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Total Paid:
                  </span>
                  <span className="text-sm text-gray-900">
                    ${purchase.total_paid.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-sm text-gray-900">Balance:</span>
                  <span
                    className={`text-sm ${purchase.balance > 0 ? "text-red-600" : "text-green-600"
                      }`}
                  >
                    ${purchase.balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseReceipt;
