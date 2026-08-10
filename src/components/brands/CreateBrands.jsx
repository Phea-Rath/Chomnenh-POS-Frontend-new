import React, { useState } from 'react';
import { FaTags, FaPlus, FaTimes } from 'react-icons/fa';
import { Input, Button } from 'antd';
import { toast } from 'react-toastify';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useCreateBrandMutation, useGetAllBrandQuery } from "@/features/products/brandsSlice";
import { useTranslation } from 'react-i18next';
import { getToken } from '@/utils/tokenStore';

const CreateBrands = ({ onAdd }) => {
  const { t } = useTranslation();
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [brandData, setBrandData] = useState({ brand_name: "", created_by: 0 });

  const token = getToken();
  const { refetch } = useGetAllBrandQuery(token);
  const [createBrand] = useCreateBrandMutation();

  const handleConfirm = async () => {
    if (!brandData.brand_name.trim()) {
      toast.warning(t('brandNameEmptyWarning'));
      return;
    }

    try {
      setLoading(true);
      await createBrand({ itemData: brandData, token }).unwrap();
      refetch();
      toast.success(t('brandCreatedSuccess'));
      setAlertBox(false);
      onAdd(); // Close modal
    } catch (error) {
      toast.error(error?.data?.message || t('failedToCreateBrand'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="view-page bg-white dark:bg-gray-800 overflow-hidden transition-colors">
      {/* Alert Confirmation */}
      <AlertBox
        isOpen={alertBox}
        title={t('confirmCreation')}
        message={`${t('doYouWantToAdd')} "${brandData.brand_name}" ${t('toBrandList')}`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
        confirmText={t('confirm')}
        cancelText={t('cancel')}
      />

      {/* Header Section */}
      <div className="p-8 bg-gradient-to-r from-cyan-50 to-indigo-50 dark:from-cyan-900/20 dark:to-indigo-900/20 border-b border-cyan-100 dark:border-cyan-800 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-2xl shadow-sm flex items-center justify-center text-cyan-600 dark:text-cyan-400 transition-colors">
            <FaTags className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{t('newBrand')}</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 font-medium">{t('addManufacturerInventory')}</p>
          </div>
        </div>
      </div>

      {/* Body Section */}
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3 ml-1">
              {t('brandIdentity')}
            </label>
            <Input
              size="large"
              placeholder={t('brandNamePlaceholder')}
              value={brandData.brand_name}
              onChange={(e) => setBrandData({ ...brandData, brand_name: e.target.value })}
              className="h-14 rounded-2xl border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 dark:text-white transition-all font-medium text-lg px-6"
            />
          </div>

          <div className="bg-cyan-50/50 dark:bg-cyan-900/10 p-4 rounded-2xl border border-cyan-100/50 dark:border-cyan-800/50 transition-colors">
            <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium leading-relaxed">
              <strong>{t('tip')}</strong> {t('uniqueBrandWarning')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button
            type="primary"
            icon={<FaPlus />}
            onClick={() => setAlertBox(true)}
            className="h-14 flex-1 rounded-2xl bg-cyan-600 dark:bg-cyan-700 dark:hover:bg-cyan-600 shadow-lg shadow-cyan-200 dark:shadow-none border-none font-bold text-base order-2 sm:order-1 transition-all"
          >
            {t('createBrand')}
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

export default CreateBrands;
