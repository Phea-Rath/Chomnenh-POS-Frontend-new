import React, { useState, useEffect } from "react";
import { FaSearch, FaEdit, FaTrash, FaPlus, FaShieldAlt } from "react-icons/fa";
import { FiArrowLeft, FiShield } from "react-icons/fi";
import { Link } from "react-router";
import api from "../../services/api";
import { useGetAllRoleQuery, useDeleteRoleMutation } from "@/features/auth/rolesSlice";
import { useOutletsContext } from "../../layouts/Management";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { useGetAllUserQuery } from "@/features/auth/usersSlice";
import MultiProfiles from "../../services/MultiProfiles";
import { getToken } from '@/utils/tokenStore';

const RoleList = () => {
  const { t } = useTranslation();
  const { darkMode } = useOutletsContext();
  const token = getToken();
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const itemsPerPage = 10;
  const { data: users } = useGetAllUserQuery(token);
  const [userState, setUserState] = useState([]);

  useEffect(() => {
    if (users?.data.length > 0) {
    }
  }, [users]);

  const rolesWithUsers = ({ data, role_id }) => data?.filter((u) => u.role_id == role_id).map((u) => ({ img: u.image, id: u.id }));

  const [deleteRole] = useDeleteRoleMutation();
  const { data, isLoading } = useGetAllRoleQuery(token);

  useEffect(() => {
    setRoles(data?.data || []);
    setFilteredRoles(data?.data || []);
  }, [data]);

  useEffect(() => {
    const filtered = roles.filter((r) =>
      r.role_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRoles(filtered);
    setCurrentPage(1);
  }, [searchTerm, roles]);

  const confirmDelete = (id) => { setDeleteId(id); setShowConfirm(true); };

  const handleDelete = async () => {
    try {
      await deleteRole({ id: deleteId, token }).unwrap();
      toast.success(t("roleDeletedSuccess"));
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Error deleting role.");
    } finally { setShowConfirm(false); setDeleteId(null); }
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentRoles = filteredRoles.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);

  const roleColors = ["bg-cyan-500", "bg-purple-500", "bg-emerald-500", "bg-orange-500", "bg-rose-500", "bg-indigo-500"];
  const getRoleColor = (i) => roleColors[i % roleColors.length];





  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <FaTrash className="text-red-500 text-sm" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t("delete")}</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">{t("roleDeleteConfirm")}</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {t("cancel")}
                </button>
                <button onClick={handleDelete}
                  className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                  {t("delete")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1e3a5f] rounded-xl flex items-center justify-center shadow-lg">
                <FiShield className="text-white text-lg" />
              </div>
              {t("rolesTitle")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm ml-[52px]">{t("rolesSubtitle")}</p>
          </div>
          <Link to="create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#163057] text-white rounded-xl shadow-sm transition-colors font-medium text-sm">
            <FaPlus className="text-xs" />
            {t("addNewRole")}
          </Link>
        </motion.div>

        {/* Stats + Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder={t("searchRolesPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:focus:ring-cyan-900/30 transition-all text-sm"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f]/10 dark:bg-cyan-900/20 rounded-xl">
              <FiShield className="text-[#1e3a5f] dark:text-cyan-400" />
              <span className="text-sm font-semibold text-[#1e3a5f] dark:text-cyan-400">{filteredRoles.length} {t("totalRoles")}</span>
            </div>
          </div>
        </motion.div>

        {/* Role Cards Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-cyan-200 border-t-[#1e3a5f] rounded-full animate-spin" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t("loadingUsers")}</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <FiShield className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">{t("noRolesFound")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t("noRolesDesc")}</p>
            <Link to="create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-xl text-sm hover:bg-[#163057] transition-colors">
              <FaPlus className="text-xs" />{t("addNewRole")}
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {currentRoles.map((role, index) => (
              <motion.div key={role.role_id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                {/* Color bar */}
                <div className={`h-1.5 ${getRoleColor(indexOfFirst + index)}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${getRoleColor(indexOfFirst + index)} rounded-xl flex items-center justify-center shadow-sm`}>
                        <FaShieldAlt className="text-white text-sm" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white capitalize">{role.role_name}</h3>
                        <span className="text-xs text-gray-400 dark:text-gray-500">ID: {role.role_id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`edit/${role.role_id}`}
                        className="p-2 text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg transition-colors" title={t("editRole")}>
                        <FaEdit className="text-sm" />
                      </Link>
                      <button onClick={() => confirmDelete(role.role_id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title={t("delete")}>
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[40px]">
                    {role.role_description || <span className="italic text-gray-300 dark:text-gray-600">No description</span>}
                  </p>
                  <MultiProfiles data={rolesWithUsers({ data: users?.data, role_id: role.role_id })} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("showing")} {indexOfFirst + 1}–{Math.min(indexOfLast, filteredRoles.length)} {t("of")} {filteredRoles.length}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors">
                {t("previous")}
              </button>
              {[...Array(totalPages).keys()].map((n) => (
                <button key={n + 1} onClick={() => setCurrentPage(n + 1)}
                  className={`px-4 py-2 text-sm rounded-xl transition-colors ${currentPage === n + 1 ? "bg-[#1e3a5f] text-white" : "border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                  {n + 1}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors">
                {t("next")}
              </button>
            </div>
          </div>
        )}

        {/* Back */}
        <div className="flex justify-start mt-8">
          <Link to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#1e3a5f] dark:hover:text-cyan-400 transition-colors">
            <FiArrowLeft />{t("backToDashboard")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoleList;
