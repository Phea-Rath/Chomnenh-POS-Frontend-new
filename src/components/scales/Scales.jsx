import React, { useEffect, useRef, useState } from 'react';
import { IoIosSearch, IoIosGrid, IoIosList } from 'react-icons/io';
import { FaPlus, FaEdit, FaTrash, FaBalanceScale, FaUser, FaWeight, FaRulerCombined } from 'react-icons/fa';
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
    const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95';
    const variants = {
      default: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
      primary: 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm hover:shadow-orange-200',
      danger: 'bg-red-50 hover:bg-red-100 text-red-600',
      success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-green-200',
    };
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        {icon && <span className="text-base">{icon}</span>}
        {children}
      </button>
    );
  };

  const Input = ({ value, onChange, placeholder, icon }) => (
    <div className="relative group">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">{icon}</div>}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm outline-none shadow-sm"
      />
    </div>
  );

  const Badge = ({ children, color = 'gray' }) => {
    const colors = {
      orange: 'bg-orange-50 text-orange-600',
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      gray: 'bg-gray-50 text-gray-600',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[color]}`}>
        {children}
      </span>
    );
  };

  const EmptyState = ({ onCreate }) => (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
      <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
        <FaBalanceScale className="text-4xl text-orange-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">No Scales Found</h3>
      <p className="text-gray-500 text-center max-w-sm mb-8">
        {searchTerm
          ? 'No scales match your search criteria. Try adjusting your search term.'
          : 'Start by creating your first scale to define measurement units.'}
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(count).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 animate-pulse">
              <div className="h-12 w-12 bg-gray-100 rounded-2xl mb-4"></div>
              <div className="h-5 bg-gray-100 rounded-full w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-100 rounded-full w-1/2 mb-6"></div>
              <div className="flex gap-2">
                <div className="h-10 bg-gray-100 rounded-xl flex-1"></div>
                <div className="h-10 bg-gray-100 rounded-xl flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {Array(count).fill(0).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse"></div>
        ))}
      </div>
    );
  };

  // Grid card
  const ScaleCard = ({ scale, index }) => (
    <div className="group bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 bg-${getScaleColor(scale.scale_name)}-50 rounded-2xl group-hover:scale-110 transition-transform duration-300 text-${getScaleColor(scale.scale_name)}-600`}>
          {getScaleIcon(scale.scale_name)}
        </div>
        <Badge color={getScaleColor(scale.scale_name)}>
          #{index + 1}
        </Badge>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">{scale.scale_name}</h3>
        <Badge color={getScaleColor(scale.scale_name)}>
          {getScaleType(scale.scale_name).toUpperCase()}
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6 font-medium">
        <FaUser className="text-gray-400" />
        <span className="truncate">By {scale.created_by_name}</span>
      </div>

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button
          onClick={() => handleUpdate(scale.scale_name, scale.scale_id)}
          variant="primary"
          icon={<FaEdit />}
          className="flex-1 py-1.5"
        >
          Edit
        </Button>
        <Button
          onClick={() => handleDelete(scale.scale_id)}
          variant="danger"
          icon={<FaTrash />}
          className="flex-1 py-1.5"
        >
          Delete
        </Button>
      </div>

      <div className="flex gap-2 group-hover:hidden mt-2">
         <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden">
            <div className={`w-3/4 h-full bg-${getScaleColor(scale.scale_name)}-500`}></div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">
            Scale Management
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Manage measurement units and scales</p>
        </div>
        <Button onClick={() => addModalRef.current?.showModal()} variant="success" icon={<FaPlus />} className="shadow-lg shadow-green-200/50">
          Add New Scale
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-[2rem] border border-gray-100 p-4 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex p-1 bg-gray-100 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <IoIosGrid size={18} />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <IoIosList size={18} />
              List
            </button>
          </div>
          
          <div className="flex-1 w-full">
            <Input
              value={searchTerm}
              onChange={onSearch}
              placeholder="Search by scale name..."
              icon={<IoIosSearch size={20} />}
            />
          </div>
          
          <div className="px-4 text-sm font-bold text-gray-400">
            {filteredScales.length} Total
          </div>
        </div>
      </div>

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
        <LoadingSkeleton count={viewMode === 'grid' ? 8 : 5} grid={viewMode === 'grid'} />
      ) : filteredScales.length === 0 ? (
        <EmptyState onCreate={() => addModalRef.current?.showModal()} />
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">Index</th>
                  <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">Scale Details</th>
                  <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredScales.map((scale, index) => (
                  <tr key={scale.scale_id} className="hover:bg-orange-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-${getScaleColor(scale.scale_name)}-50 rounded-xl text-${getScaleColor(scale.scale_name)}-600`}>
                          {getScaleIcon(scale.scale_name)}
                        </div>
                        <span className="font-bold text-gray-800">{scale.scale_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={getScaleColor(scale.scale_name)}>
                        {getScaleType(scale.scale_name).toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">
                          <FaUser className="text-gray-400" />
                        </div>
                        {scale.created_by_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleUpdate(scale.scale_name, scale.scale_id)}
                          className="p-2 text-orange-600 hover:bg-orange-100 rounded-xl transition-colors"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(scale.scale_id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                          title="Delete"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredScales.map((scale, index) => (
            <ScaleCard key={scale.scale_id} scale={scale} index={index} />
          ))}
        </div>
      )}

      {/* Modals */}
      <dialog ref={addModalRef} className="modal">
        <div className="modal-box bg-white max-w-2xl p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          <CreateScales data={edit} onAdd={() => addModalRef.current?.close()} />
        </div>
      </dialog>
      <dialog ref={updateModalRef} className="modal">
        <div className="modal-box bg-white max-w-2xl p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          <UpdateScales data={edit} onAdd={() => updateModalRef.current?.close()} />
        </div>
      </dialog>
    </div>
  );
};

export default Scales;