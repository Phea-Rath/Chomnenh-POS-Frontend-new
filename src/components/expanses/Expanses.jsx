import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { IoIosSearch, IoIosGrid, IoIosList } from "react-icons/io";
import { MdAttachMoney, MdCalendarToday, MdPerson } from "react-icons/md";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import { Link, Outlet, useNavigate } from "react-router";
import { Button, Empty, Skeleton, Typography, Tag } from "antd";
import { motion } from "framer-motion";
import {
  useDeleteExpanseMutation,
  useGetAllExpansesQuery,
} from "../../../app/Features/expansesSlice";
import { useGetAllExpanseTypesQuery } from "../../../app/Features/expanseTypesSlice";
import { toast } from "react-toastify";
import ExportExel from "../../services/ExportExel";

const ExpContext = createContext();
export function useExpContext() {
  return useContext(ExpContext);
}

const Expanses = () => {
  const [expanses, setExpanses] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const navigator = useNavigate();
  const [id, setId] = useState(0);
  const [alertBox, setAlertBox] = useState(false);
  const [edit, setEdit] = useState({ id: 1, name: "" });
  const {
    setLoading,
    loading,
    setAlert,
    setMessage,
    setAlertStatus,
    reload,
    setReload,
  } = useOutletsContext();
  const ModalRef = useRef(null);
  const updateModalRef = useRef(null);
  const [expanseType, setExpanseType] = useState([]);
  const [expanseItems, setExpanseItems] = useState([]);
  const token = localStorage.getItem("token");
  const { data, isLoading, isError, refetch } = useGetAllExpansesQuery(token);
  const [deleteExpanse] = useDeleteExpanseMutation();
  const expanseTypeContext = useGetAllExpanseTypesQuery(token);

  useEffect(() => {
    setExpanses(data?.data || []);
    setExpanseType(expanseTypeContext.data?.data || []);
  }, [data, expanseTypeContext.data]);

  async function fetchingExpItem(id) {
    const expanseItems = expanses?.find((item) => item.expanse_id == id);
    setExpanseItems(expanseItems.items);
  }

  function handleDelete(expanse_id) {
    setAlertBox(true);
    setId(expanse_id);
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
        toast.success("Expanse deleted successfully");
        setLoading(false);
      }
    } catch (error) {
      toast.error(
        error?.message ||
        error ||
        "An error occurred while deleting the expanse"
      );
      setLoading(false);
      setAlertBox(false);
    }
  }

  function onSearch(event) {
    if (event.target.value) {
      const filterExpanse = data.data.filter((expanse) =>
        expanse.code.toLowerCase().includes(event.target.value.toLowerCase())
      );
      setExpanses(filterExpanse || []);
    } else {
      setExpanses(data.data || []);
    }
  }

  function onAdd() {
    ModalRef.current?.close();
  }

  async function handleUpdate(expanse) {
    setEdit(expanse);
    console.log(expanseType);
    await fetchingExpItem(expanse.expanse_id);
    await navigator("update");
    ModalRef.current?.showModal();
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (amount) => {
    if (amount > 1000) return 'red';
    if (amount > 500) return 'orange';
    return 'green';
  };

  // Grid Card Component
  const ExpenseCard = ({ expense, index }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg mb-1">
            {expense.expanse_no}
          </h3>
          <p className="text-sm text-gray-600">{expense.expanse_supplier || 'No supplier'}</p>
        </div>
        <Tag color={getStatusColor(expense.amount)} className="rounded-full px-3 py-1">
          {formatCurrency(expense.amount)}
        </Tag>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MdPerson className="text-gray-400" />
          <span>{expense.expanse_by}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MdCalendarToday className="text-gray-400" />
          <span>{formatDate(expense.expanse_date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MdAttachMoney className="text-gray-400" />
          <span className="truncate">{expense.expanse_other || 'No description'}</span>
        </div>
      </div>

      {/* Staff */}
      <div className="flex items-center justify-between mb-4">
        <Tag color="blue" className="rounded-full px-3 py-1 text-xs">
          {expense.created_by}
        </Tag>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <Link to="/expanse-print" className="flex-1">
          <button className="w-full inline-flex items-center justify-center px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors duration-200 text-xs font-semibold">
            Details
          </button>
        </Link>
        <button
          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors duration-200 text-xs font-semibold"
          onClick={() => handleUpdate(expense)}
        >
          Edit
        </button>
        <button
          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors duration-200 text-xs font-semibold"
          onClick={() => handleDelete(expense.expanse_id)}
        >
          Delete
        </button>
      </div>
    </div>
  );

  // Loading Card Skeleton
  const ExpenseCardSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="space-y-3 mb-4">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-20 mb-4"></div>
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-transparent"
    >
      <section className="px-4 py-6">
        <AlertBox
          isOpen={alertBox}
          title="Confirm Deletion"
          message="Are you sure you want to delete this expanse?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText="Delete"
          cancelText="Cancel"
        />

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Expense Management
              </h1>
              <p className="text-gray-600">Manage and track all expenses</p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <ExportExel data={expanses} title='Expenses' />
              <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-colors duration-200 ${viewMode === 'table'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <IoIosList className="text-xl" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors duration-200 ${viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <IoIosGrid className="text-xl" />
                </button>
              </div>

              <button
                className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white border-none px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                onClick={async () => {
                  await navigator("create");
                  setEdit(null);
                  ModalRef.current?.showModal();
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Expense
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="relative max-w-md">
              <IoIosSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                onChange={onSearch}
                type="text"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-colors duration-200"
                placeholder="Search by expense number..."
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        {viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      No.
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Expense No.
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Paid By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Staff
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expanses.length === 0 && !isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-24">
                        <Empty
                          className="w-full flex flex-col items-center justify-center"
                          image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                          imageStyle={{ height: 80 }}
                          description={
                            <Typography.Text className="text-gray-500 text-lg">
                              No expenses found
                            </Typography.Text>
                          }
                        >
                          <Button
                            type="primary"
                            size="large"
                            className="mt-4 bg-blue-600 hover:bg-blue-700 border-none h-11 px-6 rounded-lg font-semibold"
                            onClick={async () => {
                              await navigator("create");
                              ModalRef.current?.showModal();
                            }}
                          >
                            Create Your First Expense
                          </Button>
                        </Empty>
                      </td>
                    </tr>
                  ) : (
                    expanses?.map((exp, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {exp.expanse_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {exp.expanse_supplier || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {exp.expanse_by}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(exp.expanse_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                          {exp.expanse_other || 'No description'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <Tag color="blue" className="rounded-full px-3 py-1 text-xs">
                            {exp.created_by}
                          </Tag>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link to="/expanse-print">
                              <button
                                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors duration-200 text-xs font-semibold"
                              >
                                Details
                              </button>
                            </Link>
                            <button
                              className="inline-flex items-center px-3 py-1.5 border border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors duration-200 text-xs font-semibold"
                              onClick={() => handleUpdate(exp)}
                            >
                              Edit
                            </button>
                            <button
                              className="inline-flex items-center px-3 py-1.5 border border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors duration-200 text-xs font-semibold"
                              onClick={() => handleDelete(exp.expanse_id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Loading Skeleton */}
              <div
                className={`flex flex-col gap-3 p-6 transition-all duration-500 ${isLoading ? "" : "hidden"
                  }`}
              >
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Skeleton.Button
                      style={{ width: "100%" }}
                      active={true}
                      size={"small"}
                      shape={"square"}
                      block={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div>
            {expanses.length === 0 && !isLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Empty
                  className="w-full flex flex-col items-center justify-center"
                  image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                  imageStyle={{ height: 80 }}
                  description={
                    <Typography.Text className="text-gray-500 text-lg">
                      No expenses found
                    </Typography.Text>
                  }
                >
                  <Button
                    type="primary"
                    size="large"
                    className="mt-4 bg-blue-600 hover:bg-blue-700 border-none h-11 px-6 rounded-lg font-semibold"
                    onClick={async () => {
                      await navigator("create");
                      ModalRef.current?.showModal();
                    }}
                  >
                    Create Your First Expense
                  </Button>
                </Empty>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                  [...Array(8)].map((_, index) => (
                    <ExpenseCardSkeleton key={index} />
                  ))
                ) : (
                  expanses?.map((exp, index) => (
                    <ExpenseCard key={index} expense={exp} index={index} />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        <dialog id="my_modal_4" ref={ModalRef} className="modal">
          <div className="modal-box w-11/12 max-w-6xl bg-white rounded-2xl shadow-xl">
            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </form>
            </div>
            <ExpContext.Provider
              value={{ expanseType, onAdd, edit, expanseItems }}
            >
              <Outlet />
            </ExpContext.Provider>
          </div>
        </dialog>

        <dialog id="my_modal_4" ref={updateModalRef} className="modal">
          <div className="modal-box w-11/12 max-w-6xl bg-white rounded-2xl shadow-xl">
            {/* Update content */}
          </div>
        </dialog>
      </section>
    </div>
  );
};

export default Expanses;