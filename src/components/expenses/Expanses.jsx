import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { IoIosSearch, IoIosGrid, IoIosList } from "react-icons/io";
import { MdAttachMoney, MdCalendarToday, MdPerson } from "react-icons/md";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Button, Empty, Skeleton, Typography, Tag } from "antd";
import {
  useDeleteExpanseMutation,
  useGetAllExpansesQuery,
} from "../../../app/Features/expensesSlice";
import { useGetAllExpanseTypesQuery } from "../../../app/Features/expenseTypesSlice";
import { toast } from "react-toastify";
import ExportExcel from "../../services/ExportExcel";
import { useTranslation } from "react-i18next";
import RefreshButton from "../../utils/RefreshButton";

const ExpContext = createContext();
export function useExpContext() {
  return useContext(ExpContext);
}

const Expanses = () => {
  const { t } = useTranslation();
  const [expenses, setExpanses] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const navigator = useNavigate();
  const location = useLocation();
  const [id, setId] = useState(0);
  const [alertBox, setAlertBox] = useState(false);
  const [edit, setEdit] = useState(null);
  const { setLoading, darkMode } = useOutletsContext();
  const [expenseType, setExpanseType] = useState([]);
  const token = localStorage.getItem("token");
  const { data, isLoading, refetch } = useGetAllExpansesQuery(token);
  const [deleteExpanse] = useDeleteExpanseMutation();
  const expenseTypeContext = useGetAllExpanseTypesQuery(token);

  useEffect(() => {
    setExpanses(data?.data || []);
    setExpanseType(expenseTypeContext.data?.data || []);
  }, [data, expenseTypeContext.data]);

  function handleDelete(expense_id) {
    setAlertBox(true);
    setId(expense_id);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      const response = await deleteExpanse({ id, token });
      if (response.data.status === 200) {
        refetch();
        toast.success(t('expenseDeletedSuccess'));
        setLoading(false);
      }
    } catch (error) {
      toast.error(
        error?.message ||
          error ||
          "An error occurred while deleting the expense"
      );
      setLoading(false);
      setAlertBox(false);
    }
  }

  function onSearch(event) {
    if (event.target.value) {
      const filterExpanse = data.data.filter((expense) =>
        expense.code.toLowerCase().includes(event.target.value.toLowerCase())
      );
      setExpanses(filterExpanse || []);
    } else {
      setExpanses(data.data || []);
    }
  }

  function onAdd() {
    setEdit(null);
    navigator("/home/expenses");
  }

  async function handleUpdate(expense) {
    setEdit(expense);
    await navigator("update");
  }

  async function handleCreate() {
    setEdit(null);
    await navigator("create");
  }

  const isExpenseChildRoute =
    location.pathname === "/home/expenses/create" ||
    location.pathname === "/home/expenses/update";

  useEffect(() => {
    if (!isExpenseChildRoute) {
      setEdit(null);
    }
  }, [isExpenseChildRoute]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (amount) => {
    if (amount > 1000) return "red";
    if (amount > 500) return "orange";
    return "green";
  };

  const ExpenseCard = ({ expense }) => (
    <div className={`${darkMode ? "bg-gray-800 border-gray-700 shadow-none" : "bg-white border-gray-200 shadow-sm"} rounded-xl border p-6 hover:shadow-md transition-all duration-200`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"} text-lg mb-1`}>
            {expense.expense_no}
          </h3>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            {expense.expense_supplier || t('walkInCustomer')}
          </p>
        </div>
        <Tag color={getStatusColor(expense.amount)} className="rounded-full px-3 py-1">
          {formatCurrency(expense.amount)}
        </Tag>
      </div>

      <div className="space-y-3 mb-4">
        <div className={`flex items-center gap-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          <MdPerson className="text-gray-400" />
          <span>{expense.expense_by}</span>
        </div>
        <div className={`flex items-center gap-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          <MdCalendarToday className="text-gray-400" />
          <span>{formatDate(expense.expense_date)}</span>
        </div>
        <div className={`flex items-center gap-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          <MdAttachMoney className="text-gray-400" />
          <span className="truncate">{expense.expense_other || t('noRemarks')}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Tag color={darkMode ? "cyan" : "blue"} className="rounded-full px-3 py-1 text-xs">
          {expense.created_by}
        </Tag>
      </div>

      <div className={`flex gap-2 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
        <Link to={`/expense-print/${expense.expense_id}`} target="_blank" className="flex-1">
          <button className={`w-full inline-flex items-center justify-center px-3 py-2 border rounded-lg transition-colors duration-200 text-xs font-semibold ${
            darkMode 
            ? "border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white" 
            : "border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
          }`}>
            {t('details')}
          </button>
        </Link>
        <button
          className={`flex-1 inline-flex items-center justify-center px-3 py-2 border rounded-lg transition-colors duration-200 text-xs font-semibold ${
            darkMode 
            ? "border-green-500 text-green-400 hover:bg-green-500 hover:text-white" 
            : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
          }`}
          onClick={() => handleUpdate(expense)}
        >
          {t('edit')}
        </button>
        <button
          className={`flex-1 inline-flex items-center justify-center px-3 py-2 border rounded-lg transition-colors duration-200 text-xs font-semibold ${
            darkMode 
            ? "border-red-500 text-red-400 hover:bg-red-500 hover:text-white" 
            : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
          }`}
          onClick={() => handleDelete(expense.expense_id)}
        >
          {t('delete')}
        </button>
      </div>
    </div>
  );

  const ExpenseCardSkeleton = () => (
    <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl shadow-sm border p-6`}>
      <div className="animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2">
            <div className={`h-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded w-24`}></div>
            <div className={`h-3 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded w-32`}></div>
          </div>
          <div className={`h-6 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded w-16`}></div>
        </div>
        <div className="space-y-3 mb-4">
          <div className={`h-3 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded w-full`}></div>
          <div className={`h-3 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded w-3/4`}></div>
          <div className={`h-3 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded w-5/6`}></div>
        </div>
        <div className={`h-6 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded w-20 mb-4`}></div>
        <div className={`flex gap-2 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <div className={`h-8 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded flex-1`}></div>
          <div className={`h-8 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded flex-1`}></div>
          <div className={`h-8 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded flex-1`}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent">
      <section className="px-4 py-6">
        <AlertBox
          isOpen={alertBox}
          title={t('confirmDelete')}
          message={t('confirmDeleteExpense')}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText={t('delete')}
          cancelText={t('cancel')}
        />

        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-2`}>
                {t('expenseManagement')}
              </h1>
              <p className={darkMode ? "text-gray-400" : "text-gray-600"}>{t('manageAndTrackExpenses')}</p>
            </div>

            <div className="flex items-center gap-3">
              <RefreshButton onRefresh={refetch} />
              <ExportExcel data={expenses} title={t('expenses')} />
              <div className={`flex rounded-lg border p-1 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    viewMode === "table"
                      ? (darkMode ? "bg-blue-900/40 text-blue-400" : "bg-blue-100 text-blue-600")
                      : (darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700")
                  }`}
                >
                  <IoIosList className="text-xl" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    viewMode === "grid"
                      ? (darkMode ? "bg-blue-900/40 text-blue-400" : "bg-blue-100 text-blue-600")
                      : (darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700")
                  }`}
                >
                  <IoIosGrid className="text-xl" />
                </button>
              </div>

              <button
                className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white border-none px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                onClick={handleCreate}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('addNewExpense')}
              </button>
            </div>
          </div>

          <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl shadow-sm border p-4`}>
            <div className="relative max-w-md">
              <IoIosSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                onChange={onSearch}
                type="text"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                  darkMode 
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                  : "bg-gray-50 border-gray-300 text-gray-900"
                }`}
                placeholder={t('searchByExpenseNumber')}
              />
            </div>
          </div>
        </div>

        {viewMode === "table" ? (
          <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl shadow-sm border overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-50"} border-b ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>No.</th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t('expenseNo')}</th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t('supplier')}</th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t('paidBy')}</th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t('date')}</th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t('description')}</th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t('amount')}</th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t('staff')}</th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className={`${darkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"} divide-y`}>
                  {expenses.length === 0 && !isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-24">
                        <Empty
                          className="w-full flex flex-col items-center justify-center"
                          image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                          imageStyle={{ height: 80 }}
                          description={<Typography.Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-lg`}>{t('noExpensesFound')}</Typography.Text>}
                        >
                          <Button
                            type="primary"
                            size="large"
                            className="mt-4 bg-blue-600 hover:bg-blue-700 border-none h-11 px-6 rounded-lg font-semibold"
                            onClick={handleCreate}
                          >
                            {t('createFirstExpense')}
                          </Button>
                        </Empty>
                      </td>
                    </tr>
                  ) : (
                    expenses?.map((exp, index) => (
                      <tr key={index} className={`${darkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"} transition-colors duration-150`}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{index + 1}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{exp.expense_no}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{exp.expense_supplier || "-"}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{exp.expense_by}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{formatDate(exp.expense_date)}</td>
                        <td className={`px-6 py-4 text-sm max-w-xs truncate ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{exp.expense_other || t('noRemarks')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{formatCurrency(exp.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Tag color={darkMode ? "cyan" : "blue"} className="rounded-full px-3 py-1 text-xs">{exp.created_by}</Tag>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link to={`/expense-print/${exp.expense_id}`} target="_blank">
                              <button className={`inline-flex items-center px-3 py-1.5 border rounded-lg transition-colors duration-200 text-xs font-semibold ${
                                darkMode 
                                ? "border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white" 
                                : "border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                              }`}>
                                {t('details')}
                              </button>
                            </Link>
                            <button
                              className={`inline-flex items-center px-3 py-1.5 border rounded-lg transition-colors duration-200 text-xs font-semibold ${
                                darkMode 
                                ? "border-green-500 text-green-400 hover:bg-green-500 hover:text-white" 
                                : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                              }`}
                              onClick={() => handleUpdate(exp)}
                            >
                              {t('edit')}
                            </button>
                            <button
                              className={`inline-flex items-center px-3 py-1.5 border rounded-lg transition-colors duration-200 text-xs font-semibold ${
                                darkMode 
                                ? "border-red-500 text-red-400 hover:bg-red-500 hover:text-white" 
                                : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                              }`}
                              onClick={() => handleDelete(exp.expense_id)}
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
            {expenses.length === 0 && !isLoading ? (
              <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl shadow-sm border p-12 text-center`}>
                <Empty
                  className="w-full flex flex-col items-center justify-center"
                  image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                  imageStyle={{ height: 80 }}
                  description={<Typography.Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-lg`}>{t('noExpensesFound')}</Typography.Text>}
                >
                  <Button
                    type="primary"
                    size="large"
                    className="mt-4 bg-blue-600 hover:bg-blue-700 border-none h-11 px-6 rounded-lg font-semibold"
                    onClick={handleCreate}
                  >
                    {t('createFirstExpense')}
                  </Button>
                </Empty>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                  [...Array(8)].map((_, index) => <ExpenseCardSkeleton key={index} />)
                ) : (
                  expenses?.map((exp, index) => <ExpenseCard key={index} expense={exp} index={index} />)
                )}
              </div>
            )}
          </div>
        )}

        {isExpenseChildRoute && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
            <div className={`w-11/12 max-w-6xl rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-xl overflow-hidden`}>
              <ExpContext.Provider value={{ expenseType, onAdd, edit, expenses }}>
                <Outlet />
              </ExpContext.Provider>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Expanses;
