import React, { useEffect, useRef, useState } from 'react';
import { FiDownload, FiPrinter, FiFilter, FiCalendar } from 'react-icons/fi';
import { useGetStockReportMutation } from '../../../app/Features/reportsSlice';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { useGetAllStockTypesQuery } from '../../../app/Features/stockTypesSlice';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { useReportText } from './reportText';

const StockReport = () => {
    const { rt } = useReportText();
    const token = localStorage.getItem('token');
    const [getStockReport] = useGetStockReportMutation();

    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [formData, setFormData] = useState({
        created_by: '',
        username: '',
        stock_type_id: '',
        stock_type_name: '',
        start_date: formatDateForInput(firstDayOfCurrentMonth),
        end_date: formatDateForInput(today),
    });

    const [users, setUsers] = useState([]);
    const [stockTypes, setStockTypes] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const tableRef = useRef();

    const { data: userData } = useGetAllUserQuery(token);
    const { data: stockTypeData } = useGetAllStockTypesQuery(token);

    useEffect(() => {
        if (userData?.data) {
            setUsers(userData.data);
        }
    }, [userData]);

    useEffect(() => {
        if (stockTypeData?.data) {
            setStockTypes(stockTypeData.data);
        }
    }, [stockTypeData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const next = { ...prev, [name]: value };

            if (name === 'created_by') {
                const selected = users.find((u) => String(u.id) === String(value));
                next.username = selected?.username || '';
            }

            if (name === 'stock_type_id') {
                const selected = stockTypes.find(
                    (st) => String(st.stock_type_id) === String(value)
                );
                next.stock_type_name = selected?.stock_type_name || '';
            }

            return next;
        });
    };

    useEffect(() => {
        fetchReport();
    }, []);

    async function fetchReport() {
        try {
            setLoading(true);
            const res = await getStockReport({ itemData: formData, token });
            if (res?.data?.status === 200) {
                setReportData(res.data.data || []);
            } else {
                toast.error(rt('Failed to generate stock report'));
            }
        } catch (error) {
            toast.error(error?.message || rt('An error occurred while generating the report'));
        } finally {
            setLoading(false);
        }
    }

    const handleGetReport = async () => {
        await fetchReport();
    };

    const formatNumber = (value) => {
        const number = Number(value);
        if (Number.isNaN(number)) return '0';
        return number.toLocaleString('en-US');
    };

    const formatRate = (value) => {
        const number = Number(value);
        if (Number.isNaN(number)) return '0.00';
        return number.toFixed(2);
    };

    const totals = reportData
        ? reportData.reduce(
            (acc, item) => ({
                quantity: acc.quantity + (Number(item.quantity) || 0),
            }),
            {
                quantity: 0,
            }
        )
        : {};

    const handleExportExcel = () => {
        if (!reportData || reportData.length === 0) return;

        const exportData = reportData.map((item) => ({
            'Stock No': item.stock_no,
            'Stock Date': item.stock_date,
            'Stock Type': item.stock_type_name,
            'From Warehouse': item.from_warehouse_name,
            'To Warehouse': item.to_warehouse_name,
            Quantity: Number(item.quantity) || 0,
            'Exchange Rate': Number(item.exchange_rate) || 0,
            'Created By': item.created_by_name,
            Remark: item.stock_remark || '-',
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'StockReport');
        XLSX.writeFile(wb, 'StockReport.xlsx');
    };

    const handlePrint = useReactToPrint({
        content: () => tableRef.current,
        contentRef: tableRef,
    });

    return (
        <div className="report-page min-h-screen bg-transparent p-1 md:p-3">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 ml-2">
                    <h1 className="text-3xl font-bold text-gray-900">{rt("Stock Report")}</h1>
                    <p className="text-gray-600 mt-2">{rt("Generate and export stock reports")}</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 text-xs mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block font-medium text-gray-700 mb-2">{rt("User")}</label>
                            <select
                                name="created_by"
                                value={formData.created_by}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{rt("All Users")}</option>
                                {users?.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block font-medium text-gray-700 mb-2">{rt("Stock Type")}</label>
                            <select
                                name="stock_type_id"
                                value={formData.stock_type_id}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{rt("All Types")}</option>
                                {stockTypes?.map((type) => (
                                    <option key={type.stock_type_id} value={type.stock_type_id}>
                                        {type.stock_type_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block font-medium text-gray-700 mb-2">{rt("Start Date")}</label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-medium text-gray-700 mb-2">{rt("End Date")}</label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleGetReport}
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiFilter size={18} />
                            {loading ? rt('Loading...') : rt('Get Report')}
                        </button>
                    </div>
                </div>

                {reportData && (
                    <div className="bg-white rounded-lg text-xs shadow-md p-6">
                        <div className="flex justify-end gap-3 mb-6">
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                            >
                                <FiDownload size={18} />
                                {rt('Export Excel')}
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 print:hidden"
                            >
                                <FiPrinter size={18} />
                                {rt('Print')}
                            </button>
                        </div>

                        <div className="overflow-x-auto print:overflow-visible print:p-10 print:bg-white print:text-black print:shadow-none" ref={tableRef}>
                            <ul className="px-5 flex justify-between text-left text-xs font-medium mb-5 text-gray-500 uppercase tracking-wider">
                                <li>{rt('User')}: <span className="font-bold">{formData?.username || rt('All')}</span></li>
                                <li>{rt('Stock Type')}: <span className="font-bold">{formData?.stock_type_name || rt('All')}</span></li>
                                <li>{rt('Start Date')}: <span className="font-bold">{formData.start_date || rt('All')}</span></li>
                                <li>{rt('End Date')}: <span className="font-bold">{formData.end_date || rt('All')}</span></li>
                            </ul>

                            <table className="min-w-full border-collapse border border-gray-400">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock No</th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Type</th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Warehouse</th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Warehouse</th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                        {/* <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exchange Rate</th> */}
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData?.map((item) => (
                                        <tr key={item.stock_id} className="hover:bg-gray-50 !text-xs">
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                {item.stock_no}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.stock_date}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.stock_type_name || '-'}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.from_warehouse_name || '-'}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.to_warehouse_name || '-'}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {formatNumber(item.quantity)}
                                            </td>
                                            {/* <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {formatRate(item.exchange_rate)}
                                            </td> */}
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.created_by_name || '-'}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 text-gray-500">
                                                {item.stock_remark || '-'}
                                            </td>
                                        </tr>
                                    ))}

                                    {reportData.length > 0 && (
                                        <tr className="bg-gray-100 font-bold">
                                            <td className="border border-gray-300 px-6 py-4 text-right" colSpan={5}>{rt("Total")}</td>
                                            <td className="border border-gray-300 px-6 py-4">{formatNumber(totals.quantity)}</td>
                                            <td className="border border-gray-300 px-6 py-4" colSpan={3}>-</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {reportData?.length > 0 && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-md">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <span className="font-medium text-gray-700">{rt("Total Stock Entries: ")}</span>
                                            <span className="text-gray-600">{reportData.length}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">{rt("Total Quantity: ")}</span>
                                            <span className="text-green-600 font-medium">{formatNumber(totals.quantity)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!reportData && !loading && (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <FiFilter size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{rt("No Report Generated")}</h3>
                        <p className="text-gray-500">{rt("Use the filters above to generate a stock report")}</p>
                    </div>
                )}

                {loading && (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">{rt("Generating report...")}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockReport;
