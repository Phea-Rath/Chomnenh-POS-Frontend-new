import { useEffect, useState } from "react";
import { FaSave, FaTimes } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router";
import api from "../../services/api";
import { toast } from "react-toastify";
import { useGetAllRoleQuery } from "../../../app/Features/rolesSlice";

const RoleForm = () => {
  const { id } = useParams(); // Get role_id from URL for edit mode
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { refetch } = useGetAllRoleQuery(token);
  const isEditMode = !!id; // Determine if in edit mode

  const [formData, setFormData] = useState({
    role_name: "",
    role_description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch role data for edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchRole = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/roles/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const role = response.data.data;
          setFormData({
            role_name: role.role_name || "",
            role_description: role.role_description || "",
          });
        } catch (err) {
          setError(err.response?.data?.message || "Error fetching role.");
        } finally {
          setLoading(false);
        }
      };
      fetchRole();
    }
  }, [id, token, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role_name) {
      setError("Role name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        role_name: formData.role_name,
        role_description: formData.role_description || null,
      };

      if (isEditMode) {
        // Update existing role
        await api.put(`/roles/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Role updated successfully!");
      } else {
        // Create new role
        await api.post("/roles", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Role created successfully!");
      }
      refetch();
      navigate("/dashboard/roles"); // Redirect to role list
    } catch (err) {
      setError(
        err.response?.data?.message ||
        `Error ${isEditMode ? "updating" : "creating"} role.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {isEditMode ? "Edit Role" : "Create New Role"}
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white text-xs shadow-lg rounded-lg p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="role_name"
                value={formData.role_name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Description
              </label>
              <input
                type="text"
                name="role_description"
                value={formData.role_description}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Submit and Cancel Buttons */}
          <div className="flex justify-end space-x-4">
            <Link
              to="/dashboard/roles"
              className="p-2 border border-gray-300 flex gap-2 items-center text-gray-700 rounded-md hover:bg-gray-100 transition-all duration-300 cursor-pointer"
            >
              <FaTimes /> Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 gap-2 flex items-center space-x-2 disabled:opacity-50 transition-all duration-300 cursor-pointer"
            >
              <FaSave className="text-xl" />{" "}
              {loading
                ? "Saving..."
                : isEditMode
                  ? "Update Role"
                  : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleForm;
