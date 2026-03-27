import React, { useEffect, useState } from 'react';
import { FaRulerCombined, FaCheck, FaTimes, FaExchangeAlt, FaHistory } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Input, Button, Tag } from 'antd';
import { toast } from 'react-toastify';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllScalesQuery, useUpdateScaleMutation } from '../../../app/Features/scalesSlice';
import { useViewText } from '../viewText';

const UpdateScales = ({ onAdd, data }) => {
  const { vt } = useViewText();
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [scales, setScales] = useState({ scale_name: "", created_by: 0 });

  const token = localStorage.getItem('token');
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
      toast.warning(vt('Scale name cannot be empty'));
      return;
    }

    try {
      setLoading(true);
      setAlertBox(false);
      const res = await updateScale({ id: data.id, itemData: scales, token }).unwrap();

      if (res.status === 200 || res) {
        refetch();
        toast.success(res.message || vt('Unit updated successfully'));
        onAdd(); // Close modal
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.message || vt('Failed to update scale'));
    } finally {
      setLoading(false);
    }
  };

  const isUnchanged = data?.name === scales.scale_name;

  return (
    <section className="view-page bg-white overflow-hidden">
      {/* Alert Confirmation */}
      <AlertBox
        isOpen={alertBox}
        title={vt('Update Measurement Unit')}
        message={`${vt('Confirm changing unit name from')} "${data.name}" ${vt('to')} "${scales.scale_name}"?`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
        confirmText={vt('Confirm Update')}
        cancelText={vt('Cancel')}
      />

      {/* Header Section - Cyan Theme */}
      <div className="p-8 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-cyan-600">
            <FaExchangeAlt className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 leading-none">{vt('Edit Scale')}</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">{vt('Update unit of measurement details')}</p>
          </div>
        </div>
        <Tag color="cyan" className="rounded-full px-4 py-1 font-bold border-none bg-cyan-200/50 text-cyan-700 hidden sm:block">
          UNIT ID: {data.id}
        </Tag>
      </div>

      {/* Body Section */}
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                {vt('Unit Name / Symbol')}
              </label>
              {!isUnchanged && (
                <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded animate-pulse">
                  {vt('EDITING')}
                </span>
              )}
            </div>
            <Input
              size="large"
              placeholder={vt('e.g. Kilograms, Meters, Liters...')}
              value={scales.scale_name}
              onChange={(e) => setScales(prev => ({ ...prev, scale_name: e.target.value }))}
              className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white transition-all font-medium text-lg px-6"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 items-start">
            <FaHistory className="text-slate-400 mt-1" />
            <div>
              <p className="text-xs text-slate-500 font-medium">
                {vt('Previous value was')} <span className="text-slate-900 font-bold">"{data.name}"</span>.
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tight">
                {vt('This will update all associated product measurements.')}
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
                ? 'bg-slate-100 text-slate-300 shadow-none'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-100'}`}
          >
            {vt('Update Scale')}
          </Button>

          <form method="dialog" className="order-1 sm:order-2">
            <Button
              icon={<FaTimes />}
              className="h-14 w-full sm:w-14 rounded-2xl border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 flex items-center justify-center font-bold"
              onClick={onAdd}
            />
          </form>
        </div>
      </div>
    </section>
  );
};

export default UpdateScales;
