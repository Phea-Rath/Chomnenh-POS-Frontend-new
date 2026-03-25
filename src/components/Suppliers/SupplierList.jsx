import React, { useState, useEffect } from 'react';
import { FaSearch, FaEye, FaEdit, FaTrash, FaTimes, FaPlus, FaMapMarkerAlt } from 'react-icons/fa';
import { Link } from 'react-router';
import api from '../../services/api';
import { useGetAllSupplierQuery } from '../../../app/Features/suppliesSlice';
import { Image, Card, Skeleton, Badge, Tag, Empty } from 'antd';
import { FaMapLocationDot } from "react-icons/fa6";
import { motion, AnimatePresence } from 'framer-motion';

const SupplierList = () => {
  const token = localStorage.getItem('token');
  const { data: supplierData, error, isLoading } = useGetAllSupplierQuery(token);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (supplierData?.data) {
      setSuppliers(supplierData.data);
      setFilteredSuppliers(supplierData.data);
    }
  }, [supplierData]);

  useEffect(() => {
    const filtered = suppliers.filter(supplier =>
      supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSuppliers(filtered);
    setCurrentPage(1);
  }, [searchTerm, suppliers]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await api.delete(`/suppliers/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuppliers(suppliers.filter(supplier => supplier.supplier_id !== id));
        setFilteredSuppliers(filteredSuppliers.filter(supplier => supplier.supplier_id !== id));
        alert('Supplier deleted successfully!');
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting supplier.');
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
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatAddress = (supplier) => {
    const parts = [
      supplier.villages,
      supplier.communes,
      supplier.districts,
      supplier.provinces
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : supplier.supplier_address || 'N/A';
  };

  return (
    <div className="min-h-screen bg-transparent py-8">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Suppliers</h1>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-1/3">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Link
              to="create"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
            >
              <FaPlus /> <span>Add New Supplier</span>
            </Link>
          </div>

          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} active paragraph={{ rows: 1 }} />
              ))}
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              Error fetching suppliers: {error.message || "Unknown error"}
            </div>
          )}

          {filteredSuppliers.length === 0 && !isLoading ? (
            <Empty description="No suppliers found" className="py-12" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentSuppliers.map((supplier) => (
                    <tr key={supplier.supplier_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="avatar">
                          <div className="mask h-12 w-12">
                            <Image.PreviewGroup>
                              <Image className="object-cover rounded-md" src={supplier?.image} />
                            </Image.PreviewGroup>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {supplier.supplier_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        <div className="flex items-start gap-2">
                          <FaMapMarkerAlt className="text-red-500 mt-1 flex-shrink-0" />
                          <span className="line-clamp-2" title={formatAddress(supplier)}>
                            {formatAddress(supplier)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.supplier_tel || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.supplier_email || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openDetail(supplier)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <Link
                            to={`edit/${supplier.supplier_id}`}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleDelete(supplier.supplier_id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                          <a
                            href={`https://www.google.com/maps?q=${encodeURIComponent(formatAddress(supplier))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View on Map"
                          >
                            <FaMapLocationDot />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>
                {[...Array(totalPages).keys()].map((number) => (
                  <button
                    key={number + 1}
                    onClick={() => paginate(number + 1)}
                    className={`px-3 py-1 border border-gray-300 rounded-md ${currentPage === number + 1 ? "bg-blue-500 text-white" : "text-gray-700"}`}
                  >
                    {number + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Link
              to="/dashboard"
              className="p-2 border border-gray-300 flex gap-2 items-center text-gray-700 rounded-md hover:bg-gray-100 transition-all duration-300 cursor-pointer"
            >
              <FaTimes /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedSupplier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-gradient-to-r from-blue-400 to-blue-500 p-6 rounded-t-2xl">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900"
                >
                  <FaTimes />
                </button>
                <div className="flex items-center gap-4">
                  {selectedSupplier.image ? (
                    <img
                      src={selectedSupplier.image}
                      alt={selectedSupplier.supplier_name}
                      className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-blue-200 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-3xl text-blue-600 font-bold">
                        {selectedSupplier.supplier_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="text-white">
                    <h2 className="text-2xl font-bold">{selectedSupplier.supplier_name}</h2>
                    <p className="text-blue-100">Supplier Details</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Contact Information" size="small" className="shadow-sm">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Phone</p>
                        <p className="font-medium">{selectedSupplier.supplier_tel || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Email</p>
                        <p className="font-medium">{selectedSupplier.supplier_email || 'N/A'}</p>
                      </div>
                    </div>
                  </Card>

                  <Card title="Location Details" size="small" className="shadow-sm">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Province</p>
                        <p className="font-medium">{selectedSupplier.provinces || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">District</p>
                        <p className="font-medium">{selectedSupplier.districts || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Commune</p>
                        <p className="font-medium">{selectedSupplier.communes || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Village</p>
                        <p className="font-medium">{selectedSupplier.villages || 'N/A'}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="mt-6">
                  <Card title="Full Address" size="small" className="shadow-sm">
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className="text-red-500 mt-1 flex-shrink-0" />
                      <p className="text-gray-700">{selectedSupplier.supplier_address || 'N/A'}</p>
                    </div>
                    {selectedSupplier.supplier_address && (
                      <a
                        href={`https://www.google.com/maps?q=${encodeURIComponent(formatAddress(selectedSupplier))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <FaMapLocationDot /> View on Google Maps
                      </a>
                    )}
                  </Card>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <Link
                    to={`edit/${selectedSupplier.supplier_id}`}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <FaEdit /> Edit Supplier
                  </Link>
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
