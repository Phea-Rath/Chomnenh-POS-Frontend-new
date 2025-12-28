import React, { useEffect, useRef, useState } from 'react'
import { IoIosSearch, IoIosGrid, IoIosList } from 'react-icons/io'
import { FaPlus, FaEdit, FaTrash, FaRuler, FaUser, FaArrowsAltH, FaSortNumericUp } from 'react-icons/fa'
import AlertBox from '../../services/AlertBox'
import { useOutletsContext } from '../../layouts/Management'
import api from '../../services/api'
import CreateSizes from '../../views/sizes/CreateSizes'
import UpdateSizes from '../../views/sizes/UpdateSizes'
import { motion } from "framer-motion";
import { Button, Empty, Skeleton, Typography, Card, Statistic, Input, Tag, Badge } from 'antd'
import { useCreateSizeMutation, useDeleteSizeMutation, useGetAllSizesQuery } from '../../../app/Features/sizesSlice'
import { toast } from 'react-toastify'

const { Title } = Typography;

const Size = () => {
  const [sizes, setSizes] = useState([]);
  const [filteredSizes, setFilteredSizes] = useState([]);
  const [id, setId] = useState(0)
  const [loadings, setLoadings] = useState(false)
  const [alertBox, setAlertBox] = useState(false)
  const [edit, setEdit] = useState({ id: 1, name: "" });
  const [viewMode, setViewMode] = useState("grid"); // "list" or "grid"
  const [searchTerm, setSearchTerm] = useState("");
  const { setLoading, loading, setAlert, setMessage, setAlertStatus, reload, setReload } = useOutletsContext();
  const addModalRef = useRef(null);
  const updateModalRef = useRef(null);
  const token = localStorage.getItem('token');
  const { data, isError, isLoading, refetch } = useGetAllSizesQuery(token);
  const [deleteSize, sizeDel] = useDeleteSizeMutation();

  useEffect(() => {
    setSizes(data?.data || []);
    setFilteredSizes(data?.data || []);
  }, [data?.data]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = sizes.filter((item) =>
        item.size_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSizes(filtered);
    } else {
      setFilteredSizes(sizes);
    }
  }, [searchTerm, sizes]);

  // Calculate statistics
  const calculateStats = () => {
    const totalSizes = filteredSizes.length;
    const numericSizes = filteredSizes.filter(size => !isNaN(parseFloat(size.size_name))).length;
    const textSizes = filteredSizes.filter(size => isNaN(parseFloat(size.size_name))).length;

    return {
      totalSizes,
      numericSizes,
      textSizes
    };
  };

  const stats = calculateStats();

  function handleDelete(size_id) {
    setAlertBox(true);
    setId(size_id);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    try {
      setLoadings(true);
      setAlertBox(false);
      const res = await deleteSize({ id, token });
      if (res.data.status === 200) {
        refetch();
        toast.success(res.data.message || 'Size deleted successfully!');
        setLoading(false);
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while deleting the size');
      setLoading(false);
    }
  }

  function onSearch(e) {
    setSearchTerm(e.target.value);
  }

  function handleUpdate(name, id) {
    updateModalRef.current?.showModal();
    setEdit(prev => { return { ...prev, name: name, id: id } })
  }

  const getSizeType = (sizeName) => {
    return isNaN(parseFloat(sizeName)) ? 'text' : 'numeric';
  };

  const getSizeColor = (sizeName) => {
    const type = getSizeType(sizeName);
    return type === 'numeric' ? 'blue' : 'green';
  };

  const SizeCard = ({ size, index }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card
        className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-indigo-50/50 hover:scale-[1.02] cursor-pointer"
        bodyStyle={{ padding: '20px' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <FaRuler className="text-2xl text-indigo-600" />
            </div>
            <Tag color={getSizeColor(size.size_name)} className="font-semibold">
              #{index + 1}
            </Tag>
          </div>

          {/* Size Display */}
          <div className="mb-4 text-center">
            <div className="relative inline-block">
              {/* <div className="w-20 h-20 rounded-2xl mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {size.size_name}
              </div> */}
              <Badge
                count={getSizeType(size.size_name) === 'numeric' ? 'Numeric' : 'Text'}
                className="absolute -top-2 -right-2"
                color={getSizeColor(size.size_name)}
              />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{size.size_name}</h3>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
              {getSizeType(size.size_name).toUpperCase()} SIZE
            </div>
          </div>

          {/* Created By */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <FaUser className="text-gray-400" />
            <span>Created by: {size.create_by}</span>
          </div>

          {/* Actions */}
          <div className="mt-auto flex gap-2">
            <Button
              type="primary"
              icon={<FaEdit />}
              onClick={() => handleUpdate(size.size_name, size.size_id)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 border-0"
              size="small"
            >
              Edit
            </Button>
            <Button
              danger
              icon={<FaTrash />}
              onClick={() => handleDelete(size.size_id)}
              className="flex-1"
              size="small"
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30 p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3"
              >
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FaRuler className="text-2xl text-indigo-600" />
                </div>
                Size Management
              </motion.h1>
              <p className="text-gray-600 text-lg">
                Manage your product sizes and dimensions
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                icon={<FaPlus />}
                onClick={() => addModalRef.current?.showModal()}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                size="large"
              >
                Add Size
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium mb-2">Total Sizes</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalSizes}
                  </p>
                </div>
                <div className="p-3 bg-indigo-400/20 rounded-full">
                  <FaRuler className="text-2xl text-indigo-200" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-2">Numeric Sizes</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.numericSizes}
                  </p>
                </div>
                <div className="p-3 bg-blue-400/20 rounded-full">
                  <FaSortNumericUp className="text-2xl text-blue-200" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-2">Text Sizes</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.textSizes}
                  </p>
                </div>
                <div className="p-3 bg-green-400/20 rounded-full">
                  <FaArrowsAltH className="text-2xl text-green-200" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div> */}

        {/* Controls Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* View Toggle and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1 border">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${viewMode === "list"
                    ? "bg-white shadow-md text-indigo-600 font-semibold"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  <IoIosList className="text-lg" />
                  <span>List View</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${viewMode === "grid"
                    ? "bg-white shadow-md text-indigo-600 font-semibold"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  <IoIosGrid className="text-lg" />
                  <span>Grid View</span>
                </button>
              </div>

              {/* Search Input */}
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search sizes..."
                  prefix={<IoIosSearch className="text-gray-400" />}
                  value={searchTerm}
                  onChange={onSearch}
                  className="h-12 rounded-xl border-0 bg-gray-50 shadow-sm"
                  allowClear
                  size="large"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Alert Box */}
        <AlertBox
          isOpen={alertBox}
          title="Delete Size"
          message="Are you sure you want to delete this size? This action cannot be undone."
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText="Delete"
          cancelText="Cancel"
        />

        {/* Content Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {viewMode === "list" ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Size Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSizes.map((size, index) => (
                      <tr key={size.size_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-600">{index + 1}</div>
                        </td>
                        {/* <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                              {size.size_name}
                            </div>
                          </div>
                        </td> */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <FaRuler className="text-indigo-600" />
                            </div>
                            <span className="font-semibold text-gray-900">{size.size_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Tag color={getSizeColor(size.size_name)} className="font-semibold">
                            {getSizeType(size.size_name).toUpperCase()}
                          </Tag>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <FaUser className="text-gray-400" />
                            {size.create_by}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              icon={<FaEdit />}
                              onClick={() => handleUpdate(size.size_name, size.size_id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              size="small"
                            >
                              Edit
                            </Button>
                            <Button
                              danger
                              icon={<FaTrash />}
                              onClick={() => handleDelete(size.size_id)}
                              size="small"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {isLoading && (
                <div className="p-6">
                  {[1, 2, 3, 4].map((item) => (
                    <Skeleton key={item} active paragraph={{ rows: 1 }} className="mb-4" />
                  ))}
                </div>
              )}

              {filteredSizes.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Empty
                    className="w-full flex flex-col items-center justify-center"
                    image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                    description={
                      <Typography.Text className="text-gray-500">
                        No sizes found
                      </Typography.Text>
                    }
                  >
                    <Button
                      type="primary"
                      icon={<FaPlus />}
                      onClick={() => addModalRef.current?.showModal()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Create Your First Size
                    </Button>
                  </Empty>
                </div>
              )}
            </div>
          ) : (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSizes.map((size, index) => (
                <SizeCard key={size.size_id} size={size} index={index} />
              ))}
            </div>
          )}

          {viewMode === "grid" && isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Card key={item} className="border-0 shadow-lg">
                  <Skeleton active paragraph={{ rows: 3 }} />
                </Card>
              ))}
            </div>
          )}

          {viewMode === "grid" && filteredSizes.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Empty
                className="w-full flex flex-col items-center justify-center"
                image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                description={
                  <Typography.Text className="text-gray-500">
                    No sizes found
                  </Typography.Text>
                }
              >
                <Button
                  type="primary"
                  icon={<FaPlus />}
                  onClick={() => addModalRef.current?.showModal()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Your First Size
                </Button>
              </Empty>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <dialog id="my_modal_5" ref={addModalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white max-w-2xl">
          <CreateSizes data={edit} onAdd={() => addModalRef.current?.close()} />
        </div>
      </dialog>

      <dialog id="my_modal_5" ref={updateModalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white max-w-2xl">
          <UpdateSizes data={edit} onAdd={() => updateModalRef.current?.close()} />
        </div>
      </dialog>
    </motion.div>
  )
}

export default Size