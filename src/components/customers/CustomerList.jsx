import React, { useState, useEffect } from 'react';
import {
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaPlus,
  FaMapMarkerAlt,
  FaUsers,
  FaList,
  FaThLarge,
  FaPhone,
  FaEnvelope,
  FaUserCheck,
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router';
import api from '../../services/api';
import { useGetAllCustomerQuery } from "@/features/customers/customersSlice";
import { Image, Skeleton, Tag, Empty, message } from 'antd';
import { FaMapLocationDot } from "react-icons/fa6";
import { motion, AnimatePresence } from 'framer-motion';
import RefreshButton from '../../utils/RefreshButton';
import RichSearch from '../../utils/RichSearch';
import Button from '../../utils/Button';
import Pagination from '../../utils/Pagination';
import { useTranslation } from 'react-i18next';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import ActionButton from '../../utils/ActionButton';
import { getToken } from '@/utils/tokenStore';

const MENU_ID = 15;

const CustomerList = () => {
  const { t } = useTranslation();
  const token = getToken();
  const navigate = useNavigate();
  const { data: customerData, error, isLoading, refetch } = useGetAllCustomerQuery(token);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  const ActionButtons = ({ customer }) => {
    const actions = [
      {
        type: 'view',
        icon: <FaEye size={14} />,
        onClick: () => openDetail(customer),
        title: t('details'),
        label: t('details')
      },
      {
        type: 'modify',
        icon: <FaEdit size={14} />,
        onClick: () => handleEdit(customer),
        title: t('edit'),
        label: t('edit')
      },
      {
        type: 'drop',
        icon: <FaTrash size={14} />,
        onClick: () => handleDelete(customer.customer_id),
        title: t('delete'),
        label: t('delete')
      },
      {
        type: 'view',
        icon: <FaMapLocationDot size={14} />,
        onClick: () => window.open(`https://www.google.com/maps?q=${encodeURIComponent(formatAddress(customer))}`, '_blank'),
        title: t('openInMaps', 'OPEN IN MAPS'),
        label: t('openInMaps', 'OPEN IN MAPS')
      }
    ];

    return (
      <div className="flex justify-center">
        <ActionButton actions={actions} menuId={MENU_ID} />
      </div>
    );
  };

  const paginationOptions = [
    { id: 12, title: `12 / ${t('page')}` },
    { id: 24, title: `24 / ${t('page')}` },
    { id: 48, title: `48 / ${t('page')}` },
    { id: 96, title: `96 / ${t('page')}` },
  ];

  useEffect(() => {
    if (customerData?.data) {
      setCustomers(customerData.data);
      setFilteredCustomers(customerData.data);
    }
  }, [customerData]);

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customer_tel?.includes(searchTerm) ||
      customer.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [searchTerm, customers]);

  const handleDelete = async (id) => {
    if (window.confirm(t('confirmDeleteCustomer', 'Are you sure you want to delete this customer?'))) {
      try {
        await api.delete(`/customers/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCustomers(customers.filter(customer => customer.customer_id !== id));
        setFilteredCustomers(filteredCustomers.filter(customer => customer.customer_id !== id));
        message.success(t('customerDeleted', 'Customer deleted successfully!'));
      } catch (err) {
        message.error(err.response?.data?.message || t('operationFailed', 'Error deleting customer.'));
      }
    }
  };

  const openDetail = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

  const formatAddress = (customer) => {
    if (!customer) return 'N/A';
    const parts = [
      customer.villages,
      customer.communes,
      customer.districts,
      customer.provinces
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : customer.customer_address || 'N/A';
  };

  const handleEdit = (customer) => {
    setShowDetailModal(false);
    localStorage.setItem("itemEdit", JSON.stringify(customer));
    navigate(`edit/${customer.customer_id}`);
  };

  return (
    <div className="space-y-5 p-4 md:p-6 transition-colors">
      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 md:p-5 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
              <FaUsers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {t('customers', 'Customers')}
                </h1>
                <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-xs font-bold text-cyan-600 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-400">
                  {filteredCustomers.length} {t('records') || 'Total'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t('manageCustomerDatabase', 'Manage your customer database and profiles')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              menuId={MENU_ID}
              actionType="is_modify"
              onClick={() => navigate("create")}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-600 hover:to-blue-700 transition-all"
            >
              <FaPlus className="h-3.5 w-3.5" />
              <span>{t('new', 'New Customer')}</span>
            </Button>
            <RefreshButton onRefresh={refetch} />
          </div>
        </div>

        {/* Search & Layout View Controls */}
        <div className="mt-4 flex flex-col items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 md:flex-row">
          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchCustomerPlaceholder', "Search by name, phone or email...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:bg-slate-800"
            />
          </div>

          <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('show', 'Show')}:</span>
              <div className="w-32">
                <RichSearch
                  data={paginationOptions}
                  keyFields={{ id: 'id', title: 'title' }}
                  value={itemsPerPage}
                  onSelected={(id) => {
                    setItemsPerPage(id);
                    setCurrentPage(1);
                  }}
                  placeholder={`${itemsPerPage} / ${t('page')}`}
                />
              </div>
            </div>

            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-800/60">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-all ${
                  viewMode === 'grid'
                    ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/20 dark:bg-cyan-500'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <FaThLarge size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="List View"
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-all ${
                  viewMode === 'list'
                    ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/20 dark:bg-cyan-500'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <FaList size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <Skeleton active avatar={{ size: 'large', shape: 'circle' }} paragraph={{ rows: 2 }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-rose-700 dark:border-rose-950 dark:bg-rose-950/30 dark:text-rose-400">
            <ExclamationCircleOutlined className="text-xl" />
            <div>
              <p className="font-bold">{t('errorLoadingCustomers', 'Error loading customers')}</p>
              <p className="text-xs opacity-90">{error.message || t('tryRefreshing', "Please try refreshing the page.")}</p>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
              <FaUsers className="h-9 w-9" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('noCustomersFound', 'No customers found')}</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('tryAdjustingSearch', 'Try adjusting your search criteria')}</p>
          </div>
        ) : viewMode === 'list' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                    <th className="px-6 py-3.5">{t('customer', 'Customer')}</th>
                    <th className="px-6 py-3.5">{t('location', 'Location')}</th>
                    <th className="px-6 py-3.5">{t('contact', 'Contact')}</th>
                    <th className="px-6 py-3.5 text-center">{t('actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {currentCustomers.map((customer) => (
                    <tr key={customer.customer_id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3.5">
                          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 shrink-0">
                            <Image
                              className="h-full w-full object-cover"
                              src={customer?.image || import.meta.env.VITE_DEFAULT_PROFILE}
                              onError={(e) => e.target.src = import.meta.env.VITE_DEFAULT_PROFILE}
                              fallback={import.meta.env.VITE_DEFAULT_PROFILE}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-xs">
                              {customer.customer_name}
                            </p>
                            <span className="inline-flex items-center mt-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              #{customer.customer_id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-start gap-2 max-w-[280px]">
                          <FaMapMarkerAlt className="mt-0.5 h-3.5 w-3.5 text-rose-500 shrink-0" />
                          <span className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed" title={formatAddress(customer)}>
                            {formatAddress(customer)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="space-y-1">
                          <p className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                            <FaPhone className="h-3 w-3 text-cyan-500" />
                            <span>{customer.customer_tel || "No Phone"}</span>
                          </p>
                          <p className="flex items-center gap-2 text-[11px] text-slate-400 truncate max-w-[180px]">
                            <FaEnvelope className="h-3 w-3 text-slate-400" />
                            <span>{customer.customer_email || "No Email"}</span>
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <ActionButtons customer={customer} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {currentCustomers.map((customer) => (
              <motion.div
                key={customer.customer_id}
                whileHover={{ y: -3 }}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all duration-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                    <Image
                      alt={customer.customer_name}
                      src={customer.image || import.meta.env.VITE_DEFAULT_PROFILE}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      preview={false}
                      fallback={import.meta.env.VITE_DEFAULT_PROFILE}
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <span className="inline-flex items-center rounded-lg bg-slate-900/80 backdrop-blur-md px-2 py-1 text-[10px] font-extrabold text-white border border-white/20">
                        #{customer.customer_id}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                      {customer.customer_name}
                    </h3>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 min-h-[32px]">
                        <FaMapMarkerAlt className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-tight">{formatAddress(customer)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                        <FaPhone className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                        <span>{customer.customer_tel || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
                  <ActionButtons customer={customer} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Fixed / Sticky Pagination Bar */}
        {filteredCustomers.length > 0 && (
          <div className="sticky bottom-4 z-20 mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-3 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} entries
            </div>
            <Pagination
              current={currentPage}
              total={filteredCustomers.length}
              pageSize={itemsPerPage}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              size="small"
              t={t}
            />
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedCustomer && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Banner Header */}
              <div className="relative bg-slate-900 p-6 md:p-8 text-white dark:bg-slate-950">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <FaTimes className="h-4 w-4" />
                </button>

                <div className="flex flex-col items-center gap-5 sm:flex-row">
                  <div className="relative">
                    <img
                      src={selectedCustomer.image || import.meta.env.VITE_DEFAULT_PROFILE}
                      onError={(e) => e.target.src = import.meta.env.VITE_DEFAULT_PROFILE}
                      alt={selectedCustomer.customer_name}
                      className="h-24 w-24 rounded-2xl border-4 border-white/20 object-cover shadow-xl"
                    />
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-slate-900 bg-emerald-500" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-extrabold tracking-tight text-white">{selectedCustomer.customer_name}</h2>
                    <span className="mt-1.5 inline-flex items-center rounded-full bg-cyan-500/20 px-3 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-500/30">
                      {t('customer', 'Customer')} ID: #{selectedCustomer.customer_id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Body Details */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Contact Info Card */}
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <div className="h-3.5 w-1 rounded-full bg-cyan-500" />
                      {t('contactInfo', 'Contact Info')}
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
                          <FaPhone className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-400">{t('phoneNumber', 'Phone Number')}</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedCustomer.customer_tel || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <FaEnvelope className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase text-slate-400">{t('emailAddress', 'Email Address')}</p>
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{selectedCustomer.customer_email || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Info Card */}
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <div className="h-3.5 w-1 rounded-full bg-amber-500" />
                      {t('location', 'Location')}
                    </h3>
                    <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
                      <div className="flex items-start gap-3">
                        <FaMapMarkerAlt className="mt-1 h-4 w-4 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
                            {formatAddress(selectedCustomer)}
                          </p>
                          <a
                            href={`https://www.google.com/maps?q=${encodeURIComponent(formatAddress(selectedCustomer))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
                          >
                            <FaMapLocationDot size={14} />
                            <span>{t('openInMaps', 'OPEN IN MAPS')}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('close', 'CLOSE')}
                </button>
                <button
                  onClick={() => handleEdit(selectedCustomer)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-600 hover:to-blue-700 transition-all"
                >
                  <FaEdit className="h-3.5 w-3.5" />
                  <span>{t('editCustomer', 'EDIT CUSTOMER')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerList;
