import React, { useEffect, useRef, useState } from 'react'
import { IoIosSearch, IoIosGrid, IoIosList } from 'react-icons/io'
import { FaPlus, FaEdit, FaTrash, FaBalanceScale, FaUser, FaWeight, FaRulerCombined } from 'react-icons/fa'
import CreateScales from '../../views/scales/CreateScales'
import UpdateScales from '../../views/scales/UpdateScales';
import { useOutletsContext } from '../../layouts/Management';
import AlertBox from '../../services/AlertBox';
import { Button, Empty, Skeleton, Typography, Card, Statistic, Input, Tag, Badge } from 'antd';
import { motion } from "framer-motion";
import { useDeleteScaleMutation, useGetAllScalesQuery } from '../../../app/Features/scalesSlice';
import { toast } from 'react-toastify';

const { Title } = Typography;

const Scales = () => {
  const [scales, setScales] = useState([]);
  const [filteredScales, setFilteredScales] = useState([]);
  const [id, setId] = useState(0)
  const [alertBox, setAlertBox] = useState(false)
  const [edit, setEdit] = useState({ id: 1, name: "" });
  const [viewMode, setViewMode] = useState("grid"); // "list" or "grid"
  const [searchTerm, setSearchTerm] = useState("");
  const { setLoading, loading, setAlert, setMessage, setAlertStatus } = useOutletsContext();
  const addModalRef = useRef(null);
  const updateModalRef = useRef(null);
  const token = localStorage.getItem("token");
  const { data, isLoading, isError, refetch } = useGetAllScalesQuery(token);
  const [deleteScale, scaleDel] = useDeleteScaleMutation();

  useEffect(() => {
    setScales(data?.data || []);
    setFilteredScales(data?.data || []);
  }, [data?.data]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = scales.filter((item) =>
        item.scale_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredScales(filtered);
    } else {
      setFilteredScales(scales);
    }
  }, [searchTerm, scales]);

  // Calculate statistics
  const calculateStats = () => {
    const totalScales = filteredScales.length;
    const weightScales = filteredScales.filter(scale =>
      scale.scale_name.toLowerCase().includes('kg') ||
      scale.scale_name.toLowerCase().includes('g') ||
      scale.scale_name.toLowerCase().includes('lb')
    ).length;
    const volumeScales = filteredScales.filter(scale =>
      scale.scale_name.toLowerCase().includes('l') ||
      scale.scale_name.toLowerCase().includes('ml')
    ).length;

    return {
      totalScales,
      weightScales,
      volumeScales
    };
  };

  const stats = calculateStats();

  function handleDelete(scale_id) {
    setAlertBox(true);
    setId(scale_id);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      const res = await deleteScale({ id, token });
      if (res.data.status === 200) {
        refetch();
        setLoading(false);
        toast.success(res.data.message || 'Scale deleted successfully!');
      }
    } catch (error) {
      setLoading(false);
      toast.error(error?.message || error || 'An error occurred while deleting the scale');
    }
  }

  function onSearch(e) {
    setSearchTerm(e.target.value);
  }

  function handleUpdate(name, id) {
    updateModalRef.current?.showModal();
    setEdit(prev => { return { ...prev, name: name, id: id } })
  }

  const getScaleType = (scaleName) => {
    const name = scaleName.toLowerCase();
    if (name.includes('kg') || name.includes('g') || name.includes('lb')) return 'weight';
    if (name.includes('l') || name.includes('ml')) return 'volume';
    return 'other';
  };

  const getScaleColor = (scaleName) => {
    const type = getScaleType(scaleName);
    switch (type) {
      case 'weight': return 'orange';
      case 'volume': return 'blue';
      default: return 'green';
    }
  };

  const getScaleIcon = (scaleName) => {
    const type = getScaleType(scaleName);
    switch (type) {
      case 'weight': return <FaWeight />;
      case 'volume': return <FaRulerCombined />;
      default: return <FaBalanceScale />;
    }
  };

  const ScaleCard = ({ scale, index }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card
        className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-orange-50/50 hover:scale-[1.02] cursor-pointer"
        bodyStyle={{ padding: '20px' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <div className="text-2xl text-orange-600">
                {getScaleIcon(scale.scale_name)}
              </div>
            </div>
            <Tag color={getScaleColor(scale.scale_name)} className="font-semibold">
              #{index + 1}
            </Tag>
          </div>

          {/* Scale Display */}
          <div className="mb-4 text-center">
            <div className="relative inline-block">
              {/* <div className="w-20 h-20 rounded-2xl mx-auto mb-3 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {scale.scale_name}
              </div> */}
              <Badge
                count={getScaleType(scale.scale_name).toUpperCase()}
                className="absolute -top-2 -right-2"
                color={getScaleColor(scale.scale_name)}
              />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{scale.scale_name}</h3>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
              MEASUREMENT UNIT
            </div>
          </div>

          {/* Created By */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <FaUser className="text-gray-400" />
            <span>Created by: {scale.created_by}</span>
          </div>

          {/* Actions */}
          <div className="mt-auto flex gap-2">
            <Button
              type="primary"
              icon={<FaEdit />}
              onClick={() => handleUpdate(scale.scale_name, scale.scale_id)}
              className="flex-1 bg-orange-600 hover:bg-orange-700 border-0"
              size="small"
            >
              Edit
            </Button>
            <Button
              danger
              icon={<FaTrash />}
              onClick={() => handleDelete(scale.scale_id)}
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3"
              >
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FaBalanceScale className="text-2xl text-orange-600" />
                </div>
                Scale Management
              </motion.h1>
              <p className="text-gray-600 text-lg">
                Manage your product measurement scales and units
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                icon={<FaPlus />}
                onClick={() => addModalRef.current?.showModal()}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                size="large"
              >
                Add Scale
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
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-2">Total Scales</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalScales}
                  </p>
                </div>
                <div className="p-3 bg-orange-400/20 rounded-full">
                  <FaBalanceScale className="text-2xl text-orange-200" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium mb-2">Weight Units</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.weightScales}
                  </p>
                </div>
                <div className="p-3 bg-red-400/20 rounded-full">
                  <FaWeight className="text-2xl text-red-200" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-2">Volume Units</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.volumeScales}
                  </p>
                </div>
                <div className="p-3 bg-blue-400/20 rounded-full">
                  <FaRulerCombined className="text-2xl text-blue-200" />
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
                    ? "bg-white shadow-md text-orange-600 font-semibold"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  <IoIosList className="text-lg" />
                  <span>List View</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${viewMode === "grid"
                    ? "bg-white shadow-md text-orange-600 font-semibold"
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
                  placeholder="Search scales..."
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
          title="Delete Scale"
          message="Are you sure you want to delete this scale? This action cannot be undone."
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Scale</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Scale Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredScales.map((scale, index) => (
                      <tr key={scale.scale_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-600">{index + 1}</div>
                        </td>
                        {/* <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                              {scale.scale_name}
                            </div>
                          </div>
                        </td> */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 text-orange-500 rounded-lg">
                              {getScaleIcon(scale.scale_name)}
                            </div>
                            <span className="font-semibold text-gray-900">{scale.scale_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Tag color={getScaleColor(scale.scale_name)} className="font-semibold">
                            {getScaleType(scale.scale_name).toUpperCase()}
                          </Tag>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <FaUser className="text-gray-400" />
                            {scale.created_by}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              icon={<FaEdit />}
                              onClick={() => handleUpdate(scale.scale_name, scale.scale_id)}
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                              size="small"
                            >
                              Edit
                            </Button>
                            <Button
                              danger
                              icon={<FaTrash />}
                              onClick={() => handleDelete(scale.scale_id)}
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

              {filteredScales.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Empty
                    className="w-full flex flex-col items-center justify-center"
                    image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                    description={
                      <Typography.Text className="text-gray-500">
                        No scales found
                      </Typography.Text>
                    }
                  >
                    <Button
                      type="primary"
                      icon={<FaPlus />}
                      onClick={() => addModalRef.current?.showModal()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Create Your First Scale
                    </Button>
                  </Empty>
                </div>
              )}
            </div>
          ) : (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredScales.map((scale, index) => (
                <ScaleCard key={scale.scale_id} scale={scale} index={index} />
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

          {viewMode === "grid" && filteredScales.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Empty
                className="w-full flex flex-col items-center justify-center"
                image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                description={
                  <Typography.Text className="text-gray-500">
                    No scales found
                  </Typography.Text>
                }
              >
                <Button
                  type="primary"
                  icon={<FaPlus />}
                  onClick={() => addModalRef.current?.showModal()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Your First Scale
                </Button>
              </Empty>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <dialog id="my_modal_5" ref={addModalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white max-w-2xl">
          <CreateScales data={edit} onAdd={() => addModalRef.current?.close()} />
        </div>
      </dialog>

      <dialog id="my_modal_5" ref={updateModalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white max-w-2xl">
          <UpdateScales data={edit} onAdd={() => updateModalRef.current?.close()} />
        </div>
      </dialog>
    </motion.div>
  )
}

export default Scales