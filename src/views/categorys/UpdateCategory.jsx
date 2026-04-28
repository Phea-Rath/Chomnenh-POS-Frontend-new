import React, { useEffect, useState } from 'react';
import { FaEdit, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { Input, Button, Tag } from 'antd';
import { toast } from 'react-toastify';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllCategoriesQuery, useUpdateCategoryMutation } from '../../../app/Features/categoriesSlice';
import { useTranslation } from 'react-i18next';

const UpdateCategory = ({ onAdd, data }) => {
  const { t } = useTranslation();
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [category, setCategory] = useState({ category_name: "", created_by: 0 });

  const token = localStorage.getItem('token');
  const { refetch } = useGetAllCategoriesQuery(token);
  const [updateCategory] = useUpdateCategoryMutation();

  // Initialize state from props
  useEffect(() => {
    if (data) {
      setCategory({
        category_name: data.category_name || '',
        created_by: 0
      });
    }
  }, [data]);

  const handleConfirm = async () => {
    if (!category.category_name.trim()) {
      toast.warning(t('categoryNameEmptyWarning'));
      return;
    }

    try {
      setLoading(true);
      await updateCategory({ id: data.category_id || data.id, itemData: category, token }).unwrap();
      refetch();
      toast.success(t('categoryUpdatedSuccess'));
      setAlertBox(false);
      onAdd(); // Close modal
    } catch (error) {
      toast.error(error?.data?.message || t('failedToUpdateCategory'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="view-page bg-white dark:bg-gray-800 overflow-hidden transition-colors">
      {/* Alert Confirmation */}
      <AlertBox
        isOpen={alertBox}
        title={t('confirmUpdate')}
        message={`${t('renameCategoryConfirm')} "${data.category_name}" ${t('to')} "${category.category_name}"?`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
        confirmText={t('yesUpdate')}
        cancelText={t('discard')}
      />

      {/* Header Section - Violet Theme */}
      <div className="p-8 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border-b border-violet-100 dark:border-violet-800 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-2xl shadow-sm flex items-center justify-center text-violet-600 dark:text-violet-400 transition-colors">
            <FaEdit className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{t('editCategory')}</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 font-medium">{t('modifyCategorySettings')}</p>
          </div>
        </div>
        <Tag color="purple" className="rounded-full px-4 py-1 font-bold border-none bg-violet-200/50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hidden sm:block">
          REF: #{data.category_id || data.id}
        </Tag>
      </div>

      {/* Body Section */}
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                {t('categoryName')}
              </label>
              {data.category_name !== category.category_name && (
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded tracking-tighter uppercase transition-colors">
                  {t('pendingChange')}
                </span>
              )}
            </div>
            <Input
              size="large"
              placeholder={t('enterCategoryName')}
              value={category.category_name}
              onChange={(e) => setCategory(prev => ({ ...prev, category_name: e.target.value }))}
              className="h-14 rounded-2xl border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 dark:text-white transition-all font-medium text-lg px-6"
            />
          </div>

          <div className="bg-slate-50 dark:bg-gray-900/30 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 flex gap-3 items-start transition-colors">
            <FaInfoCircle className="text-slate-400 dark:text-gray-500 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-medium line-clamp-2">
                {t('changeNameWarning')} <span className="text-slate-900 dark:text-white font-bold">"{data.category_name}"</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button
            type="primary"
            icon={<FaCheck />}
            onClick={() => setAlertBox(true)}
            disabled={data.category_name === category.category_name}
            className={`h-14 flex-1 rounded-2xl font-bold text-base order-2 sm:order-1 border-none shadow-lg transition-all
              ${data.category_name === category.category_name
                ? 'bg-slate-200 dark:bg-gray-700 text-slate-400 dark:text-gray-500 shadow-none cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600 text-white shadow-violet-100 dark:shadow-none'}`}
          >
            {t('saveChanges')}
          </Button>

          <Button
            icon={<FaTimes />}
            className="h-14 w-full sm:w-14 rounded-2xl border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-100 dark:hover:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center justify-center font-bold transition-all"
            onClick={onAdd}
          />
        </div>
      </div>
    </section>
  );
};

export default UpdateCategory;
