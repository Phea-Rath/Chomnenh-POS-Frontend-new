import React, { useEffect, useState } from 'react';
import { IoIosSearch, IoIosGrid, IoIosList } from 'react-icons/io';
import { FaPlus, FaEdit, FaTrash, FaTags, FaUser } from 'react-icons/fa';
import { useOutletsContext } from '../../layouts/Management';
import { useDeleteBrandMutation, useGetAllBrandQuery } from '../../../app/Features/brandsSlice';
import { toast } from 'react-toastify';
import CreateBrands from '../../views/brands/CreateBrands';
import UpdateBrands from '../../views/brands/UpdateBrands';
import AlertBox from '../../services/AlertBox';
import { useTranslation } from 'react-i18next';

const Brands = () => {
  const { t } = useTranslation();
  const [id, setId] = useState(0);
  const [alertBox, setAlertBox] = useState(false);
  const [edit, setEdit] = useState({ id: 1, name: '' });
  const [viewMode, setViewMode] = useState('grid'); // 'list' or 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const { setLoading, loading } = useOutletsContext();
  const token = localStorage.getItem('token');
  const [brands, setBrands] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const { data, isLoading, refetch } = useGetAllBrandQuery(token);
  const [deleteBrand] = useDeleteBrandMutation();

  useEffect(() => {
    setBrands(data?.data || []);
    setFilteredBrands(data?.data || []);
  }, [data]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = brands.filter((item) =>
        item.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBrands(filtered);
    } else {
      setFilteredBrands(brands);
    }
  }, [searchTerm, brands]);

  const handleDelete = (brand_id) => {
    setAlertBox(true);
    setId(brand_id);
  };

  const handleCancel = () => setAlertBox(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await deleteBrand({ id, token });
      refetch();
      toast.success(t('brandUpdatedSuccess'));
      setAlertBox(false);
    } catch (err) {
      toast.error(err?.message || t('failedToDeleteBrand'));
    } finally {
      setLoading(false);
    }
  };

  const onSearch = (e) => setSearchTerm(e.target.value);

  const handleUpdate = (name, id) => {
    setIsUpdateOpen(true);
    setEdit({ name, id });
  };

  // Custom components
  const Button = ({ children, onClick, variant = 'default', icon, disabled, className = '' }) => {
    const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95';
    const variants = {
      default: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200',
      primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-blue-200 dark:shadow-none',
      danger: 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400',
      success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-green-200 dark:shadow-none',
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
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">{icon}</div>}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 dark:text-white transition-all text-sm outline-none shadow-sm placeholder:dark:text-gray-400"
      />
    </div>
  );

  const Badge = ({ children, color = 'blue' }) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      gray: 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[color]} transition-colors`}>
        {children}
      </span>
    );
  };

  const EmptyState = ({ onCreate }) => (
    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
      <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
        <FaTags className="text-4xl text-blue-400 dark:text-blue-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('noBrandsFound')}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-8">
        {searchTerm
          ? t('noBrandsMatchSearch')
          : t('startByCreatingBrand')}
      </p>
      {!searchTerm && (
        <Button onClick={onCreate} variant="success" icon={<FaPlus />}>
          {t('createFirstBrand')}
        </Button>
      )}
    </div>
  );

  const LoadingSkeleton = ({ count = 6, grid = true }) => {
    if (grid) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(count).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 animate-pulse transition-colors">
              <div className="h-12 w-12 bg-gray-100 dark:bg-gray-700 rounded-2xl mb-4"></div>
              <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded-full w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full w-1/2 mb-6"></div>
              <div className="flex gap-2">
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex-1"></div>
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {Array(count).fill(0).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse border dark:border-gray-700"></div>
        ))}
      </div>
    );
  };

  // Grid view card
  const CategoryCard = ({ brand, index }) => (
    <div className="group bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
          <FaTags className="text-blue-600 dark:text-blue-400 text-xl" />
        </div>
        <Badge color="blue">#{index + 1}</Badge>
      </div>
      
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 truncate">{brand.brand_name}</h3>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-6">
        <FaUser className="text-gray-400 dark:text-gray-500" />
        <span className="truncate">{t('by')} {brand.created_by_name}</span>
      </div>

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button
          onClick={() => handleUpdate(brand.brand_name, brand.brand_id)}
          variant="primary"
          icon={<FaEdit />}
          className="flex-1 py-1.5"
        >
          {t('edit')}
        </Button>
        <Button
          onClick={() => handleDelete(brand.brand_id)}
          variant="danger"
          icon={<FaTrash />}
          className="flex-1 py-1.5"
        >
          {t('delete')}
        </Button>
      </div>
      
      {/* Fallback for mobile/non-hover */}
      <div className="flex gap-2 group-hover:hidden mt-2">
         <div className="w-full h-1 bg-gray-50 dark:bg-gray-700 rounded-full overflow-hidden transition-colors">
            <div className="w-1/3 h-full bg-blue-500"></div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 view-page">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
            {t('brandManagement')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('configureOrganizeBrands')}</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} variant="success" icon={<FaPlus />} className="shadow-lg shadow-green-200/50 dark:shadow-none">
          {t('addNewBrand')}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-4 mb-8 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-2xl w-full md:w-auto transition-colors">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              <IoIosGrid size={18} />
              {t('grid')}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              <IoIosList size={18} />
              {t('list')}
            </button>
          </div>
          
          <div className="flex-1 w-full">
            <Input
              value={searchTerm}
              onChange={onSearch}
              placeholder={t('searchByBrandName')}
              icon={<IoIosSearch size={20} />}
            />
          </div>
          
          <div className="px-4 text-sm font-bold text-gray-400 dark:text-gray-500 transition-colors">
            {filteredBrands.length} {t('total')}
          </div>
        </div>
      </div>

      <AlertBox
        isOpen={alertBox}
        title={t('deleteBrand')}
        message={t('confirmDeleteBrand')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={t('delete')}
        cancelText={t('cancel')}
      />

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton count={viewMode === 'grid' ? 8 : 5} grid={viewMode === 'grid'} />
      ) : filteredBrands.length === 0 ? (
        <EmptyState onCreate={() => setIsAddOpen(true)} />
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 transition-colors">
                  <th className="px-6 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('index')}</th>
                  <th className="px-6 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('brandDetails')}</th>
                  <th className="px-6 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('author')}</th>
                  <th className="px-6 py-5 text-right text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filteredBrands.map((brand, index) => (
                  <tr key={brand.brand_id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-400 dark:text-gray-500">#{index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 transition-colors">
                          <FaTags size={14} />
                        </div>
                        <span className="font-bold text-gray-800 dark:text-gray-200 transition-colors">{brand.brand_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium transition-colors">
                        <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-[10px] transition-colors">
                          <FaUser className="text-gray-400 dark:text-gray-500" />
                        </div>
                        {brand.created_by_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleUpdate(brand.brand_name, brand.brand_id)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                          title={t('edit')}
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.brand_id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                          title={t('delete')}
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
          {filteredBrands.map((brand, index) => (
            <CategoryCard key={brand.brand_id} brand={brand} index={index} />
          ))}
        </div>
      )}

      {/* Modals */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 transition-opacity">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
            <CreateBrands onAdd={() => setIsAddOpen(false)} />
          </div>
        </div>
      )}
      {isUpdateOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 transition-opacity">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
            <UpdateBrands dataBrand={edit} onAdd={() => setIsUpdateOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Brands;
