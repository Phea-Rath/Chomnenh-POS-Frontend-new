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
import { useGetAllQuoteQuery, useDeleteQuoteMutation, useUpdateQuoteStatusMutation } from "@/features/sales/quoteSlice";
import api from '../../services/api';
import { toast } from 'react-toastify';
import AlertBox from '../../services/AlertBox';
import { Dropdown } from 'antd';
import { useGetAllSaleQuery } from "@/features/sales/salesSlice";
import { useTranslation } from 'react-i18next';
import RefreshButton from '../../utils/RefreshButton';
import ActionButton from '../../utils/ActionButton';
import { motion } from 'framer-motion';
import Button from '../../utils/Button';
import { FaPlus } from 'react-icons/fa';
import { definePermission } from '../../services/serviceFunction';
import { getToken } from '@/utils/tokenStore';
const MENU_ID = 18;
const QuotationList = () => {
    const { t, i18n } = useTranslation();
    const navigator = useNavigate();
    const token = getToken();
    const queryArgs = { token, start_date: '', end_date: '' };
    const { data, refetch, isLoading } = useGetAllQuoteQuery(queryArgs);
    const { refetch: saleFetch } = useGetAllSaleQuery(token);
    const [deleteQuote] = useDeleteQuoteMutation();
    const [updateQuoteStatus] = useUpdateQuoteStatusMutation();
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

    const statusOptions = [
        { value: 'draft', label: t('draft'), icon: FaFileAlt, color: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700' },
        { value: 'submitted', label: t('submitted'), icon: FaHourglassHalf, color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700' },
        { value: 'approved', label: t('approved'), icon: FaCheckCircle, color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700' },
        { value: 'rejected', label: t('rejected'), icon: FaTimesCircle, color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700' },
    ];

    const menuItems = [
        {
            label: t('draft'),
            key: 'draft',
            icon: <FaFileAlt className="text-slate-500" />,
        },
        {
            label: t('submitted'),
            key: 'submitted',
            icon: <FaHourglassHalf className="text-amber-500" />,
        },
        {
            label: t('approved'),
            key: 'approved',
            icon: <FaCheckCircle className="text-emerald-500" />,
        },
        {
            label: t('rejected'),
            key: 'rejected',
            icon: <FaTimesCircle className="text-rose-500" />,
            danger: true
        },
    ];

    const handleStatusChange = async (quoteId, newStatus) => {
        try {
            await updateQuoteStatus({ id: quoteId, status: newStatus, token }).unwrap();
            if (saleFetch) saleFetch();
            toast.success(t('successfully'));
        } catch (error) {
            toast.error(error?.data?.message || error?.message || error);
        }
    };

    const StatusDropdown = ({ quote }) => {
        const config = getStatusConfig(quote.status);
        const StatusIcon = config.icon;
        const isEditable = quote.status !== 'approved' && definePermission(MENU_ID).is_execute;

        const badge = (
            <button
                type="button"
                disabled={!isEditable}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-xs ${config.color} ${
                    isEditable ? 'cursor-pointer hover:opacity-85 hover:scale-[1.02] active:scale-[0.98]' : 'cursor-default'
                }`}
            >
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{config.label}</span>
                {isEditable && <FaChevronDown className="w-2.5 h-2.5 ml-0.5 opacity-75" />}
            </button>
        );

        if (!isEditable) {
            return badge;
        }

        return (
            <Dropdown
                menu={{
                    items: menuItems,
                    onClick: (e) => handleStatusChange(quote.quotation_id, e.key)
                }}
                trigger={['click']}
                placement="bottomRight"
            >
                {badge}
            </Dropdown>
        );
    };

    useEffect(() => {
        if (data?.data) {
            setQuotations(data.data);
        }
    }, [data]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-container')) {
                setDropdownOpen(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

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

    const handleConfirm = async () => {
        try {
            await deleteQuote({ id, token, queryArgs }).unwrap();
            toast.success(t('successfully'));
            setAlertBox(false);
            setId(0);
        } catch (error) {
            toast.error(error?.data?.message || error?.message || error);
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

    const handleBulkStatusUpdate = async (newStatus) => {
        if (selectedQuotations.length === 0) {
            toast.warning(t('pleaseAddAtLeastOneItem'));
            return;
        }

        
        if (window.confirm(t('confirmUpdate'))) {
            try {
                const updates = selectedQuotations.map(async (quotation_id) => {
                    await api.put(`/quote_status/${quotation_id}/${newStatus}`, {}, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        }
                    });
                });

                await Promise.all(updates);

                setQuotations(prev => prev.map(quote =>
                    selectedQuotations.includes(quote.quotation_id)
                        ? { ...quote, status: newStatus }
                        : quote
                ));

                toast.success(t('successfully'));
                setSelectedQuotations([]);
                refetch();
            } catch (error) {
                toast.error(t('processFailed'));
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedQuotations.length === 0) return;

        if (window.confirm(t('deleteQuotation'))) {
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
                toast.success(t('successfully'));
            } catch (error) {
                toast.error(t('processFailed'));
            }
        }
    };

    const ListView = () => (
        <div className="overflow-x-auto bg-primary rounded-lg  border border-gray-200 dark:border-gray-700 relative">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('quotationNo')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('date')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('customer')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('totalAmount')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('dueDate')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('actions')}
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-primary divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredQuotations?.map((quote) => {
                        return (
                            <tr key={quote.quotation_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                                        {quote.quotation_number}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{quote.notes}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center text-sm text-gray-900 dark:text-gray-200">
                                        <FaCalendarAlt className="mr-2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                                        {quote.date ? new Date(quote.date).toLocaleDateString() : 'N/A'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <FaUser className="mr-2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                                        <span className="text-sm text-gray-900 dark:text-gray-200">{quote.customer_name || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center text-sm font-semibold text-gray-900 dark:text-gray-200">
                                        <FaDollarSign className="mr-1 text-gray-400 dark:text-gray-500 w-4 h-4" />
                                        {quote.grand_total || '0.00'}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {quote.order_total || '0.00'} + {quote.delivery_fee || '0.00'} {t('delivery')}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusDropdown quote={quote} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {quote.date_term ? new Date(quote.date_term).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <ActionButton
                                        menuId={MENU_ID}
                                        actions={[
                                            {
                                                type: 'view',
                                                icon: <FaEye />,
                                                onClick: () => navigator(`detail/${quote.quotation_id}`),
                                                title: t('viewDetails'),
                                                label: t('viewDetails')
                                            },
                                            {
                                                type: 'modify',
                                                icon: <FaEdit />,
                                                onClick: () => navigator(`edit/${quote.quotation_id}`),
                                                title: t('edit'),
                                                label: t('edit')
                                            },
                                            {
                                                type: 'execute',
                                                icon: <FaPrint />,
                                                onClick: () => navigator(`receipt/${quote.quotation_id}`),
                                                title: t('printReceipt'),
                                                label: t('print')
                                            },
                                            {
                                                type: 'drop',
                                                icon: <FaTrash />,
                                                onClick: () => handleDelete(quote.quotation_id),
                                                title: t('delete'),
                                                label: t('delete')
                                            }
                                        ]}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    const GridView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuotations?.map((quote) => {
                return (
                    <div key={quote.quotation_id} className="bg-white dark:bg-gray-800 rounded-lg  border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">
                                        {quote.quotation_number}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{quote.notes}</p>
                                </div>
                                <StatusDropdown quote={quote} />
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400 flex items-center text-sm">
                                        <FaCalendarAlt className="mr-2 w-4 h-4" />
                                        {t('date')}:
                                    </span>
                                    <span className="font-medium text-sm dark:text-gray-200">{quote.date ? new Date(quote.date).toLocaleDateString() : 'N/A'}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400 flex items-center text-sm">
                                        <FaUser className="mr-2 w-4 h-4" />
                                        {t('customer')}:
                                    </span>
                                    <span className="font-medium text-sm dark:text-gray-200">{quote.customer_name || 'N/A'}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400 flex items-center text-sm">
                                        <FaDollarSign className="mr-2 w-4 h-4" />
                                        {t('total')}:
                                    </span>
                                    <span className="font-bold dark:text-gray-200">{quote.grand_total || '0.00'}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400 text-sm">{t('dueDate')}:</span>
                                    <span className="font-medium text-sm dark:text-gray-200">{quote.date_term ? new Date(quote.date_term).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('items')}:</div>
                                <div className="space-y-2">
                                    {quote.details?.slice(0, 3).map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span className="truncate dark:text-gray-300">{item.item_name}</span>
                                            <span className="font-medium dark:text-gray-200">{item.total_price || '0.00'}</span>
                                        </div>
                                    ))}
                                    {quote.details?.length > 3 && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                            +{quote.details.length - 3} {t('more')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <ActionButton
                                menuId={MENU_ID}
                                    actions={[
                                        {
                                            type: 'view',
                                            icon: <FaEye />,
                                            onClick: () => navigator(`detail/${quote.quotation_id}`),
                                            title: t('viewDetails'),
                                            label: t('viewDetails')
                                        },
                                        {
                                            type: 'modify',
                                            icon: <FaEdit />,
                                            onClick: () => navigator(`edit/${quote.quotation_id}`),
                                            title: t('edit'),
                                            label: t('edit')
                                        },
                                        {
                                            type: 'execute',
                                            icon: <FaPrint />,
                                            onClick: () => navigator(`receipt/${quote.quotation_id}`),
                                            title: t('printReceipt'),
                                            label: t('print')
                                        },
                                        {
                                            type: 'drop',
                                            icon: <FaTrash />,
                                            onClick: () => handleDelete(quote.quotation_id),
                                            title: t('delete'),
                                            label: t('delete')
                                        }
                                    ]}
                                />
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loadingDetails')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="view-page bg-transparent transition-colors">
            <AlertBox
                isOpen={alertBox}
                title={t('deleteQuotation')}
                message={t('confirmDeleteQuotation')}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirmText={t('delete')}
                cancelText={t('cancel')}
                confirmColor="error"
            />

            <div className="">
                {/* Header */}
                <div className="flex items-center justify-between border-b-0 border-x p-4 dark:border-gray-700 border-gray-200 bg-white dark:bg-gray-800 transition-colors">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                            {t('quotations')}
                        </h1>
                        <p className="text-gray-600 text-xs dark:text-gray-400 mt-2">
                            {t('manageTrackQuotations')}
                        </p>
                    </div>
                    <div className="mt-6 flex justify-center items-center gap-2">
                        <RefreshButton onRefresh={refetch} />
                        <Button
                            variant="save"
                            actionType="is_modify"
                            menuId={MENU_ID}
                            onClick={() => navigator('create')}
                        >
                            <FaPlus className="w-3.5 h-3.5 mr-1" />
                            {t('newQuotation')}
                        </Button>
                    </div>
                </div>

                {/* Filters Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="bg-gray-100 dark:bg-gray-800/60 dark:border-gray-700 p-4 border border-gray-200 border-t-0 transition-colors">
                        <div className="flex flex-wrap items-end gap-5">
                            <div className="grow max-w-xs">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <span className="flex items-center text-sm font-semibold gap-2 uppercase text-[11px] tracking-wider">
                                        <FaSearch className="text-gray-400 dark:text-gray-500" />
                                        {t('search')}
                                    </span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={t('searchQuotationPlaceholder')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-white dark:bg-gray-800 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-200 h-10 outline-none focus:ring-2 focus:ring-cyan-500/50"
                                    />
                                </div>
                            </div>
                            <div className="grow max-w-xs">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <span className="flex items-center text-sm font-semibold gap-2 uppercase text-[11px] tracking-wider">
                                        <FaFilter className="text-gray-400 dark:text-gray-500" />
                                        {t('status')}
                                    </span>
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-800 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-200 h-10 outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none"
                                >
                                    <option value="all">{t('allStatus')}</option>
                                    {statusOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center h-10">
                                <div className="flex border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-3 h-full flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                    >
                                        <FaList className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-3 h-full flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                    >
                                        <FaTh className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {statusOptions.map((status) => (
                        <div key={status.value} className="bg-primary p-4 rounded-sm border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center">
                                <div className={`p-3 ${status.color.split(' ')[0]} rounded-lg`}>
                                    <status.icon className={status.color.split(' ')[1]} />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{status.label}</p>
                                    <p className="text-2xl font-bold dark:text-white">
                                        {quotations?.filter(q => q.status === status.value).length || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-primary rounded-sm border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    {filteredQuotations?.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaTag className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">{t('noQuotationsFound')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                {searchTerm || statusFilter !== 'all'
                                    ? t('noQuotationsMatchSearch')
                                    : t('noQuotationsCreated')
                                }
                            </p>
                            <Button
                                variant="save"
                                actionType="is_modify"
                                menuId={MENU_ID}
                                onClick={() => navigator('create')}
                            >
                                <FaPlus className="w-4 h-4 mr-2" />
                                {t('createFirstQuotation')}
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {t('showing')} <span className="font-bold text-gray-800 dark:text-white">{filteredQuotations?.length}</span> {t('of')} <span className="font-bold text-gray-800 dark:text-white">{quotations?.length}</span> {t('quotations')}
                                    </span>
                                </div>
                                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    {t('totalValue')}: <span className="text-lg text-cyan-600 dark:text-cyan-400 font-bold">${filteredQuotations?.reduce((sum, quote) => sum + parseFloat(quote.grand_total || 0), 0).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="p-0">
                                {viewMode === 'list' ? <ListView /> : <div className="p-4"><GridView /></div>}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuotationList;