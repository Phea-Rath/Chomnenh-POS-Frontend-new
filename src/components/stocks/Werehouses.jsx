import React, { useEffect, useRef, useState } from 'react'
import { IoIosSearch } from 'react-icons/io'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { TbBuildingWarehouse } from 'react-icons/tb'
import { MdLocationCity } from 'react-icons/md'
import { useOutletsContext } from '../../layouts/Management';
import AlertBox from '../../services/AlertBox';
import UpdateWarehouses from '../../views/stocks/UpdateWarehouses';
import CreateWarehouses from '../../views/stocks/CreateWarehouses';
import { motion } from "framer-motion";
import { Button, Empty, Skeleton, Tag, Typography, Card, Badge, Tooltip, Modal, Input, Row, Col, Statistic, Progress } from 'antd';
import { useGetAllWarehousesQuery, useDeleteWarehouseMutation } from '../../../app/Features/warehousesSlice';
import { toast } from 'react-toastify';
import { RiDeleteBin6Line, RiEdit2Line } from 'react-icons/ri';
import { IoGridOutline, IoListOutline } from 'react-icons/io5'

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [id, setId] = useState(0)
  const [alertBox, setAlertBox] = useState(false)
  const [edit, setEdit] = useState({ id: 1, name: "", status: 0 });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const { setLoading, loading, setAlert, setMessage, setAlertStatus } = useOutletsContext();
  const addModalRef = useRef(null);
  const updateModalRef = useRef(null);
  const token = localStorage.getItem('token');
  const { data, isError, isLoading, refetch } = useGetAllWarehousesQuery(token);
  const [deleteWarehouse, warehouseDel] = useDeleteWarehouseMutation();

  useEffect(() => {
    setWarehouses(data?.data || []);
  }, [data]);

  // Calculate statistics
  const calculateStats = () => {
    const totalWarehouses = warehouses.length;
    const activeWarehouses = warehouses.filter(w => w.status === 1).length;
    const defaultWarehouses = warehouses.filter(w => w.created_by === 0).length;

    return {
      totalWarehouses,
      activeWarehouses,
      defaultWarehouses,
      activePercentage: totalWarehouses > 0 ? Math.round((activeWarehouses / totalWarehouses) * 100) : 0
    };
  };

  const stats = calculateStats();

  function handleDelete(warehouse_id) {
    setAlertBox(true);
    setId(warehouse_id);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      const response = await deleteWarehouse({ id, token });
      if (response?.data.status === 200) {
        setAlertBox(false);
        refetch();
        toast.success(response.data.message || 'Warehouse deleted successfully!');
        setLoading(false);
      } else {
        throw new Error(response.error?.data?.message || "Failed to delete warehouse");
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while deleting the warehouse');
      setLoading(false);
      setAlertBox(false);
    }
  }

  function onSearch(e) {
    const value = e.target.value;
    setSearchTerm(value);

    if (value) {
      const filterWarehouses = data?.data.filter((item) =>
        item.warehouse_name?.toLowerCase().includes(value.toLowerCase())
      );
      setWarehouses(filterWarehouses || []);
    } else {
      setWarehouses(data?.data || []);
    }
  }

  function handleUpdate(name, id, status) {
    updateModalRef.current?.showModal();
    setEdit(prev => { return { ...prev, name: name, id: id, status } })
  }

  // Warehouse Card Component for Grid View
  const WarehouseCard = ({ warehouse, index }) => {
    return (
      <div
      >
        <Card
          className="h-full border-0 shadow-sm hover:shadow-sm transition-all duration-300 bg-gradient-to-br from-white to-blue-50/50 hover:scale-[1.02] cursor-pointer"
          bodyStyle={{ padding: '20px' }}
        >
          <div className="flex flex-col h-full">
            {/* Header with Icon and Status */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl">
                  <TbBuildingWarehouse className="text-2xl text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge
                    count={index + 1}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600"
                    style={{ backgroundColor: '#3b82f6' }}
                  />
                </div>
              </div>
              <Tag
                color={warehouse.status === 1 ? "success" : "error"}
                className="font-semibold text-xs"
              >
                {warehouse.status === 1 ? 'Active' : 'Inactive'}
              </Tag>
            </div>

            {/* Warehouse Info */}
            <div className="mb-4">
              <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">
                {warehouse.warehouse_name}
              </h3>
              <div className="flex items-center space-x-2 text-gray-600">
                <HiOutlineBuildingOffice2 className="text-gray-400" />
                <span className="text-sm">Warehouse ID: {warehouse.warehouse_id}</span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <MdLocationCity className="text-blue-400" />
                  <span className="text-sm text-gray-600">Type</span>
                </div>
                <Tag color={warehouse.created_by === 0 ? "gold" : "blue"} className="font-semibold">
                  {warehouse.created_by === 0 ? 'Default' : 'Custom'}
                </Tag>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Created By</span>
                <span className="font-semibold text-gray-900">
                  {warehouse.created_by === 0 ? 'System' : `User #${warehouse.created_by}`}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <Tooltip title="Edit Warehouse">
                  <Button
                    type="primary"
                    icon={<RiEdit2Line />}
                    onClick={() => handleUpdate(warehouse.warehouse_name, warehouse.warehouse_id, warehouse.status)}
                    className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 border-0 hover:from-blue-600 hover:to-indigo-700"
                  >
                    Edit
                  </Button>
                </Tooltip>
                <Tooltip title="Delete Warehouse">
                  <Button
                    type="default"
                    danger
                    icon={<RiDeleteBin6Line />}
                    onClick={() => handleDelete(warehouse.warehouse_id)}
                    className="flex items-center justify-center border-red-300 text-red-600 hover:border-red-400 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div
    >
      <section className='p-4 md:p-6 lg:p-8'>
        <AlertBox
          isOpen={alertBox}
          title="Confirm Deletion"
          message="Are you sure you want to delete this warehouse? This action cannot be undone."
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText="Delete"
          cancelText="Cancel"
        />

        <div className="mb-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3"
              >
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-sm">
                  <TbBuildingWarehouse className="text-2xl text-white" />
                </div>
                Warehouse Management
              </motion.h1>
              <p className="text-gray-600 text-lg">
                Manage your storage facilities and distribution centers
              </p>
            </div>

            <Button
              type="primary"
              size="large"
              onClick={() => addModalRef.current?.showModal()}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 h-12 px-6 shadow-sm"
            >
              + Add New Warehouse
            </Button>
          </div>

          {/* Statistics Cards */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-semibold mb-2">Total Warehouses</p>
                    {isLoading ? (
                      <div className="h-8 bg-blue-100 rounded animate-pulse w-16"></div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.totalWarehouses}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <TbBuildingWarehouse className="text-2xl text-blue-600" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-semibold mb-2">Active Warehouses</p>
                    {isLoading ? (
                      <div className="h-8 bg-green-100 rounded animate-pulse w-12"></div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.activeWarehouses}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <div className="w-6 h-6 rounded-full bg-green-500"></div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-white">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 text-sm font-semibold mb-2">Default Warehouses</p>
                    {isLoading ? (
                      <div className="h-8 bg-yellow-100 rounded animate-pulse w-12"></div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.defaultWarehouses}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <HiOutlineBuildingOffice2 className="text-2xl text-yellow-600" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-semibold mb-2">Active Rate</p>
                    {isLoading ? (
                      <div className="h-8 bg-purple-100 rounded animate-pulse w-16"></div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <p className="text-3xl font-bold text-gray-900">
                          {stats.activePercentage}%
                        </p>
                        <Progress
                          type="circle"
                          percent={stats.activePercentage}
                          size={40}
                          strokeColor="#8b5cf6"
                          trailColor="#e5e7eb"
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <div className="text-2xl text-purple-600">📊</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Controls Section */}
          <div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* View Toggle and Search */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1 border">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${viewMode === "table"
                      ? "bg-white shadow-sm text-blue-600 font-semibold"
                      : "text-gray-600 hover:text-gray-800"
                      }`}
                  >
                    <IoListOutline className="text-lg" />
                    <span>Table View</span>
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${viewMode === "grid"
                      ? "bg-white shadow-sm text-blue-600 font-semibold"
                      : "text-gray-600 hover:text-gray-800"
                      }`}
                  >
                    <IoGridOutline className="text-lg" />
                    <span>Grid View</span>
                  </button>
                </div>

                {/* Search Input */}
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Search warehouses by name..."
                    prefix={<IoIosSearch className="text-gray-400" />}
                    value={searchTerm}
                    onChange={onSearch}
                    className="h-12 rounded-xl border-0 bg-gray-50 shadow-sm"
                    allowClear
                    size="large"
                  />
                </div>
              </div>

              {/* Refresh Button */}
              <Button
                icon={<IoIosSearch />}
                onClick={refetch}
                loading={isLoading}
                className="flex items-center space-x-2 h-12 px-4"
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Modals */}
        <dialog id="my_modal_5" ref={addModalRef} className="modal">
          <div className="modal-box max-w-4xl bg-gradient-to-br from-gray-50 to-white p-0 rounded-2xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Warehouse</h3>
              <CreateWarehouses data={edit} onAdd={() => addModalRef.current?.close()} />
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>

        <dialog id="my_modal_5" ref={updateModalRef} className="modal">
          <div className="modal-box max-w-4xl bg-gradient-to-br from-gray-50 to-white p-0 rounded-2xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Update Warehouse</h3>
              <UpdateWarehouses data={edit} onAdd={() => updateModalRef.current?.close()} />
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>

        {/* Content Section */}
        <div
        >
          {viewMode === "table" ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  {/* Table Header */}
                  <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <tr>
                      <th className="text-left py-4 px-6 text-gray-700 font-semibold">No</th>
                      <th className="text-left py-4 px-6 text-gray-700 font-semibold">Warehouse Name</th>
                      <th className="text-left py-4 px-6 text-gray-700 font-semibold">Create By</th>
                      <th className="text-left py-4 px-6 text-gray-700 font-semibold">Status</th>
                      <th className="text-left py-4 px-6 text-gray-700 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.length === 0 && !isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-16">
                          <Empty
                            className="w-full flex flex-col items-center justify-center"
                            image={
                              <div className="text-gray-400 mb-4">
                                <TbBuildingWarehouse className="w-16 h-16 mx-auto" />
                              </div>
                            }
                            description={
                              <div>
                                <Typography.Text className="text-gray-600 text-lg">
                                  No warehouses found
                                </Typography.Text>
                                <p className="text-gray-500 mt-2">
                                  Try adding a new warehouse or adjusting your search
                                </p>
                              </div>
                            }
                          >
                            <Button
                              type="primary"
                              size="large"
                              onClick={() => addModalRef.current?.showModal()}
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 border-0"
                            >
                              Create New Warehouse
                            </Button>
                          </Empty>
                        </td>
                      </tr>
                    ) : (
                      warehouses.map(({ warehouse_id, warehouse_name, status, created_by }, index) => (
                        <tr key={warehouse_id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-gray-900">{index + 1}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <TbBuildingWarehouse className="text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{warehouse_name}</div>
                                <div className="text-xs text-gray-500">ID: {warehouse_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {created_by === 0 ? (
                              <Tag color="gold" className="font-semibold">
                                Default
                              </Tag>
                            ) : (
                              <span className="text-gray-700">User #{created_by}</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <Tag
                              color={status === 1 ? "success" : "error"}
                              className="font-semibold"
                            >
                              {status === 1 ? "Active" : "Inactive"}
                            </Tag>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Tooltip title="Edit Warehouse">
                                <Button
                                  type="primary"
                                  disabled={warehouse_id == 3 || warehouse_id == 2 || warehouse_id == 4 || warehouse_id == 1}
                                  icon={<RiEdit2Line />}
                                  onClick={() => handleUpdate(warehouse_name, warehouse_id, status)}
                                  className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 border-0 hover:from-blue-600 hover:to-indigo-700"
                                  size="small"
                                >
                                  Edit
                                </Button>
                              </Tooltip>
                              <Tooltip title="Delete Warehouse">
                                <Button
                                  type="default"
                                  disabled={warehouse_id == 3 || warehouse_id == 2 || warehouse_id == 4 || warehouse_id == 1}
                                  danger
                                  icon={<RiDeleteBin6Line />}
                                  onClick={() => handleDelete(warehouse_id)}
                                  className="flex items-center justify-center border-red-300 text-red-600 hover:border-red-400 hover:text-red-700"
                                  size="small"
                                >
                                  Delete
                                </Button>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Loading Skeleton */}
                {isLoading && (
                  <div className="p-6">
                    <div className="space-y-4">
                      {[...Array(4)].map((_, index) => (
                        <Skeleton key={index} active paragraph={{ rows: 1 }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Grid View
            <div className="bg-transparent">
              <Row gutter={[24, 24]}>
                {warehouses.map((warehouse, index) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={warehouse.warehouse_id}>
                    <WarehouseCard warehouse={warehouse} index={index} />
                  </Col>
                ))}
              </Row>

              {warehouses.length === 0 && !isLoading && (
                <div className="text-center py-20">
                  <div className="text-gray-400 text-6xl mb-4">
                    <TbBuildingWarehouse className="mx-auto w-16 h-16" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No warehouses found</h3>
                  <p className="text-gray-500">
                    Try adding a new warehouse or adjusting your search
                  </p>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => addModalRef.current?.showModal()}
                    className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 border-0"
                  >
                    Create New Warehouse
                  </Button>
                </div>
              )}

              {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, index) => (
                    <Card key={index} className="shadow-sm border-0">
                      <div className="animate-pulse">
                        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="flex justify-between">
                          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Warehouses