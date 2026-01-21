import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaPlus,
} from "react-icons/fa";
import { Link } from "react-router";
import api from "../../services/api";
import { useGetAllRoleQuery } from "../../../app/Features/rolesSlice";

const RoleList = () => {
  const token = localStorage.getItem("token");
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRoles, setFilteredRoles] = useState([]);
  const { data } = useGetAllRoleQuery(token);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch and set roles
  useEffect(() => {
    setRoles(data?.data || []);

    setFilteredRoles(data?.data || []);
  }, [data]);

  // Filter roles based on search term
  useEffect(() => {
    const filtered = roles.filter((role) =>
      role.role_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRoles(filtered);
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, roles]);

  // Handle delete role
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      try {
        await api.delete(`/roles/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRoles(roles.filter((role) => role.role_id !== id));
        setFilteredRoles(filteredRoles.filter((role) => role.role_id !== id));
        alert("Role deleted successfully!");
      } catch (err) {
        alert(err.response?.data?.message || "Error deleting role.");
      }
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRoles = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Roles</h1>

        <div className="bg-white shadow-lg rounded-lg p-6">
          {/* Search and Add New */}
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-1/3">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Link
              to="create"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
            >
              <FaPlus /> <span>Add New Role</span>
            </Link>
          </div>

          {/* Error and Loading States */}
          {isLoading && (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              Error fetching roles: {error.message || "Unknown error"}
            </div>
          )}

          {/* Roles Table */}
          {filteredRoles.length === 0 && !isLoading ? (
            <p className="text-gray-500 text-center py-8">No roles found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRoles.map((role) => (
                    <tr key={role.role_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {role.role_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {role.role_description || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`edit/${role.role_id}`}
                            className="text-green-600 hover:text-green-900"
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleDelete(role.role_id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
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

export default RoleList;
