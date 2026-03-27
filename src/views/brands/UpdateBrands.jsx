import React, { useEffect, useState } from 'react';
import { FaEdit, FaCheck, FaTimes, FaHistory } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Input, Button, Tooltip, Tag } from 'antd';
import { toast } from 'react-toastify';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllBrandQuery, useUpdateBrandMutation } from '../../../app/Features/brandsSlice';
import { useViewText } from '../viewText';

const UpdateBrands = ({ onAdd, dataBrand }) => {
  const { vt } = useViewText();
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [brands, setBrands] = useState({ brand_name: "", created_by: 0 });

  const token = localStorage.getItem('token');
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
      toast.warning(vt('Brand name cannot be empty'));
      return;
    }

    try {
      setLoading(true);
      await updateBrand({ id: dataBrand.id, itemData: brands, token }).unwrap();
      refetch();
      toast.success(vt('Brand updated successfully'));
      setAlertBox(false);
      onAdd(); // Close modal
    } catch (error) {
      toast.error(error?.data?.message || vt('Failed to update brand'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="view-page bg-white overflow-hidden">
      {/* Alert Confirmation */}
      <AlertBox
        isOpen={alertBox}
        title={vt('Save Changes?')}
        message={`${vt('Are you sure you want to rename')} "${dataBrand.name}" ${vt('to')} "${brands.brand_name}"?`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
        confirmText={vt('Save Changes')}
        cancelText={vt('Discard')}
      />

      {/* Header Section */}
      <div className="p-8 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-amber-600">
            <FaEdit className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 leading-none">{vt('Edit Brand')}</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">{vt('Update manufacturer details')}</p>
          </div>
        </div>
        <div className="hidden sm:block">
          <Tag color="amber" className="rounded-full px-4 py-1 font-bold border-none bg-amber-200/50 text-amber-700">
            ID: #{dataBrand.id}
          </Tag>
        </div>
      </div>

      {/* Body Section */}
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                {vt('Brand Name')}
              </label>
              {dataBrand.name !== brands.brand_name && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded italic">
                  {vt('Modified')}
                </span>
              )}
            </div>
            <Input
              size="large"
              placeholder={vt('Enter brand name...')}
              value={brands.brand_name}
              onChange={(e) => setBrands(prev => ({ ...prev, brand_name: e.target.value }))}
              className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white transition-all font-medium text-lg px-6"
            />
          </div>

          <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <FaHistory className="text-slate-400 mt-1" />
            <div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {vt('Original Name:')} <span className="text-slate-800 font-bold">{dataBrand.name}</span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {vt('This change will reflect across all products associated with this brand.')}
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
                ? 'bg-slate-200 text-slate-400 shadow-none'
                : 'bg-slate-900 hover:bg-blue-600 text-white shadow-slate-200'}`}
          >
            {vt('Update Brand')}
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

export default UpdateBrands;
