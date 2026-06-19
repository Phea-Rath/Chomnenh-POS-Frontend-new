import React, { useEffect, useState } from 'react';
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
import { RiDeleteBin6Line, RiEdit2Line, RiEyeLine } from 'react-icons/ri';
import { IoGridOutline, IoListOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router';
import RefreshButton from '../../utils/RefreshButton';
import { useTranslation } from 'react-i18next';
import Button from '../../utils/Button';
import ActionButton from '../../utils/ActionButton';
import Input from '../../utils/Input';

const MENU_ID = 12;

const Warehouses = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [id, setId] = useState(0);
  const [alertBox, setAlertBox] = useState(false);
  const [edit, setEdit] = useState({ id: 1, name: '', status: 0 });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const { setLoading, loading } = useOutletsContext();
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
        toast.success(response.data.message || t('warehouseDeletedSuccess', 'Warehouse deleted successfully!'));
      } else {
        throw new Error(response.error?.data?.message || t('failedToDeleteWarehouse', 'Failed to delete warehouse'));
      }
    } catch (error) {
      toast.error(error?.message || t('errorOccurredDeletingWarehouse', 'An error occurred while deleting the warehouse'));
    } finally {
      setLoading(false);
    }
  };

  const onSearch = (val) => {
    setSearchTerm(val);
  };

  const handleUpdate = (name, id, status) => {
    setIsUpdateOpen(true);
    setEdit({ id, name, status });
  };

  const handleView = (id) => {
    navigate(`/inventories/product-in-warehouse/${id}`);
  };

  const ActionButtons = ({ item }) => {
    const isProtected = [1, 2, 3, 4, 5].includes(item.warehouse_id);
    const actions = [
      {
        type: 'view',
        icon: <RiEyeLine size={14} />,
        onClick: () => handleView(item.warehouse_id),
        title: t('view'),
        label: t('view')
      },
      {
        type: 'modify',
        icon: <RiEdit2Line size={14} />,
        onClick: () => handleUpdate(item.warehouse_name, item.warehouse_id, item.status),
        title: t('edit'),
        label: t('edit'),
        disabled: isProtected
      },
      {
        type: 'drop',
        icon: <RiDeleteBin6Line size={14} />,
        onClick: () => handleDelete(item.warehouse_id),
        title: t('delete'),
        label: t('delete'),
        disabled: isProtected
      }
    ];

    return (
      <div className="flex justify-end">
        <ActionButton actions={actions} menuId={MENU_ID} />
      </div>
    );
  };

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
    <div className={`bg-primary  rounded p-4 `}>
      <div className="flex items-center justify-between">
        <div>
          <p className=" text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold ">{value}</p>
        </div>
        <div className={`p-3 bg-${color}-100 rounded text-${color}-600`}>{icon}</div>
      </div>
    </div>
  );

  const EmptyState = ({ onCreate }) => (
    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-300 rounded bg-white dark:bg-gray-800">
      <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
        <HiOutlineBuildingOffice2 className="text-3xl text-blue-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('noWarehousesFound', 'No Warehouses Found')}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
        {searchTerm
          ? t('noWarehousesMatchSearch', 'No warehouses match your search criteria. Try adjusting your search.')
          : t('startByCreatingWarehouse', 'Start by creating your first warehouse.')}
      </p>
      {!searchTerm && (
        <Button 
          onClick={onCreate} 
          variant="success" 
          menuId={MENU_ID} 
          actionType="is_modify"
        >
          <HiOutlineBuildingOffice2 />
          {t('createFirstWarehouse', 'Create Your First Warehouse')}
        </Button>
      )}
    </div>
  );

  const LoadingSkeleton = ({ count = 4, grid = false }) => {
    if (grid) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(count).fill(0).map((_, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded p-4 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {Array(count).fill(0).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
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
        className="border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 hover:shadow-sm transition-shadow"
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
              <HiOutlineBuildingOffice2 className="text-blue-600 dark:text-blue-400" />
            </div>
            <Badge color={warehouse.status === 'stock' ? 'success' : 'error'}>
              {warehouse.status === 'stock' ? t('active') : t('inactive')}
            </Badge>
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-lg mb-2 truncate">{warehouse.warehouse_name}</h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <span>{t('createdBy')}: {isDefault ? t('system') : warehouse.created_by_name}</span>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
            <ActionButtons item={warehouse} />
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
      className="min-h-screen container mx-auto bg-transparent p-4 md:p-6"
    >
      <AlertBox
        isOpen={alertBox}
        title={t('confirmDeletion')}
        message={t('confirmDeleteWarehouseDesc', 'Are you sure you want to delete this warehouse? This action cannot be undone.')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={t('delete')}
        cancelText={t('cancel')}
      />

      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
              <TbBuildingWarehouse className="text-blue-600 dark:text-blue-400" />
            </div>
            {t('warehouseManagement')}
          </motion.h1>
          <p className="text-gray-400 text-sm">{t('manageStorageFacilities', 'Manage your storage facilities and distribution centers')}</p>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)} 
          variant="success" 
          menuId={MENU_ID} 
          actionType="is_modify"
        >
          <TbBuildingWarehouse />
          {t('addNewWarehouse')}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title={t('totalWarehouses')} value={stats.totalWarehouses} icon={<TbBuildingWarehouse />} color="blue" />
        <StatCard title={t('active')} value={stats.activeWarehouses} icon={<MdLocationCity />} color="green" />
        <StatCard title={t('inactive')} value={stats.inactiveWarehouses} icon={<HiOutlineBuildingOffice2 />} color="red" />
      </div>

      {/* Controls */}
      <div className="bg-primary rounded p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            <div className="flex border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm flex items-center gap-2 transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
              >
                <IoListOutline />
                {t('table')}
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm flex items-center gap-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
              >
                <IoGridOutline />
                {t('grid')}
              </button>
            </div>
            <div className="flex-1 max-w-md">
              <Input
                value={searchTerm}
                onChange={onSearch}
                placeholder={t('searchWarehousesPlaceholder', 'Search warehouses by name...')}
                icon={<IoIosSearch />}
              />
            </div>
          </div>
          <RefreshButton onRefresh={refetch}/>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton count={viewMode === 'grid' ? 8 : 5} grid={viewMode === 'grid'} />
      ) : filteredWarehouses.length === 0 ? (
        <EmptyState onCreate={() => setIsAddOpen(true)} />
      ) : viewMode === 'table' ? (
        <div className="bg-primary border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">{t('index', '#')}</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">{t('warehouseName')}</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">{t('createdBy')}</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">{t('status')}</th>
                  <th className="px-4 py-3 text-right font-bold uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredWarehouses.map((wh, index) => {
                  const isDefault = wh.created_by_name === 0;
                  return (
                    <tr key={wh.warehouse_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 dark:text-gray-300">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                            <HiOutlineBuildingOffice2 className="text-blue-600 dark:text-blue-400" size={14} />
                          </div>
                          <span className="font-medium dark:text-gray-200">{wh.warehouse_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isDefault ? (
                          <Badge color="warning">{t('default')}</Badge>
                        ) : (
                          <span className="dark:text-gray-300">{wh.created_by_name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={wh.status === 'stock' ? 'success' : 'error'}>
                          {wh.status === 'stock' ? t('active') : t('inactive')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <ActionButtons item={wh} />
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
      {isAddOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
            <CreateWarehouses data={edit} onAdd={() => setIsAddOpen(false)} />
          </div>
          <button
            type="button"
            aria-label="Close add warehouse modal"
            className="absolute inset-0 -z-10 cursor-default"
            onClick={() => setIsAddOpen(false)}
          />
        </div>
      )}

      {isUpdateOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
            <UpdateWarehouses data={edit} onAdd={() => setIsUpdateOpen(false)} />
          </div>
          <button
            type="button"
            aria-label="Close update warehouse modal"
            className="absolute inset-0 -z-10 cursor-default"
            onClick={() => setIsUpdateOpen(false)}
          />
        </div>
      )}
    </motion.div>
  );
};

export default Warehouses;
