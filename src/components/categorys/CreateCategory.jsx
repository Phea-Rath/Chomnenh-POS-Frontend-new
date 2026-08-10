import React, { useState } from 'react';
import { FaCheck, FaTimes, FaLayerGroup } from 'react-icons/fa';
import { Input, Button } from 'antd';
import { toast } from 'react-toastify';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useCreateCategoryMutation, useGetAllCategoriesQuery } from "@/features/products/categoriesSlice";
import { useTranslation } from 'react-i18next';
import { getToken } from '@/utils/tokenStore';

const CreateCategory = ({ onAdd }) => {
  const { t } = useTranslation();
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [category, setCategory] = useState({ category_name: "", created_by: 0 });

  const token = getToken();
  const { refetch } = useGetAllCategoriesQuery(token);
  const [createCategory] = useCreateCategoryMutation();

  const handleConfirm = async () => {
    if (!category.category_name.trim()) {
      toast.warning(t('categoryNameEmptyWarning'));
      return;
    }

    try {
      setLoading(true);
      await createCategory({ itemData: category, token }).unwrap();
      refetch();
      toast.success(t('categoryCreatedSuccess'));
      setAlertBox(false);
      onAdd(); // Close modal
    } catch (error) {
      toast.error(error?.data?.message || t('failedToCreateCategory'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="view-page bg-white dark:bg-gray-800 overflow-hidden transition-colors">
      {/* Alert Confirmation */}
      <AlertBox
        isOpen={alertBox}
        title={t('confirmNewCategory')}
        message={`${t('doYouWantToCreate')} "${category.category_name}" ${t('category?')}`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
        confirmText={t('createNow')}
        cancelText={t('discard')}
      />

      {/* Header Section - Emerald Theme */}
      <div className="p-8 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-emerald-100 dark:border-emerald-800 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-2xl shadow-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition-colors">
            <FaLayerGroup className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{t('newCategory')}</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 font-medium">{t('groupProductsBetterOrg')}</p>
          </div>
        </div>
      </div>

      {/* Body Section */}
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3 ml-1">
              {t('categoryName')}
            </label>
            <Input
              size="large"
              placeholder={t('categoryNamePlaceholder')}
              value={category.category_name}
              onChange={(e) => setCategory({ ...category, category_name: e.target.value, created_by: 0 })}
              className="h-14 rounded-2xl border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 dark:text-white transition-all font-medium text-lg px-6"
            />
          </div>

          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/50 flex gap-3 items-center transition-colors">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              {t('categoryHelpText')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button
            type="primary"
            icon={<FaCheck />}
            onClick={() => setAlertBox(true)}
            className="h-14 flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 shadow-lg shadow-emerald-100 dark:shadow-none border-none font-bold text-base order-2 sm:order-1 transition-all"
          >
            {t('createCategory')}
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

export default CreateCategory;
