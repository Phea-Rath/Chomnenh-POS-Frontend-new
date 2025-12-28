import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { FaPrint, FaFileExcel, FaArrowLeft, FaCalendarAlt } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import { useGetAllSupplierQuery } from '../../../app/Features/suppliesSlice';

const PurchaseReport = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [purchases, setPurchases] = useState([]);
    const { data: supplierData } = useGetAllSupplierQuery(token);
    const [suppliers, setSuppliers] = useState([]);
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        supplier_id: 'all'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const componentRef = useRef();

    // Fetch suppliers
    useEffect(() => {
        setSuppliers(supplierData?.data || []);
    }, [supplierData]);

    // Fetch purchases
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const params = {
                    start_date: filters.start_date || undefined,
                    end_date: filters.end_date || undefined,
                    supplier_id: filters.supplier_id !== 'all' ? filters.supplier_id : undefined
                };
                const response = await api.post('/purchase_report', params, {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                });
                const purchaseData = response.data.data.map(purchase => ({
                    ...purchase,
                    sub_total: parseFloat(purchase.sub_total),
                    tax_rate: parseFloat(purchase.tax_rate),
                    tax_amount: parseFloat(purchase.tax_amount),
                    shipping_fee: parseFloat(purchase.shipping_fee),
                    total_amount: parseFloat(purchase.total_amount),
                    total_paid: parseFloat(purchase.total_paid),
                    balance: parseFloat(purchase.balance),
                    exchange_rate: parseFloat(purchase.exchange_rate),
                    details: purchase.details.map(detail => ({
                        ...detail,
                        quantity: parseFloat(detail.quantity),
                        unit_price: parseFloat(detail.unit_price),
                        subtotal: parseFloat(detail.subtotal),
                        item_price: parseFloat(detail.item_price)
                    })),
                    payments: purchase.payments.map(payment => ({
                        ...payment,
                        amount: parseFloat(payment.amount)
                    }))
                }));
                setPurchases(purchaseData);
            } catch (err) {
                setError(err.response?.data?.message || 'Error fetching report data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filters, token]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Calculate summary
    const summary = purchases.reduce(
        (acc, purchase) => ({
            totalPurchases: acc.totalPurchases + 1,
            totalAmount: acc.totalAmount + purchase.total_amount,
            totalPaid: acc.totalPaid + purchase.total_paid,
            totalBalance: acc.totalBalance + purchase.balance
        }),
        { totalPurchases: 0, totalAmount: 0, totalPaid: 0, totalBalance: 0 }
    );

    // Print handler
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        contentRef: componentRef
        // documentTitle: `Purchase_Report_${filters.start_date || 'all'}_to_${filters.end_date || 'all'}`,
        // pageStyle: `
        //     @media print {
        //         body { margin: 0; padding: 0; }
        //         .no-print { display: none; }
        //         .report-container { padding: 20px; }
        //         table { width: 100%; border-collapse: collapse; }
        //         th, td { border: 1px solid #000; padding: 8px; }
        //         .text-center { text-align: center; }
        //         .text-right { text-align: right; }
        //     }
        // `
    });

    // Excel export handler
    const handleExportExcel = () => {
        if (!purchases.length) {
            console.log('No purchases data to export');
            return;
        }

        console.log('Purchases data:', purchases); // Debug: Log purchases data
        console.log('Suppliers data:', suppliers); // Debug: Log suppliers data

        const workbook = XLSX.utils.book_new();

        // Helper function to format numbers as currency
        const formatCurrency = (value) => `$${parseFloat(value || 0).toFixed(2)}`;

        // Helper function to set column widths
        const setColumnWidths = (worksheet, widths) => {
            worksheet['!cols'] = widths.map(width => ({ wch: width }));
        };

        // Helper function to apply styles
        const applyStyles = (worksheet, startRow, endRow, startCol, endCol, style) => {
            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
                    if (!worksheet[cellRef]) worksheet[cellRef] = {};
                    worksheet[cellRef].s = style;
                }
            }
        };

        // Summary Sheet
        const summaryData = [
            ['Purchase Report'],
            ['Date Range', `${filters.start_date || 'All'} to ${filters.end_date || 'All'}`],
            ['Supplier', filters.supplier_id === 'all' ? 'All' : (suppliers.find(s => s.supplier_id === parseInt(filters.supplier_id))?.supplier_name || 'Unknown')],
            [],
            ['Summary'],
            ['Total Purchases', summary.totalPurchases || 0],
            ['Total Amount', formatCurrency(summary.totalAmount)],
            ['Total Paid', formatCurrency(summary.totalPaid)],
            ['Total Balance', formatCurrency(summary.totalBalance)]
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        applyStyles(summarySheet, 0, 0, 0, 1, { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } });
        applyStyles(summarySheet, 4, 4, 0, 1, { font: { bold: true, sz: 12 } });
        applyStyles(summarySheet, 5, 8, 1, 1, { alignment: { horizontal: 'right' } });
        setColumnWidths(summarySheet, [20, 20]);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

        // Purchases Sheet
        const purchasesData = [
            ['Purchase No', 'Supplier', 'Date', 'Sub Total', 'Tax Rate', 'Tax Amount', 'Shipping Fee', 'Total Amount', 'Total Paid', 'Balance', 'Status'],
            ...purchases.map(purchase => [
                purchase.purchase_no || 'N/A',
                purchase.supplier_name || 'Unknown',
                purchase.purchase_date || 'N/A',
                formatCurrency(purchase.sub_total),
                `${parseFloat(purchase.tax_rate || 0).toFixed(2)}%`,
                formatCurrency(purchase.tax_amount),
                formatCurrency(purchase.shipping_fee),
                formatCurrency(purchase.total_amount),
                formatCurrency(purchase.total_paid),
                formatCurrency(purchase.balance),
                purchase.status === 1 ? 'Completed' : purchase.status === 0 ? 'Pending' : 'Cancelled'
            ])
        ];
        const purchasesSheet = XLSX.utils.aoa_to_sheet(purchasesData);
        applyStyles(purchasesSheet, 0, 0, 0, 10, { font: { bold: true }, fill: { fgColor: { rgb: 'E5E7EB' } } });
        applyStyles(purchasesSheet, 1, purchasesData.length - 1, 3, 9, { alignment: { horizontal: 'right' } });
        setColumnWidths(purchasesSheet, [15, 20, 15, 12, 10, 12, 12, 12, 12, 12, 10]);
        XLSX.utils.book_append_sheet(workbook, purchasesSheet, 'Purchases');

        // Items Sheet
        const itemsData = [
            ['Purchase No', 'Supplier', 'Item Name', 'Item Code', 'Quantity', 'Unit Price', 'Subtotal'],
            ...purchases.flatMap(purchase =>
                (purchase.details || []).map(detail => [
                    purchase.purchase_no || 'N/A',
                    purchase.supplier_name || 'Unknown',
                    detail.item_name || 'Unknown',
                    detail.item_code || 'N/A',
                    parseFloat(detail.quantity || 0).toFixed(2),
                    formatCurrency(detail.unit_price),
                    formatCurrency(detail.subtotal)
                ])
            )
        ];
        const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
        applyStyles(itemsSheet, 0, 0, 0, 6, { font: { bold: true }, fill: { fgColor: { rgb: 'E5E7EB' } } });
        applyStyles(itemsSheet, 1, itemsData.length - 1, 4, 6, { alignment: { horizontal: 'right' } });
        setColumnWidths(itemsSheet, [15, 20, 20, 15, 10, 12, 12]);
        XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items');

        // Payments Sheet
        const paymentsData = [
            ['Purchase No', 'Supplier', 'Amount', 'Paid At'],
            ...purchases.flatMap(purchase =>
                (purchase.payments || []).map(payment => [
                    purchase.purchase_no || 'N/A',
                    purchase.supplier_name || 'Unknown',
                    formatCurrency(payment.amount),
                    payment.paid_at || 'N/A'
                ])
            )
        ];
        const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentsData);
        applyStyles(paymentsSheet, 0, 0, 0, 3, { font: { bold: true }, fill: { fgColor: { rgb: 'E5E7EB' } } });
        applyStyles(paymentsSheet, 1, paymentsData.length - 1, 2, 2, { alignment: { horizontal: 'right' } });
        setColumnWidths(paymentsSheet, [15, 20, 12, 15]);
        XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Payments');

        // Detailed Purchase Sheets
        purchases.forEach(purchase => {
            const sheetData = [
                [`Purchase #${purchase.purchase_no || 'N/A'}`],
                ['Supplier', purchase.supplier_name || 'Unknown'],
                ['Address', purchase.supplier_address || 'N/A'],
                ['Phone', purchase.supplier_tel || 'N/A'],
                ['Email', purchase.supplier_email || 'N/A'],
                ['Purchase Date', purchase.purchase_date || 'N/A'],
                ['Status', purchase.status === 1 ? 'Completed' : purchase.status === 0 ? 'Pending' : 'Cancelled'],
                ['Created At', purchase.created_at ? new Date(purchase.created_at).toLocaleString() : 'N/A'],
                ['Updated At', purchase.updated_at ? new Date(purchase.updated_at).toLocaleString() : 'N/A'],
                [],
                ['Items'],
                ['Item', 'Code', 'Quantity', 'Unit Price', 'Subtotal'],
                ...(purchase.details || []).map(detail => [
                    detail.item_name || 'Unknown',
                    detail.item_code || 'N/A',
                    parseFloat(detail.quantity || 0).toFixed(2),
                    formatCurrency(detail.unit_price),
                    formatCurrency(detail.subtotal)
                ]),
                [],
                ['Payments'],
                ['Amount', 'Paid At'],
                ...(purchase.payments && purchase.payments.length > 0
                    ? purchase.payments.map(payment => [
                        formatCurrency(payment.amount),
                        payment.paid_at || 'N/A'
                    ])
                    : [['No payments recorded', '']]),
                [],
                ['Summary'],
                ['Sub Total', formatCurrency(purchase.sub_total)],
                ['Tax Rate', `${parseFloat(purchase.tax_rate || 0).toFixed(2)}%`],
                ['Tax Amount', formatCurrency(purchase.tax_amount)],
                ['Shipping Fee', formatCurrency(purchase.shipping_fee)],
                ['Total Amount', formatCurrency(purchase.total_amount)],
                ['Total Paid', formatCurrency(purchase.total_paid)],
                ['Balance', formatCurrency(purchase.balance)]
            ];
            const sheet = XLSX.utils.aoa_to_sheet(sheetData);
            applyStyles(sheet, 0, 0, 0, 1, { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center' } });
            applyStyles(sheet, 10, 10, 0, 4, { font: { bold: true } });
            applyStyles(sheet, 11, 11, 0, 4, { font: { bold: true }, fill: { fgColor: { rgb: 'E5E7EB' } } });
            applyStyles(sheet, 12, 12 + (purchase.details?.length || 0) - 1, 2, 4, { alignment: { horizontal: 'right' } });
            applyStyles(sheet, (purchase.details?.length || 0) + 13, (purchase.details?.length || 0) + 13, 0, 1, { font: { bold: true } });
            applyStyles(sheet, (purchase.details?.length || 0) + 14, (purchase.details?.length || 0) + 14, 0, 1, { font: { bold: true }, fill: { fgColor: { rgb: 'E5E7EB' } } });
            applyStyles(sheet, (purchase.details?.length || 0) + 15, (purchase.details?.length || 0) + 15 + (purchase.payments?.length || 1) - 1, 0, 0, { alignment: { horizontal: 'right' } });
            applyStyles(sheet, (purchase.details?.length || 0) + (purchase.payments?.length || 1) + 16, (purchase.details?.length || 0) + (purchase.payments?.length || 1) + 16, 0, 1, { font: { bold: true } });
            applyStyles(sheet, (purchase.details?.length || 0) + (purchase.payments?.length || 1) + 17, (purchase.details?.length || 0) + (purchase.payments?.length || 1) + 23, 1, 1, { alignment: { horizontal: 'right' } });
            setColumnWidths(sheet, [20, 20, 10, 12, 12]);
            XLSX.utils.book_append_sheet(workbook, sheet, `Purchase_${purchase.purchase_no || 'Unknown'}`);
        });

        // Export to Excel
        XLSX.writeFile(workbook, `Purchase_Report_${filters.start_date || 'all'}_to_${filters.end_date || 'all'}.xlsx`);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Purchase Report</h1>
                    <div className="no-print flex space-x-4">
                        <button
                            onClick={handleExportExcel}
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center space-x-2"
                            disabled={loading || !purchases.length}
                        >
                            <FaFileExcel /> <span>Export to Excel</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
                            disabled={loading || !purchases.length}
                        >
                            <FaPrint /> <span>Print Report</span>
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center space-x-2"
                        >
                            <FaArrowLeft /> <span>Back to Purchases</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="no-print bg-white shadow-lg rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Filters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                            <div className="relative">
                                <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="date"
                                    name="start_date"
                                    value={filters.start_date}
                                    onChange={handleFilterChange}
                                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <div className="relative">
                                <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="date"
                                    name="end_date"
                                    value={filters.end_date}
                                    onChange={handleFilterChange}
                                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                            <select
                                name="supplier_id"
                                value={filters.supplier_id}
                                onChange={handleFilterChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Suppliers</option>
                                {suppliers.map(supplier => (
                                    <option key={supplier.supplier_id} value={supplier.supplier_id}>
                                        {supplier.supplier_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {loading && <p className="text-center text-gray-500 py-8">Loading...</p>}
                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {purchases.length === 0 && !loading && (
                    <p className="text-center text-gray-500 py-8">No purchases found for the selected filters.</p>
                )}

                {purchases.length > 0 && (
                    <div ref={componentRef} className="print:shadow-none report-container bg-white shadow-lg rounded-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Purchase Report</h2>
                        <p className="text-sm text-gray-600 text-center mb-4">
                            Date Range: {filters.start_date || 'All'} to {filters.end_date || 'All'} |
                            Supplier: {filters.supplier_id === 'all' ? 'All' : purchases[0]?.supplier_name || 'Unknown'}
                        </p>

                        {/* Summary */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                            <div className="grid grid-cols-1 text-white md:grid-cols-4 print:grid-cols-4  gap-4">
                                <div className="p-4 bg-info rounded-md">
                                    <p className="text-sm font-medium ">Total Purchases</p>
                                    <p className="text-lg font-semibold">{summary.totalPurchases}</p>
                                </div>
                                <div className="p-4 bg-warning rounded-md">
                                    <p className="text-sm font-medium ">Total Amount</p>
                                    <p className="text-lg font-semibold">${summary.totalAmount.toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-success rounded-md">
                                    <p className="text-sm font-medium ">Total Paid</p>
                                    <p className="text-lg font-semibold">${summary.totalPaid.toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-error rounded-md">
                                    <p className="text-sm font-medium ">Total Balance</p>
                                    <p className="text-lg font-semibold">${summary.totalBalance.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Purchases Table */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchases</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Total</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {purchases.map(purchase => (
                                            <tr key={purchase.purchase_id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.purchase_no}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.supplier_name || 'Unknown'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.purchase_date}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${purchase.sub_total.toFixed(2)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${purchase.total_amount.toFixed(2)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${purchase.total_paid.toFixed(2)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${purchase.balance.toFixed(2)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {purchase.status === 1 ? 'Completed' : purchase.status === 0 ? 'Pending' : 'Cancelled'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Detailed Items and Payments */}
                        {purchases.map(purchase => (
                            <div key={purchase.purchase_id} className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase #{purchase.purchase_no}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <p><strong>Supplier:</strong> {purchase.supplier_name || 'Unknown'}</p>
                                        <p><strong>Address:</strong> {purchase.supplier_address || 'N/A'}</p>
                                        <p><strong>Phone:</strong> {purchase.supplier_tel || 'N/A'}</p>
                                        <p><strong>Email:</strong> {purchase.supplier_email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p><strong>Purchase Date:</strong> {purchase.purchase_date}</p>
                                        <p><strong>Status:</strong> {purchase.status === 1 ? 'Completed' : purchase.status === 0 ? 'Pending' : 'Cancelled'}</p>
                                        <p><strong>Created At:</strong> {new Date(purchase.created_at).toLocaleString()}</p>
                                        <p><strong>Updated At:</strong> {new Date(purchase.updated_at).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="text-md font-semibold text-gray-900 mb-2">Items</h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {purchase.details.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.item_name || 'Unknown'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.item_code || 'N/A'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity.toFixed(2)}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.unit_price.toFixed(2)}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.subtotal.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="text-md font-semibold text-gray-900 mb-2">Payments</h4>
                                    {purchase.payments.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">No payments recorded.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid At</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {purchase.payments.map((payment, index) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${payment.amount.toFixed(2)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.paid_at}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div></div>
                                    <div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-700">Sub Total:</span>
                                            <span className="text-sm text-gray-900">${purchase.sub_total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-700">Tax Rate:</span>
                                            <span className="text-sm text-gray-900">{purchase.tax_rate.toFixed(2)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-700">Tax Amount:</span>
                                            <span className="text-sm text-gray-900">${purchase.tax_amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-700">Shipping Fee:</span>
                                            <span className="text-sm text-gray-900">${purchase.shipping_fee.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold">
                                            <span className="text-sm text-gray-900">Total Amount:</span>
                                            <span className="text-sm text-gray-900">${purchase.total_amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-700">Total Paid:</span>
                                            <span className="text-sm text-gray-900">${purchase.total_paid.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold">
                                            <span className="text-sm text-gray-900">Balance:</span>
                                            <span className={`text-sm ${purchase.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                ${purchase.balance.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchaseReport;