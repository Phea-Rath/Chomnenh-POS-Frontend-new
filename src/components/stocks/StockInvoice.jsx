import React, { useMemo, useRef } from "react";
import { FaDownload, FaPrint } from "react-icons/fa";
import { IoArrowBackCircle } from "react-icons/io5";
import { useReactToPrint } from "react-to-print";
import { useLocation, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import handleDownload from "../../services/imageDowload";
import { useGetStockByIdQuery, useGetStockRawByIdQuery } from "@/features/stocks/stocksSlice";
import Button from "../../utils/Button";
import { getToken } from '@/utils/tokenStore';

const EMPTY_ROWS = 8;

const StockInvoice = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {pathname} = useLocation();
  console.log(pathname);
  
  const { id } = useParams();
  const token = getToken();
  const invoiceRef = useRef(null);
  
  const { data: stockResponse, isFetching: isStockFetching } = useGetStockByIdQuery({ id, token }, { skip: !id ||  pathname != `/stock-invoice/${id}` });
  const { data: stockRawResponse, isFetching: isStockRawFetching } = useGetStockRawByIdQuery({ id, token }, { skip: !id ||  pathname != `/stock-raw-invoice/${id}` });

  const stock = stockResponse?.data || stockRawResponse?.data || {};
  const items = useMemo(() => (Array.isArray(stock?.items) ? stock.items : []), [stock?.items]);

  const money = (value) =>
    Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    contentRef: invoiceRef,
  });

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.item_cost || item.item_price || 0);
        return sum + quantity * unitPrice;
      }, 0),
    [items]
  );

  const paddedReference = String(stock?.stock_id || id || "").padStart(8, "0");
  const stockTypeLabel = (stock?.stock_type_name || "OUT").toUpperCase();
  const partyName = stock?.to_warehouse_name || stock?.from_warehouse_name || stock?.created_by_name || "N/A";
  const noteText = stock?.stock_remark || `Reference #${paddedReference}`;
  const rows = [...items];

  while (rows.length < EMPTY_ROWS) {
    rows.push(null);
  }

  if (isStockFetching || isStockRawFetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-700" />
          <p className="text-gray-600 dark:text-gray-400">{t("loadingInvoice")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white print:hidden"
        >
          <IoArrowBackCircle className="mr-2" size={24} />
          {t("back")}
        </button>

        <div className="mb-6 flex flex-wrap justify-end gap-3 print:hidden">
          <Button
            onClick={handlePrint}
            className="flex items-center rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-900"
          >
            <FaPrint className="mr-2" /> {t("print")}
          </Button>
          <Button
            onClick={() => handleDownload(invoiceRef, "pdf", "stock-receipt", stock?.stock_no || id)}
            className="flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
          >
            <FaDownload className="mr-2" /> {t("downloadPDF")}
          </Button>
          <Button
            onClick={() => handleDownload(invoiceRef, "png", "stock-receipt", stock?.stock_no || id)}
            className="flex items-center rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
          >
            <FaDownload className="mr-2" /> {t("downloadPNG")}
          </Button>
          <Button
            onClick={() => handleDownload(invoiceRef, "jpg", "stock-receipt", stock?.stock_no || id)}
            className="flex items-center rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
          >
            <FaDownload className="mr-2" /> {t("downloadJPG")}
          </Button>
        </div>

        <div
          ref={invoiceRef}
          className="mx-auto bg-white px-10 py-8 text-black shadow-lg print:shadow-none"
          style={{ width: "210mm", minHeight: "297mm" }}
        >
          <div className="text-center">
            <h1 className="text-[18px] font-bold text-green-700">
              ប័ណ្ណដៃស្តុក / Stock Receipt
            </h1>
            <p className="text-[12px]">Inventory Management System</p>
          </div>

          <div className="mt-2 border-b-2 border-black" />

          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-[13px]">
            <div className="grid grid-cols-[90px_1fr] items-baseline">
              <span className="font-semibold">លេខប័ណ្ណ:</span>
              <span>{stock?.stock_no || "N/A"}</span>
            </div>
            <div className="grid grid-cols-[90px_1fr] items-baseline">
              <span className="font-semibold">កាលបរិច្ឆេទ:</span>
              <span>{formatDate(stock?.stock_date)}</span>
            </div>
            <div className="grid grid-cols-[90px_1fr] items-baseline">
              <span className="font-semibold">ប្រភេទ:</span>
              <span className="font-bold text-red-600">{stockTypeLabel}</span>
            </div>
            <div className="grid grid-cols-[90px_1fr] items-baseline">
              <span className="font-semibold">លេខយោង:</span>
              <span>{paddedReference}</span>
            </div>
            <div className="grid grid-cols-[90px_1fr] items-baseline">
              <span className="font-semibold">ឈ្មោះ:</span>
              <span>{partyName}</span>
            </div>
          </div>

          <table className="mt-4 w-full border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="border border-black px-2 py-1 text-center font-bold">Nº</th>
                <th className="border border-black px-2 py-1 text-center font-bold">បរិយាយទំនិញ (DESCRIPTION)</th>
                <th className="border border-black px-2 py-1 text-center font-bold">ចំនួន</th>
                <th className="border border-black px-2 py-1 text-center font-bold">តម្លៃ</th>
                <th className="border border-black px-2 py-1 text-center font-bold">សរុប</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => {
                const quantity = Number(item?.quantity || 0);
                const unitPrice = Number(item?.item_cost || item?.item_price || 0);
                const amount = quantity * unitPrice;

                return (
                  <tr key={item?.detail_id || `empty-${index}`}>
                    <td className="h-6 border border-black px-2 text-center align-middle">{item ? index + 1 : ""}</td>
                    <td className="h-6 border border-black px-2 align-middle">
                      {item ? item.item_name || item.material_name || "" : ""}
                    </td>
                    <td className="h-6 border border-black px-2 text-center align-middle">
                      {item ? quantity : ""}
                    </td>
                    <td className="h-6 border border-black px-2 text-right align-middle">
                      {item ? `$${money(unitPrice)}` : ""}
                    </td>
                    <td className="h-6 border border-black px-2 text-right align-middle">
                      {item ? `$${money(amount)}` : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-3 grid grid-cols-[1fr_245px] gap-6 text-[12px]">
            <div>
              <p className="font-semibold">សម្គាល់ (Note):</p>
              <p>{noteText}</p>
            </div>

            <table className="h-fit w-full border-collapse text-[12px]">
              <tbody>
                <tr>
                  <td className="border border-black px-3 py-1 font-bold">សរុប (Total)</td>
                  <td className="border border-black px-3 py-1 text-right font-bold">${money(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-12 text-center text-[12px]">
            <div>
              <div className="mx-auto w-full border-t border-black" />
              <p className="mt-1">អ្នកបញ្ចូល (Prepared By)</p>
            </div>
            <div>
              <div className="mx-auto w-full border-t border-black" />
              <p className="mt-1">អ្នកទទួល/អនុម័ត (Approved By)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockInvoice;
