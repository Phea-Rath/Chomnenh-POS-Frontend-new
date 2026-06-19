import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { FaDownload, FaPrint } from "react-icons/fa";
import { IoArrowBackCircle } from "react-icons/io5";
import { useReactToPrint } from "react-to-print";
import { motion } from "framer-motion";
import api from "../../services/api";
import handleDownload from "../../services/imageDowload";
import Button from "../../utils/Button";
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
      email: profileData?.data?.email,
      taxId: profileData?.data?.tax_id || "VAT TIN",
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
          purchase_date: purchaseData.purchase_date || purchaseData.created_at,
          sub_total: parseFloat(purchaseData.subtotal || purchaseData.sub_total || 0),
          tax_rate: parseFloat(purchaseData.tax_percent || purchaseData.tax_rate || 0),
          tax_amount: parseFloat(purchaseData.tax_amount || 0),
          shipping_fee: parseFloat(purchaseData.shippings?.fee || purchaseData.shipping_fee || 0),
          discount: parseFloat(purchaseData.discount_amount || purchaseData.discount || 0),
          total_amount: parseFloat(purchaseData.grand_total || purchaseData.total_amount || 0),
          total_paid: parseFloat(purchaseData.paymented || purchaseData.total_paid || 0),
          balance: parseFloat(purchaseData.balance || 0),
          exchange_rate: parseFloat(purchaseData.exchange_rate || 1),
          total_amount_khr: parseFloat(purchaseData.grand_total_khr || 0),
          details: (purchaseData.items || purchaseData.details || []).map((detail) => ({
            ...detail,
            quantity: parseFloat(detail.quantity || 0),
            price: parseFloat(detail.price || detail.unit_price || detail.item_cost || 0),
            total: parseFloat(detail.total || detail.subtotal || 0),
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

  const formatUSD = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  const formatKHR = (amount) =>
    `${Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })} ៛`;

  const formatQty = (amount) =>
    Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const formatDate = (date) => {
    if (!date) return "N/A";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return date;
    return parsedDate.toLocaleDateString("en-GB").replaceAll("/", "-");
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return date;
    return parsedDate.toLocaleString("sv-SE").replace("T", " ");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
          <Button
            onClick={() => navigate(-1)}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <IoArrowBackCircle className="mr-2" size={22} />
            Back
          </Button>
        </div>
      </div>
    );
  }

  if (!purchase || !supplier) return null;

  const shipping = purchase.shippings || {};
  const documentTotalKhr = purchase.total_amount * purchase.exchange_rate;
  const summaryRows = [
    { label: "Total", value: formatUSD(purchase.sub_total), strong: true },
    {
      label: `Tax${purchase.tax_rate ? ` (${purchase.tax_rate.toFixed(0)}%)` : ""}`,
      value: formatUSD(purchase.tax_amount),
    },
    // { label: "Shipping", value: formatUSD(purchase.shipping_fee) },
    { label: "Discounts", value: formatUSD(purchase.total_discount) },
    { label: "Grand total", value: formatUSD(purchase.total_amount), strong: true },
  ];

  return (
    <div className="print:bg-white py-4 print:py-0 bg-gray-100">
      {/* <style>
        {`
          @media print {
            @page { size: A4; margin: 8mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #ffffff !important; }
            .purchase-order-page { box-shadow: none !important; border: 1px solid #d8d8d8 !important; width: 100% !important; min-height: auto !important; }
            .purchase-order-table th { background: #2f73c8 !important; color: #ffffff !important; }
          }
        `}
      </style> */}

      <div className="mx-auto max-w-5xl px-4">
        

        <div className="mb-6 flex flex-wrap justify-end gap-3 print:hidden">
          <Button
              onClick={() => navigate(`${receiptType === "receipt"? '/inventories/purchases':'/inventories/purchase-raw'}`)}
              variant="cancel"
            >
              <IoArrowBackCircle className="mr-2" size={24} />
              Back
          </Button>
          <Button
            onClick={handlePrint}
            variant="success"
          >
            <FaPrint className="mr-2" /> Print
          </Button>
          <Button
            onClick={() => handleDownload(componentRef, "pdf", "purchase-order", purchase?.purchase_no || id)}
            className="flex items-center rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            <FaDownload className="mr-2" /> Download PDF
          </Button>
          <Button
            onClick={() => handleDownload(componentRef, "png", "purchase-order", purchase?.purchase_no || id)}
            className="flex items-center rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
          >
            <FaDownload className="mr-2" /> Download PNG
          </Button>
          <Button
            onClick={() => handleDownload(componentRef, "jpg", "purchase-order", purchase?.purchase_no || id)}
            className="flex items-center rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
          >
            <FaDownload className="mr-2" /> Download JPG
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            ref={componentRef}
            className="purchase-order-page mx-auto min-h-[1122px] w-full max-w-[920px] border border-gray-300 bg-white p-8 text-[13px] leading-relaxed text-gray-900 sm:p-10"
          >
            <header className="grid gap-8 grid-cols-2 md:items-start">
              <div>
                <div className="flex items-center gap-4">
                  {businessInfo?.image ? (
                    <img
                      className="h-16 w-16 object-contain"
                      src={businessInfo.image}
                      alt={businessInfo.name || "Business logo"}
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center border border-gray-300 text-2xl font-bold text-blue-700">
                      {businessInfo?.name?.[0] || "B"}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold leading-tight text-gray-800">
                      {businessInfo?.name || "Business Name"}
                    </h2>
                    <p className="text-xs font-medium text-blue-600">Purchase Department</p>
                  </div>
                </div>
                <div className=" max-w-[360px] text-xs text-gray-800">
                  <p>{businessInfo?.address || "Address not available"}</p>
                  <p>Tel: {businessInfo?.tel || "N/A"}</p>
                  {businessInfo?.email ? <p>Email: {businessInfo.email}</p> : null}
                </div>
              </div>

              <div className="text-right">
                <h1 className="text-xl font-light uppercase tracking-[0.02em] text-gray-500">
                  Purchase Order
                </h1>
                <div className="inline-grid grid-cols-[88px,1fr] text-xs gap-x-4 gap-y-1 text-left">
                  <pre>
                    <span className="font-bold mr-2">PO No:</span>
                    <span className="text-right">{purchase.purchase_no || "N/A"}</span>
                  </pre>
                  <pre>
                    <span className="font-bold mr-2">PO Date:</span>
                    <span className="text-right">{formatDate(purchase.purchase_date)}</span>
                  </pre>
                  <pre>
                    <span className="font-bold mr-2">Quote No:</span>
                    <span className="text-right">{purchase.quote_no ? `${purchase.quote_no}` : "N/A"}</span>
                  </pre>
                </div>
              </div>
            </header>

            <section className="mt-2 grid gap-8 grid-cols-2">
              <div className="border border-gray-300">
                <div className="bg-[#2f73c8] px-2 py-1 font-bold text-white">Vendor</div>
                <div className="space-y-1 px-2 py-1 text-xs">
                  <p>
                    <span className="font-bold">Supplier Name:</span> {supplier.supplier_name || "N/A"}
                  </p>
                  <p>
                    <span className="font-bold">Address:</span> {supplier.supplier_address || "N/A"}
                  </p>
                  <p>
                    <span className="font-bold">Supplier Code:</span>{" "}
                    {supplier.supplier_code || `VNDR-${supplier.supplier_id || purchase.supplier_id || "N/A"}`}
                  </p>
                  <p>
                    <span className="font-bold">Contact:</span> {supplier.supplier_tel || "N/A"}
                  </p>
                  <p>
                    <span className="font-bold">Email:</span> {supplier.supplier_email || "N/A"}
                  </p>
                </div>
              </div>

              <div className="border border-gray-300">
                <div className="bg-[#2f73c8] px-2 py-1 font-bold text-white">Ship To:</div>
                <div className="space-y-1 px-2 py-1 text-xs">
                  <p className="font-bold">{businessInfo?.name || "Business Name"}</p>
                  <p>{businessInfo?.address || "Address not available"}</p>
                  <p>
                    <span className="font-bold">Tax ID:</span> {businessInfo?.taxId || "N/A"}
                  </p>
                  <p>Contact: {businessInfo?.tel || "N/A"}</p>
                  <p>Email: {businessInfo?.email || "N/A"}</p>
                </div>
              </div>
            </section>

            <section className="mt-1 overflow-hidden border text-xs border-gray-300">
              <div className="grid divide-gray-300 grid-cols-3 divide-x divide-y-0">
                <div>
                  <div className="bg-[#2f73c8] px-2 py-1 font-bold text-white">Requisitioner</div>
                  <div className="px-2 py-1 capitalize">{purchase.created_by_name || "N/A"}</div>
                </div>
                <div>
                  <div className="bg-[#2f73c8] px-2 py-1 font-bold text-white">Ship via</div>
                  <div className="px-2 py-1 capitalize">{shipping.vai || shipping.carrier || "N/A"}</div>
                </div>
                <div>
                  <div className="bg-[#2f73c8] px-2 py-1 font-bold text-white">Carrier</div>
                  <div className="px-2 py-1">{shipping.carrier || "N/A"}</div>
                </div>
              </div>
            </section>
            

            <section className="mt-1 overflow-x-auto">
              <table className="purchase-order-table w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-gray-300 bg-[#2f73c8] px-2 py-1 text-center font-bold text-white">
                      S.No
                    </th>
                    <th className="border border-gray-300 bg-[#2f73c8] px-2 py-1 text-center font-bold text-white">
                      Product Code
                    </th>
                    <th className="border border-gray-300 bg-[#2f73c8] px-3 py-2 text-left font-bold text-white">
                      Product Name
                    </th>
                    <th className="border border-gray-300 bg-[#2f73c8] px-2 py-1 text-center font-bold text-white">
                      Quantity
                    </th>
                    <th className="border border-gray-300 bg-[#2f73c8] px-3 py-2 text-left font-bold text-white">
                      Specification
                    </th>
                    <th className="border border-gray-300 bg-[#2f73c8] px-2 py-1 text-center font-bold text-white">
                      Price
                    </th>
                    <th className="border border-gray-300 bg-[#2f73c8] px-2 py-1 text-right font-bold text-white">
                      Discount
                    </th>
                    <th className="border border-gray-300 bg-[#2f73c8] px-2 py-1 text-right font-bold text-white">
                      Tax
                    </th>
                    <th className="border border-gray-300 bg-[#2f73c8] px-2 py-1 text-right font-bold text-white">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="!relative">
                  {purchase.details.map((item, index) => (
                    <tr key={item.item_id || item.material_id || index}>
                      <td className="border border-gray-300 px-2 py-2 text-center">{index + 1}</td>
                      <td className="border border-gray-300 px-2 py-2 text-center">
                        {item.material_code || item.item_code || "-"}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {isRawReceipt ? item.material_name || item.item_name : item.item_name}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center">{formatQty(item.quantity)}</td>
                      <td className="border border-gray-300 px-2 py-2 text-center">{item.unit || "pcs"}</td>
                      <td className="border border-gray-300 px-2 py-2 text-center">${formatQty(item.item_cost)}</td>
                      <td className="border border-gray-300 px-2 py-2 text-right">{item.discount}%</td>
                      <td className="border border-gray-300 px-2 py-2 text-right">
                        {purchase.tax_rate ? `${purchase.tax_rate.toFixed(0)}%` : "-"}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-right">{formatUSD(item.total)}</td>
                    </tr>
                  ))}
                  {summaryRows.map((row) => (<tr>
                      <th colSpan={8} className="px-3 py-2 text-right">{row.label}</th>
                      <td className="border border-gray-300 px-3 py-2 text-right">{row.value}</td>
                    </tr>))}
                  {purchase.details.length === 0 ? (
                    <tr>
                      <td className="border border-gray-300 px-3 py-8 text-center text-gray-500" colSpan="8">
                        No purchase items found
                      </td>
                    </tr>
                  ) : null}
                 <div className="bg-blue-50 bottom-0 grow px-7 absolute  py-4 text-[11px] leading-snug text-gray-800">
                  <p className="font-bold">Terms and conditions:</p>
                  <ol className="list-decimal pl-4">
                    <li>We reserve the right to cancel the purchase order anytime before product shipment.</li>
                    <li>Invoice raised to us should contain purchase order details with date mentioned.</li>
                    <li>Adherence to agreed product specifications is required during delivery.</li>
                    <li>Packing and shipping charges are to be borne by the supplier unless stated.</li>
                    <li>Delivery should be done within the agreed purchase order due term.</li>
                  </ol>
                </div>
                </tbody>
              </table>
            </section>
           

            <footer className="flex flex-col gap-20">
                <div className="bg-[#2f73c8] px-4 py-2 text-center font-bold text-white">
                  For {businessInfo?.name || "Business Name"}
                </div>
                <div className="flex justify-between gap-5">
                  <div className="flex items-end justify-center border-t border-gray-300 px-4 pb-3 text-center text-xs italic text-gray-500">
                    Prepared by
                  </div>
                  <div className="flex items-end justify-center border-t border-gray-300 px-4 pb-3 text-center text-xs italic text-gray-500">
                    Approved by
                  </div>
                </div>
            </footer>

            <div className="mt-4 text-[12px] text-gray-800">
              Mark any communications to {businessInfo?.email || "purchase-team@example.com"}
            </div>
          </div>
        </motion.div>

        <div className="mt-4 text-center text-sm text-gray-500 print:hidden">
          <p>Use the Print button to print this purchase order.</p>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReceipt;
