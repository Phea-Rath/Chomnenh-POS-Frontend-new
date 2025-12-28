import React, { useEffect, useRef, useState } from 'react'
import { IoIosSearch, IoIosGrid, IoIosList } from 'react-icons/io'
import { FaPlus, FaEdit, FaTrash, FaPalette, FaUser } from 'react-icons/fa'
import AlertBox from '../../services/AlertBox'
import { useOutletsContext } from '../../layouts/Management'
import CreateColors from '../../views/colors/CreateColors'
import UpdateColors from '../../views/colors/UpdateColors'
import { motion } from 'framer-motion';
import { Button, Empty, Skeleton, Typography, Card, Statistic, Input, Tag, Tooltip } from 'antd'
import { useDeleteColorMutation, useGetAllColorQuery } from '../../../app/Features/colorsSlice'
import { toast } from 'react-toastify'

const { Title } = Typography;

const Color = () => {
  const [colors, setColors] = useState([]);
  const [filteredColors, setFilteredColors] = useState([]);
  const [id, setId] = useState(0)
  const [alertBox, setAlertBox] = useState(false)
  const [edit, setEdit] = useState({ id: 1, name: "", color_pick: '' });
  const [viewMode, setViewMode] = useState("grid"); // "list" or "grid"
  const [searchTerm, setSearchTerm] = useState("");
  const { setLoading, loading, setAlert, setMessage, setAlertStatus } = useOutletsContext();
  const addModalRef = useRef(null);
  const updateModalRef = useRef(null);
  const token = localStorage.getItem('token');
  const { data, isError, isLoading, refetch } = useGetAllColorQuery(token);
  const [deleteColor, colorDel] = useDeleteColorMutation();

  useEffect(() => {
    setColors(data?.data || []);
    setFilteredColors(data?.data || []);
  }, [data]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = colors.filter((item) =>
        item.color_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.color_pick.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredColors(filtered);
    } else {
      setFilteredColors(colors);
    }
  }, [searchTerm, colors]);

  // Calculate statistics
  const calculateStats = () => {
    const totalColors = filteredColors.length;
    const uniqueColors = new Set(filteredColors.map(color => color.color_pick.toLowerCase())).size;
    const recentColors = filteredColors.slice(0, 5).length;

    return {
      totalColors,
      uniqueColors,
      recentColors
    };
  };

  const stats = calculateStats();

  function handleDelete(color_id) {
    setAlertBox(true);
    setId(color_id);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      await deleteColor({ id, token });
      if (colorDel.error) {
        toast.error(colorDel?.error?.message || colorDel.error || 'An error occurred while deleting the color');
        setLoading(false);
      } else {
        refetch();
        toast.success('Color deleted successfully');
        setLoading(false);
      }
    } catch (error) {
      setAlertBox(false);
      toast.error(error?.message || error || 'An error occurred while deleting the color');
      setLoading(false);
    }
  }

  function onSearch(e) {
    setSearchTerm(e.target.value);
  }

  function handleUpdate(name, id, color_pick) {
    updateModalRef.current?.showModal();
    setEdit(prev => { return { ...prev, name: name, id: id, color_pick: color_pick } })
  }

  const ColorCard = ({ color, index }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card
        className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-pink-50/50 hover:scale-[1.02] cursor-pointer"
        bodyStyle={{ padding: '20px' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-pink-100 rounded-xl">
              <FaPalette className="text-2xl text-pink-600" />
            </div>
            <Tag color="pink" className="font-semibold">
              #{index + 1}
            </Tag>
          </div>

          {/* Color Display */}
          <div className="mb-4 text-center">
            <Tooltip title={color.color_pick}>
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-3 border-4 border-white shadow-lg transition-transform duration-300 hover:scale-110"
                style={{ backgroundColor: color.color_pick?.toLowerCase() }}
              />
            </Tooltip>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{color.color_name}</h3>
            <div className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-md inline-block">
              {color.color_pick}
            </div>
          </div>

          {/* Created By */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <FaUser className="text-gray-400" />
            <span>Created by: {color.created_by}</span>
          </div>

          {/* Actions */}
          <div className="mt-auto flex gap-2">
            <Button
              type="primary"
              icon={<FaEdit />}
              onClick={() => handleUpdate(color.color_name, color.color_id, color.color_pick)}
              className="flex-1 bg-pink-600 hover:bg-pink-700 border-0"
              size="small"
            >
              Edit
            </Button>
            <Button
              danger
              icon={<FaTrash />}
              onClick={() => handleDelete(color.color_id)}
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/30 p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3"
              >
                <div className="p-2 bg-pink-100 rounded-lg">
                  <FaPalette className="text-2xl text-pink-600" />
                </div>
                Color Management
              </motion.h1>
              <p className="text-gray-600 text-lg">
                Manage your product colors and palettes
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                icon={<FaPlus />}
                onClick={() => addModalRef.current?.showModal()}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                size="large"
              >
                Add Color
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
          <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm font-medium mb-2">Total Colors</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalColors}
                  </p>
                </div>
                <div className="p-3 bg-pink-400/20 rounded-full">
                  <FaPalette className="text-2xl text-pink-200" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-2">Unique Colors</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.uniqueColors}
                  </p>
                </div>
                <div className="p-3 bg-purple-400/20 rounded-full">
                  <FaEyedropper className="text-2xl text-purple-200" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-2">Recent Colors</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.recentColors}
                  </p>
                </div>
                <div className="p-3 bg-orange-400/20 rounded-full">
                  <FaPaintBrush className="text-2xl text-orange-200" />
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
                    ? "bg-white shadow-md text-pink-600 font-semibold"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  <IoIosList className="text-lg" />
                  <span>List View</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${viewMode === "grid"
                    ? "bg-white shadow-md text-pink-600 font-semibold"
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
                  placeholder="Search colors by name or hex code..."
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
          title="Delete Color"
          message="Are you sure you want to delete this color? This action cannot be undone."
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Color</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Color Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hex Code</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredColors.map((color, index) => (
                      <tr key={color.color_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-600">{index + 1}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: color.color_pick?.toLowerCase() }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-100 rounded-lg">
                              <FaPalette className="text-pink-600" />
                            </div>
                            <span className="font-semibold text-gray-900">{color.color_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              {color.color_pick}
                            </code>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <FaUser className="text-gray-400" />
                            {color.created_by}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              icon={<FaEdit />}
                              onClick={() => handleUpdate(color.color_name, color.color_id, color.color_pick)}
                              className="bg-pink-600 hover:bg-pink-700 text-white"
                              size="small"
                            >
                              Edit
                            </Button>
                            <Button
                              danger
                              icon={<FaTrash />}
                              onClick={() => handleDelete(color.color_id)}
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

              {filteredColors.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Empty
                    className="w-full flex flex-col items-center justify-center"
                    image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                    description={
                      <Typography.Text className="text-gray-500">
                        No colors found
                      </Typography.Text>
                    }
                  >
                    <Button
                      type="primary"
                      icon={<FaPlus />}
                      onClick={() => addModalRef.current?.showModal()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Create Your First Color
                    </Button>
                  </Empty>
                </div>
              )}
            </div>
          ) : (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredColors.map((color, index) => (
                <ColorCard key={color.color_id} color={color} index={index} />
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

          {viewMode === "grid" && filteredColors.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Empty
                className="w-full flex flex-col items-center justify-center"
                image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                description={
                  <Typography.Text className="text-gray-500">
                    No colors found
                  </Typography.Text>
                }
              >
                <Button
                  type="primary"
                  icon={<FaPlus />}
                  onClick={() => addModalRef.current?.showModal()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Your First Color
                </Button>
              </Empty>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <dialog id="my_modal_5" ref={addModalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white max-w-2xl">
          <CreateColors data={edit} onAdd={() => addModalRef.current?.close()} />
        </div>
      </dialog>

      <dialog id="my_modal_5" ref={updateModalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white max-w-2xl">
          <UpdateColors data={edit} onAdd={() => updateModalRef.current?.close()} />
        </div>
      </dialog>
    </motion.div>
  )
}

export default Color