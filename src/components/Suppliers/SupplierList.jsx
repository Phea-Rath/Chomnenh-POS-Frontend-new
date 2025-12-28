import React, { useState, useEffect } from 'react';
import { FaSearch, FaEye, FaEdit, FaTrash, FaTimes, FaPlus } from 'react-icons/fa';
import { Link } from 'react-router';
import api from '../../services/api';
import { useGetAllSupplierQuery } from '../../../app/Features/suppliesSlice';
import { Image } from 'antd';
import { FaMapLocationDot } from "react-icons/fa6";

const SupplierList = () => {
  const token = localStorage.getItem('token');
  const { data: supplierData, error, isLoading } = useGetAllSupplierQuery(token);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch and set suppliers
  useEffect(() => {
    if (supplierData?.data) {
      setSuppliers(supplierData.data);
      setFilteredSuppliers(supplierData.data);
    }
  }, [supplierData]);

  // Filter suppliers based on search term
  useEffect(() => {
    const filtered = suppliers.filter(supplier =>
      supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSuppliers(filtered);
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, suppliers]);

  // Handle delete supplier
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

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Suppliers</h1>

        <div className="bg-white shadow-lg rounded-lg p-6">
          {/* Search and Add New */}
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

          {/* Error and Loading States */}
          {isLoading && (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              Error fetching suppliers: {error.message || "Unknown error"}
            </div>
          )}

          {/* Suppliers Table */}
          {filteredSuppliers.length === 0 && !isLoading ? (
            <p className="text-gray-500 text-center py-8">
              No suppliers found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentSuppliers.map((supplier) => (
                    <tr key={supplier.supplier_id}>
                      <td>
                        <div className="flex items-center justify-center gap-3">
                          <div className="avatar">
                            <div className="mask h-12 w-12">
                              <Image.PreviewGroup>
                                <Image
                                  // width={50}
                                  className="object-cover rounded-md"
                                  src={supplier?.image}
                                />
                              </Image.PreviewGroup>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.supplier_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.supplier_address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.supplier_tel || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.supplier_email || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* <Link
                                                        to={`/suppliers/${supplier.supplier_id}`}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View"
                                                    >
                                                        <FaEye />
                                                    </Link> */}
                          <Link
                            to={`edit/${supplier.supplier_id}`}
                            className="text-green-600 hover:text-green-900"
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleDelete(supplier.supplier_id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                          <a href={`https://www.google.com/maps?q=${supplier.supplier_address}`} target="_blank" rel="noopener noreferrer"><FaMapLocationDot className="text-blue-600 hover:text-green-900" /></a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
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
                    className={`px-3 py-1 border border-gray-300 rounded-md ${currentPage === number + 1
                      ? "bg-blue-500 text-white"
                      : "text-gray-700"
                      }`}
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

          {/* Cancel Button */}
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
    </div>
  );
};

export default SupplierList;