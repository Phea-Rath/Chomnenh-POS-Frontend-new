import React, { useState, useEffect } from 'react';
import { FaSearch, FaEye, FaEdit, FaTrash, FaTimes, FaPlus, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router';
import api from '../../services/api';
import { useGetAllCustomerQuery } from '../../../app/Features/customersSlice';
import { Image, Card, Skeleton, Badge, Tag, Empty, Tooltip } from 'antd';
import { FaMapLocationDot } from "react-icons/fa6";
import { motion, AnimatePresence } from 'framer-motion';
import RefreshButton from '../../utils/RefreshButton';
import RichSearch from '../../utils/RichSearch';
import Button from '../../utils/Button';
import Pagination from '../../utils/Pagination';
import { useTranslation } from 'react-i18next';

const CustomerList = () => {
  const { t } = useTranslation();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { data: customerData, error, isLoading, refetch } = useGetAllCustomerQuery(token);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const paginationOptions = [
    { id: 10, title: '10 / Page' },
    { id: 20, title: '20 / Page' },
    { id: 50, title: '50 / Page' },
    { id: 100, title: '100 / Page' },
  ];

  useEffect(() => {
    if (customerData?.data) {
      setCustomers(customerData.data);
      setFilteredCustomers(customerData.data);
    }
  }, [customerData]);

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customer_tel?.includes(searchTerm) ||
      customer.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [searchTerm, customers]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.delete(`/customers/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCustomers(customers.filter(customer => customer.customer_id !== id));
        setFilteredCustomers(filteredCustomers.filter(customer => customer.customer_id !== id));
        message.success('Customer deleted successfully!');
      } catch (err) {
        message.error(err.response?.data?.message || 'Error deleting customer.');
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
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const formatAddress = (customer) => {
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
    <div className=" bg-transparent py-4">
      <div className=" sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-xl  shadow-blue-200">
              <FaUsers className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl  text-gray-900 dark:text-white">Customers</h1>
              <p className="text-sm text-gray-500">Manage your customer database</p>
            </div>
          </div>
          <div className='flex gap-2 w-full sm:w-auto'>
            <RefreshButton onRefresh={refetch} />
            <Link
              to="create" 
              >
              <Button>
                <FaPlus /> <span>New</span>
              </Button>
            </Link>
          </div>
        </div>

        <div>
          <div className='m-3'>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="label"
                  placeholder="Search by name, phone or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5  border border-gray-200 dark:border-gray-600 rounded-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm"
                />
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <label className="text-gray-500 whitespace-nowrap text-sm ">Show:</label>
                <div className="w-32">
                  <RichSearch
                    data={paginationOptions}
                    keyFields={{ id: 'id', title: 'title' }}
                    value={itemsPerPage}
                    onSelected={(id) => {
                      setItemsPerPage(id);
                      setCurrentPage(1);
                    }}
                    placeholder={`${itemsPerPage} / Page`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} active avatar={{ size: 'large', shape: 'square' }} paragraph={{ rows: 1 }} />
                ))}
              </div>
            ) : error ? (
              <div className="m-6 p-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
                <ExclamationCircleOutlined className="text-xl" />
                <div>
                  <p className="">Error loading customers</p>
                  <p className="text-sm opacity-90">{error.message || "Please try refreshing the page."}</p>
                </div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-20">
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="text-center">
                      <p className="text-gray-500 text-lg">No customers found</p>
                      <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                    </div>
                  } 
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-gray-500 dark:text-gray-400 uppercase text-[11px]  tracking-wider border-b border-gray-100 dark:border-gray-700">
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-transparent divide-gray-100 dark:divide-gray-700">
                    {currentCustomers.map((customer) => (
                      <tr key={customer.customer_id} className="hover:bg-blue-50/30 dark:hover:bg-gray-700/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-100 text- flex-shrink-0">
                              <Image 
                                className="object-cover h-full w-full" 
                                src={customer?.image || import.meta.env.VITE_DEFAULT_PROFILE}
                                onError={(e) => e.target.src = import.meta.env.VITE_DEFAULT_PROFILE} 
                                fallback={import.meta.env.VITE_DEFAULT_PROFILE}
                              />
                            </div>
                            <div>
                              <p className="text-sm  text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                {customer.customer_name}
                              </p>
                              <p className="text-[11px] text-gray-400 ">ID: #{customer.customer_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2 max-w-[250px]">
                            <FaMapMarkerAlt className="text-red-400 mt-1 flex-shrink-0" />
                            <span className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed" title={formatAddress(customer)}>
                              {formatAddress(customer)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                              {customer.customer_tel || "No Phone"}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate max-w-[150px]">
                              {customer.customer_email || "No Email"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center gap-1">
                            <Tooltip title="View Details">
                              <button
                                onClick={() => openDetail(customer)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <FaEye />
                              </button>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <button
                                onClick={() => handleEdit(customer)}
                                className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <FaEdit />
                              </button>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <button
                                onClick={() => handleDelete(customer.customer_id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <FaTrash />
                              </button>
                            </Tooltip>
                            <Tooltip title="View on Map">
                              <a
                                href={`https://www.google.com/maps?q=${encodeURIComponent(formatAddress(customer))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                              >
                                <FaMapLocationDot />
                              </a>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {filteredCustomers.length > 0 && (
            // <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
            //   <p className="text-xs text-gray-500  italic">
            //     Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} customers
            //   </p>
            //   <div className="pagination-container">
            //     <Pagination
            //       current={currentPage}
            //       total={filteredCustomers.length}
            //       pageSize={itemsPerPage}
            //       onChange={(page) => setCurrentPage(page)}
            //       showSizeChanger={false}
            //       size="small"
            //       className="dark:[&_.ant-pagination-item]:bg-gray-700 dark:[&_.ant-pagination-item]:border-gray-600 dark:[&_.ant-pagination-item_a]:text-gray-200 dark:[&_.ant-pagination-item-active]:bg-blue-600 dark:[&_.ant-pagination-item-active]:border-blue-500 dark:[&_.ant-pagination-item-active_a]:text-white dark:[&_.ant-pagination-prev_.ant-pagination-item-link]:bg-gray-700 dark:[&_.ant-pagination-prev_.ant-pagination-item-link]:border-gray-600 dark:[&_.ant-pagination-prev_.ant-pagination-item-link]:text-gray-200 dark:[&_.ant-pagination-next_.ant-pagination-item-link]:bg-gray-700 dark:[&_.ant-pagination-next_.ant-pagination-item-link]:border-gray-600 dark:[&_.ant-pagination-next_.ant-pagination-item-link]:text-gray-200 dark:[&_.ant-pagination-disabled_.ant-pagination-item-link]:bg-gray-800 dark:[&_.ant-pagination-disabled_.ant-pagination-item-link]:text-gray-500"
            //     />
            //   </div>
            // </div>
            <Pagination
              current={currentPage}
              total={filteredCustomers.length}
              pageSize={itemsPerPage}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              size="small"
              t={t}
              className="dark:[&_.ant-pagination-item]:bg-gray-700 dark:[&_.ant-pagination-item]:border-gray-600 dark:[&_.ant-pagination-item_a]:text-gray-200 dark:[&_.ant-pagination-item-active]:bg-blue-600 dark:[&_.ant-pagination-item-active]:border-blue-500 dark:[&_.ant-pagination-item-active_a]:text-white dark:[&_.ant-pagination-prev_.ant-pagination-item-link]:bg-gray-700 dark:[&_.ant-pagination-prev_.ant-pagination-item-link]:border-gray-600 dark:[&_.ant-pagination-prev_.ant-pagination-item-link]:text-gray-200 dark:[&_.ant-pagination-next_.ant-pagination-item-link]:bg-gray-700 dark:[&_.ant-pagination-next_.ant-pagination-item-link]:border-gray-600 dark:[&_.ant-pagination-next_.ant-pagination-item-link]:text-gray-200 dark:[&_.ant-pagination-disabled_.ant-pagination-item-link]:bg-gray-800 dark:[&_.ant-pagination-disabled_.ant-pagination-item-link]:text-gray-500"
            />
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            to="/dashboard"
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center gap-2  text-sm border border-gray-200 dark:border-gray-600"
          >
            <FaTimes /> Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedCustomer && (
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
                      src={selectedCustomer.image || import.meta.env.VITE_DEFAULT_PROFILE}
                      onError={(e) => e.target.src = import.meta.env.VITE_DEFAULT_PROFILE}
                      alt={selectedCustomer.customer_name}
                      className="w-28 h-28 rounded-3xl object-cover border-4 border-white "
                    />
                    <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white text-"></div>
                  </div>
                  <div className="text-white text-center sm:text-left">
                    <h2 className="text-3xl  mb-1">{selectedCustomer.customer_name}</h2>
                    <Tag color="blue" className="rounded-full px-3 border-none bg-white/20 text-white ">
                      Customer ID: #{selectedCustomer.customer_id}
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
                        Contact Info
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                          <div className="p-2 bg-white dark:bg-gray-700 rounded-lg text-">
                            <FaEye className="text-blue-500" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500  uppercase">Phone Number</p>
                            <p className="text-sm  text-gray-800 dark:text-gray-200">{selectedCustomer.customer_tel || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                          <div className="p-2 bg-white dark:bg-gray-700 rounded-lg text- text-green-500 ">@</div>
                          <div>
                            <p className="text-[10px] text-gray-500  uppercase">Email Address</p>
                            <p className="text-sm  text-gray-800 dark:text-gray-200 truncate max-w-[180px]">{selectedCustomer.customer_email || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm  text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                        Location
                      </h3>
                      <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                        <div className="flex items-start gap-3">
                          <FaMapMarkerAlt className="text-orange-500 mt-1" />
                          <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed ">
                              {formatAddress(selectedCustomer)}
                            </p>
                            <a
                              href={`https://www.google.com/maps?q=${encodeURIComponent(formatAddress(selectedCustomer))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-xs  transition-all"
                            >
                              <FaMapLocationDot /> OPEN IN MAPS
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-10 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <Button
                    onClick={() => setShowDetailModal(false)}
                    variant='danger'
                    outline
                    className="order-2 sm:order-1 px-8 py-3 rounded-2xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700  transition-all"
                  >
                    CLOSE
                  </Button>
                  <Button onClick={() => handleEdit(selectedCustomer)}
                  variant='success'
                    className="order-1 sm:order-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl   shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    <FaEdit /> EDIT CUSTOMER
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

export default CustomerList;
