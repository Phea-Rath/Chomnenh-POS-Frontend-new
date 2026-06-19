import React, {
  useEffect,
  useState,
  useMemo
} from "react";
import { IoIosSearch, IoIosGrid, IoIosList } from "react-icons/io";
import { FaImage, FaPlus, FaEye, FaEdit, FaTrash, FaMoneyBillWave, FaCalculator, FaChartLine } from "react-icons/fa";
import { MdAttachMoney, MdCalendarToday, MdPerson } from "react-icons/md";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import { Link, useNavigate } from "react-router";
import { Empty, Skeleton, Typography, Tag } from "antd";
import {
  useDeleteExpanseMutation,
  useGetAllExpansesQuery,
} from "../../../app/Features/expensesSlice";
import { toast } from "react-toastify";
import ExportExcel from "../../services/ExportExcel";
import { useTranslation } from "react-i18next";
import RefreshButton from "../../utils/RefreshButton";
import Button from "../../utils/Button";
import ActionButton from "../../utils/ActionButton";
import Input from "../../utils/Input";
import { motion } from "framer-motion";

const MENU_ID = 19;

const Expanses = () => {
  const { t } = useTranslation();
  const [expenses, setExpanses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const navigator = useNavigate();
  const [id, setId] = useState(0);
  const [alertBox, setAlertBox] = useState(false);
  const { setLoading, darkMode } = useOutletsContext();
  const token = localStorage.getItem("token");
  const { data, isLoading, refetch } = useGetAllExpansesQuery(token);
  const [deleteExpanse] = useDeleteExpanseMutation();

  useEffect(() => {
    const items = data?.data || [];
    setExpanses(items);
    setFilteredExpenses(items);
  }, [data]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCount = filteredExpenses.length;
    const totalAmount = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const attachmentCount = filteredExpenses.filter(e => e.images?.length > 0).length;
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;

    return { totalCount, totalAmount, attachmentCount, averageAmount };
  }, [filteredExpenses]);

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
      }
    } catch (error) {
      toast.error(error?.message || t('errorOccurredDeletingExpense', "An error occurred while deleting the expense"));
    } finally {
      setLoading(false);
    }
  }

  function onSearch(val) {
    if (val) {
      const filtered = expenses.filter((expense) =>
        expense.expense_no.toLowerCase().includes(val.toLowerCase()) ||
        expense.expense_supplier?.toLowerCase().includes(val.toLowerCase()) ||
        expense.expense_by?.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredExpenses(filtered);
    } else {
      setFilteredExpenses(expenses);
    }
  }

  const handleUpdate = (expense) => {
    navigator(`/home/expenses/update/${expense.expense_id}`);
  };

  const handleCreate = () => {
    navigator("/home/expenses/create");
  };

  const ActionButtons = ({ item }) => {
    const actions = [
      {
        type: 'view',
        icon: <FaEye size={14} />,
        onClick: () => window.open(`/expense-print/${item.expense_id}`, '_blank'),
        title: t('details'),
        label: t('details')
      },
      {
        type: 'modify',
        icon: <FaEdit size={14} />,
        onClick: () => handleUpdate(item),
        title: t('edit'),
        label: t('edit')
      },
      {
        type: 'drop',
        icon: <FaTrash size={14} />,
        onClick: () => handleDelete(item.expense_id),
        title: t('delete'),
        label: t('delete')
      }
    ];

    return (
      <div className="flex justify-end">
        <ActionButton actions={actions} menuId={MENU_ID} />
      </div>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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

  const StatCard = ({ title, value, icon, color = "blue" }) => {
    const bgColor = `bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/20 dark:to-${color}-800/20`;
    const textColor = `text-${color}-600 dark:text-${color}-400`;
    return (
      <div className={`border border-gray-200 dark:border-gray-700 rounded-xl p-4 ${bgColor} transition-all duration-300 hover:shadow-md`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
            <p className="text-xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
          </div>
          <div className={`p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm ${textColor}`}>{icon}</div>
        </div>
      </div>
    );
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
          <div className="flex flex-col">
            <span>{t('paidBy')}: {expense.expense_by}</span>
            {expense.purchased_by && (
              <span className="text-xs opacity-75">{t('purchasedBy')}: {expense.purchased_by}</span>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          <MdCalendarToday className="text-gray-400" />
          <span>{formatDate(expense.expense_date)}</span>
        </div>
        {expense.images?.length > 0 && (
          <div className={`flex items-center gap-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            <FaImage className="text-blue-500" />
            <span>{expense.images.length} {t('attachments', 'Attachments')}</span>
          </div>
        )}
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

      <div className={`pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
        <ActionButtons item={expense} />
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="view-page bg-transparent transition-colors"
    >
      <AlertBox
        isOpen={alertBox}
        title={t('confirmDelete')}
        message={t('confirmDeleteExpense')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={t('delete')}
        cancelText={t('cancel')}
      />

      <div>
        {/* Header Section */}
        <div className="flex items-center justify-between border-b-0 border-x p-4 dark:border-gray-500 border-gray-200 bg-white dark:bg-gray-600">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <FaMoneyBillWave className="text-[#13b5ea]" />
              {t('expenseManagement')}
            </h1>
            <p className="text-gray-500 text-xs dark:text-gray-400 mt-2">
              {t('manageAndTrackExpenses')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RefreshButton onRefresh={refetch} />
            <ExportExcel data={filteredExpenses} title="Expenses" />

            <Button
              menuId={MENU_ID}
              actionType="is_modify"
              variant="save"
              onClick={handleCreate}
            >
              <FaPlus />
              {t('addNewExpense')}
            </Button>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between bg-gray-100 dark:bg-transparent p-4 border-x border-gray-200 dark:border-gray-500">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-1">
            <div className="flex border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 rounded-[2px]">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-2 transition-all ${viewMode === 'table' ? 'bg-[#13b5ea]/10 text-[#13b5ea]' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                title={t('tableView')}
              >
                <IoIosList size={20} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-[#13b5ea]/10 text-[#13b5ea]' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                title={t('gridView')}
              >
                <IoIosGrid size={20} />
              </button>
            </div>

            <div className="grow max-w-md">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <IoIosSearch className="text-gray-400" />
                {t('searchExpense')}
              </label>
              <Input
                type="text"
                placeholder={t('searchByExpenseNumber')}
                onChange={(val) => onSearch(val)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-4 md:p-6 border border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title={t('totalExpenses')} value={stats.totalCount} icon={<FaCalculator className="text-2xl" />} color="blue" />
            <StatCard title={t('totalAmount')} value={formatCurrency(stats.totalAmount)} icon={<FaMoneyBillWave className="text-2xl" />} color="green" />
            <StatCard title={t('averageAmount')} value={formatCurrency(stats.averageAmount)} icon={<FaChartLine className="text-2xl" />} color="purple" />
            <StatCard title={t('attachments')} value={stats.attachmentCount} icon={<FaImage className="text-2xl" />} color="orange" />
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {viewMode === "table" ? (
              <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 overflow-hidden rounded-[2px]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">#</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">{t('expenseNo')}</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">{t('supplier')}</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">{t('paidBy')}</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">{t('purchasedBy', 'Purchased By')}</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">{t('date')}</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">{t('description')}</th>
                        <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">{t('amount')}</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">{t('staff')}</th>
                        <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredExpenses.length === 0 && !isLoading ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-24">
                            <Empty
                              className="w-full flex flex-col items-center justify-center"
                              image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                              imageStyle={{ height: 80 }}
                              description={<Typography.Text className="text-gray-500 dark:text-gray-400 text-lg">{t('noExpensesFound')}</Typography.Text>}
                            >
                              <Button
                                variant="primary"
                                actionType="is_modify"
                                menuId={MENU_ID}
                                onClick={handleCreate}
                                className="mt-4"
                              >
                                {t('createFirstExpense')}
                              </Button>
                            </Empty>
                          </td>
                        </tr>
                      ) : (
                        filteredExpenses.map((exp, index) => (
                          <tr key={exp.expense_id} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">{index + 1}</td>
                            <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">{exp.expense_no}</td>
                            <td className="px-6 py-4 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200">{exp.expense_supplier || "-"}</td>
                            <td className="px-6 py-4 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200">
                              <div className="flex items-center gap-2">
                                {exp.expense_by}
                                {exp.images?.length > 0 && <FaImage className="text-blue-500" title={t('hasAttachments')} />}
                              </div>
                            </td>
                            <td className="px-6 py-4 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200">{exp.purchased_by || "-"}</td>
                            <td className="px-6 py-4 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200">{formatDate(exp.expense_date)}</td>
                            <td className="px-6 py-4 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200 truncate max-w-[150px]" title={exp.expense_other}>{exp.expense_other || t('noRemarks')}</td>
                            <td className="px-6 py-4 text-right font-bold text-green-600 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">{formatCurrency(exp.amount)}</td>
                            <td className="px-6 py-4 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                              <Tag color={darkMode ? "cyan" : "blue"} className="rounded-full px-3 py-1 text-xs">{exp.created_by}</Tag>
                            </td>
                            <td className="px-6 py-4 bg-white dark:bg-gray-800">
                              <ActionButtons item={exp} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {isLoading && (
                  <div className="flex flex-col gap-3 p-6 transition-all duration-500">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <Skeleton.Button active block />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {filteredExpenses.length === 0 && !isLoading ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <Empty
                      image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                      imageStyle={{ height: 80 }}
                      description={<Typography.Text className="text-gray-500 dark:text-gray-400 text-lg">{t('noExpensesFound')}</Typography.Text>}
                    >
                      <Button
                        variant="primary"
                        actionType="is_modify"
                        menuId={MENU_ID}
                        onClick={handleCreate}
                        className="mt-4"
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
                      filteredExpenses.map((exp) => <ExpenseCard key={exp.expense_id} expense={exp} />)
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Expanses;
