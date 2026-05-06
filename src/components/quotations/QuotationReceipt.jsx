import React, { useEffect, useRef, useState } from 'react';
import {
    FaArrowLeft,
    FaPrint,
    FaDownload,
    FaSave,
    FaShare,
    FaEnvelope,
    FaWhatsapp,
    FaCopy,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaUser,
    FaCalendarAlt,
    FaDollarSign,
    FaBox,
    FaPercent,
    FaTruck,
    FaTag,
    FaFilePdf,
    FaImage,
    FaGlobe
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useGetQuoteByIdQuery } from '../../../app/Features/quoteSlice';
import { useGetUserLoginQuery } from '../../../app/Features/usersSlice';
import handleDownload from '../../services/imageDowload';
import { convertImageToBase64 } from '../../services/serviceFunction';

const QuotationReceipt = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const token = localStorage.getItem('token');
    const { data, refetch } = useGetQuoteByIdQuery({ id, token });
    const receiptRef = useRef(null);
    const [quotation, setQuotation] = useState({});
    const [logoBase64, setLogoBase64] = useState();
    const { data: company } = useGetUserLoginQuery(token);

    useEffect(() => {
        const savedLang = localStorage.getItem("language");
        if (savedLang) {
            i18n.changeLanguage(savedLang);
        }
    }, [i18n]);

    const toggleLanguage = () => {
        const newLang = i18n.language === "en" ? "kh" : "en";
        i18n.changeLanguage(newLang);
        localStorage.setItem("language", newLang);
    };

    useEffect(() => {
        setQuotation(data?.data);
        convertImageToBase64(company?.data?.image).then(setLogoBase64);
    }, [data, company]);

    const getStatusConfig = (status) => {
        const configs = {
            submitted: { color: 'bg-yellow-50 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800', icon: <FaClock className="mr-1" />, label: t('pending') },
            approved: { color: 'bg-green-50 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', icon: <FaCheckCircle className="mr-1" />, label: t('approved') },
            rejected: { color: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', icon: <FaTimesCircle className="mr-1" />, label: t('rejected') },
            draft: { color: 'bg-gray-50 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600', icon: <FaTag className="mr-1" />, label: t('draft') }
        };
        return configs[status] || configs.draft;
    };

    const statusConfig = getStatusConfig(quotation?.status);

    const handlePrint = () => window.print();

    const calculateSubtotal = () => {
        return quotation?.details?.reduce((sum, item) => sum + parseFloat(item.total_price), 0) || 0;
    };

    return (
        <div className=" bg-transparent p-4 md:p-6 font-sans min-h-screen">
            {/* Header with Actions – Excel style */}
            <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-4 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center mr-4 px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-gray-800 dark:text-gray-200"
                        >
                            <FaArrowLeft className="mr-1" size={12} />
                            {t('back')}
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('quotationReceipt')}</h1>
                                <button
                                    onClick={toggleLanguage}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors"
                                >
                                    <FaGlobe size={10} />
                                    {i18n.language === "en" ? "KH" : "EN"}
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                #{quotation?.quotation_number} • {quotation?.customer_name}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() =>
                                handleDownload(receiptRef, "jpg", "receipt", data?.data?.quotation_number || id)
                            }
                            className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-gray-800 dark:text-gray-200"
                        >
                            <FaDownload className="mr-1" size={12} />
                            {t('download')}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-gray-800 dark:text-gray-200"
                        >
                            <FaPrint className="mr-1" size={12} />
                            {t('print')}
                        </button>
                    </div>
                </div>

                {/* Status bar – minimal */}
                <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4 text-sm">
                    <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2 py-0.5 border ${statusConfig.color} rounded`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                        </span>
                        <div className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{t('createdDate')}:</span> {new Date(quotation?.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{t('validUntil')}:</span> {new Date(quotation?.date_term).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="font-semibold text-blue-600 dark:text-blue-400">{t('total')}: ${quotation?.grand_total}</div>
                </div>
            </div>

            {/* Receipt – Excel style document */}
            <div className="flex justify-center print-area">
                <div
                    ref={receiptRef}
                    className="w-full max-w-4xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-sm"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-300 dark:border-gray-700">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div className="mb-4 md:mb-0">
                                <div className="flex items-center mb-3">
                                    <div className={`w-12 h-12 ${!logoBase64 && "bg-blue-600"} border border-gray-300 dark:border-gray-600 overflow-hidden flex items-center justify-center mr-3`}>
                                        {company ? <img src={logoBase64} alt="" className="object-contain" />
                                            : <span className="text-white text-lg font-bold">CP</span>}
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-gray-800 dark:text-white">{company?.data?.username}</h1>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-1">{t('quotations').toUpperCase()}</h2>
                                <div className="text-base font-semibold text-gray-800 dark:text-gray-200">#{quotation?.quotation_number}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                                    <div className="flex items-center justify-end">
                                        <FaCalendarAlt className="mr-1" size={12} />
                                        {t('date')}: {new Date(quotation?.date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <FaCalendarAlt className="mr-1" size={12} />
                                        {t('dueDate')}: {new Date(quotation?.date_term).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <FaTag className="mr-1" size={12} />
                                        {t('status')}: <span className={`ml-1 px-2 py-0.5 border ${statusConfig.color} rounded`}>
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bill To / Details – two columns with border */}
                    <div className="p-6 border-b border-gray-300 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">{t('billTo')}</h3>
                            <div className="flex items-start">
                                <FaUser className="mr-2 text-gray-400" size={14} />
                                <div>
                                    <div className="font-medium text-gray-800 dark:text-white">{quotation?.customer_name}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">ID: {quotation?.customer_id}</div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">{t('details')}</h3>
                            <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('quoteNo')}:</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{quotation?.quotation_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('issueDate')}:</span>
                                    <span className="text-gray-800 dark:text-gray-200">{new Date(quotation?.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('paymentTerms')}:</span>
                                    <span className="text-gray-800 dark:text-gray-200">{quotation?.credit_term} {t('days')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('validUntil')}:</span>
                                    <span className="text-gray-800 dark:text-gray-200">{new Date(quotation?.date_term).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="p-6 border-b border-gray-300 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">{t('items')}</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                                        <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">{t('description')}</th>
                                        <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">{t('quantity')}</th>
                                        <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">{t('unitPrice')}</th>
                                        <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">{t('discount')}</th>
                                        <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">{t('total')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotation?.details?.map((item) => (
                                        <tr key={item.detail_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="py-2 px-2">
                                                <div className="font-medium text-gray-800 dark:text-gray-200">{item.item_name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-500">{t('unit')}: {item.scale}</div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{item.quantity}</td>
                                            <td className="py-2 px-2 text-gray-700 dark:text-gray-300">${item.price}</td>
                                            <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                                                {parseFloat(item.discount) > 0 ? `${item.discount}` : '-'}
                                            </td>
                                            <td className="py-2 px-2 font-medium text-gray-800 dark:text-gray-200">${item.total_price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals Section */}
                    <div className="p-6">
                        <div className="flex justify-end">
                            <div className="w-full md:w-1/2 lg:w-1/3 text-sm">
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">{t('subtotal')}:</span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">${calculateSubtotal().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                            <FaTruck className="mr-1" size={12} /> {t('delivery')}:
                                        </span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">${quotation?.delivery_fee}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                            <FaPercent className="mr-1" size={12} /> {t('discount')}:
                                        </span>
                                        <span className="font-medium text-green-600 dark:text-green-400">-${quotation?.total_discount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                            <FaPercent className="mr-1" size={12} /> {t('tax')}:
                                        </span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{quotation?.tax}%</span>
                                    </div>
                                    <div className="border-t border-gray-300 dark:border-gray-700 pt-2 mt-2">
                                        <div className="flex justify-between text-base font-bold">
                                            <span className="text-gray-800 dark:text-white">{t('grandTotal')}:</span>
                                            <span className="text-blue-600 dark:text-blue-400">${quotation?.grand_total}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                {quotation?.notes && (
                                    <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-700">
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('note')}</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{quotation?.notes}</p>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-500">
                                    <p>{t('thankYouBusiness')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print styles (unchanged) */}
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; box-shadow: none; border: none !important; }
                    .no-print { display: none !important; }
                    @page { margin: 20mm; }
                    .dark .print-area { background: white !important; color: black !important; }
                    .dark .print-area * { color: black !important; border-color: #ddd !important; }
                }
            `}</style>
        </div>
    );
};

export default QuotationReceipt;