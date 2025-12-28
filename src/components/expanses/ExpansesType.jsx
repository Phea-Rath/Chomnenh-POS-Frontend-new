import React, { useEffect, useRef, useState } from 'react'
import { IoIosSearch, IoIosGrid, IoIosList } from 'react-icons/io'
import { MdCategory, MdPerson } from 'react-icons/md'
import CreateExpanseTypes from '../../views/expanses/CreateExpanseTypes'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import UpdateExpanseType from '../../views/expanses/UpdateExpanseTypes';
import { Button, Empty, Skeleton, Typography, Tag } from 'antd';
import { motion } from "framer-motion";
import { useDeleteExpanseTypeMutation, useGetAllExpanseTypesQuery } from '../../../app/Features/expanseTypesSlice';
import { toast } from 'react-toastify';

const ExpansesType = () => {
  const [expanse_types, setExpanseTypes] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [id, setId] = useState(0)
  const [alertBox, setAlertBox] = useState(false)
  const [edit, setEdit] = useState({ id: 1, name: "" });
  const { setLoading, setAlert, setMessage, setAlertStatus, reload, setReload } = useOutletsContext();
  const addModalRef = useRef(null);
  const updateModalRef = useRef(null);
  const token = localStorage.getItem('token');
  const { data, isLoading, isError, refetch } = useGetAllExpanseTypesQuery(token);
  const [deleteExpanseType, expansetypeDel] = useDeleteExpanseTypeMutation();

  useEffect(() => {
    setExpanseTypes(data?.data || []);
  }, [data]);

  function handleDelete(expanse_type_id) {
    setAlertBox(true);
    setId(expanse_type_id);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      const response = await deleteExpanseType({ id, token });;
      if (response.data.status === 200) {
        refetch();
        toast.success('Expanse type deleted successfully');
        setAlertBox(false);
        setLoading(false);
      } else {
        toast.error('Failed to delete expanse type');
        setAlertBox(false);
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while deleting the expanse type');
      setLoading(false);
      setAlertBox(false);
    }
  }

  function onSearch(event) {
    if (event.target.value) {
      const filterExpanseType = data.data.filter((item) => item.expanse_type_name.toLowerCase().includes(event.target.value.toLowerCase()));
      setExpanseTypes(filterExpanseType || []);
    } else {
      setExpanseTypes(data.data || []);
    }
  }

  function handleUpdate(id, name) {
    updateModalRef.current?.showModal();
    setEdit(prev => { return { ...prev, name: name, id: id } })
  }

  // Grid Card Component
  const ExpenseTypeCard = ({ expenseType, index }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <MdCategory className="text-blue-600 text-xl" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
            {expenseType.expanse_type_name}
          </h3>
          <p className="text-sm text-gray-500">Expense Type</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MdPerson className="text-gray-400" />
          <span>Created by: {expenseType.created_by}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Active</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <button
          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors duration-200 text-xs font-semibold"
        >
          Details
        </button>
        <button
          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors duration-200 text-xs font-semibold"
          onClick={() => handleUpdate(expenseType.expanse_type_id, expenseType.expanse_type_name)}
        >
          Edit
        </button>
        <button
          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors duration-200 text-xs font-semibold"
          onClick={() => handleDelete(expenseType.expanse_type_id)}
        >
          Delete
        </button>
      </div>
    </div>
  );

  // Loading Card Skeleton
  const ExpenseTypeCardSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="animate-pulse">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-3 bg-gray-200 rounded-lg w-12 h-12"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      <section className="px-4 md:px-6 lg:px-8 py-6">
        <AlertBox
          isOpen={alertBox}
          title="Confirm Deletion"
          message="Are you sure you want to delete this expense type?"
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
                Expense Types
              </h1>
              <p className="text-gray-600">Manage and organize your expense categories</p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
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
                onClick={() => addModalRef.current?.showModal()}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Type
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
                placeholder="Search by expense type name..."
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
                      Expense Type Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expanse_types.length === 0 && !isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-24">
                        <Empty
                          className="w-full flex flex-col items-center justify-center"
                          image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                          imageStyle={{ height: 80 }}
                          description={
                            <Typography.Text className="text-gray-500 text-lg">
                              No expense types found
                            </Typography.Text>
                          }
                        >
                          <Button
                            type="primary"
                            size="large"
                            className="mt-4 bg-blue-600 hover:bg-blue-700 border-none h-11 px-6 rounded-lg font-semibold"
                            onClick={() => addModalRef.current?.showModal()}
                          >
                            Create Your First Type
                          </Button>
                        </Empty>
                      </td>
                    </tr>
                  ) : (
                    expanse_types?.map(({ expanse_type_id, expanse_type_name, created_by }, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {expanse_type_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <Tag color="blue" className="rounded-full px-3 py-1 text-xs">
                            {created_by}
                          </Tag>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors duration-200 text-xs font-semibold">
                              Details
                            </button>
                            <button
                              className="inline-flex items-center px-3 py-1.5 border border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors duration-200 text-xs font-semibold"
                              onClick={() => handleUpdate(expanse_type_id, expanse_type_name)}
                            >
                              Edit
                            </button>
                            <button
                              className="inline-flex items-center px-3 py-1.5 border border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors duration-200 text-xs font-semibold"
                              onClick={() => handleDelete(expanse_type_id)}
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
              <div className={`flex flex-col gap-3 p-6 transition-all duration-500 ${isLoading ? "" : "hidden"}`}>
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
            {expanse_types.length === 0 && !isLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Empty
                  className="w-full flex flex-col items-center justify-center"
                  image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                  imageStyle={{ height: 80 }}
                  description={
                    <Typography.Text className="text-gray-500 text-lg">
                      No expense types found
                    </Typography.Text>
                  }
                >
                  <Button
                    type="primary"
                    size="large"
                    className="mt-4 bg-blue-600 hover:bg-blue-700 border-none h-11 px-6 rounded-lg font-semibold"
                    onClick={() => addModalRef.current?.showModal()}
                  >
                    Create Your First Type
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
                  expanse_types?.map((expenseType, index) => (
                    <ExpenseTypeCard key={index} expenseType={expenseType} index={index} />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        <dialog id="my_modal_5" ref={addModalRef} className="modal modal-bottom sm:modal-middle">
          <div className="modal-box bg-white rounded-2xl shadow-xl max-w-2xl">
            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </form>
            </div>
            <CreateExpanseTypes onAdd={() => addModalRef.current?.close()} />
          </div>
        </dialog>

        <dialog id="my_modal_5" ref={updateModalRef} className="modal modal-bottom sm:modal-middle">
          <div className="modal-box bg-white rounded-2xl shadow-xl max-w-2xl">
            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </form>
            </div>
            <UpdateExpanseType onAdd={() => updateModalRef.current?.close()} data={edit} />
          </div>
        </dialog>
      </section>
    </motion.div>
  )
}

export default ExpansesType