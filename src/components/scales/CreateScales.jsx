import React, { useState } from 'react';
import { FaRulerCombined, FaCheck, FaTimes, FaWeightHanging } from 'react-icons/fa';
import { Input, Button } from 'antd';
import { toast } from 'react-toastify';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useCreateScaleMutation, useGetAllScalesQuery } from "@/features/products/scalesSlice";
import { useTranslation } from 'react-i18next';
import { getToken } from '@/utils/tokenStore';

const CreateScales = ({ onAdd }) => {
  const { t } = useTranslation();
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [scales, setScales] = useState({ scale_name: "", created_by: 0 });

  const token = getToken();
  const { refetch } = useGetAllScalesQuery(token);
  const [createScale] = useCreateScaleMutation();

  const handleConfirm = async () => {
    if (!scales.scale_name.trim()) {
      toast.warning(t('enterScaleName'));
      return;
    }

    try {
      setLoading(true);
      setAlertBox(false);
      const res = await createScale({ itemData: scales, token }).unwrap();

      if (res.status === 200 || res) {
        refetch();
        toast.success(t('unitUpdatedSuccess'));
        onAdd(); // Close modal
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.message || t('failedToCreateScale'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="view-page bg-white dark:bg-gray-800 overflow-hidden transition-colors">
      {/* Alert Confirmation */}
      <AlertBox
        isOpen={alertBox}
        title={t('confirmNewUnit')}
        message={`${t('addToMeasurementUnits')} "${scales.scale_name}"?`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
        confirmText={t('confirm')}
        cancelText={t('cancel')}
      />

      {/* Header Section - Sky cyan Theme */}
      <div className="p-8 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20 border-b border-sky-100 dark:border-sky-800 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-2xl shadow-sm flex items-center justify-center text-sky-600 dark:text-sky-400 transition-colors">
            <FaRulerCombined className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{t('newScale')}</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 font-medium">{t('defineUnitsOfMeasurement')}</p>
          </div>
        </div>
      </div>

      {/* Body Section */}
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3 ml-1">
              {t('unitNameMeasurement')}
            </label>
            <Input
              size="large"
              placeholder={t('measurementPlaceholder')}
              value={scales.scale_name}
              onChange={(e) => setScales({ ...scales, scale_name: e.target.value, created_by: 0 })}
              className="h-14 rounded-2xl border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 dark:text-white transition-all font-medium text-lg px-6"
            />
          </div>

          <div className="bg-sky-50/50 dark:bg-sky-900/10 p-4 rounded-2xl border border-sky-100/50 dark:border-sky-800/50 flex gap-3 items-center transition-colors">
            <FaWeightHanging className="text-sky-400 dark:text-sky-500" />
            <p className="text-xs text-sky-700 dark:text-sky-400 font-medium leading-relaxed">
              {t('scalesAccuracyMessage', 'Scales ensure accuracy in stock levels and pricing calculations.')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button
            type="primary"
            icon={<FaCheck />}
            onClick={() => setAlertBox(true)}
            className="h-14 flex-1 rounded-2xl bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600 shadow-lg shadow-sky-100 dark:shadow-none border-none font-bold text-base order-2 sm:order-1 transition-all"
          >
            {t('createScale')}
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

export default CreateScales;
