import React, { useEffect, useState } from 'react';
import { FaEdit, FaCheck, FaTimes, FaHistory } from 'react-icons/fa';
import { Input, Button, Tag } from 'antd';
import { toast } from 'react-toastify';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllBrandQuery, useUpdateBrandMutation } from "@/features/products/brandsSlice";
import { useTranslation } from 'react-i18next';
import { getToken } from '@/utils/tokenStore';

const UpdateBrands = ({ onAdd, dataBrand }) => {
  const { t } = useTranslation();
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [brands, setBrands] = useState({ brand_name: "", created_by: 0 });

  const token = getToken();
  const { refetch } = useGetAllBrandQuery(token);
  const [updateBrand] = useUpdateBrandMutation();

  // Sync state with incoming dataBrand prop
  useEffect(() => {
    if (dataBrand) {
      setBrands({
        brand_name: dataBrand.name || '',
        created_by: 0
      });
    }
  }, [dataBrand]);

  const handleConfirm = async () => {
    if (!brands.brand_name.trim()) {
      toast.warning(t('brandNameEmptyWarning'));
      return;
    }

    try {
      setLoading(true);
      await updateBrand({ id: dataBrand.id, itemData: brands, token }).unwrap();
      refetch();
      toast.success(t('brandUpdatedSuccess'));
      setAlertBox(false);
      onAdd(); // Close modal
    } catch (error) {
      toast.error(error?.data?.message || t('failedToUpdateBrand'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="view-page bg-white dark:bg-gray-800 overflow-hidden transition-colors text-gray-900 dark:text-gray-100">
      {/* Alert Confirmation */}
      <AlertBox
        isOpen={alertBox}
        title={t('saveChangesQuestion')}
        message={`${t('renameBrandConfirm')} "${dataBrand.name}" ${t('to')} "${brands.brand_name}"?`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
        confirmText={t('saveChanges')}
        cancelText={t('discard')}
      />

      {/* Header Section */}
      <div className="p-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-100 dark:border-amber-800 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-2xl shadow-sm flex items-center justify-center text-amber-600 dark:text-amber-400 transition-colors">
            <FaEdit className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{t('editBrand')}</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 font-medium">{t('updateManufacturerDetails')}</p>
          </div>
        </div>
        <div className="hidden sm:block">
          <Tag color="amber" className="rounded-full px-4 py-1 font-bold border-none bg-amber-200/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 transition-colors">
            ID: #{dataBrand.id}
          </Tag>
        </div>
      </div>

      {/* Body Section */}
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                {t('brandName')}
              </label>
              {dataBrand.name !== brands.brand_name && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded italic transition-colors">
                  {t('modified')}
                </span>
              )}
            </div>
            <Input
              size="large"
              placeholder={t('enterBrandName')}
              value={brands.brand_name}
              onChange={(e) => setBrands(prev => ({ ...prev, brand_name: e.target.value }))}
              className="h-14 rounded-2xl border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 dark:text-white transition-all font-medium text-lg px-6"
            />
          </div>

          <div className="flex items-start gap-3 bg-slate-50 dark:bg-gray-900/30 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 transition-colors">
            <FaHistory className="text-slate-400 dark:text-gray-500 mt-1" />
            <div>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-medium leading-relaxed">
                {t('originalName')} <span className="text-slate-800 dark:text-gray-200 font-bold">{dataBrand.name}</span>
              </p>
              <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">
                {t('changeReflectWarning')}
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
            disabled={dataBrand.name === brands.brand_name}
            className={`h-14 flex-1 rounded-2xl font-bold text-base order-2 sm:order-1 border-none shadow-lg transition-all
                ${dataBrand.name === brands.brand_name
                ? 'bg-slate-200 dark:bg-gray-700 text-slate-400 dark:text-gray-500 shadow-none cursor-not-allowed'
                : 'bg-slate-900 dark:bg-cyan-600 hover:bg-cyan-600 dark:hover:bg-cyan-500 text-white shadow-slate-200 dark:shadow-none'}`}
          >
            {t('updateBrand')}
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

export default UpdateBrands;
