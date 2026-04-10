import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { FaCopy, FaDownload, FaPrint } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useGetExpanseByIdQuery } from '../../../app/Features/expensesSlice';
import handleDownload from '../../services/imageDowload';

const PrintExpanse = () => {
  const [data, setData] = useState({
    expense_no: '',
    expense_date: '',
    expense_by: '',
    expense_other: '',
    amount: '',
    items: [],
  });
  const receiptRef = useRef(null);
  const { id } = useParams();
  const token = localStorage.getItem('token');
  const { data: expenseData } = useGetExpanseByIdQuery({ id, token });

  useEffect(() => {
    setData(expenseData?.data || {
      expense_no: '',
      expense_date: '',
      expense_by: '',
      expense_other: '',
      amount: '',
      items: [],
    });
  }, [expenseData]);

  const totalAmount = useMemo(() => {
    return (data?.items || []).reduce((sum, item) => sum + Number(item.sub_total || 0), 0);
  }, [data]);

  const formatMoney = (value) => Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const formatDate = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (value) => {
    const date = value ? new Date(value) : new Date();
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyURL = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('URL copied!');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const usdAmount = totalAmount * 4000;

  return (
    <section className="min-h-screen bg-transparent px-4 py-8 text-gray-800">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap justify-center gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-white transition-colors hover:bg-slate-900"
          >
            <FaPrint />
            Print
          </button>
          <button
            onClick={copyURL}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <FaCopy />
            Copy URL
          </button>
          <button
            onClick={() => handleDownload(receiptRef, 'jpg', 'Expense', data?.expense_no)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700"
          >
            <FaDownload />
            Download
          </button>
        </div>

        <div
          ref={receiptRef}
          className="relative mx-auto overflow-hidden rounded-[28px] border border-gray-200 bg-white px-8 py-10 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.35)] print:rounded-none print:border-0 print:shadow-none sm:px-12"
        >
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
            <div className="rotate-[-32deg] border-[6px] border-emerald-400 px-20 py-28 text-8xl font-black uppercase tracking-[0.4em] text-emerald-500">
              PAID
            </div>
          </div>

          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="text-center">
              <h1 className="text-3xl font-black tracking-tight text-slate-700 sm:text-4xl">Expense Voucher</h1>
              <p className="mt-2 text-base text-gray-500">Printed from expense management system</p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 border-b border-dashed border-gray-300 pb-8 text-[15px] leading-8 text-gray-800 md:grid-cols-2">
              <div className="space-y-1">
                <div className="flex gap-3">
                  <span className="min-w-[115px] font-semibold text-gray-600">Expense No:</span>
                  <span className="font-medium">{data?.expense_no || 'N/A'}</span>
                </div>
                <div className="flex gap-3">
                  <span className="min-w-[115px] font-semibold text-gray-600">Date:</span>
                  <span>{formatDate(data?.expense_date)}</span>
                </div>
                <div className="flex gap-3">
                  <span className="min-w-[115px] font-semibold text-gray-600">Paid By:</span>
                  <span>{data?.expense_by || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex gap-3">
                  <span className="min-w-[115px] font-semibold text-gray-600">Exchange:</span>
                  <span>1$ = 4,000 $</span>
                </div>
                <div className="flex gap-3">
                  <span className="min-w-[115px] font-semibold text-gray-600">Note:</span>
                  <span>{data?.expense_other || '-'}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 overflow-hidden">
              <table className="w-full border-collapse text-[15px]">
                <thead>
                  <tr className="border-b-2 border-slate-700 bg-slate-100">
                    <th className="px-3 py-3 text-left font-bold text-slate-800">Expense Type</th>
                    <th className="px-3 py-3 text-left font-bold text-slate-800">Description</th>
                    <th className="px-3 py-3 text-right font-bold text-slate-800">Qty</th>
                    <th className="px-3 py-3 text-right font-bold text-slate-800">Unit Price</th>
                    <th className="px-3 py-3 text-right font-bold text-slate-800">Amount ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items || []).map((item, index) => (
                    <tr key={index} className="border-b border-gray-200/70">
                      <td className="px-3 py-4 font-semibold text-slate-900">{item.expense_type_name || '-'}</td>
                      <td className="px-3 py-4 text-gray-700">{item.description || '-'}</td>
                      <td className="px-3 py-4 text-right">{formatMoney(item.quantity)}</td>
                      <td className="px-3 py-4 text-right">{formatMoney(item.unit_price)}</td>
                      <td className="px-3 py-4 text-right font-medium">{formatMoney(item.sub_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-[340px] space-y-2 text-[15px]">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium text-gray-700">Total Amount:</span>
                  <span className="font-bold text-slate-900">
                    {formatMoney(totalAmount)} $ (៛{usdAmount.toFixed(2)})
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4 text-emerald-700">
                  <span className="font-medium text-gray-700">Paid:</span>
                  <span className="font-bold">{formatMoney(totalAmount)} $</span>
                </div>
                <div className="flex items-baseline justify-between gap-4 text-red-600">
                  <span className="font-medium text-gray-700">Remaining:</span>
                  <span className="font-bold">0 $</span>
                </div>
              </div>
            </div>

            <div className="mt-20 grid grid-cols-3 gap-8 text-center text-[15px] text-gray-700">
              <div>
                <div className="mx-auto mb-3 h-px w-40 bg-gray-500" />
                <p className="font-medium">Prepared By</p>
              </div>
              <div>
                <div className="mx-auto mb-3 h-px w-40 bg-gray-500" />
                <p className="font-medium">Approved By</p>
              </div>
              <div>
                <div className="mx-auto mb-3 h-px w-40 bg-gray-500" />
                <p className="font-medium">Receiver</p>
              </div>
            </div>

            <div className="mt-12 text-center text-sm text-gray-400">
              Printed: {formatDateTime(data?.updated_at || data?.created_at)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrintExpanse;
