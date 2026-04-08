import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { FaArrowLeft, FaFileExcel, FaPrint } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";
import { Button } from "antd";
import { motion } from "framer-motion";
import api from "../../services/api";
import { useGetUserProfileQuery } from "../../../app/Features/usersSlice";

const PurchaseReceipt = () => {
  const { id } = useParams();
  const { pathname } = useLocation();
  const receiptType = pathname.split("/")[3];
  const isRawReceipt = receiptType === "receipt-raw";
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const proId = localStorage.getItem("profileId");

  const [purchase, setPurchase] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [businessInfo, setBusinessInfo] = useState({});
  const componentRef = useRef(null);

  const { data: profileData } = useGetUserProfileQuery({ id: proId, token });

  useEffect(() => {
    setBusinessInfo({
      name: profileData?.data?.profile_name,
      image: profileData?.data?.image,
      address: profileData?.data?.address,
      tel: profileData?.data?.telephone,
      taxId: "VAT TIN",
    });
  }, [profileData]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const purchaseResponse = await api.get(
          `${receiptType === "receipt" ? "/purchase/" : "/purchase_raw/"}${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const purchaseData = purchaseResponse.data.data;
        setPurchase({
          ...purchaseData,
          sub_total: parseFloat(purchaseData.sub_total || 0),
          tax_rate: parseFloat(purchaseData.tax_rate || 0),
          tax_amount: parseFloat(purchaseData.tax_amount || 0),
          shipping_fee: parseFloat(purchaseData.shipping_fee || 0),
          discount: parseFloat(purchaseData.discount || 0),
          total_amount: parseFloat(purchaseData.total_amount || 0),
          total_paid: parseFloat(purchaseData.total_paid || 0),
          balance: parseFloat(purchaseData.balance || 0),
          exchange_rate: parseFloat(purchaseData.exchange_rate || 4000),
          details: (purchaseData.details || []).map((detail) => ({
            ...detail,
            quantity: parseFloat(detail.quantity || 0),
            unit_price: parseFloat(detail.unit_price || 0),
            subtotal: parseFloat(detail.subtotal || 0),
          })),
          payments: (purchaseData.payments || []).map((payment) => ({
            ...payment,
            amount: parseFloat(payment.amount || 0),
          })),
        });

        const supplierResponse = await api.get(`/suppliers/${purchaseData.supplier_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSupplier(supplierResponse.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching purchase or supplier data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, receiptType, token]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    contentRef: componentRef,
  });

  const handleExportExcel = () => {
    if (!purchase || !supplier) return;

    const workbook = XLSX.utils.book_new();

    const purchaseInfo = [
      ["Purchase Receipt"],
      ["Purchase No", purchase.purchase_no],
      ["Purchase Date", purchase.purchase_date],
      ["Supplier Name", supplier.supplier_name],
      ["Supplier Address", supplier.supplier_address],
      ["Supplier Phone", supplier.supplier_tel || "N/A"],
      ["Sub Total", `$${purchase.sub_total.toFixed(2)}`],
      ["Tax Rate", `${purchase.tax_rate.toFixed(2)}%`],
      ["Tax Amount", `$${purchase.tax_amount.toFixed(2)}`],
      ["Total Amount", `$${purchase.total_amount.toFixed(2)}`],
      ["Total Paid", `$${purchase.total_paid.toFixed(2)}`],
      ["Balance", `$${purchase.balance.toFixed(2)}`],
      ["Created At", purchase.created_at],
    ];

    const purchaseSheet = XLSX.utils.aoa_to_sheet(purchaseInfo);
    XLSX.utils.book_append_sheet(workbook, purchaseSheet, "Purchase Info");

    const itemsData = [
      ["No", "Item", "Qty", "Unit Price", "Amount"],
      ...purchase.details.map((item, index) => [
        index + 1,
        isRawReceipt ? item.material_name : item.item_name,
        `${item.quantity} ${item.unit || ""}`,
        item.unit_price,
        item.subtotal,
      ]),
    ];

    const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(workbook, itemsSheet, "Items");
    XLSX.writeFile(workbook, `Purchase_Receipt_${purchase.purchase_no}.xlsx`);
  };

  const formatCurrency = (amount) => `${Number(amount || 0).toLocaleString("en-US")} ៛`;
  const formatUSD = (amount) => `${Number(amount || 0).toFixed(2)} $`;
  const formatQty = (amount) =>
    Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("sv-SE").replace("T", " ");
  };
  const calculateUSD = (rielAmount) => {
    if (!purchase?.exchange_rate) return 0;
    return Number(rielAmount || 0) / purchase.exchange_rate;
  };
  const getPaymentStatusText = (balance) => {
    if (Number(balance || 0) === 0) return "Paid";
    if (Number(balance || 0) > 0) return "Partial";
    return "Pending";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-gray-600">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-md">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Error</h3>
          <p className="mb-4 text-gray-600">{error}</p>
          <Button type="primary" onClick={() => navigate(-1)}>
            <FaArrowLeft className="mr-2" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  if (!purchase || !supplier) return null;

  const summaryRows = [
    { label: "Subtotal", value: formatCurrency(purchase.sub_total * purchase.exchange_rate) },
    { label: "Shipping", value: formatCurrency(purchase.shipping_fee * purchase.exchange_rate) },
    { label: "Discount", value: formatCurrency(purchase.discount * purchase.exchange_rate) },
    { label: "Grand Total", value: formatCurrency(purchase.total_amount * purchase.exchange_rate), strong: true },
    { label: "Paid", value: formatCurrency(purchase.total_paid * purchase.exchange_rate), strong: true },
    { label: "Balance", value: formatCurrency(purchase.balance * purchase.exchange_rate), strong: true },
    { label: "USD Total", value: formatUSD(calculateUSD(purchase.total_amount * purchase.exchange_rate)), strong: true },
  ];

  return (
    <div className="min-h-screen bg-transparent py-8">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-6 print:hidden">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="mb-2 flex items-center text-blue-600 hover:text-blue-800"
              >
                <FaArrowLeft className="mr-2" />
                Back
              </button>
              <h1 className="text-xl font-bold text-gray-900">Purchase Receipt #{purchase.purchase_no}</h1>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExportExcel}
                icon={<FaFileExcel />}
                className="border-0 bg-green-500 text-white hover:!bg-green-600 hover:!text-white"
              >
                Export Excel
              </Button>
              <Button onClick={handlePrint} icon={<FaPrint />} type="primary">
                Print
              </Button>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            ref={componentRef}
            className="mx-auto overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_20px_60px_-28px_rgba(15,23,42,0.35)] print:rounded-none print:border-0 print:shadow-none"
          >
            <div className="bg-white px-6 py-8 sm:px-10">
              <div className="mx-auto max-w-3xl border-b-2 border-gray-800 pb-8 text-center">
                {businessInfo?.image ? (
                  <img
                    className="mx-auto mb-3 h-20 w-20 object-contain"
                    src={businessInfo.image}
                    alt={businessInfo.name || "Business logo"}
                  />
                ) : null}
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  {businessInfo?.name}
                </h2>
                <p className="mt-2 text-sm text-gray-600 sm:text-base">{businessInfo?.address}</p>
                <p className="text-sm text-gray-600 sm:text-base">Tel: {businessInfo?.tel || "N/A"}</p>
                <h1 className="mt-7 text-3xl font-bold tracking-[0.08em] text-gray-700 sm:text-4xl">
                  PURCHASE RECEIPT
                </h1>
              </div>

              <div className="mx-auto mt-6 max-w-3xl">
                <div className="grid grid-cols-1 gap-8 text-[15px] leading-7 text-gray-800 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex gap-3">
                      <span className="min-w-[120px] font-semibold text-gray-600">Receipt No:</span>
                      <span className="font-medium">{purchase.purchase_no}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="min-w-[120px] font-semibold text-gray-600">Date:</span>
                      <span>{formatDateTime(purchase.purchase_date || purchase.created_at)}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="min-w-[120px] font-semibold text-gray-600">Supplier:</span>
                      <span>{supplier.supplier_name}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="min-w-[120px] font-semibold text-gray-600">Phone:</span>
                      <span>{supplier.supplier_tel || "N/A"}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-3">
                      <span className="min-w-[120px] font-semibold text-gray-600">Address:</span>
                      <span>{supplier.supplier_address || "N/A"}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="min-w-[120px] font-semibold text-gray-600">Payment:</span>
                      <span>{purchase.payments?.[0]?.payment_method || "PP"}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="min-w-[120px] font-semibold text-gray-600">Status:</span>
                      <span>{getPaymentStatusText(purchase.balance)}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="min-w-[120px] font-semibold text-gray-600">Exchange:</span>
                      <span>1 USD = {purchase.exchange_rate.toLocaleString("en-US")} ៛</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mx-auto mt-8 max-w-3xl">
                <table className="w-full border-collapse text-[15px]">
                  <thead>
                    <tr className="border-b-2 border-gray-700 bg-gray-100">
                      <th className="px-3 py-3 text-left font-bold text-gray-800">Item</th>
                      <th className="px-3 py-3 text-center font-bold text-gray-800">Qty</th>
                      <th className="px-3 py-3 text-right font-bold text-gray-800">Price</th>
                      <th className="px-3 py-3 text-right font-bold text-gray-800">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.details.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 align-top">
                        <td className="px-3 py-4">
                          <div className="font-semibold text-gray-900">
                            {isRawReceipt ? item.material_name : item.item_name}
                          </div>
                          {item.item_code ? <div className="mt-1 text-sm text-gray-500">{item.item_code}</div> : null}
                        </td>
                        <td className="px-3 py-4 text-center">
                          {formatQty(item.quantity)} {item.unit || ""}
                        </td>
                        <td className="px-3 py-4 text-right">
                          {formatCurrency(item.item_cost * purchase.exchange_rate)}
                        </td>
                        <td className="px-3 py-4 text-right font-medium">
                          {formatCurrency(item.subtotal * purchase.exchange_rate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-8 flex justify-end">
                  <div className="w-full max-w-[320px] space-y-2 text-[15px]">
                    {summaryRows.map((row) => (
                      <div
                        key={row.label}
                        className={`flex items-baseline justify-between gap-4 ${row.strong ? "pt-2 font-bold text-gray-900" : "text-gray-700"}`}
                      >
                        <span className={row.strong ? "font-bold" : "font-medium"}>{row.label}:</span>
                        <span className={row.strong ? "text-[17px]" : ""}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {purchase.payments && purchase.payments.length > 0 ? (
                  <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-gray-700">
                      Payment History
                    </h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      {purchase.payments.map((payment, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-[40px,1fr,1fr] gap-3 border-b border-gray-200 pb-2 last:border-0 last:pb-0"
                        >
                          <span>{index + 1}.</span>
                          <span>{formatCurrency(payment.amount * purchase.exchange_rate)}</span>
                          <span className="text-right">{formatDateTime(payment.paid_at || payment.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-16 grid grid-cols-2 gap-8 text-center text-[15px] text-gray-700">
                  <div>
                    <p className="mb-16 font-medium">Supplier Signature</p>
                    <div className="mx-auto w-44 border-t border-gray-400 pt-3">
                      <p className="font-semibold">{supplier.supplier_name || "Supplier"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="mb-16 font-medium">Receiver Signature</p>
                    <div className="mx-auto w-44 border-t border-gray-400 pt-3">
                      <p className="font-semibold">{businessInfo?.name || "Receiver"}</p>
                    </div>
                  </div>
                </div>

                <div className="mx-auto mt-14 max-w-xs border-t border-gray-300 pt-4 text-center text-sm font-semibold text-gray-700">
                  Thank you
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-4 text-center text-sm text-gray-500 print:hidden">
          <p>Use the Print button to print this receipt.</p>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReceipt;
