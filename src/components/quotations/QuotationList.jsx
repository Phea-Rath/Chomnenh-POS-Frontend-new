import React, { useEffect, useState } from 'react';
import {
    FaList,
    FaTh,
    FaEye,
    FaEdit,
    FaTrash,
    FaPrint,
    FaFileExport,
    FaFilter,
    FaSearch,
    FaCalendarAlt,
    FaUser,
    FaDollarSign,
    FaTag,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaCheck,
    FaTimes,
    FaHourglassHalf,
    FaFileAlt,
    FaEllipsisH,
    FaChevronDown,
    FaSyncAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router';
import { useGetAllQuoteQuery } from '../../../app/Features/quoteSlice';
import api from '../../services/api';
import { toast } from 'react-toastify';
import AlertBox from '../../services/AlertBox';
import { Button, Dropdown, Space } from 'antd';
import { useGetAllSaleQuery } from '../../../app/Features/salesSlice';

const items = [
    {
        label: 'draft',
        key: 'draft',
        icon: <FaFileAlt />,
    },
    {
        label: 'submitted',
        key: 'submitted',
        icon: <FaHourglassHalf />,
    },
    {
        label: 'approved',
        key: 'approved',
        icon: <FaCheckCircle />,
    },
    {
        label: 'rejected',
        key: 'rejected',
        icon: <FaTimesCircle />,
        danger: true
    },
];
const statusOptions = [
    { value: 'draft', label: 'Draft', icon: FaFileAlt, color: 'bg-gray-100 text-gray-800 border-gray-300' },
    { value: 'submitted', label: 'Submitted', icon: FaHourglassHalf, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { value: 'approved', label: 'Approved', icon: FaCheckCircle, color: 'bg-green-100 text-green-800 border-green-300' },
    { value: 'rejected', label: 'Rejected', icon: FaTimesCircle, color: 'bg-red-100 text-red-800 border-red-300' },
];

const QuotationList = () => {
    const navigator = useNavigate();
    const token = localStorage.getItem('token');
    const { data, refetch, isLoading } = useGetAllQuoteQuery(token);
    const { refetch: saleFetch } = useGetAllSaleQuery(token);
    const [viewMode, setViewMode] = useState('list');
    const [quotations, setQuotations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedQuotations, setSelectedQuotations] = useState([]);
    const [alertBox, setAlertBox] = useState(false);
    const [id, setId] = useState(0);
    const [statusUpdateModal, setStatusUpdateModal] = useState({
        isOpen: false,
        quoteId: null,
        currentStatus: '',
        newStatus: '',
        quoteNumber: ''
    });
    const [dropdownOpen, setDropdownOpen] = useState(null);

    // const handleButtonClick = e => {
    //     console.log('click left button', e);
    // };
    const handleMenuClick = async e => {
        try {
            const res = await api.put(`/quote_status/${id}/${e.key}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            console.log(res);

            if (res.status === 200) {
                refetch();
                saleFetch();
                setQuotations(prev => prev.filter(quote => quote.quotation_id !== id));
                toast.success('Quote updated status successfully!');
                setAlertBox(false);
                setId(0);
            }
        } catch (error) {
            toast.error(error?.message || error);
            setAlertBox(false);
        }
    };

    const menuProps = {
        items,
        onClick: handleMenuClick,
    };
    useEffect(() => {
        if (data?.data) {
            setQuotations(data.data);
        }
    }, [data]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-container')) {
                setDropdownOpen(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Filter quotations based on search and status
    const filteredQuotations = quotations?.filter(quote => {
        const matchesSearch =
            (quote.quotation_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (quote.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (quote.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' ||
            quote.status === statusFilter;

        return matchesSearch && matchesStatus;
    });



    const getStatusConfig = (status) => {
        return statusOptions.find(option => option.value === status) || statusOptions[0];
    };

    const getStatusBadge = (status) => {
        const config = getStatusConfig(status);
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="mr-1 w-3 h-3" />
                {config.label}
            </span>
        );
    };

    const openStatusUpdateModal = (quoteId, currentStatus, quoteNumber) => {
        setStatusUpdateModal({
            isOpen: true,
            quoteId,
            currentStatus,
            newStatus: currentStatus,
            quoteNumber
        });
        setDropdownOpen(null);
    };

    const closeStatusUpdateModal = () => {
        setStatusUpdateModal({
            isOpen: false,
            quoteId: null,
            currentStatus: '',
            newStatus: '',
            quoteNumber: ''
        });
    };

    const handleSelectQuotation = (id) => {
        setSelectedQuotations(prev =>
            prev.includes(id)
                ? prev.filter(quoteId => quoteId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedQuotations.length === filteredQuotations?.length) {
            setSelectedQuotations([]);
        } else {
            setSelectedQuotations(filteredQuotations?.map(quote => quote.quotation_id) || []);
        }
    };

    const handleConfirm = async () => {
        try {
            const res = await api.delete(`/quotations/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            if (res.status === 200) {
                refetch();
                setQuotations(prev => prev.filter(quote => quote.quotation_id !== id));
                toast.success('Quote deleted successfully!');
                setAlertBox(false);
                setId(0);
            }
        } catch (error) {
            toast.error(error?.message || error);
            setAlertBox(false);
        }
    };

    const handleCancel = () => {
        setAlertBox(false);
        setId(0);
    };

    const handleDelete = (id) => {
        setId(id);
        setAlertBox(true);
    };

    const toggleDropdown = (id, e) => {
        e.stopPropagation();
        setDropdownOpen(dropdownOpen === id ? null : id);
    };

    const handleBulkStatusUpdate = async (newStatus) => {
        if (selectedQuotations.length === 0) {
            toast.warning('Please select at least one quotation');
            return;
        }

        if (window.confirm(`Are you sure you want to update ${selectedQuotations.length} quotations to ${getStatusConfig(newStatus).label}?`)) {
            try {
                const updates = selectedQuotations.map(async (id) => {
                    await updateQuoteStatus({
                        token,
                        id,
                        status: newStatus
                    }).unwrap();
                });

                await Promise.all(updates);

                // Update local state
                setQuotations(prev => prev.map(quote =>
                    selectedQuotations.includes(quote.quotation_id)
                        ? { ...quote, status: newStatus }
                        : quote
                ));

                toast.success(`${selectedQuotations.length} quotations updated to ${getStatusConfig(newStatus).label}`);
                setSelectedQuotations([]);
                refetch();
            } catch (error) {
                toast.error('Failed to update some quotations');
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedQuotations.length === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedQuotations.length} quotations?`)) {
            try {
                const deletions = selectedQuotations.map(async (id) => {
                    await api.delete(`/quotations/${id}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        }
                    });
                });

                await Promise.all(deletions);
                setQuotations(prev => prev.filter(quote => !selectedQuotations.includes(quote.quotation_id)));
                setSelectedQuotations([]);
                refetch();
                toast.success(`${selectedQuotations.length} quotations deleted successfully`);
            } catch (error) {
                toast.error('Failed to delete some quotations');
            }
        }
    };

    // List View Component
    const ListView = () => (
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200 relative">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quotation #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredQuotations?.map((quote) => {
                        const statusConfig = getStatusConfig(quote.status);
                        const StatusIcon = statusConfig.icon;
                        return (
                            <tr key={quote.quotation_id} className="hover:bg-gray-50 transition-colors">

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-blue-600">
                                        {quote.quotation_number}
                                    </div>
                                    <div className="text-sm text-gray-500">{quote.notes}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center text-sm text-gray-900">
                                        <FaCalendarAlt className="mr-2 text-gray-400 w-4 h-4" />
                                        {quote.date ? new Date(quote.date).toLocaleDateString() : 'N/A'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <FaUser className="mr-2 text-gray-400 w-4 h-4" />
                                        <span className="text-sm text-gray-900">{quote.customer_name || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center text-sm font-semibold text-gray-900">
                                        <FaDollarSign className="mr-1 text-gray-400 w-4 h-4" />
                                        ${quote.grand_total || '0.00'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        ${quote.order_total || '0.00'} + ${quote.delivery_fee || '0.00'} delivery
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">

                                    <Space.Compact>
                                        <Button>{quote.status}</Button>
                                        <Dropdown disabled={quote.status == 'approved'} menu={menuProps} onOpenChange={() => setId(quote.quotation_id)} placement="bottomRight">
                                            <Button icon={<StatusIcon />} />
                                        </Dropdown>
                                    </Space.Compact>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {quote.date_term ? new Date(quote.date_term).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => navigator(`detail/${quote.quotation_id}`)}
                                            className="text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-50 rounded"
                                            title="View Details"
                                        >
                                            <FaEye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => navigator(`edit/${quote.quotation_id}`)}
                                            className="text-green-600 hover:text-green-800 transition-colors p-1 hover:bg-green-50 rounded"
                                            title="Edit"
                                        >
                                            <FaEdit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => navigator(`receipt/${quote.quotation_id}`)}
                                            className="text-purple-600 hover:text-purple-800 transition-colors p-1 hover:bg-purple-50 rounded"
                                            title="Print Receipt"
                                        >
                                            <FaPrint className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(quote.quotation_id)}
                                            className="text-red-600 hover:text-red-800 transition-colors p-1 hover:bg-red-50 rounded"
                                            title="Delete"
                                        >
                                            <FaTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    // Grid View Component
    const GridView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuotations?.map((quote) => {
                const statusConfig = getStatusConfig(quote.status);
                const StatusIcon = statusConfig.icon;

                return (
                    <div key={quote.quotation_id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-blue-600">
                                        {quote.quotation_number}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">{quote.notes}</p>
                                </div>
                                <Space.Compact>
                                    <Button>{quote.status}</Button>
                                    <Dropdown disabled={quote.status == 'approved'} menu={menuProps} placement="bottomRight">
                                        <Button icon={<StatusIcon />} />
                                    </Dropdown>
                                </Space.Compact>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 flex items-center text-sm">
                                        <FaCalendarAlt className="mr-2 w-4 h-4" />
                                        Date:
                                    </span>
                                    <span className="font-medium text-sm">{quote.date ? new Date(quote.date).toLocaleDateString() : 'N/A'}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 flex items-center text-sm">
                                        <FaUser className="mr-2 w-4 h-4" />
                                        Customer:
                                    </span>
                                    <span className="font-medium text-sm">{quote.customer_name || 'N/A'}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 flex items-center text-sm">
                                        <FaDollarSign className="mr-2 w-4 h-4" />
                                        Total:
                                    </span>
                                    <span className="font-bold">${quote.grand_total || '0.00'}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 text-sm">Due Date:</span>
                                    <span className="font-medium text-sm">{quote.date_term ? new Date(quote.date_term).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <div className="text-sm text-gray-600 mb-2">Items:</div>
                                <div className="space-y-2">
                                    {quote.details?.slice(0, 3).map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span className="truncate">{item.item_name}</span>
                                            <span className="font-medium">${item.total_price || '0.00'}</span>
                                        </div>
                                    ))}
                                    {quote.details?.length > 3 && (
                                        <div className="text-sm text-gray-500 text-center">
                                            +{quote.details.length - 3} more items
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                                <button onClick={() => navigator(`detail/${quote.quotation_id}`)} className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 px-2 py-1 rounded">
                                    <FaEye className="mr-1" /> View
                                </button>
                                <button onClick={() => navigator(`edit/${quote.quotation_id}`)} className="flex items-center text-green-600 hover:text-green-800 text-sm font-medium hover:bg-green-50 px-2 py-1 rounded">
                                    <FaEdit className="mr-1" /> Edit
                                </button>
                                <button onClick={() => navigator(`receipt/${quote.quotation_id}`)} className="flex items-center text-purple-600 hover:text-purple-800 text-sm font-medium hover:bg-purple-50 px-2 py-1 rounded">
                                    <FaPrint className="mr-1" /> Print
                                </button>
                                <button
                                    onClick={() => handleDelete(quote.quotation_id)}
                                    className="flex items-center text-red-600 hover:text-red-800 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded"
                                >
                                    <FaTrash className="mr-1" /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading quotations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            {/* Delete Confirmation Alert */}
            <AlertBox
                isOpen={alertBox}
                title="Delete Quotation"
                message="Are you sure you want to delete this quotation? This action cannot be undone."
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirmText="Delete"
                cancelText="Cancel"
                confirmColor="error"
            />

            {/* Status Update Modal */}
            {statusUpdateModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Update Status</h3>
                                <button
                                    onClick={closeStatusUpdateModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <p className="text-gray-600 mb-2">
                                    Quotation: <span className="font-semibold">{statusUpdateModal.quoteNumber}</span>
                                </p>
                                <p className="text-gray-600">
                                    Current Status: {getStatusBadge(statusUpdateModal.currentStatus)}
                                </p>
                            </div>

                            <div className="space-y-3 mb-6">
                                {statusOptions.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => setStatusUpdateModal(prev => ({ ...prev, newStatus: option.value }))}
                                            className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${statusUpdateModal.newStatus === option.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                <Icon className={`mr-3 w-5 h-5 ${option.color.split(' ')[1]}`} />
                                                <span className="font-medium">{option.label}</span>
                                            </div>
                                            {statusUpdateModal.newStatus === option.value && (
                                                <FaCheck className="text-blue-600" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={closeStatusUpdateModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={''}
                                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
                                >
                                    Update Status
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Quotations</h1>
                        <p className="text-gray-600 mt-1">Manage and track all your quotations</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigator('create')}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300 font-medium"
                        >
                            <FaEdit className="w-4 h-4" />
                            New Quotation
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-200">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1 min-w-[250px]">
                                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by number, notes, or customer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <FaFilter className="text-gray-500 w-4 h-4" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    >
                                        <option value="all">All Status</option>
                                        {statusOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* View Toggle */}
                            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-3 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <FaList className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-3 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <FaTh className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {statusOptions.map((status) => (
                    <div key={status.value} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className={`p-3 ${status.color.split(' ')[0]} rounded-lg`}>
                                <status.icon className={status.color.split(' ')[1]} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">{status.label}</p>
                                <p className="text-2xl font-bold">
                                    {quotations?.filter(q => q.status === status.value).length || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bulk Actions */}
            {selectedQuotations.length > 0 && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
                                {selectedQuotations.length} selected
                            </div>
                            <span className="text-gray-700">Select an action:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <div className="relative dropdown-container">
                                <button
                                    onClick={() => setDropdownOpen('bulk-status')}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                                >
                                    <FaSyncAlt className="w-4 h-4" />
                                    Update Status
                                    <FaChevronDown className="w-3 h-3" />
                                </button>

                                {dropdownOpen === 'bulk-status' && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                        <div className="py-1">
                                            {statusOptions.map((option) => {
                                                const Icon = option.icon;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => {
                                                            handleBulkStatusUpdate(option.value);
                                                            setDropdownOpen(null);
                                                        }}
                                                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        <Icon className={`mr-3 w-4 h-4 ${option.color.split(' ')[1]}`} />
                                                        Set as {option.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleBulkDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors"
                            >
                                Delete Selected
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {filteredQuotations?.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaTag className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">No quotations found</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            {searchTerm || statusFilter !== 'all'
                                ? 'No quotations match your search criteria. Try adjusting your filters.'
                                : 'You have not created any quotations yet. Start by creating your first quotation.'
                            }
                        </p>
                        <button
                            onClick={() => navigator('create')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300 font-medium"
                        >
                            <FaEdit className="w-4 h-4" />
                            Create New Quotation
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Summary Bar */}
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <span className="text-sm text-gray-600">
                                    Showing {filteredQuotations?.length} of {quotations?.length} quotations
                                </span>
                            </div>
                            <div className="text-sm font-semibold text-gray-800">
                                Total Value: ${filteredQuotations?.reduce((sum, quote) => sum + parseFloat(quote.grand_total || 0), 0).toFixed(2)}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {viewMode === 'list' ? <ListView /> : <GridView />}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default QuotationList;