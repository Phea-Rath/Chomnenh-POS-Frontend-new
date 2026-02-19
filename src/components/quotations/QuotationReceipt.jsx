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
    FaImage
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router';
import { useGetQuoteByIdQuery } from '../../../app/Features/quoteSlice';
import { useGetUserLoginQuery } from '../../../app/Features/usersSlice';
import handleDownload from '../../services/imageDowload';
import { convertImageToBase64 } from '../../services/serviceFunction';

const QuotationReceipt = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const token = localStorage.getItem('token');
    const { data, refetch } = useGetQuoteByIdQuery({ id, token });
    const receiptRef = useRef(null);
    const [quotation, setQuotation] = useState({});
    const [logoBase64, setLogoBase64] = useState();
    const { data: company } = useGetUserLoginQuery(token);

    useEffect(() => {
        setQuotation(data?.data);
        convertImageToBase64(company?.data?.image).then(setLogoBase64);
    }, [data, company]);

    const getStatusConfig = (status) => {
        const configs = {
            submitted: { color: 'bg-yellow-50 text-yellow-800 border-yellow-300', icon: <FaClock className="mr-1" />, label: 'Pending' },
            approved: { color: 'bg-green-50 text-green-800 border-green-300', icon: <FaCheckCircle className="mr-1" />, label: 'Approved' },
            rejected: { color: 'bg-red-50 text-red-800 border-red-300', icon: <FaTimesCircle className="mr-1" />, label: 'Rejected' },
            draft: { color: 'bg-gray-50 text-gray-800 border-gray-300', icon: <FaTag className="mr-1" />, label: 'Draft' }
        };
        return configs[status] || configs.draft;
    };

    const statusConfig = getStatusConfig(quotation?.status);

    const handlePrint = () => window.print();

    const calculateSubtotal = () => {
        return quotation?.details?.reduce((sum, item) => sum + parseFloat(item.total_price), 0) || 0;
    };

    return (
        <div className=" bg-transparent p-4 md:p-6 font-sans">
            {/* Header with Actions – Excel style */}
            <div className="mb-6 bg-white border border-gray-300 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center mr-4 px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-100 text-sm"
                        >
                            <FaArrowLeft className="mr-1" size={12} />
                            Back
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Quotation Receipt</h1>
                            <p className="text-sm text-gray-600">
                                #{quotation?.quotation_number} • {quotation?.customer_name}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() =>
                                handleDownload(receiptRef, "jpg", "receipt", data?.data?.quotation_number || id)
                            }
                            className="flex items-center px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-100 text-sm"
                        >
                            <FaDownload className="mr-1" size={12} />
                            Download
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-100 text-sm"
                        >
                            <FaPrint className="mr-1" size={12} />
                            Print
                        </button>
                    </div>
                </div>

                {/* Status bar – minimal */}
                <div className="mt-4 pt-3 border-t border-gray-300 flex flex-wrap items-center justify-between gap-4 text-sm">
                    <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2 py-0.5 border ${statusConfig.color} rounded`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                        </span>
                        <div className="text-gray-600">
                            <span className="font-medium">Created:</span> {new Date(quotation?.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-gray-600">
                            <span className="font-medium">Valid Until:</span> {new Date(quotation?.date_term).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="font-semibold text-blue-600">Total: ${quotation?.grand_total}</div>
                </div>
            </div>

            {/* Receipt – Excel style document */}
            <div className="flex justify-center print-area">
                <div
                    ref={receiptRef}
                    className="w-full max-w-4xl bg-white border border-gray-300"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-300">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div className="mb-4 md:mb-0">
                                <div className="flex items-center mb-3">
                                    <div className={`w-12 h-12 ${!logoBase64 && "bg-blue-600"} border border-gray-300 overflow-hidden flex items-center justify-center mr-3`}>
                                        {company ? <img src={logoBase64} alt="" className="object-contain" />
                                            : <span className="text-white text-lg font-bold">CP</span>}
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-gray-800">{company?.data?.username}</h1>
                                    </div>
                                </div>
                                {/* Company info omitted for brevity; add if needed */}
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-bold text-blue-600 mb-1">QUOTATION</h2>
                                <div className="text-base font-semibold text-gray-800">#{quotation?.quotation_number}</div>
                                <div className="text-sm text-gray-600 mt-2 space-y-1">
                                    <div className="flex items-center justify-end">
                                        <FaCalendarAlt className="mr-1" size={12} />
                                        Date: {new Date(quotation?.date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <FaCalendarAlt className="mr-1" size={12} />
                                        Due: {new Date(quotation?.date_term).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <FaTag className="mr-1" size={12} />
                                        Status: <span className={`ml-1 px-2 py-0.5 border ${statusConfig.color} rounded`}>
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bill To / Details – two columns with border */}
                    <div className="p-6 border-b border-gray-300 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Bill To</h3>
                            <div className="flex items-start">
                                <FaUser className="mr-2 text-gray-400" size={14} />
                                <div>
                                    <div className="font-medium text-gray-800">{quotation?.customer_name}</div>
                                    <div className="text-xs text-gray-600">ID: {quotation?.customer_id}</div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Details</h3>
                            <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Quote #:</span>
                                    <span className="font-medium">{quotation?.quotation_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Issue Date:</span>
                                    <span>{new Date(quotation?.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Terms:</span>
                                    <span>{quotation?.credit_term} days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Valid Until:</span>
                                    <span>{new Date(quotation?.date_term).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="p-6 border-b border-gray-300">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Items</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-gray-300 bg-gray-100">
                                        <th className="text-left py-2 px-2 font-medium text-gray-700">Description</th>
                                        <th className="text-left py-2 px-2 font-medium text-gray-700">Quantity</th>
                                        <th className="text-left py-2 px-2 font-medium text-gray-700">Unit Price</th>
                                        <th className="text-left py-2 px-2 font-medium text-gray-700">Discount</th>
                                        <th className="text-left py-2 px-2 font-medium text-gray-700">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotation?.details?.map((item) => (
                                        <tr key={item.detail_id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="py-2 px-2">
                                                <div className="font-medium text-gray-800">{item.item_name}</div>
                                                <div className="text-xs text-gray-500">Unit: {item.scale}</div>
                                            </td>
                                            <td className="py-2 px-2">{item.quantity}</td>
                                            <td className="py-2 px-2">${item.price}</td>
                                            <td className="py-2 px-2">
                                                {parseFloat(item.discount) > 0 ? `${item.discount}` : '-'}
                                            </td>
                                            <td className="py-2 px-2 font-medium">${item.total_price}</td>
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
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 flex items-center">
                                            <FaTruck className="mr-1" size={12} /> Delivery:
                                        </span>
                                        <span className="font-medium">${quotation?.delivery_fee}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 flex items-center">
                                            <FaPercent className="mr-1" size={12} /> Discount:
                                        </span>
                                        <span className="font-medium text-green-600">-${quotation?.total_discount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 flex items-center">
                                            <FaPercent className="mr-1" size={12} /> Tax:
                                        </span>
                                        <span className="font-medium">{quotation?.tax}%</span>
                                    </div>
                                    <div className="border-t border-gray-300 pt-2 mt-2">
                                        <div className="flex justify-between text-base font-bold">
                                            <span>Grand Total:</span>
                                            <span className="text-blue-600">${quotation?.grand_total}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                {quotation?.notes && (
                                    <div className="mt-6 pt-4 border-t border-gray-300">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Notes</h4>
                                        <p className="text-xs text-gray-600">{quotation?.notes}</p>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="mt-6 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                                    <p>Thank you for your business!</p>
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
                    .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; box-shadow: none; }
                    .no-print { display: none !important; }
                    @page { margin: 20mm; }
                }
            `}</style>
        </div>
    );
};

export default QuotationReceipt;