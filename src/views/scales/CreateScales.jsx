import React, { useState } from 'react';
import { FaRulerCombined, FaCheck, FaTimes, FaWeightHanging } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Input, Button } from 'antd';
import { toast } from 'react-toastify';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useCreateScaleMutation, useGetAllScalesQuery } from '../../../app/Features/scalesSlice';
import { useViewText } from '../viewText';

const CreateScales = ({ onAdd }) => {
  const { vt } = useViewText();
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [scales, setScales] = useState({ scale_name: "", created_by: 0 });

  const token = localStorage.getItem('token');
  const { refetch } = useGetAllScalesQuery(token);
  const [createScale] = useCreateScaleMutation();

  const handleConfirm = async () => {
    if (!scales.scale_name.trim()) {
      toast.warning(vt('Please enter a scale name'));
      return;
    }

    try {
      setLoading(true);
      setAlertBox(false);
      const res = await createScale({ itemData: scales, token }).unwrap();

      // Checking for 200 status as per your original logic
      if (res.status === 200 || res) {
        refetch();
        toast.success(vt('Unit of measurement created'));
        onAdd(); // Close modal
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.message || vt('Failed to create scale'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="view-page bg-white overflow-hidden">
      {/* Alert Confirmation */}
      <AlertBox
        isOpen={alertBox}
        title={vt('Confirm New Unit')}
        message={`${vt('Add')} "${scales.scale_name}" ${vt('to your measurement units?')}`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
        confirmText={vt('Confirm')}
        cancelText={vt('Cancel')}
      />

      {/* Header Section - Sky Blue Theme */}
      <div className="p-8 bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-sky-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-sky-600">
            <FaRulerCombined className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 leading-none">{vt('New Scale')}</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">{vt('Define units of measurement')}</p>
          </div>
        </div>
      </div>

      {/* Body Section */}
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">
              {vt('Unit Name / Measurement')}
            </label>
            <Input
              size="large"
              placeholder={vt('e.g. Kilograms (kg), Liters (L), Pieces (pcs)...')}
              value={scales.scale_name}
              onChange={(e) => setScales({ ...scales, scale_name: e.target.value, created_by: 0 })}
              className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white transition-all font-medium text-lg px-6"
            />
          </div>

          <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100/50 flex gap-3 items-center">
            <FaWeightHanging className="text-sky-400" />
            <p className="text-xs text-sky-700 font-medium">
              {vt('Scales ensure accuracy in stock levels and pricing calculations.')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button
            type="primary"
            icon={<FaCheck />}
            onClick={() => setAlertBox(true)}
            className="h-14 flex-1 rounded-2xl bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-100 border-none font-bold text-base order-2 sm:order-1"
          >
            {vt('Create Scale')}
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

export default CreateScales;
