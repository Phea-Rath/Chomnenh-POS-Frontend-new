import React, { useEffect, useState } from 'react';
import { FaRulerCombined, FaCheck, FaTimes, FaExchangeAlt, FaHistory } from 'react-icons/fa';
import { Input, Button, Tag } from 'antd';
import { toast } from 'react-toastify';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllScalesQuery, useUpdateScaleMutation } from "@/features/products/scalesSlice";
import { useTranslation } from 'react-i18next';
import { getToken } from '@/utils/tokenStore';

const UpdateScales = ({ onAdd, data }) => {
  const { t } = useTranslation();
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [scales, setScales] = useState({ scale_name: "", created_by: 0 });

  const token = getToken();
  const { refetch } = useGetAllScalesQuery(token);
  const [updateScale] = useUpdateScaleMutation();

  // Initialize state from props
  useEffect(() => {
    if (data) {
      setScales({
        scale_name: data.name || '',
        created_by: 0
      });
    }
  }, [data]);

  const handleConfirm = async () => {
    if (!scales.scale_name.trim()) {
      toast.warning(t('unitNameEmptyWarning'));
      return;
    }

    try {
      setLoading(true);
      setAlertBox(false);
      const res = await updateScale({ id: data.id, itemData: scales, token }).unwrap();

      if (res.status === 200 || res) {
        refetch();
        toast.success(res.message || t('unitUpdatedSuccess'));
        onAdd(); // Close modal
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.message || t('failedToUpdateScale'));
    } finally {
      setLoading(false);
    }
  };

  const isUnchanged = data?.name === scales.scale_name;

  return (
    <section className="view-page bg-white dark:bg-gray-800 overflow-hidden transition-colors">
      {/* Alert Confirmation */}
      <AlertBox
        isOpen={alertBox}
        title={t('updateScale')}
        message={`${t('renameCategoryConfirm')} "${data.name}" ${t('to')} "${scales.scale_name}"?`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
        confirmText={t('yesUpdate')}
        cancelText={t('discard')}
      />

      {/* Header Section - Cyan Theme */}
      <div className="p-8 bg-gradient-to-r from-cyan-50 to-cyan-50 dark:from-cyan-900/20 dark:to-cyan-900/20 border-b border-cyan-100 dark:border-cyan-800 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-2xl shadow-sm flex items-center justify-center text-cyan-600 dark:text-cyan-400 transition-colors">
            <FaExchangeAlt className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{t('editScale')}</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 font-medium">{t('updateScaleDetails')}</p>
          </div>
        </div>
        <Tag color="cyan" className="rounded-full px-4 py-1 font-bold border-none bg-cyan-200/50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 hidden sm:block">
          {t('unitId')}: {data.id}
        </Tag>
      </div>

      {/* Body Section */}
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                {t('unitNameSymbol')}
              </label>
              {!isUnchanged && (
                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 px-2 py-0.5 rounded animate-pulse transition-colors">
                  {t('pendingChange')}
                </span>
              )}
            </div>
            <Input
              size="large"
              placeholder={t('enterScaleName')}
              value={scales.scale_name}
              onChange={(e) => setScales(prev => ({ ...prev, scale_name: e.target.value }))}
              className="h-14 rounded-2xl border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 dark:text-white transition-all font-medium text-lg px-6"
            />
          </div>

          <div className="bg-slate-50 dark:bg-gray-900/30 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 flex gap-3 items-start transition-colors">
            <FaHistory className="text-slate-400 dark:text-gray-500 mt-1" />
            <div>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-medium leading-relaxed">
                {t('previousValueWas')} <span className="text-slate-900 dark:text-white font-bold">"{data.name}"</span>.
              </p>
              <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium mt-1 uppercase tracking-tight">
                {t('updateAllProductMeasurements')}
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
            disabled={isUnchanged}
            className={`h-14 flex-1 rounded-2xl font-bold text-base order-2 sm:order-1 border-none shadow-lg transition-all
              ${isUnchanged
                ? 'bg-slate-100 dark:bg-gray-700 text-slate-300 dark:text-gray-500 shadow-none cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-600 text-white shadow-cyan-100 dark:shadow-none'}`}
          >
            {t('updateScale')}
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

export default UpdateScales;
