import React, { useRef, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import { useGetUserLoginQuery } from '../../../app/Features/usersSlice';
import { useReportText } from '../Reports/reportText';
import { Spin, Tag, Card, Row, Col, Table } from 'antd';
import dayjs from 'dayjs';
import { 
    FiPrinter, 
    FiDownload, 
    FiArrowLeft, 
    FiPackage, 
    FiUser, 
    FiCalendar, 
    FiDollarSign, 
    FiCreditCard,
    FiCheckCircle,
    FiClock,
    FiXCircle,
    FiInfo,
    FiTruck,
    FiHash
} from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { useOutletsContext } from '../../layouts/Management';
import { motion } from 'framer-motion';
import { useGetPurchaseByIdQuery, useGetPurchaseRawByIdQuery } from '../../../app/Features/purchasesSlice';

const PurchaseDetails = () => {
    const { id } = useParams();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { rt } = useReportText();
    const { darkMode } = useOutletsContext();
    const token = localStorage.getItem('token');
    
    const isRaw = pathname.includes('purchase-raw') || pathname.includes('detail-raw');
    
    const { data: userLogin } = useGetUserLoginQuery(token);
    const profile = userLogin?.data;

    const { data: purchaseResponse, isLoading, isFetching } = isRaw 
        ? useGetPurchaseRawByIdQuery({ id, token })
        : useGetPurchaseByIdQuery({ id, token });

    const purchase = purchaseResponse?.data || null;
    const reportRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => reportRef.current,
        contentRef: reportRef,
    });

    const formatUSD = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value || 0);
    };

    const formatKHR = (value) => {
        return `${(value || 0).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })} ៛`;
    };

    const exportToExcel = () => {
        if (!purchase) return;
        
        const itemsData = (purchase.items || purchase.details || [])?.map((item, index) => [
            index + 1,
            item.item_name || item.material_name || '',
            item.quantity || 0,
            item.price || item.unit_price || item.item_cost || 0,
            item.total || item.subtotal || 0
        ]) || [];

        const data = [
            [rt('Purchase Details Report')],
            [rt('Purchase No'), purchase.purchase_no],
            [rt('Supplier'), purchase.supplier_name || ''],
            [rt('Date'), dayjs(purchase.purchase_date).format('YYYY-MM-DD HH:mm:ss')],
            [],
            [rt('No'), rt('Item Name'), rt('Qty'), rt('Price'), rt('Total')],
            ...itemsData,
            [],
            ['', '', '', rt('Subtotal'), purchase.subtotal || purchase.sub_total || 0],
            ['', '', '', rt('Tax'), purchase.tax_amount || 0],
            ['', '', '', rt('Discount'), purchase.discount_amount || purchase.discount || 0],
            ['', '', '', rt('Shipping'), purchase.shippings?.fee || purchase.shipping_fee || 0],
            ['', '', '', rt('Grand Total'), purchase.grand_total || purchase.total_amount || 0],
            ['', '', '', rt('Total Paid'), purchase.paymented || purchase.total_paid || 0],
            ['', '', '', rt('Balance'), purchase.balance || 0],
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Purchase Details");
        XLSX.writeFile(wb, `Purchase_${purchase.purchase_no}.xlsx`);
    };

    const getStatusTag = (status) => {
        switch (status) {
            case 1:
                return <Tag color="success" icon={<FiCheckCircle className="inline mr-1" />}>{rt('Completed')}</Tag>;
            case 2:
                return <Tag color="error" icon={<FiXCircle className="inline mr-1" />}>{rt('Cancelled')}</Tag>;
            default:
                return <Tag color="warning" icon={<FiClock className="inline mr-1" />}>{rt('Pending')}</Tag>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spin size="large" tip={rt("Loading...")} />
            </div>
        );
    }

    if (!purchase) {
        return (
            <div className="p-8 text-center">
                <FiInfo size={48} className="mx-auto text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-600">{rt("Purchase not found")}</h2>
                <button 
                    onClick={() => navigate(-1)}
                    className="mt-4 flex items-center gap-2 mx-auto text-blue-600 hover:underline"
                >
                    <FiArrowLeft /> {rt("Back")}
                </button>
            </div>
        );
    }

    const items = purchase.items || purchase.details || [];

    return (
        <div className="report-page min-h-screen bg-transparent p-2 md:p-4 w-full">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: A4;
                        margin: 5mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        font-family: 'Siemreap', 'Poppins', sans-serif;
                        background: white !important;
                    }
                    .print-container {
                        font-size: 11px !important;
                        color: black !important;
                        background: white !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .shadow-sm, .shadow-md, .shadow-lg {
                        box-shadow: none !important;
                    }
                    .border {
                        border: 1px solid #e2e8f0 !important;
                    }
                    .bg-primary {
                        background: white !important;
                    }
                    .stats-grid {
                        display: grid !important;
                        grid-template-columns: repeat(4, 1fr) !important;
                        gap: 10px !important;
                    }
                    .stats-card {
                        border: 1px solid #e2e8f0 !important;
                        padding: 10px !important;
                    }
                }
            `}} />

            <div className="w-full mx-auto">
                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
                    <div>
                        <button 
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2"
                        >
                            <FiArrowLeft /> {rt("Back")}
                        </button>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {rt("Purchase Detail")} <span className="text-blue-600">#{purchase.purchase_no}</span>
                        </h1>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={exportToExcel}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-all shadow-sm h-10"
                        >
                            <FiDownload size={16} />
                            {rt('Export Excel')}
                        </button>
                        
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-all shadow-sm h-10 print:hidden"
                        >
                            <FiPrinter size={16} />
                            {rt('Print')}
                        </button>
                    </div>
                </div>

                <div className="print-container" ref={reportRef}>
                    {/* Print Header */}
                    <div className="hidden print:flex items-center justify-between mb-6 border-b pb-4 print-header">
                        <div className="flex items-center gap-4">
                            {profile?.image ? (
                                <img src={profile.image} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                                    <span className="text-2xl text-slate-400 uppercase">{profile?.username?.[0] || 'U'}</span>
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{profile?.username || 'User'}</h2>
                                <p className="text-xs text-slate-500">{profile?.role || 'Staff'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-xl font-bold text-blue-600">{rt("Purchase Detail")}</h1>
                            <p className="text-[10px] text-slate-500">{new Date().toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                                    <FiHash size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{rt("Purchase No")}</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{purchase.purchase_no}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
                                    <FiCalendar size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{rt("Date")}</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{dayjs(purchase.purchase_date).format('YYYY-MM-DD HH:mm')}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                                    <FiUser size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{rt("Supplier")}</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{purchase.supplier_name || rt('N/A')}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600">
                                    <FiInfo size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{rt("Status")}</p>
                                    <div className="mt-1">{getStatusTag(purchase.status)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stats-grid">
                        <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 border-l-4 border-blue-500 stats-card">
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Grand Total")}</p>
                            <p className="text-lg font-bold mt-1 text-blue-600">{formatUSD(purchase.grand_total || purchase.total_amount)}</p>
                            <p className="text-slate-400 text-[9px] mt-1">{formatKHR(purchase.grand_total_khr || (purchase.grand_total || purchase.total_amount) * (purchase.exchange_rate || 1))}</p>
                        </div>
                        <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 border-l-4 border-emerald-500 stats-card">
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Total Paid")}</p>
                            <p className="text-lg font-bold mt-1 text-emerald-600">{formatUSD(purchase.paymented || purchase.total_paid)}</p>
                            <p className="text-slate-400 text-[9px] mt-1">{rt("Settled Payments")}</p>
                        </div>
                        <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 border-l-4 border-rose-500 stats-card">
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Balance Due")}</p>
                            <p className={`text-lg font-bold mt-1 ${(purchase.balance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatUSD(purchase.balance)}
                            </p>
                            <p className="text-slate-400 text-[9px] mt-1">{rt("Remaining Amount")}</p>
                        </div>
                        <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 border-l-4 border-amber-500 stats-card">
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Subtotal")}</p>
                            <p className="text-lg font-bold mt-1 text-amber-600">{formatUSD(purchase.subtotal || purchase.sub_total)}</p>
                            <p className="text-slate-400 text-[9px] mt-1">{rt("Excl. Tax & Shipping")}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Items List */}
                        <div className="lg:col-span-2">
                            <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden h-full">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                                    <FiPackage className="text-blue-600" />
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">{rt("Purchase Items")}</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold">
                                            <tr>
                                                <th className="px-4 py-3">{rt("No")}</th>
                                                <th className="px-4 py-3">{rt("Item Name")}</th>
                                                <th className="px-4 py-3 text-center">{rt("Qty")}</th>
                                                <th className="px-4 py-3 text-right">{rt("Price")}</th>
                                                <th className="px-4 py-3 text-right">{rt("Total")}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {items.map((item, index) => (
                                                <tr key={index} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-4 py-3 text-slate-400 font-medium">{index + 1}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{item.item_name || item.material_name}</td>
                                                    <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right font-medium">{formatUSD(item.price || item.unit_price || item.item_cost)}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{formatUSD(item.total || item.subtotal)}</td>
                                                </tr>
                                            ))}
                                            {items.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="px-4 py-10 text-center text-slate-400 italic">{rt("No items found")}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-slate-50/50 dark:bg-slate-800/30 font-bold">
                                            <tr>
                                                <td colSpan="4" className="px-4 py-3 text-right text-slate-500 uppercase text-[10px]">{rt("Subtotal")}</td>
                                                <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{formatUSD(purchase.subtotal || purchase.sub_total)}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan="4" className="px-4 py-3 text-right text-slate-500 uppercase text-[10px]">{rt("Tax")} ({purchase.tax_percent || 0}%)</td>
                                                <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{formatUSD(purchase.tax_amount)}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan="4" className="px-4 py-3 text-right text-slate-500 uppercase text-[10px]">{rt("Discount")} ({purchase.discount_percent || 0}%)</td>
                                                <td className="px-4 py-3 text-right text-rose-500">-{formatUSD(purchase.discount_amount || purchase.discount)}</td>
                                            </tr>
                                            {purchase.shippings?.fee && (
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-3 text-right text-slate-500 uppercase text-[10px]">{rt("Shipping Fee")}</td>
                                                    <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{formatUSD(purchase.shippings.fee)}</td>
                                                </tr>
                                            )}
                                            <tr className="bg-blue-600 text-white">
                                                <td colSpan="4" className="px-4 py-4 text-right uppercase tracking-widest text-xs">{rt("Grand Total")}</td>
                                                <td className="px-4 py-4 text-right text-lg font-black">{formatUSD(purchase.grand_total || purchase.total_amount)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Payment & Shipping Info */}
                        <div className="space-y-6">
                            {/* Payment History */}
                            <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
                                <div className="flex items-center gap-2 mb-4 border-b border-slate-50 dark:border-slate-800 pb-3">
                                    <FiCreditCard className="text-emerald-600" />
                                    <h3 className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">{rt("Payment History")}</h3>
                                </div>
                                <div className="space-y-4">
                                    {(purchase.payments || [])?.map((payment, idx) => (
                                        <div key={idx} className="flex justify-between items-start pb-3 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0">
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{formatUSD(payment.amount)}</p>
                                                <p className="text-[10px] text-slate-400 capitalize">{payment.payment_method}</p>
                                                {payment.transection_id && <p className="text-[9px] text-slate-400">ID: {payment.transection_id}</p>}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-slate-500 font-medium">{dayjs(payment.paid_at || payment.created_at).format('YYYY-MM-DD')}</p>
                                                {payment.remark && <p className="text-[9px] text-slate-400 italic">"{payment.remark}"</p>}
                                            </div>
                                        </div>
                                    ))}
                                    {(purchase.payments || []).length === 0 && (
                                        <div className="py-4 text-center">
                                            <p className="text-xs text-slate-400 italic">{rt("No payments recorded")}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-medium">{rt("Total Paid")}</span>
                                        <span className="font-bold text-emerald-600">{formatUSD(purchase.paymented || purchase.total_paid)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Details */}
                            {purchase.shippings && (
                                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
                                    <div className="flex items-center gap-2 mb-4 border-b border-slate-50 dark:border-slate-800 pb-3">
                                        <FiTruck className="text-blue-600" />
                                        <h3 className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">{rt("Shipping Info")}</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500">{rt("Carrier")}</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{purchase.shippings.carrier || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500">{rt("Method")}</span>
                                            <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{purchase.shippings.vai || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500">{rt("Tracking No")}</span>
                                            <span className="font-bold text-blue-600 underline cursor-pointer">{purchase.shippings.tracking_number || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-50 dark:border-slate-800">
                                            <span className="text-slate-500">{rt("Shipping Fee")}</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{formatUSD(purchase.shippings.fee)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Meta Info */}
                            <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
                                <div className="flex items-center gap-2 mb-4 border-b border-slate-50 dark:border-slate-800 pb-3">
                                    <FiInfo className="text-slate-400" />
                                    <h3 className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">{rt("Other Info")}</h3>
                                </div>
                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">{rt("Created By")}</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{purchase.created_by_name}</span>
                                    </div>
                                    {purchase.due_date && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">{rt("Due Date")}</span>
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{purchase.due_date} {purchase.due_term && `(${purchase.due_term} days)`}</span>
                                        </div>
                                    )}
                                    {purchase.quote_no !== 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">{rt("Quotation No")}</span>
                                            <span className="font-medium text-blue-600">{purchase.quote_no}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Signature Footer for Print */}
                    <div className="hidden print:grid grid-cols-2 gap-20 mt-16 pt-10 border-t border-slate-100 px-10">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-16">{rt("Authorized Signature")}</p>
                            <div className="border-t border-slate-200 pt-2">
                                <p className="text-xs font-bold text-slate-900">{profile?.profile_name || profile?.username || 'Management'}</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-16">{rt("Supplier Signature")}</p>
                            <div className="border-t border-slate-200 pt-2">
                                <p className="text-xs font-bold text-slate-900">{purchase.supplier_name || 'Verified Supplier'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="hidden print:block mt-8 text-center text-[9px] text-slate-400">
                        <p>{rt("This is a computer-generated document. No signature is required.")}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseDetails;
