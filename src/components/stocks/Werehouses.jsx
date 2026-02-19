import React, { useEffect, useRef, useState } from 'react';
import { IoIosSearch } from 'react-icons/io';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import { TbBuildingWarehouse } from 'react-icons/tb';
import { MdLocationCity } from 'react-icons/md';
import { useOutletsContext } from '../../layouts/Management';
import AlertBox from '../../services/AlertBox';
import UpdateWarehouses from '../../views/stocks/UpdateWarehouses';
import CreateWarehouses from '../../views/stocks/CreateWarehouses';
import { motion } from 'framer-motion';
import { useGetAllWarehousesQuery, useDeleteWarehouseMutation } from '../../../app/Features/warehousesSlice';
import { toast } from 'react-toastify';
import { RiDeleteBin6Line, RiEdit2Line } from 'react-icons/ri';
import { IoGridOutline, IoListOutline } from 'react-icons/io5';

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [id, setId] = useState(0);
  const [alertBox, setAlertBox] = useState(false);
  const [edit, setEdit] = useState({ id: 1, name: '', status: 0 });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const { setLoading, loading } = useOutletsContext();
  const addModalRef = useRef(null);
  const updateModalRef = useRef(null);
  const token = localStorage.getItem('token');
  const { data, isLoading, refetch } = useGetAllWarehousesQuery(token);
  const [deleteWarehouse] = useDeleteWarehouseMutation();

  useEffect(() => {
    const warehouseData = data?.data || [];
    setWarehouses(warehouseData);
    setFilteredWarehouses(warehouseData);
  }, [data]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = warehouses.filter((item) =>
        item.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredWarehouses(filtered);
    } else {
      setFilteredWarehouses(warehouses);
    }
  }, [searchTerm, warehouses]);

  // Statistics
  const calculateStats = () => {
    const totalWarehouses = filteredWarehouses.length;
    const activeWarehouses = filteredWarehouses.filter((w) => w.status === 'stock').length;
    const inactiveWarehouses = filteredWarehouses.filter((w) => w.status !== 'stock').length;
    return { totalWarehouses, activeWarehouses, inactiveWarehouses };
  };
  const stats = calculateStats();

  const handleDelete = (warehouse_id) => {
    setAlertBox(true);
    setId(warehouse_id);
  };

  const handleCancel = () => setAlertBox(false);

  const handleConfirm = async () => {
    setAlertBox(false);
    setLoading(true);
    try {
      const response = await deleteWarehouse({ id, token });
      if (response?.data?.status === 200) {
        refetch();
        toast.success(response.data.message || 'Warehouse deleted successfully!');
      } else {
        throw new Error(response.error?.data?.message || 'Failed to delete warehouse');
      }
    } catch (error) {
      toast.error(error?.message || 'An error occurred while deleting the warehouse');
    } finally {
      setLoading(false);
    }
  };

  const onSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleUpdate = (name, id, status) => {
    updateModalRef.current?.showModal();
    setEdit({ id, name, status });
  };

  // Custom components
  const Button = ({ children, onClick, variant = 'default', icon, disabled, className = '' }) => {
    const base = 'inline-flex items-center gap-2 px-3 py-1.5 border rounded text-sm font-medium transition-colors';
    const variants = {
      default: 'border-gray-300 bg-white hover:bg-gray-100 text-gray-700',
      primary: 'border-blue-600 bg-blue-600 hover:bg-blue-700 text-white',
      danger: 'border-red-600 bg-red-600 hover:bg-red-700 text-white',
      success: 'border-green-600 bg-green-600 hover:bg-green-700 text-white',
    };
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        {icon && <span className="text-sm">{icon}</span>}
        {children}
      </button>
    );
  };

  const Input = ({ value, onChange, placeholder, icon }) => (
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
      />
    </div>
  );

  const Badge = ({ children, color = 'gray' }) => {
    const colors = {
      success: 'bg-green-100 text-green-800 border-green-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${colors[color]}`}>
        {children}
      </span>
    );
  };

  const StatCard = ({ title, value, icon, color = 'blue' }) => (
    <div className={`border border-gray-200 rounded p-4 bg-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 bg-${color}-100 rounded text-${color}-600`}>{icon}</div>
      </div>
    </div>
  );

  const EmptyState = ({ onCreate }) => (
    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-300 rounded bg-white">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <HiOutlineBuildingOffice2 className="text-3xl text-blue-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Warehouses Found</h3>
      <p className="text-gray-500 text-center max-w-md mb-6">
        {searchTerm
          ? 'No warehouses match your search criteria. Try adjusting your search.'
          : 'Start by creating your first warehouse.'}
      </p>
      {!searchTerm && (
        <Button onClick={onCreate} variant="success" icon={<HiOutlineBuildingOffice2 />}>
          Create Your First Warehouse
        </Button>
      )}
    </div>
  );

  const LoadingSkeleton = ({ count = 4, grid = false }) => {
    if (grid) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(count).fill(0).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded p-4 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {Array(count).fill(0).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    );
  };

  // Grid card component
  const WarehouseCard = ({ warehouse, index }) => {
    const isDefault = warehouse.created_by_name === 0;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="border border-gray-200 rounded bg-white hover:shadow-sm transition-shadow"
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-blue-100 rounded">
              <HiOutlineBuildingOffice2 className="text-blue-600" />
            </div>
            <Badge color={warehouse.status === 'stock' ? 'success' : 'error'}>
              {warehouse.status === 'stock' ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <h3 className="font-semibold text-gray-800 text-lg mb-2 truncate">{warehouse.warehouse_name}</h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
            <span>Created by: {isDefault ? 'System' : warehouse.created_by_name}</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleUpdate(warehouse.warehouse_name, warehouse.warehouse_id, warehouse.status)}
              variant="primary"
              icon={<RiEdit2Line />}
              className="flex-1"
              disabled={[1, 2, 3, 4, 5].includes(warehouse.warehouse_id)}
            >
              Edit
            </Button>
            <Button
              onClick={() => handleDelete(warehouse.warehouse_id)}
              variant="danger"
              icon={<RiDeleteBin6Line />}
              className="flex-1"
              disabled={[1, 2, 3, 4, 5].includes(warehouse.warehouse_id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-transparent p-4 md:p-6"
    >
      <AlertBox
        isOpen={alertBox}
        title="Confirm Deletion"
        message="Are you sure you want to delete this warehouse? This action cannot be undone."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-gray-800 flex items-center gap-3"
          >
            <div className="p-2 bg-blue-100 rounded">
              <TbBuildingWarehouse className="text-blue-600" />
            </div>
            Warehouse Management
          </motion.h1>
          <p className="text-gray-600 text-sm">Manage your storage facilities and distribution centers</p>
        </div>
        <Button onClick={() => addModalRef.current?.showModal()} variant="success" icon={<TbBuildingWarehouse />}>
          Add New Warehouse
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Warehouses" value={stats.totalWarehouses} icon={<TbBuildingWarehouse />} color="blue" />
        <StatCard title="Active" value={stats.activeWarehouses} icon={<MdLocationCity />} color="green" />
        <StatCard title="Inactive" value={stats.inactiveWarehouses} icon={<HiOutlineBuildingOffice2 />} color="red" />
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm flex items-center gap-2 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <IoListOutline />
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm flex items-center gap-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <IoGridOutline />
                Grid
              </button>
            </div>
            <div className="flex-1 max-w-md">
              <Input
                value={searchTerm}
                onChange={onSearch}
                placeholder="Search warehouses by name..."
                icon={<IoIosSearch />}
              />
            </div>
          </div>
          <Button onClick={refetch} disabled={isLoading} icon={<IoIosSearch />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton count={viewMode === 'grid' ? 8 : 5} grid={viewMode === 'grid'} />
      ) : filteredWarehouses.length === 0 ? (
        <EmptyState onCreate={() => addModalRef.current?.showModal()} />
      ) : viewMode === 'table' ? (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Warehouse Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Created By</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWarehouses.map((wh, index) => {
                  const isDefault = wh.created_by_name === 0;
                  return (
                    <tr key={wh.warehouse_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 rounded">
                            <HiOutlineBuildingOffice2 className="text-blue-600" size={14} />
                          </div>
                          <span className="font-medium text-gray-800">{wh.warehouse_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isDefault ? (
                          <Badge color="warning">Default</Badge>
                        ) : (
                          <span className="text-gray-600">{wh.created_by_name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={wh.status === 'stock' ? 'success' : 'error'}>
                          {wh.status === 'stock' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleUpdate(wh.warehouse_name, wh.warehouse_id, wh.status)}
                            variant="primary"
                            icon={<RiEdit2Line />}
                            className="px-3 py-1 text-xs"
                            disabled={[1, 2, 3, 4, 5].includes(wh.warehouse_id)}
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(wh.warehouse_id)}
                            variant="danger"
                            icon={<RiDeleteBin6Line />}
                            className="px-3 py-1 text-xs"
                            disabled={[1, 2, 3, 4, 5].includes(wh.warehouse_id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWarehouses.map((wh, index) => (
            <WarehouseCard key={wh.warehouse_id} warehouse={wh} index={index} />
          ))}
        </div>
      )}

      {/* Modals */}
      <dialog ref={addModalRef} className="modal">
        <div className="modal-box max-w-4xl bg-white p-0 rounded overflow-hidden">
          <CreateWarehouses data={edit} onAdd={() => addModalRef.current?.close()} />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <dialog ref={updateModalRef} className="modal">
        <div className="modal-box max-w-4xl bg-white p-0 rounded overflow-hidden">
          <UpdateWarehouses data={edit} onAdd={() => updateModalRef.current?.close()} />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </motion.div>
  );
};

export default Warehouses;