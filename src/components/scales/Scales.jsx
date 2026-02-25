import React, { useEffect, useRef, useState } from 'react';
import { IoIosSearch, IoIosGrid, IoIosList } from 'react-icons/io';
import { FaPlus, FaEdit, FaTrash, FaBalanceScale, FaUser, FaWeight, FaRulerCombined } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useOutletsContext } from '../../layouts/Management';
import { useDeleteScaleMutation, useGetAllScalesQuery } from '../../../app/Features/scalesSlice';
import { toast } from 'react-toastify';
import CreateScales from '../../views/scales/CreateScales';
import UpdateScales from '../../views/scales/UpdateScales';
import AlertBox from '../../services/AlertBox';

const Scales = () => {
  const [scales, setScales] = useState([]);
  const [filteredScales, setFilteredScales] = useState([]);
  const [id, setId] = useState(0);
  const [alertBox, setAlertBox] = useState(false);
  const [edit, setEdit] = useState({ id: 1, name: '' });
  const [viewMode, setViewMode] = useState('grid'); // 'list' or 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const { setLoading, loading } = useOutletsContext();
  const addModalRef = useRef(null);
  const updateModalRef = useRef(null);
  const token = localStorage.getItem('token');
  const { data, isLoading, refetch } = useGetAllScalesQuery(token);
  const [deleteScale] = useDeleteScaleMutation();

  useEffect(() => {
    setScales(data?.data || []);
    setFilteredScales(data?.data || []);
  }, [data]);

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

  // Statistics (optional)
  const calculateStats = () => ({
    totalScales: filteredScales.length,
    weightScales: filteredScales.filter(s =>
      s.scale_name.toLowerCase().includes('kg') ||
      s.scale_name.toLowerCase().includes('g') ||
      s.scale_name.toLowerCase().includes('lb')
    ).length,
    volumeScales: filteredScales.filter(s =>
      s.scale_name.toLowerCase().includes('l') ||
      s.scale_name.toLowerCase().includes('ml')
    ).length,
  });
  // const stats = calculateStats();

  const handleDelete = (scale_id) => {
    setAlertBox(true);
    setId(scale_id);
  };

  const handleCancel = () => setAlertBox(false);

  const handleConfirm = async () => {
    setAlertBox(false);
    setLoading(true);
    try {
      const res = await deleteScale({ id, token });
      if (res.data.status === 200) {
        refetch();
        toast.success(res.data.message || 'Scale deleted successfully!');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to delete scale');
    } finally {
      setLoading(false);
    }
  };

  const onSearch = (e) => setSearchTerm(e.target.value);

  const handleUpdate = (name, id) => {
    updateModalRef.current?.showModal();
    setEdit({ id, name });
  };

  // Helper functions
  const getScaleType = (scaleName) => {
    const name = scaleName.toLowerCase();
    if (name.includes('kg') || name.includes('g') || name.includes('lb')) return 'weight';
    if (name.includes('l') || name.includes('ml')) return 'volume';
    return 'other';
  };

  const getScaleColor = (scaleName) => {
    const type = getScaleType(scaleName);
    return {
      weight: 'orange',
      volume: 'blue',
      other: 'green',
    }[type];
  };

  const getScaleIcon = (scaleName) => {
    const type = getScaleType(scaleName);
    return {
      weight: <FaWeight />,
      volume: <FaRulerCombined />,
      other: <FaBalanceScale />,
    }[type];
  };

  // Custom components
  const Button = ({ children, onClick, variant = 'default', icon, disabled, className = '' }) => {
    const base = 'inline-flex items-center gap-2 px-3 py-1.5 border rounded text-sm font-medium transition-colors';
    const variants = {
      default: 'border-gray-300 bg-white hover:bg-gray-100 text-gray-700',
      primary: 'border-orange-600 bg-orange-600 hover:bg-orange-700 text-white',
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
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
      />
    </div>
  );

  const Badge = ({ children, color = 'gray' }) => {
    const colors = {
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${colors[color]}`}>
        {children}
      </span>
    );
  };

  const EmptyState = ({ onCreate }) => (
    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-300 rounded bg-white">
      <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
        <FaBalanceScale className="text-3xl text-orange-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Scales Found</h3>
      <p className="text-gray-500 text-center max-w-md mb-6">
        {searchTerm
          ? 'No scales match your search criteria. Try adjusting your search.'
          : 'Start by creating your first scale.'}
      </p>
      {!searchTerm && (
        <Button onClick={onCreate} variant="success" icon={<FaPlus />}>
          Create Your First Scale
        </Button>
      )}
    </div>
  );

  const LoadingSkeleton = ({ count = 6, grid = true }) => {
    if (grid) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array(count).fill(0).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded p-4 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="mt-4 flex gap-2">
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

  // Grid card
  const ScaleCard = ({ scale, index }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="border border-gray-200 rounded bg-white hover:shadow-sm transition-shadow"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-orange-100 rounded">
            {getScaleIcon(scale.scale_name)}
          </div>
          <Badge color={getScaleColor(scale.scale_name)}>
            #{index + 1}
          </Badge>
        </div>
        <div className="text-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800">{scale.scale_name}</h3>
          <Badge color={getScaleColor(scale.scale_name)} className="mt-1">
            {getScaleType(scale.scale_name).toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-4">
          <FaUser className="text-gray-400" />
          <span>Created by: {scale.created_by_name}</span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleUpdate(scale.scale_name, scale.scale_id)}
            variant="primary"
            icon={<FaEdit />}
            className="flex-1"
          >
            Edit
          </Button>
          <Button
            onClick={() => handleDelete(scale.scale_id)}
            variant="danger"
            icon={<FaTrash />}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-transparent p-4 md:p-6"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-gray-800 flex items-center gap-3"
          >
            <div className="p-2 bg-orange-100 rounded">
              <FaBalanceScale className="text-orange-600" />
            </div>
            Scale Management
          </motion.h1>
          <p className="text-gray-600 text-sm">Manage your product measurement scales and units</p>
        </div>
        <Button onClick={() => addModalRef.current?.showModal()} variant="success" icon={<FaPlus />}>
          Add Scale
        </Button>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white border border-gray-200 rounded p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm flex items-center gap-2 ${viewMode === 'list' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <IoIosList />
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm flex items-center gap-2 ${viewMode === 'grid' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <IoIosGrid />
                Grid
              </button>
            </div>
            <div className="flex-1 max-w-md">
              <Input
                value={searchTerm}
                onChange={onSearch}
                placeholder="Search scales..."
                icon={<IoIosSearch />}
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {filteredScales.length} scale{filteredScales.length !== 1 && 's'} found
          </div>
        </div>
      </div>

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

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton count={viewMode === 'grid' ? 12 : 5} grid={viewMode === 'grid'} />
      ) : filteredScales.length === 0 ? (
        <EmptyState onCreate={() => addModalRef.current?.showModal()} />
      ) : viewMode === 'list' ? (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Scale</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Created By</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredScales.map((scale, index) => (
                  <tr key={scale.scale_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-orange-100 rounded text-orange-600">
                          {getScaleIcon(scale.scale_name)}
                        </div>
                        <span className="font-medium text-gray-800">{scale.scale_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={getScaleColor(scale.scale_name)}>
                        {getScaleType(scale.scale_name).toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="flex items-center gap-1">
                        <FaUser size={12} className="text-gray-400" />
                        {scale.created_by_name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleUpdate(scale.scale_name, scale.scale_id)}
                          variant="primary"
                          icon={<FaEdit />}
                          className="px-3 py-1 text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(scale.scale_id)}
                          variant="danger"
                          icon={<FaTrash />}
                          className="px-3 py-1 text-xs"
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
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredScales.map((scale, index) => (
            <ScaleCard key={scale.scale_id} scale={scale} index={index} />
          ))}
        </div>
      )}

      {/* Modals */}
      <dialog ref={addModalRef} className="modal">
        <div className="modal-box bg-white max-w-2xl p-0">
          <CreateScales data={edit} onAdd={() => addModalRef.current?.close()} />
        </div>
      </dialog>
      <dialog ref={updateModalRef} className="modal">
        <div className="modal-box bg-white max-w-2xl p-0">
          <UpdateScales data={edit} onAdd={() => updateModalRef.current?.close()} />
        </div>
      </dialog>
    </motion.div>
  );
};

export default Scales;