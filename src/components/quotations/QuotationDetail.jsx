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
                color: 'bg-yellow-100 text-yellow-800 border-gray-300 border-yellow-200',
                icon: <FaClock className="mr-2" />,
                label: 'Pending Review'
            },
            approved: {
                color: 'bg-green-100 text-green-800 border-gray-300 border-green-200',
                icon: <FaCheckCircle className="mr-2" />,
                label: 'Approved'
            },
            rejected: {
                color: 'bg-red-100 text-red-800 border-gray-300 border-red-200',
                icon: <FaTimesCircle className="mr-2" />,
                label: 'Rejected'
            },
            draft: {
                color: 'bg-gray-100 text-gray-800 border-gray-300 border-gray-200',
                icon: <FaTag className="mr-2" />,
                label: 'Draft'
            }
        };
        return configs[status] || configs.draft;
    };

    const statusConfig = getStatusConfig(quotation?.status);

    // Calculate totals
    const calculateSubtotal = () => {
        return quotation?.details?.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
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
        const body = `Please review quotation?: ${quotation?.quotation_number}\n\nTotal Amount: $${quotation?.grand_total}\n\nView details: ${window.location.href}`;
        window.location.href = `mailto:${quotation?.customer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleShareWhatsApp = () => {
        const message = `Quotation ${quotation?.quotation_number} for $${quotation?.grand_total}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleConvertToInvoice = () => {
        navigate('/invoices/create', { state: { quotation } });
    };

    const handleDuplicate = () => {
        alert('Duplicating quotation?...');
        // In real app, this would call an API
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Header with Actions */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center mr-4 text-gray-600 hover:text-gray-900"
                        >
                            <FaArrowLeft className="mr-2" />
                            Back
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                Quotation #{quotation?.quotation_number}
                            </h1>
                            <div className="flex items-center mt-1">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border-gray-300 border ${statusConfig.color}`}>
                                    {statusConfig.icon}
                                    {statusConfig.label}
                                </span>
                                <span className="ml-4 text-sm text-gray-600">
                                    Created: {new Date(quotation?.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* <div className="flex flex-wrap gap-2">
                        // Primary Actions 
                        <div className="relative">
                            <button
                                onClick={() => setShowShareOptions(!showShareOptions)}
                                className="flex items-center px-4 py-2 border-gray-300 border border-gray-300 border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <FaShare className="mr-2" />
                                Share
                                <FaChevronDown className="ml-2" />
                            </button>

                            // Share Dropdown 
                            {showShareOptions && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-sm-lg border-gray-300 border border-gray-300 border-gray-200 z-10">
                                    <button
                                        onClick={handleShareEmail}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <FaEnvelope className="mr-3" />
                                        Share via Email
                                    </button>
                                    <button
                                        onClick={handleShareWhatsApp}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <FaWhatsapp className="mr-3" />
                                        Share via WhatsApp
                                    </button>
                                    <button
                                        onClick={handleCopyLink}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <FaCopy className="mr-3" />
                                        Copy Link
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handlePrint}
                            className="flex items-center px-4 py-2 border-gray-300 border border-gray-300 border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <FaPrint className="mr-2" />
                            Print
                        </button>

                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center px-4 py-2 border-gray-300 border border-gray-300 border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <FaDownload className="mr-2" />
                            PDF
                        </button>

                        // Status-based Actions
                        {quotation?.status === 'approved' && (
                            <button
                                onClick={handleConvertToInvoice}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <FaFileInvoiceDollar className="mr-2" />
                                Convert to Invoice
                            </button>
                        )}

                        <button
                            onClick={handleDuplicate}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <FaCopy className="mr-2" />
                            Duplicate
                        </button>

                        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            <FaEdit className="mr-2" />
                            Edit
                        </button>
                    </div> */}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Information */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items Section */}
                    <div className="bg-white rounded-xl shadow-sm">
                        <div
                            className="flex items-center justify-between p-6 cursor-pointer border-gray-300 border-b"
                            onClick={() => setShowItemsDetails(!showItemsDetails)}
                        >
                            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                            {showItemsDetails ? <FaChevronUp /> : <FaChevronDown />}
                        </div>

                        {showItemsDetails && (
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-gray-300 border-b">
                                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Item</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Qty</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Price</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Discount</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {quotation?.details?.map((item) => (
                                                <tr key={item.detail_id} className="border-gray-300 border-b hover:bg-gray-50">
                                                    <td className="py-4 px-4">
                                                        <div className="font-medium text-gray-900">{item.item_name}</div>
                                                        <div className="text-sm text-gray-600">{item.description}</div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Code: {item.item_code} • Unit: {item.scale}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center">
                                                            <FaBox className="mr-2 text-gray-400" />
                                                            {item.quantity}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center">
                                                            <FaDollarSign className="mr-1 text-gray-400" />
                                                            {item.price}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        {parseFloat(item.discount) > 0 ? (
                                                            <div className="flex items-center text-green-600">
                                                                <FaPercent className="mr-1" />
                                                                {item.discount} ({item.discount_percentage})
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-4 font-semibold">
                                                        <div className="flex items-center">
                                                            <FaDollarSign className="mr-1 text-gray-400" />
                                                            {item.total_price}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes & Instructions */}
                    <div className="bg-white rounded-xl shadow-sm">
                        <div
                            className="flex items-center justify-between p-6 cursor-pointer border-gray-300 border-b"
                            onClick={() => setShowNotes(!showNotes)}
                        >
                            <h2 className="text-lg font-semibold text-gray-900">Notes & Instructions</h2>
                            {showNotes ? <FaChevronUp /> : <FaChevronDown />}
                        </div>

                        {showNotes && (
                            <div className="p-6 space-y-4">
                                <div>
                                    <h3 className="font-medium text-gray-700 mb-2">Quotation Notes</h3>
                                    <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                                        {quotation?.notes}
                                    </p>
                                </div>

                                {quotation?.special_instructions && (
                                    <div>
                                        <h3 className="font-medium text-gray-700 mb-2">Special Instructions</h3>
                                        <p className="text-gray-600 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                            {quotation?.special_instructions}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-medium text-gray-700 mb-2">Payment Terms</h3>
                                        <p className="text-gray-600">{quotation?.payment_terms}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-700 mb-2">Shipping Method</h3>
                                        <div className="flex items-center text-gray-600">
                                            <FaTruck className="mr-2" />
                                            {quotation?.shipping_method}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Column - Summary & Customer */}
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-white rounded-xl shadow-sm">
                        <div className="p-6 border-gray-300 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">
                                        ${(calculateSubtotal() || 0)?.toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600 flex items-center">
                                        <FaPercent className="mr-2 text-sm" />
                                        Tax ({quotation?.tax_rate}%)
                                    </span>
                                    <span className="font-medium">${quotation?.tax_amount}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600 flex items-center">
                                        <FaTruck className="mr-2 text-sm" />
                                        Delivery Fee
                                    </span>
                                    <span className="font-medium">${quotation?.delivery_fee}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600 flex items-center">
                                        <FaTag className="mr-2 text-sm" />
                                        Discount
                                    </span>
                                    <span className="font-medium text-green-600">
                                        -${quotation?.total_discount}
                                    </span>
                                </div>

                                <div className="border-gray-300 border-t pt-3 mt-3">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Grand Total</span>
                                        <span className="text-blue-600">
                                            ${quotation?.grand_total}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-gray-300 border-t">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Date Issued</span>
                                        <span className="font-medium">
                                            {new Date(quotation?.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Valid Until</span>
                                        <span className="font-medium">
                                            {new Date(quotation?.date_term).toLocaleDateString()}
                                        </span>
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
                    </div>

                    {/* Customer Information */}
                    <div className="bg-white rounded-xl shadow-sm">
                        <div
                            className="flex items-center justify-between p-6 cursor-pointer border-gray-300 border-b"
                            onClick={() => setShowCustomerInfo(!showCustomerInfo)}
                        >
                            <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
                            {showCustomerInfo ? <FaChevronUp /> : <FaChevronDown />}
                        </div>

                        {showCustomerInfo && (
                            <div className="p-6">
                                <div className="flex items-start mb-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                                        <FaUser className="text-blue-600 text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{quotation?.customer_name}</h3>
                                        <p className="text-sm text-gray-600">Customer ID: CUST-{quotation?.customer_id}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start">
                                        <FaEnvelope className="text-gray-400 mt-1 mr-3" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-700">Email</div>
                                            <a
                                                href={`mailto:${quotation?.customer_email}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {quotation?.customer_email}
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="text-gray-400 mt-1 mr-3">📱</div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-700">Phone</div>
                                            <a
                                                href={`tel:${quotation?.customer_phone}`}
                                                className="text-gray-900 hover:underline"
                                            >
                                                {quotation?.customer_phone}
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="text-gray-400 mt-1 mr-3">📍</div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-700">Address</div>
                                            <div className="text-gray-900 whitespace-pre-line">
                                                {quotation?.customer_address}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <FaTruck className="text-gray-400 mt-1 mr-3" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-700">Shipping Address</div>
                                            <div className="text-gray-900 whitespace-pre-line">
                                                {quotation?.shipping_address}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-gray-300 border-t">
                                    <button className="w-full flex items-center justify-center px-4 py-2 border-gray-300 border rounded-lg hover:bg-gray-50">
                                        <FaUser className="mr-2" />
                                        View Customer Profile
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    {/* <div className="bg-white rounded-xl shadow-sm">
                        <div className="p-6 border-gray-300 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-3">
                                <button className="flex flex-col items-center justify-center p-4 border-gray-300 border border-gray-300 border-gray-200 rounded-lg hover:bg-gray-50">
                                    <FaEdit className="text-blue-600 text-xl mb-2" />
                                    <span className="text-sm font-medium">Edit</span>
                                </button>
                                <button
                                    onClick={handleDuplicate}
                                    className="flex flex-col items-center justify-center p-4 border-gray-300 border border-gray-300 border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    <FaCopy className="text-green-600 text-xl mb-2" />
                                    <span className="text-sm font-medium">Duplicate</span>
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex flex-col items-center justify-center p-4 border-gray-300 border border-gray-300 border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    <FaPrint className="text-purple-600 text-xl mb-2" />
                                    <span className="text-sm font-medium">Print</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-4 border-gray-300 border border-gray-300 border-gray-200 rounded-lg hover:bg-gray-50">
                                    <FaDownload className="text-indigo-600 text-xl mb-2" />
                                    <span className="text-sm font-medium">PDF</span>
                                </button>
                            </div>

                            <div className="mt-6">
                                <button className="w-full flex items-center justify-center px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border-gray-300 border border-gray-300 border-red-200">
                                    <FaTimesCircle className="mr-2" />
                                    Delete Quotation
                                </button>
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 flex flex-wrap justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                    Last updated: {new Date(quotation?.updated_at).toLocaleDateString()} at{' '}
                    {new Date(quotation?.updated_at).toLocaleTimeString()}
                </div>

                <div className="flex flex-wrap gap-3">
                    <button className="px-6 py-2 border-gray-300 border rounded-lg hover:bg-gray-50">
                        Save as Draft
                    </button>
                    {quotation?.status === 'submitted' && (
                        <>
                            <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                Reject
                            </button>
                            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                Approve
                            </button>
                        </>
                    )}
                    {/* <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Send to Customer
                    </button> */}
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
        </div>
    );
};

export default QuotationDetail;