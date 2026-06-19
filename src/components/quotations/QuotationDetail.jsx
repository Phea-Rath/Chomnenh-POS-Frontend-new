import React, { useEffect, useState } from 'react';
import {
    FaArrowLeft,
    FaEdit,
    FaPrint,
    FaDownload,
    FaShare,
    FaCopy,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaUser,
    FaCalendarAlt,
    FaDollarSign,
    FaTag,
    FaTruck,
    FaPercent,
    FaBox,
    FaFileInvoiceDollar,
    FaEnvelope,
    FaWhatsapp,
    FaEllipsisH,
    FaChevronDown,
    FaChevronUp
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router';
import { useGetQuoteByIdQuery } from '../../../app/Features/quoteSlice';
import { useTranslation } from 'react-i18next';

const QuotationDetail = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const token = localStorage.getItem('token');
    const { data, refetch } = useGetQuoteByIdQuery({ id, token });
    const navigate = useNavigate();
    const [quotation, setQuotation] = useState({});
    const [showItemsDetails, setShowItemsDetails] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [showCustomerInfo, setShowCustomerInfo] = useState(true);
    const [showNotes, setShowNotes] = useState(true);
    const [showShareOptions, setShowShareOptions] = useState(false);

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
        setQuotation(data?.data)
    }, [data]);

    // Status configuration
    const getStatusConfig = (status) => {
        const configs = {
            submitted: {
                color: 'bg-yellow-50 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
                icon: <FaClock className="mr-1" />,
                label: t('submitted')
            },
            approved: {
                color: 'bg-green-50 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
                icon: <FaCheckCircle className="mr-1" />,
                label: t('approved')
            },
            rejected: {
                color: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
                icon: <FaTimesCircle className="mr-1" />,
                label: t('rejected')
            },
            draft: {
                color: 'bg-gray-50 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
                icon: <FaTag className="mr-1" />,
                label: t('draft')
            }
        };
        return configs[status] || configs.draft;
    };

    const statusConfig = getStatusConfig(quotation?.status);

    // Calculate totals
    const calculateSubtotal = () => {
        return quotation?.details?.reduce((sum, item) => sum + parseFloat(item.total_price), 0) || 0;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        alert('PDF download functionality would be implemented here');
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    };

    const handleShareEmail = () => {
        const subject = `Quotation: ${quotation?.quotation_number}`;
        const body = `Please review quotation: ${quotation?.quotation_number}\n\nTotal Amount: $${quotation?.grand_total}\n\nView details: ${window.location.href}`;
        window.location.href = `mailto:${quotation?.customer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleShareWhatsApp = () => {
        const message = `Quotation ${quotation?.quotation_number} for $${quotation?.grand_total}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleConvertToInvoice = () => {
        navigate('/orders', { state: { quotation } });
    };

    const handleDuplicate = () => {
        alert('Duplicating quotation...');
    };

    return (
        <div className=" bg-transparent p-4 md:p-6 font-sans">
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center mr-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800"
                    >
                        <FaArrowLeft className="mr-1" size={12} />
                        {t('back')}
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                                {t('quotationNo')} #{quotation?.quotation_number}
                            </h1>
                            <button
                                onClick={toggleLanguage}
                                className="px-2 py-1 rounded text-xs font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                {i18n.language === "en" ? "KH" : "EN"}
                            </button>
                        </div>
                        <div className="flex items-center mt-1 text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 border ${statusConfig.color} rounded`}>
                                {statusConfig.icon}
                                {statusConfig.label}
                            </span>
                            <span className="ml-3 text-gray-600 dark:text-gray-400">
                                {t('createdDate')}: {new Date(quotation?.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items Section */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
                        <div
                            className="flex items-center justify-between px-4 py-3 border-b border-gray-300 dark:border-gray-700 cursor-pointer bg-gray-50 dark:bg-gray-900"
                            onClick={() => setShowItemsDetails(!showItemsDetails)}
                        >
                            <h2 className="font-semibold text-gray-700 dark:text-gray-300">{t('items')}</h2>
                            <div className="dark:text-gray-400">
                                {showItemsDetails ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                            </div>
                        </div>
                        {showItemsDetails && (
                            <div className="p-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                                                <th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-300">{t('item')}</th>
                                                <th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-300">{t('quantity')}</th>
                                                <th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-300">{t('price')}</th>
                                                <th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-300">{t('discount')}</th>
                                                <th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-300">{t('total')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {quotation?.details?.map((item) => (
                                                <tr key={item.detail_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="py-2 px-2">
                                                        <div className="font-medium text-gray-800 dark:text-white">{item.item_name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.item_code}</div>
                                                    </td>
                                                    <td className="py-2 px-2 dark:text-gray-300">{item.quantity}</td>
                                                    <td className="py-2 px-2 dark:text-gray-300">${item.price}</td>
                                                    <td className="py-2 px-2 dark:text-gray-300">
                                                        {parseFloat(item.discount) > 0 ? `${item.discount} (${item.discount_percentage})` : '-'}
                                                    </td>
                                                    <td className="py-2 px-2 font-semibold dark:text-white">${item.total_price}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes Section */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
                        <div
                            className="flex items-center justify-between px-4 py-3 border-b border-gray-300 dark:border-gray-700 cursor-pointer bg-gray-50 dark:bg-gray-900"
                            onClick={() => setShowNotes(!showNotes)}
                        >
                            <h2 className="font-semibold text-gray-700 dark:text-gray-300">{t('notesAndDescription')}</h2>
                            <div className="dark:text-gray-400">
                                {showNotes ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                            </div>
                        </div>
                        {showNotes && (
                            <div className="p-4 space-y-3 text-sm">
                                <div>
                                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t('quotationNotes')}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 border border-gray-200 dark:border-gray-700 rounded">
                                        {quotation?.notes || t('noNotes')}
                                    </p>
                                </div>
                                {quotation?.special_instructions && (
                                    <div>
                                        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t('specialInstructions')}</h3>
                                        <p className="text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 border border-yellow-200 dark:border-yellow-700/50 rounded">
                                            {quotation.special_instructions}
                                        </p>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t('paymentTerms')}</h3>
                                        <p className="text-gray-600 dark:text-gray-400">{quotation?.payment_terms}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t('shippingMethod')}</h3>
                                        <p className="text-gray-600 dark:text-gray-400 flex items-center">
                                            <FaTruck className="mr-1 text-gray-400 dark:text-gray-500" size={12} />
                                            {quotation?.shipping_method}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
                        <div className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                            <h2 className="font-semibold text-gray-700 dark:text-gray-300">{t('summary')}</h2>
                        </div>
                        <div className="p-4 text-sm">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('subtotal')}</span>
                                    <span className="font-medium dark:text-gray-200">${calculateSubtotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('tax')} ({quotation?.tax_rate}%)</span>
                                    <span className="font-medium dark:text-gray-200">${quotation?.tax_amount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('deliveryFee')}</span>
                                    <span className="font-medium dark:text-gray-200">${quotation?.delivery_fee}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('discount')}</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">-${quotation?.total_discount}</span>
                                </div>
                                <div className="border-t border-gray-300 dark:border-gray-700 pt-2 mt-2">
                                    <div className="flex justify-between font-bold">
                                        <span className="dark:text-white">{t('grandTotal')}</span>
                                        <span className="text-blue-600 dark:text-blue-400">${quotation?.grand_total}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700 space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('issueDate')}</span>
                                    <span className="font-medium dark:text-gray-200">{new Date(quotation?.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('validUntil')}</span>
                                    <span className="font-medium dark:text-gray-200">{new Date(quotation?.date_term).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('creditTerm')}</span>
                                    <span className="font-medium dark:text-gray-200">{quotation?.credit_term} {t('days')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('salesPerson')}</span>
                                    <span className="font-medium dark:text-gray-200">{quotation?.sales_person}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
                        <div
                            className="flex items-center justify-between px-4 py-3 border-b border-gray-300 dark:border-gray-700 cursor-pointer bg-gray-50 dark:bg-gray-900"
                            onClick={() => setShowCustomerInfo(!showCustomerInfo)}
                        >
                            <h2 className="font-semibold text-gray-700 dark:text-gray-300">{t('customerInformation')}</h2>
                            <div className="dark:text-gray-400">
                                {showCustomerInfo ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                            </div>
                        </div>
                        {showCustomerInfo && (
                            <div className="p-4 text-sm">
                                <div className="flex items-start mb-3">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center mr-2">
                                        <FaUser className="text-blue-600 dark:text-blue-400" size={14} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-white">{quotation?.customer_name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('id')}: {quotation?.customer_id}</p>
                                    </div>
                                </div>
                                {/* <div className="space-y-2">
                                    <div className="flex">
                                        <FaEnvelope className="text-gray-400 mr-2" size={12} />
                                        <a href={`mailto:${quotation?.customer_email}`} className="text-blue-600 hover:underline">
                                            {quotation?.customer_email}
                                        </a>
                                    </div>
                                    <div className="flex">
                                        <span className="text-gray-400 mr-2">📱</span>
                                        <a href={`tel:${quotation?.customer_tel}`} className="text-gray-800 hover:underline">
                                            {quotation?.customer_tel}
                                        </a>
                                    </div>
                                    <div className="flex">
                                        <span className="text-gray-400 mr-2">📍</span>
                                        <span className="text-gray-800">{quotation?.customer_address}</span>
                                    </div>
                                    <div className="flex">
                                        <FaTruck className="text-gray-400 mr-2" size={12} />
                                        <span className="text-gray-800">{quotation?.shipping_address}</span>
                                    </div>
                                </div> */}
                                {/* <div className="mt-4 pt-3 border-t border-gray-200">
                                    <button className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-100 text-sm">
                                        <FaUser className="mr-2" size={12} />
                                        View Customer Profile
                                    </button>
                                </div> */}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            {/* <div className="mt-8 flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-gray-300">
                <div className="text-xs text-gray-500">
                    Last updated: {new Date(quotation?.updated_at).toLocaleString()}
                </div>
                <div className="flex flex-wrap gap-2">
                    <button className="px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-100 text-sm">
                        Save as Draft
                    </button>
                    {quotation?.status === 'submitted' && (
                        <>
                            <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                                Reject
                            </button>
                            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                                Approve
                            </button>
                        </>
                    )}
                </div>
            </div> */}

            {/* Print styles (unchanged) */}
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default QuotationDetail;
