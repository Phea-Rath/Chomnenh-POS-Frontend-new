import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { FaPrint, FaFileExcel, FaArrowLeft } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";
import api from "../../services/api";
import { Button, Card } from "antd";
import { motion } from "framer-motion";
import { useGetUserProfileQuery } from "../../../app/Features/usersSlice";

const PurchaseReceipt = () => {
  const { id } = useParams();
  const { pathname } = useLocation();
  console.log(pathname.split('/')[3]);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const proId = localStorage.getItem("profileId");
  const [purchase, setPurchase] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const componentRef = useRef();
  const [businessInfo, setBusinessInfo] = useState({});
  const { data: profileData, refetch } = useGetUserProfileQuery({ id: proId, token });

  // Business information (can be moved to settings/config)
  useEffect(() => {
    console.log(profileData);

    setBusinessInfo({
      name: profileData?.data?.profile_name,
      image: profileData?.data?.image,
      address: profileData?.data?.address,
      tel: profileData?.data?.telephone,
      taxId: "VAT TIN"
    });
  }, [profileData])

  // Fetch purchase and supplier data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch purchase
        const purchaseResponse = await api.get(`${pathname.split('/')[3] == 'receipt' ? '/purchase/' : '/purchase_raw/'}${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const purchaseData = purchaseResponse.data.data;
        setPurchase({
          ...purchaseData,
          sub_total: parseFloat(purchaseData.sub_total),
          tax_rate: parseFloat(purchaseData.tax_rate),
          tax_amount: parseFloat(purchaseData.tax_amount),
          shipping_fee: parseFloat(purchaseData.shipping_fee),
          discount: parseFloat(purchaseData.discount || 0),
          total_amount: parseFloat(purchaseData.total_amount),
          total_paid: parseFloat(purchaseData.total_paid),
          balance: parseFloat(purchaseData.balance),
          exchange_rate: parseFloat(purchaseData.exchange_rate || 4000),
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

    const workbook = XLSX.utils.book_new();

    // Purchase Info Sheet
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
      ["Status", purchase.status === 1 ? "Completed" : purchase.status === 0 ? "Pending" : "Cancelled"],
      ["Created At", purchase.created_at],
    ];
    const purchaseSheet = XLSX.utils.aoa_to_sheet(purchaseInfo);
    XLSX.utils.book_append_sheet(workbook, purchaseSheet, "Purchase Info");

    // Items Sheet
    const itemsData = [
      ["ល.រ", "ទំនិញ", "បរិចាណ", "តម្លៃឯកតា", "សរុប"],
      ...purchase.details.map((item, index) => [
        index + 1,
        item.item_name,
        `${item.quantity} ${item.unit || ''}`,
        `${(item.unit_price).toLocaleString('en-US')} ៛`,
        `${(item.subtotal).toLocaleString('en-US')} ៛`,
      ]),
    ];
    const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(workbook, itemsSheet, "Items");

    // Export to Excel
    XLSX.writeFile(workbook, `Purchase_Receipt_${purchase.purchase_no}.xlsx`);
  };

  // Format currency in Khmer style
  const formatCurrency = (amount) => {
    return `${amount.toLocaleString('en-US')} ៛`;
  };

  // Format USD amount
  const formatUSD = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  // Calculate USD amount
  const calculateUSD = (rielAmount) => {
    if (!purchase) return 0;
    return rielAmount / purchase.exchange_rate;
  };

  // Get payment status text
  const getPaymentStatusText = (balance) => {
    if (balance === 0) return "Paid";
    if (balance > 0) return "Partial";
    return "Pending";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">កំពុងផ្ទុកវិក្កយបត្រ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-center mb-4">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">កំហុស</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button type="primary" onClick={() => navigate(-1)}>
            <FaArrowLeft className="mr-2" />
            ត្រឡប់ទៅកាន់បញ្ជីទិញទំនិញ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with actions */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
              >
                <FaArrowLeft className="mr-2" />
                ត្រឡប់ក្រោយ
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                វិក្កយបត្រទិញទំនិញ #{purchase?.purchase_no}
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExportExcel}
                icon={<FaFileExcel />}
                className="bg-green-500 hover:bg-green-600 text-white border-0"
                disabled={!purchase || !supplier}
              >
                នាំចេញ Excel
              </Button>
              <Button
                onClick={handlePrint}
                icon={<FaPrint />}
                type="primary"
                disabled={!purchase || !supplier}
              >
                បោះពុម្ព
              </Button>
            </div>
          </div>
        </div>

        {/* Receipt Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            ref={componentRef}
            className="bg-white shadow-lg print:shadow-none rounded-lg overflow-hidden border border-gray-200"
          >
            {/* Receipt Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="text-center flex flex-col items-center mb-4">
                <img className="h-25 w-25" src={businessInfo?.image} alt="" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {businessInfo?.name}
                </h2>
                <p className="text-gray-600">{businessInfo?.address}</p>
                <p className="text-gray-600">ទូរស័ព្ទ: {businessInfo?.tel}</p>
              </div>

              {/* Invoice Title based on tax */}
              <div className="text-center mb-6">
                <h1 className={`text-3xl font-bold ${purchase.tax_rate > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {/* {purchase.tax_rate > 0 ? "វិធីរួយចំពោះអាចអត្ថ (Tax Invoice)" : "ទិត្យរប័រ"} */}
                </h1>
                {purchase.tax_rate > 0 && businessInfo?.taxId && (
                  <p className="text-sm text-gray-600 mt-1">
                    អត្ថសញ្ញាណអង្គ អត្ថ ({businessInfo?.taxId})
                  </p>
                )}
              </div>

              {/* Invoice Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex mb-2">
                    <span className="w-40 font-medium">លេខវិក្កយបត្រ:</span>
                    <span className="font-bold">{purchase.purchase_no}</span>
                  </div>
                  <div className="flex mb-2">
                    <span className="w-40 font-medium">អតិថិជន:</span>
                    <span>{supplier.supplier_name}</span>
                  </div>
                  {purchase.tax_rate > 0 && (
                    <div className="flex mb-2">
                      <span className="w-40 font-medium">អត្ថសញ្ញាណកម្ម:</span>
                      <span>{supplier.tax_id || "N/A"}</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex mb-2">
                    <span className="w-40 font-medium">កាលបរិច្ឆេទ:</span>
                    <span>{new Date(purchase.purchase_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex mb-2">
                    <span className="w-40 font-medium">ទូរស័ព្ទ:</span>
                    <span>{supplier.supplier_tel || "N/A"}</span>
                  </div>
                  <div className="flex mb-2">
                    <span className="w-40 font-medium">ទីតាំង:</span>
                    <span>{supplier.supplier_address || "N/A"}</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 font-medium">អត្រាប្តូរប្រាក់:</span>
                    <span>1$ = {purchase.exchange_rate.toLocaleString('en-US')} ៛</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="p-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left font-medium">ល.រ</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-medium">{pathname.split('/')[3] === 'receipt-raw' ? 'វត្ថុធាតុដើម' : 'ទំនិញ'}</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-medium">បរិមាណ</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-medium">តម្លៃ</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-medium">សរុប</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.details.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-center">{index + 1}</td>
                      <td className="border border-gray-300 px-4 py-3">
                        <div className="font-medium">{pathname.split('/')[3] === 'receipt-raw' ? item.material_name : item.item_name}</div>
                        {item.item_code && (
                          <div className="text-sm text-gray-500">កូដ: {item.item_code}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {item.quantity} {item.unit || ''}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right">
                        {formatCurrency(item.item_cost * purchase.exchange_rate)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                        {formatCurrency(item.subtotal * purchase.exchange_rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Note Section */}
              <div className="mt-4">
                <div className="flex">
                  <span className="font-medium mr-2">សម្គាល់៖</span>
                  {/* <span className="text-gray-600">{purchase.note || "N/A"}</span> */}
                </div>
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-gray-50 p-6">
              <div className="max-w-md ml-auto">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">សរុបតម្លៃ:</span>
                    <span className="font-bold">{formatCurrency(purchase.sub_total * purchase.exchange_rate)}</span>
                  </div>

                  {purchase.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="font-medium">បញ្ចុះតម្លៃ:</span>
                      <span className="text-red-600">- {formatCurrency(purchase.discount * purchase.exchange_rate)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="font-medium">សេវាដឹក:</span>
                    <span>{purchase.shipping_fee > 0 ? `+ ${formatCurrency(purchase.shipping_fee * purchase.exchange_rate)}` : `+ ${formatCurrency(0)}`}</span>
                  </div>

                  {/* Tax Section (only show if tax > 0) */}
                  {purchase.tax_rate > 0 && (
                    <div className="flex justify-between border-t border-gray-300 pt-2">
                      <span className="font-medium">តម្លៃពន្ធដា ({purchase.tax_rate}%):</span>
                      <span className="font-bold">+ {formatCurrency(purchase.tax_amount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-gray-300 pt-2">
                    <span className="text-lg font-bold">សរុបចុងក្រោយ:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(purchase.total_amount * purchase.exchange_rate)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium">សរុបជាដុល្លារ:</span>
                    <span className="font-bold text-green-600">
                      {formatUSD(purchase.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="mt-6 pt-4 border-t border-gray-300">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">ប្រាក់បានបង់:</span>
                    <span className="font-bold">{formatCurrency(purchase.total_paid * purchase.exchange_rate)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">ប្រាក់នៅសល់:</span>
                    <span className={`font-bold ${purchase.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(purchase.balance * purchase.exchange_rate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">ការទូទាត់:</span>
                    <span className={`font-bold ${purchase.balance === 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {getPaymentStatusText(purchase.balance)}
                    </span>
                  </div>
                </div>

                {/* Payment Details Table */}
                {purchase.payments && purchase.payments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <h4 className="font-bold mb-2">ការទូទាត់:</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-2 py-1 text-left">ល.រ</th>
                          <th className="px-2 py-1 text-left">ចំនួន</th>
                          <th className="px-2 py-1 text-left">កាលបរិច្ឆេទ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchase.payments.map((payment, index) => (
                          <tr key={index}>
                            <td className="px-2 py-1">{index + 1}</td>
                            <td className="px-2 py-1">{formatCurrency(payment.amount * purchase.exchange_rate)}</td>
                            <td className="px-2 py-1">{payment.paid_at || payment.created_at}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Signatures */}
            <div className="border-t border-gray-200 p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-bold mb-4">អ្នកទិញ</div>
                  <div className="h-16 border-t border-gray-300 pt-2 text-sm text-gray-500">
                    ឈ្មោះ និងហត្ថលេខា
                  </div>
                </div>
                <div>
                  <div className="font-bold mb-4">អ្នកដឹកជញ្ជូន</div>
                  <div className="h-16 border-t border-gray-300 pt-2 text-sm text-gray-500">
                    ឈ្មោះ និងហត្ថលេខា
                  </div>
                </div>
                <div>
                  <div className="font-bold mb-4">អ្នកលក់</div>
                  <div className="h-16 border-t border-gray-300 pt-2 text-sm text-gray-500">
                    ឈ្មោះ និងហត្ថលេខា
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Print Message */}
        <div className="mt-4 text-center text-sm text-gray-500 print:hidden">
          <p>ចុចប៊ូតុង "បោះពុម្ព" ដើម្បីបោះពុម្ពវិក្កយបត្រនេះ</p>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReceipt;