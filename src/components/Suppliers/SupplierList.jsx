import React, { useState, useEffect } from 'react';
import { FaSearch, FaEye, FaEdit, FaTrash, FaTimes, FaPlus, FaMapMarkerAlt, FaTruck, FaList, FaThLarge, FaPhone, FaEnvelope } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router';
import api from '../../services/api';
import { useGetAllSupplierQuery } from '../../../app/Features/suppliesSlice';
import { Image, Card, Skeleton, Badge, Tag, Empty, Tooltip, message } from 'antd';
import { FaMapLocationDot } from "react-icons/fa6";
import { motion, AnimatePresence } from 'framer-motion';
import RefreshButton from '../../utils/RefreshButton';
import RichSearch from '../../utils/RichSearch';
import Button from '../../utils/Button';
import Pagination from '../../utils/Pagination';
import { useTranslation } from 'react-i18next';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import ActionButton from '../../utils/ActionButton';

const MENU_ID = 14;
const SupplierList = () => {
  const { t } = useTranslation();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { data: supplierData, error, isLoading, refetch } = useGetAllSupplierQuery(token);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  const ActionButtons = ({ supplier }) => {
    const actions = [
      {
        type: 'view',
        icon: <FaEye size={14} />,
        onClick: () => openDetail(supplier),
        title: t('details'),
        label: t('details')
      },
      {
        type: 'modify',
        icon: <FaEdit size={14} />,
        onClick: () => handleEdit(supplier),
        title: t('edit'),
        label: t('edit')
      },
      {
        type: 'drop',
        icon: <FaTrash size={14} />,
        onClick: () => handleDelete(supplier.supplier_id),
        title: t('delete'),
        label: t('delete')
      },
      {
        type: 'view',
        icon: <FaMapLocationDot size={14} />,
        onClick: () => window.open(`https://www.google.com/maps?q=${encodeURIComponent(formatAddress(supplier))}`, '_blank'),
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
    if (supplierData?.data) {
      setSuppliers(supplierData.data);
      setFilteredSuppliers(supplierData.data);
    }
  }, [supplierData]);

  useEffect(() => {
    const filtered = suppliers.filter(supplier =>
      supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplier_tel?.includes(searchTerm) ||
      supplier.supplier_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSuppliers(filtered);
    setCurrentPage(1);
  }, [searchTerm, suppliers]);

  const handleDelete = async (id) => {
    if (window.confirm(t('confirmDeleteSupplier', 'Are you sure you want to delete this supplier?'))) {
      try {
        await api.delete(`/suppliers/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuppliers(suppliers.filter(supplier => supplier.supplier_id !== id));
        setFilteredSuppliers(filteredSuppliers.filter(supplier => supplier.supplier_id !== id));
        message.success(t('supplierDeleted', 'Supplier deleted successfully!'));
      } catch (err) {
        message.error(err.response?.data?.message || t('operationFailed', 'Error deleting supplier.'));
      }
    }
  };

  const openDetail = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailModal(true);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);

  const formatAddress = (supplier) => {
    const parts = [
      supplier.villages,
      supplier.communes,
      supplier.districts,
      supplier.provinces
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : supplier.supplier_address || 'N/A';
  };

  const handleEdit = (supplier) => {
    setShowDetailModal(false);
    localStorage.setItem("itemEdit", JSON.stringify(supplier));
    navigate(`edit/${supplier.supplier_id}`);
  };

  return (
    <div className="view-page bg-transparent transition-colors">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b-0 border-x p-4 dark:border-gray-500 border-gray-200 bg-white dark:bg-gray-600">
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:!text-gray-100 flex items-center gap-3">
                {t('suppliers', 'Suppliers')}
              </h1>
              <p className="text-gray-600 text-xs dark:!text-gray-400 mt-2">
                {t('manageSupplierNetwork', 'Manage your supplier network')}
              </p>
            </div>
            <div className="flex justify-center items-center gap-2">
                <Button 
                    variant='primary'
                    menuId={MENU_ID}
                    actionType="is_modify"
                    onClick={() => navigate("create")}
                >
                    <FaPlus /> {t('new', 'New')}
                </Button>
                <RefreshButton onRefresh={refetch} />
            </div>
        </div>

        {/* Search and Controls */}
        <div className="bg-gray-100 p-4 border dark:bg-transparent dark:border-gray-500 border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchSupplierPlaceholder', "Search by name, phone or email...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-400 rounded-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm dark:text-gray-100 bg-transparent"
                />
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <label className="text-gray-500 whitespace-nowrap text-sm">{t('show', 'Show')}:</label>
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
                <div className="flex items-center rounded-sm p-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-500">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-sm transition-all ${viewMode === 'grid' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        <FaThLarge size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-sm transition-all ${viewMode === 'list' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        <FaList size={16} />
                    </button>
                </div>
              </div>
            </div>
        </div>

        {/* Content Container */}
        <div className="border-t-0 px-4 py-6 border-x bg-gradient-to-b from-gray-50 to-gray-100 dark:bg-transparent dark:from-transparent dark:to-transparent border-gray-200 dark:border-gray-500 min-h-[400px]">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i} className="dark:bg-gray-800 border-gray-100 dark:border-gray-700">
                    <Skeleton active avatar={{ size: 'large', shape: 'square' }} paragraph={{ rows: 2 }} />
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 rounded-sm flex items-center gap-3">
                <ExclamationCircleOutlined className="text-xl" />
                <div>
                  <p className="">{t('errorLoadingSuppliers', 'Error loading suppliers')}</p>
                  <p className="text-sm opacity-90">{error.message || t('tryRefreshing', "Please try refreshing the page.")}</p>
                </div>
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="text-center">
                      <p className="text-gray-500 text-lg dark:text-gray-400">{t('noSuppliersFound', 'No suppliers found')}</p>
                      <p className="text-gray-400 text-sm">{t('tryAdjustingSearch', 'Try adjusting your search criteria')}</p>
                    </div>
                  } 
                />
              </div>
            ) : viewMode === 'list' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-700">
                      <th className="px-6 py-4">{t('supplier', 'Supplier')}</th>
                      <th className="px-6 py-4">{t('location', 'Location')}</th>
                      <th className="px-6 py-4">{t('contact', 'Contact')}</th>
                      <th className="px-6 py-4 text-center">{t('actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {currentSuppliers.map((supplier) => (
                      <tr key={supplier.supplier_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-100 dark:border-gray-600 flex-shrink-0">
                              <Image 
                                className="object-cover h-full w-full" 
                                src={supplier?.image || import.meta.env.VITE_DEFAULT_PROFILE}
                                onError={(e) => e.target.src = import.meta.env.VITE_DEFAULT_PROFILE} 
                                fallback={import.meta.env.VITE_DEFAULT_PROFILE}
                              />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 dark:text-gray-100">
                                {supplier.supplier_name}
                              </p>
                              <p className="text-[10px] text-gray-500 ">{t('id', 'ID')}: #{supplier.supplier_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2 max-w-[250px]">
                            <FaMapMarkerAlt className="text-red-400 mt-1 flex-shrink-0" />
                            <span className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed" title={formatAddress(supplier)}>
                              {formatAddress(supplier)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                              <FaPhone className="text-blue-400 text-[10px]" /> {supplier.supplier_tel || "No Phone"}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate max-w-[150px] flex items-center gap-2">
                              <FaEnvelope className="text-gray-400 text-[10px]" /> {supplier.supplier_email || "No Email"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <ActionButtons supplier={supplier} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {currentSuppliers.map((supplier) => (
                  <motion.div
                    key={supplier.supplier_id}
                    whileHover={{ y: -5 }}
                    className="bg-white dark:bg-gray-800 rounded-sm border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="h-40 relative overflow-hidden bg-gray-50 dark:bg-gray-900">
                        <Image
                          alt={supplier.supplier_name}
                          src={supplier.image || import.meta.env.VITE_DEFAULT_PROFILE}
                          className="w-full h-full object-cover"
                          preview={false}
                          fallback={import.meta.env.VITE_DEFAULT_PROFILE}
                        />
                        <div className="absolute top-2 right-2">
                          <Tag color="blue" className="m-0 text-[10px] font-bold">#{supplier.supplier_id}</Tag>
                        </div>
                    </div>
                    <div className="p-4 flex-grow">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate mb-2">{supplier.supplier_name}</h3>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-start gap-2 text-[10px] text-gray-500 dark:text-gray-400 min-h-[30px]">
                            <FaMapMarkerAlt className="text-red-400 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{formatAddress(supplier)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-300">
                            <FaPhone className="text-blue-400 flex-shrink-0" />
                            <span className="font-medium">{supplier.supplier_tel || "N/A"}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <ActionButtons supplier={supplier} />
                        </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

          {filteredSuppliers.length > 0 && (
            <div className="mt-6 flex justify-end">
              <Pagination
                current={currentPage}
                total={filteredSuppliers.length}
                pageSize={itemsPerPage}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                size="small"
                t={t}
              />
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedSupplier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-sm  max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-chomnenh-light p-8 rounded-sm">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all outline-none"
                >
                  <FaTimes />
                </button>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <img
                      src={selectedSupplier.image || import.meta.env.VITE_DEFAULT_PROFILE}
                      onError={(e) => e.target.src = import.meta.env.VITE_DEFAULT_PROFILE}
                      alt={selectedSupplier.supplier_name}
                      className="w-28 h-28 rounded-3xl object-cover border-4 border-white "
                    />
                    <div className="absolute -bottom-2 -right-2 bg-blue-500 w-8 h-8 rounded-full border-4 border-white"></div>
                  </div>
                  <div className="text-white text-center sm:text-left">
                    <h2 className="text-3xl  mb-1">{selectedSupplier.supplier_name}</h2>
                    <Tag color="blue" className="rounded-full px-3 border-none bg-white/20 text-white ">
                      {t('supplier', 'Supplier')} ID: #{selectedSupplier.supplier_id}
                    </Tag>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm  text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                        {t('contactInfo', 'Contact Info')}
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                          <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                            <FaPhone className="text-blue-500" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500  uppercase">{t('phoneNumber', 'Phone Number')}</p>
                            <p className="text-sm  text-gray-800 dark:text-gray-200">{selectedSupplier.supplier_tel || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                          <div className="p-2 bg-white dark:bg-gray-700 rounded-lg text-green-500 ">@</div>
                          <div>
                            <p className="text-[10px] text-gray-500  uppercase">{t('emailAddress', 'Email Address')}</p>
                            <p className="text-sm  text-gray-800 dark:text-gray-200 truncate max-w-[180px]">{selectedSupplier.supplier_email || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm  text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                        {t('location', 'Location')}
                      </h3>
                      <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                        <div className="flex items-start gap-3">
                          <FaMapMarkerAlt className="text-orange-500 mt-1" />
                          <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed ">
                              {formatAddress(selectedSupplier)}
                            </p>
                            <a
                              href={`https://www.google.com/maps?q=${encodeURIComponent(formatAddress(selectedSupplier))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-[10px] transition-all font-bold uppercase"
                            >
                              <FaMapLocationDot size={14} /> {t('openInMaps', 'OPEN IN MAPS')}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedSupplier.description && (
                  <div className="mt-6">
                    <Card title={t('description', 'Description')} size="small" className="shadow-sm border-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      <p className="text-sm italic text-gray-600 dark:text-gray-400">"{selectedSupplier.description}"</p>
                    </Card>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-10 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <Button
                    onClick={() => setShowDetailModal(false)}
                    variant='danger'
                    outline
                    className="order-2 sm:order-1 px-8 py-3 rounded-2xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700  transition-all font-bold uppercase tracking-wide"
                  >
                    {t('close', 'CLOSE')}
                  </Button>
                  <Button onClick={() => handleEdit(selectedSupplier)}
                    variant='success'
                    menuId={MENU_ID}
                    actionType="is_modify"
                    className="order-1 sm:order-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-wide"
                  >
                    <FaEdit /> {t('editSupplier', 'EDIT SUPPLIER')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupplierList;
