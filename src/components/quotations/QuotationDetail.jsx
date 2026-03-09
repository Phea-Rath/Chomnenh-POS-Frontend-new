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

const QuotationDetail = () => {
    const { id } = useParams();
    const navigator = useNavigate();
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
        setQuotation(data?.data)
    }, [data]);

    // Status configuration
    const getStatusConfig = (status) => {
        const configs = {
            submitted: {
                color: 'bg-yellow-50 text-yellow-800 border-yellow-300',
                icon: <FaClock className="mr-1" />,
                label: 'Pending Review'
            },
            approved: {
                color: 'bg-green-50 text-green-800 border-green-300',
                icon: <FaCheckCircle className="mr-1" />,
                label: 'Approved'
            },
            rejected: {
                color: 'bg-red-50 text-red-800 border-red-300',
                icon: <FaTimesCircle className="mr-1" />,
                label: 'Rejected'
            },
            draft: {
                color: 'bg-gray-50 text-gray-800 border-gray-300',
                icon: <FaTag className="mr-1" />,
                label: 'Draft'
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
                        className="flex items-center mr-4 text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                        <FaArrowLeft className="mr-1" size={12} />
                        Back
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Quotation #{quotation?.quotation_number}
                        </h1>
                        <div className="flex items-center mt-1 text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 border ${statusConfig.color} rounded`}>
                                {statusConfig.icon}
                                {statusConfig.label}
                            </span>
                            <span className="ml-3 text-gray-600">
                                Created: {new Date(quotation?.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons - Excel style */}
                <div className="flex flex-wrap gap-2">


                    <button
                        onClick={() => navigator(`/home/quotations/receipt/${id}`)}
                        className="flex items-center px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-100 text-sm"
                    >
                        <FaPrint className="mr-1" size={12} />
                        Print
                    </button>

                    <button onClick={() => navigator(`/home/quotations/edit/${id}`)} className="flex items-center px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-100 text-sm">
                        <FaEdit className="mr-1" size={12} />
                        Edit
                    </button>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items Section */}
                    <div className="bg-white border border-gray-300 rounded">
                        <div
                            className="flex items-center justify-between px-4 py-3 border-b border-gray-300 cursor-pointer bg-gray-50"
                            onClick={() => setShowItemsDetails(!showItemsDetails)}
                        >
                            <h2 className="font-semibold text-gray-700">Items</h2>
                            {showItemsDetails ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                        </div>
                        {showItemsDetails && (
                            <div className="p-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-300 bg-gray-100">
                                                <th className="text-left py-2 px-2 font-medium text-gray-600">Item</th>
                                                <th className="text-left py-2 px-2 font-medium text-gray-600">Qty</th>
                                                <th className="text-left py-2 px-2 font-medium text-gray-600">Price</th>
                                                <th className="text-left py-2 px-2 font-medium text-gray-600">Discount</th>
                                                <th className="text-left py-2 px-2 font-medium text-gray-600">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {quotation?.details?.map((item) => (
                                                <tr key={item.detail_id} className="border-b border-gray-200 hover:bg-gray-50">
                                                    <td className="py-2 px-2">
                                                        <div className="font-medium text-gray-800">{item.item_name}</div>
                                                        <div className="text-xs text-gray-500">{item.item_code}</div>
                                                    </td>
                                                    <td className="py-2 px-2">{item.quantity}</td>
                                                    <td className="py-2 px-2">${item.price}</td>
                                                    <td className="py-2 px-2">
                                                        {parseFloat(item.discount) > 0 ? `${item.discount} (${item.discount_percentage})` : '-'}
                                                    </td>
                                                    <td className="py-2 px-2 font-semibold">${item.total_price}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes Section */}
                    <div className="bg-white border border-gray-300 rounded">
                        <div
                            className="flex items-center justify-between px-4 py-3 border-b border-gray-300 cursor-pointer bg-gray-50"
                            onClick={() => setShowNotes(!showNotes)}
                        >
                            <h2 className="font-semibold text-gray-700">Notes & Instructions</h2>
                            {showNotes ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                        </div>
                        {showNotes && (
                            <div className="p-4 space-y-3 text-sm">
                                <div>
                                    <h3 className="font-medium text-gray-700 mb-1">Quotation Notes</h3>
                                    <p className="text-gray-600 bg-gray-50 p-2 border border-gray-200 rounded">
                                        {quotation?.notes || 'No notes'}
                                    </p>
                                </div>
                                {quotation?.special_instructions && (
                                    <div>
                                        <h3 className="font-medium text-gray-700 mb-1">Special Instructions</h3>
                                        <p className="text-gray-600 bg-yellow-50 p-2 border border-yellow-200 rounded">
                                            {quotation.special_instructions}
                                        </p>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-medium text-gray-700 mb-1">Payment Terms</h3>
                                        <p className="text-gray-600">{quotation?.payment_terms}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-700 mb-1">Shipping Method</h3>
                                        <p className="text-gray-600 flex items-center">
                                            <FaTruck className="mr-1 text-gray-400" size={12} />
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
                    <div className="bg-white border border-gray-300 rounded">
                        <div className="px-4 py-3 border-b border-gray-300 bg-gray-50">
                            <h2 className="font-semibold text-gray-700">Summary</h2>
                        </div>
                        <div className="p-4 text-sm">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tax ({quotation?.tax_rate}%)</span>
                                    <span className="font-medium">${quotation?.tax_amount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Delivery Fee</span>
                                    <span className="font-medium">${quotation?.delivery_fee}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Discount</span>
                                    <span className="font-medium text-green-600">-${quotation?.total_discount}</span>
                                </div>
                                <div className="border-t border-gray-300 pt-2 mt-2">
                                    <div className="flex justify-between font-bold">
                                        <span>Grand Total</span>
                                        <span className="text-blue-600">${quotation?.grand_total}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-300 space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Date Issued</span>
                                    <span className="font-medium">{new Date(quotation?.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Valid Until</span>
                                    <span className="font-medium">{new Date(quotation?.date_term).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Credit Term</span>
                                    <span className="font-medium">{quotation?.credit_term} days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Sales Person</span>
                                    <span className="font-medium">{quotation?.sales_person}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className="bg-white border border-gray-300 rounded">
                        <div
                            className="flex items-center justify-between px-4 py-3 border-b border-gray-300 cursor-pointer bg-gray-50"
                            onClick={() => setShowCustomerInfo(!showCustomerInfo)}
                        >
                            <h2 className="font-semibold text-gray-700">Customer Information</h2>
                            {showCustomerInfo ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                        </div>
                        {showCustomerInfo && (
                            <div className="p-4 text-sm">
                                <div className="flex items-start mb-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-2">
                                        <FaUser className="text-blue-600" size={14} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{quotation?.customer_name}</h3>
                                        <p className="text-xs text-gray-500">ID: {quotation?.customer_id}</p>
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
