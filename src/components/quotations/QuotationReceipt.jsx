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
    // Status configuration
    const getStatusConfig = (status) => {
        const configs = {
            submitted: {
                color: 'bg-yellow-100 text-yellow-800',
                icon: <FaClock className="mr-2" />,
                label: 'Pending'
            },
            approved: {
                color: 'bg-green-100 text-green-800',
                icon: <FaCheckCircle className="mr-2" />,
                label: 'Approved'
            },
            rejected: {
                color: 'bg-red-100 text-red-800',
                icon: <FaTimesCircle className="mr-2" />,
                label: 'Rejected'
            },
            draft: {
                color: 'bg-gray-100 text-gray-800',
                icon: <FaTag className="mr-2" />,
                label: 'Draft'
            }
        };
        return configs[status] || configs.draft;
    };

    const statusConfig = getStatusConfig(quotation?.status);

    // Handle Print
    const handlePrint = () => {
        window.print();
    };

    // Calculate subtotal from items
    const calculateSubtotal = () => {
        return quotation?.details?.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Header with Actions */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center mr-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <FaArrowLeft className="mr-2" />
                            Back
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Quotation Receipt
                            </h1>
                            <p className="text-gray-600">
                                #{quotation?.quotation_number} • {quotation?.customer_name}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="flex space-x-2">
                            <button
                                onClick={() =>
                                    handleDownload(
                                        receiptRef,
                                        "jpg",
                                        "reciept",
                                        data?.data?.quotation_number || id
                                    )
                                }
                                className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                            >
                                <FaDownload className="mr-2" />
                                Download
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                            >
                                <FaPrint className="mr-2" />
                                Print
                            </button>
                        </div>

                    </div>
                </div>

                {/* Status and Info Bar */}
                <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                        </span>
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Created:</span>{' '}
                            {new Date(quotation?.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Valid Until:</span>{' '}
                            {new Date(quotation?.date_term).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="text-lg font-bold text-blue-600">
                        Total: ${quotation?.grand_total}
                    </div>
                </div>
            </div>

            {/* Receipt Container */}
            <div className="flex justify-center print-area">
                <div
                    ref={receiptRef}
                    className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:border-0"
                >
                    {/* Receipt Header */}
                    <div className="p-8 border-b">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div className="mb-6 md:mb-0">
                                <div className="flex items-center mb-4">
                                    <div className={`w-16 h-16 ${!logoBase64 && "bg-blue-600"} overflow-hidden rounded-lg flex items-center justify-center mr-4`}>
                                        {company ? <img src={logoBase64} alt="" />
                                            : <span className="text-white text-2xl font-bold">CP</span>}
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900">{company?.data?.username}</h1>
                                        {/* <p className="text-gray-600">{quotation?.company_info?.address}</p> */}
                                    </div>
                                </div>

                                {/* <div className="space-y-1 text-sm text-gray-600">
                                    <div>Phone: {quotation?.company_info?.phone}</div>
                                    <div>Email: {quotation?.company_info?.email}</div>
                                    <div>Website: {quotation?.company_info?.website}</div>
                                    <div>Tax ID: {quotation?.company_info?.tax_id}</div>
                                </div> */}
                            </div>

                            <div className="text-right">
                                <h2 className="text-2xl font-bold text-blue-600 mb-2">QUOTATION</h2>
                                <div className="text-lg font-semibold text-gray-900">
                                    #{quotation?.quotation_number}
                                </div>
                                <div className="space-y-1 text-sm text-gray-600 mt-4">
                                    <div className="flex items-center justify-end">
                                        <FaCalendarAlt className="mr-2" />
                                        Date: {new Date(quotation?.date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <FaCalendarAlt className="mr-2" />
                                        Due Date: {new Date(quotation?.date_term).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <FaTag className="mr-2" />
                                        Status: <span className={`ml-2 px-2 py-1 rounded ${statusConfig.color}`}>
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bill To Section */}
                    <div className="p-8 border-b grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To</h3>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <FaUser className="mr-3 text-gray-400" />
                                    <div>
                                        <div className="font-semibold text-gray-900">{quotation?.customer_name}</div>
                                        <div className="text-sm text-gray-600">Customer ID: {quotation?.customer_id}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quotation Details</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Quotation Number:</span>
                                    <span className="font-semibold">{quotation?.quotation_number}</span>
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
                    <div className="p-8 border-b">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantity</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Unit Price</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Discount</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotation?.details?.map((item, index) => (
                                        <tr key={item.detail_id} className="border-b hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                                <div className="font-medium text-gray-900">{item.item_name}</div>
                                                <div className="text-sm text-gray-600">
                                                    Unit: {item.scale} • Item ID: {item.item_id}
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
                                                        {item.discount}
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

                    {/* Totals Section */}
                    <div className="p-8">
                        <div className="flex justify-end">
                            <div className="w-full md:w-1/2 lg:w-1/3">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium">${(calculateSubtotal() || 0).toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600 flex items-center">
                                            <FaTruck className="mr-2" />
                                            Delivery Fee:
                                        </span>
                                        <span className="font-medium">${quotation?.delivery_fee}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600 flex items-center">
                                            <FaPercent className="mr-2" />
                                            Discount:
                                        </span>
                                        <span className="font-medium text-green-600">-${quotation?.total_discount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 flex items-center">
                                            <FaPercent className="mr-2" />
                                            Tax:
                                        </span>
                                        <span className="font-medium text-green-600">{quotation?.tax}%</span>
                                    </div>

                                    <div className="border-t pt-3 mt-3">
                                        <div className="flex justify-between text-xl font-bold">
                                            <span>Grand Total:</span>
                                            <span className="text-blue-600">${quotation?.grand_total}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                {quotation?.notes && (
                                    <div className="mt-6 pt-6 border-t">
                                        <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                                        <p className="text-gray-600 text-sm">{quotation?.notes}</p>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="mt-8 pt-8 border-t text-center text-sm text-gray-500">
                                    <p>Thank you for support our business!</p>
                                    {/* <p className="mt-2">{quotation?.company_info?.name}</p>
                                    <p>{quotation?.company_info?.address}</p>
                                    <p>Phone: {quotation?.company_info?.phone} • Email: {quotation?.company_info?.email}</p>
                                    <p className="mt-4 text-xs">Quotation #{quotation?.quotation_number} • Issued: {new Date(quotation?.created_at).toLocaleDateString()}</p> */}
                                </div>
                            </div>
                        </div>
                    </div>
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
            padding: 0;
            margin: 0;
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 20mm;
          }
        }
      `}</style>
        </div>
    );
};

export default QuotationReceipt;