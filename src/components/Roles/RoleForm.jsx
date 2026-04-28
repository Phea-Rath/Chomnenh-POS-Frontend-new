import { useEffect, useState } from "react";
import { FiArrowLeft, FiSave, FiShield, FiFileText, FiAlertCircle } from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router";
import api from "../../services/api";
import { toast } from "react-toastify";
import { useGetAllRoleQuery } from "../../../app/Features/rolesSlice";
import { useOutletsContext } from "../../layouts/Management";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const RoleForm = () => {
  const { t } = useTranslation();
  const { darkMode } = useOutletsContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { refetch } = useGetAllRoleQuery(token);
  const isEditMode = !!id;

  const [formData, setFormData] = useState({ role_name: "", role_description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      api.get(`/roles/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          const role = res.data.data;
          setFormData({ role_name: role.role_name || "", role_description: role.role_description || "" });
        })
        .catch((err) => setError(err.response?.data?.message || "Error fetching role."))
        .finally(() => setLoading(false));
    }
  }, [id, token, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role_name.trim()) { setError(t("roleNameRequired")); return; }
    setLoading(true);
    setError("");
    try {
      const payload = { role_name: formData.role_name, role_description: formData.role_description || null };
      if (isEditMode) {
        await api.put(`/roles/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(t("roleUpdatedSuccess"));
      } else {
        await api.post("/roles", payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(t("roleCreatedSuccess"));
      }
      refetch();
      navigate(-1);
    } catch (err) {
      setError(err.response?.data?.message || `Error ${isEditMode ? "updating" : "creating"} role.`);
    } finally { setLoading(false); }
  };

  const inputCls = `w-full px-4 py-3 border rounded-xl outline-none transition-all text-sm
    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
    placeholder-gray-400 dark:placeholder-gray-500
    border-gray-200 dark:border-gray-600
    focus:border-blue-500 dark:focus:border-blue-400
    focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30`;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="mb-8">
          <Link to="/setting/roles"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#1e3a5f] dark:hover:text-blue-400 transition-colors mb-6">
            <FiArrowLeft />{t("backToRoles")}
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1e3a5f] rounded-2xl flex items-center justify-center shadow-lg">
              <FiShield className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {isEditMode ? t("editRole") : t("createNewRole")}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {isEditMode ? t("editRoleSubtitle") : t("createRoleSubtitle")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <form onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">

            {/* Top accent */}
            <div className="h-1 bg-gradient-to-r from-[#1e3a5f] to-blue-400" />

            <div className="p-8 space-y-6">
              {/* Role Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FiShield className="text-gray-400" />
                  {t("roleName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="role_name"
                  value={formData.role_name}
                  onChange={handleInputChange}
                  className={inputCls}
                  placeholder={t("roleName")}
                  required
                />
              </div>

              {/* Role Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FiFileText className="text-gray-400" />
                  {t("roleDescription")}
                </label>
                <textarea
                  name="role_description"
                  value={formData.role_description}
                  onChange={handleInputChange}
                  rows={4}
                  className={inputCls + " resize-none"}
                  placeholder={t("roleDescription")}
                />
              </div>

              {/* Error */}
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <FiAlertCircle className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Tip box */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <span className="font-semibold">{t("quickTips")}: </span>
                  {isEditMode ? t("editRoleSubtitle") : t("createRoleSubtitle")}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-5 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center gap-3">
              <Link to="/setting/roles"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium">
                {t("cancel")}
              </Link>
              <button type="submit" disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1e3a5f] hover:bg-[#163057] text-white rounded-xl shadow-sm transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <FiSave className="text-base" />
                    {isEditMode ? t("updateRole") : t("createRole")}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default RoleForm;
