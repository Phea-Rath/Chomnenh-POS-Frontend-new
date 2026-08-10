import React, { useEffect, useState } from 'react'
import { IoIosSearch, IoIosGrid, IoIosList } from 'react-icons/io'
import { MdCategory, MdPerson } from 'react-icons/md'
import CreateExpanseTypes from './CreateExpanseTypes'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import UpdateExpanseType from './UpdateExpanseTypes';
import { Button, Empty, Skeleton, Typography, Tag } from 'antd';
import { useDeleteExpanseTypeMutation, useGetAllExpanseTypesQuery } from "@/features/expenses/expenseTypesSlice";
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { getToken } from '@/utils/tokenStore';

const ExpansesType = () => {
  const { t } = useTranslation();
  const [expense_types, setExpanseTypes] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [id, setId] = useState(0);
  const [alertBox, setAlertBox] = useState(false);
  const [edit, setEdit] = useState({ id: 1, name: "" });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const { setLoading, darkMode } = useOutletsContext();
  const token = getToken();
  const { data, isLoading, refetch } = useGetAllExpanseTypesQuery(token);
  const [deleteExpanseType] = useDeleteExpanseTypeMutation();

  useEffect(() => {
    setExpanseTypes(data?.data || []);
  }, [data]);

  function handleDelete(expense_type_id) {
    setAlertBox(true);
    setId(expense_type_id);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      await deleteExpanseType({ id, token }).unwrap();
      toast.success(t('expenseTypeDeletedSuccess'));
    } catch (error) {
      toast.error(error?.data?.message || error?.message || 'An error occurred while deleting the expense type');
    } finally {
      setLoading(false);
    }
  }

  function onSearch(event) {
    if (event.target.value) {
      const filterExpanseType = data.data.filter((item) => item.expense_type_name.toLowerCase().includes(event.target.value.toLowerCase()));
      setExpanseTypes(filterExpanseType || []);
    } else {
      setExpanseTypes(data.data || []);
    }
  }

  function handleUpdate(id, name) {
    setIsUpdateOpen(true);
    setEdit((prev) => ({ ...prev, name, id }));
  }

  const ExpenseTypeCard = ({ expenseType }) => (
    <div className={`${darkMode ? "bg-gray-800 border-gray-700 shadow-none" : "bg-white border-gray-200 shadow-sm"} rounded-xl border p-6 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`p-3 ${darkMode ? "bg-cyan-900/30" : "bg-cyan-100"} rounded-lg`}>
          <MdCategory className={`${darkMode ? "text-cyan-400" : "text-cyan-600"} text-xl`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"} text-lg mb-1 truncate`}>
            {expenseType.expense_type_name}
          </h3>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t('expenseTypes')}</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className={`flex items-center gap-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          <MdPerson className="text-gray-400" />
          <span>{t('createdBy')}: {expenseType.created_by}</span>
        </div>
        <div className={`flex items-center gap-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>{t('activeStatus')}</span>
        </div>
      </div>

      <div className={`flex gap-2 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
        <button
          className={`flex-1 inline-flex items-center justify-center px-3 py-2 border rounded-lg transition-colors duration-200 text-xs font-semibold ${
            darkMode 
            ? "border-green-500 text-green-400 hover:bg-green-500 hover:text-white" 
            : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
          }`}
          onClick={() => handleUpdate(expenseType.expense_type_id, expenseType.expense_type_name)}
        >
          {t('edit')}
        </button>
        <button
          className={`flex-1 inline-flex items-center justify-center px-3 py-2 border rounded-lg transition-colors duration-200 text-xs font-semibold ${
            darkMode 
            ? "border-red-500 text-red-400 hover:bg-red-500 hover:text-white" 
            : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
          }`}
          onClick={() => handleDelete(expenseType.expense_type_id)}
        >
          {t('delete')}
        </button>
      </div>
    </div>
  );

  const ExpenseTypeCardSkeleton = () => (
    <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl shadow-sm border p-6`}>
      <div className="animate-pulse">
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-3 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded-lg w-12 h-12`}></div>
          <div className="flex-1 space-y-2">
            <div className={`h-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded w-3/4`}></div>
            <div className={`h-3 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded w-1/2`}></div>
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div className={`h-3 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded w-full`}></div>
          <div className={`h-3 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded w-3/4`}></div>
        </div>
        <div className={`flex gap-2 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <div className={`h-8 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded flex-1`}></div>
          <div className={`h-8 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded flex-1`}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent">
      <section className="px-4 md:px-6 lg:px-8 py-6">
        <AlertBox
          isOpen={alertBox}
          title={t('confirmDelete')}
          message={t('confirmDeleteExpenseType')}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText={t('delete')}
          cancelText={t('cancel')}
        />

        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-2`}>
                {t('expenseTypes')}
              </h1>
              <p className={darkMode ? "text-gray-400" : "text-gray-600"}>{t('manageExpenseCategories')}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex rounded-lg border p-1 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-colors duration-200 ${viewMode === 'table'
                    ? (darkMode ? 'bg-cyan-900/40 text-cyan-400' : 'bg-cyan-100 text-cyan-600')
                    : (darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
                    }`}
                >
                  <IoIosList className="text-xl" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors duration-200 ${viewMode === 'grid'
                    ? (darkMode ? 'bg-cyan-900/40 text-cyan-400' : 'bg-cyan-100 text-cyan-600')
                    : (darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
                    }`}
                >
                  <IoIosGrid className="text-xl" />
                </button>
              </div>

              <button
                className="btn btn-primary bg-cyan-600 hover:bg-cyan-700 text-white border-none px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                onClick={() => setIsAddOpen(true)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('addNewType')}
              </button>
            </div>
          </div>

          <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl shadow-sm border p-4`}>
            <div className="relative max-w-md">
              <IoIosSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                onChange={onSearch}
                type="text"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors duration-200 ${
                  darkMode 
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                  : "bg-gray-50 border-gray-300 text-gray-900"
                }`}
                placeholder={t('searchExpenseTypePlaceholder')}
              />
            </div>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl shadow-sm border overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-50"} border-b ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>No.</th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t('expenseTypeName')}</th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t('createdBy')}</th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className={`${darkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"} divide-y`}>
                  {expense_types.length === 0 && !isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-24">
                        <Empty
                          className="w-full flex flex-col items-center justify-center"
                          image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                          imageStyle={{ height: 80 }}
                          description={<Typography.Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-lg`}>{t('noExpenseTypesFound')}</Typography.Text>}
                        >
                          <Button
                            type="primary"
                            size="large"
                            className="mt-4 bg-cyan-600 hover:bg-cyan-700 border-none h-11 px-6 rounded-lg font-semibold"
                            onClick={() => setIsAddOpen(true)}
                          >
                            {t('createFirstType')}
                          </Button>
                        </Empty>
                      </td>
                    </tr>
                  ) : (
                    expense_types?.map(({ expense_type_id, expense_type_name, created_by }, index) => (
                      <tr key={index} className={`${darkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"} transition-colors duration-150`}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{index + 1}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{expense_type_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Tag color={darkMode ? "cyan" : "cyan"} className="rounded-full px-3 py-1 text-xs">{created_by}</Tag>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              className={`inline-flex items-center px-3 py-1.5 border rounded-lg transition-colors duration-200 text-xs font-semibold ${
                                darkMode 
                                ? "border-green-500 text-green-400 hover:bg-green-500 hover:text-white" 
                                : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                              }`}
                              onClick={() => handleUpdate(expense_type_id, expense_type_name)}
                            >
                              {t('edit')}
                            </button>
                            <button
                              className={`inline-flex items-center px-3 py-1.5 border rounded-lg transition-colors duration-200 text-xs font-semibold ${
                                darkMode 
                                ? "border-red-500 text-red-400 hover:bg-red-500 hover:text-white" 
                                : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                              }`}
                              onClick={() => handleDelete(expense_type_id)}
                            >
                              {t('delete')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className={`flex flex-col gap-3 p-6 transition-all duration-500 ${isLoading ? "" : "hidden"}`}>
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Skeleton.Button style={{ width: "100%" }} active={true} size={"small"} shape={"square"} block={true} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {expense_types.length === 0 && !isLoading ? (
              <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl shadow-sm border p-12 text-center`}>
                <Empty
                  className="w-full flex flex-col items-center justify-center"
                  image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                  imageStyle={{ height: 80 }}
                  description={<Typography.Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-lg`}>{t('noExpenseTypesFound')}</Typography.Text>}
                >
                  <Button
                    type="primary"
                    size="large"
                    className="mt-4 bg-cyan-600 hover:bg-cyan-700 border-none h-11 px-6 rounded-lg font-semibold"
                    onClick={() => setIsAddOpen(true)}
                  >
                    {t('createFirstType')}
                  </Button>
                </Empty>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                  [...Array(8)].map((_, index) => (
                    <ExpenseTypeCardSkeleton key={index} />
                  ))
                ) : (
                  expense_types?.map((expenseType, index) => (
                    <ExpenseTypeCard key={index} expenseType={expenseType} index={index} />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {isAddOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
            <div className={`w-full max-w-2xl rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-xl overflow-hidden`}>
              <CreateExpanseTypes onAdd={() => setIsAddOpen(false)} />
            </div>
          </div>
        )}

        {isUpdateOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
            <div className={`w-full max-w-2xl rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-xl overflow-hidden`}>
              <UpdateExpanseType onAdd={() => setIsUpdateOpen(false)} data={edit} />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default ExpansesType
