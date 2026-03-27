import React, { useState } from 'react';
import { FaWarehouse, FaCheck, FaTimes, FaInfoCircle, FaHdd } from 'react-icons/fa';
import { Input, Button, Radio, Divider } from 'antd';
import { toast } from 'react-toastify';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllWarehousesQuery, useCreateWarehouseMutation } from '../../../app/Features/warehousesSlice';
import { useViewText } from '../viewText';

const CreateWarehouses = ({ onAdd }) => {
  const { vt } = useViewText();
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [warehouses, setWarehouses] = useState({ warehouse_name: "", created_by: 0, status: "stock" });

  const token = localStorage.getItem('token');
  const { refetch } = useGetAllWarehousesQuery(token);
  const [createWarehouse] = useCreateWarehouseMutation();

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const response = await createWarehouse({ itemData: warehouses, token }).unwrap();
      if (response?.status === 200 || response) {
        refetch();
        toast.success(vt('System record created'));
        onAdd();
      }
    } catch (error) {
      toast.error(vt('System error: Failed to initialize'));
    } finally {
      setLoading(false);
      setAlertBox(false);
    }
  };

  return (
    <section className="view-page bg-[#f5f5f7] rounded-lg overflow-hidden border border-[#d2d2d7] shadow-lg font-sans">
      <AlertBox
        isOpen={alertBox}
        title={vt('System Confirmation')}
        message={`${vt('Are you sure you want to register')} "${warehouses.warehouse_name}"?`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
      />

      {/* System Title Bar */}
      <div className="bg-white px-5 py-3 border-b border-[#d2d2d7] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaHdd className="text-slate-500" />
          <span className="text-[13px] font-semibold text-slate-700">{vt('Add New Storage Entity')}</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c940]" />
        </div>
      </div>

      <div className="p-6 bg-[#f5f5f7]">
        <div className="bg-white border border-[#d2d2d7] rounded-md p-6 space-y-6 shadow-sm">

          {/* Form Field 1 */}
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-[13px] text-right font-medium text-slate-600">
              {vt('Entity Name:')}
            </label>
            <div className="col-span-2">
              <Input
                size="small"
                placeholder={vt('Enter identifier...')}
                value={warehouses.warehouse_name}
                onChange={(e) => setWarehouses({ ...warehouses, warehouse_name: e.target.value })}
                className="rounded border-[#d2d2d7] focus:border-[#007aff] focus:ring-1 focus:ring-[#007aff] hover:border-[#b1b1b6] text-[13px]"
              />
            </div>
          </div>

          <Divider className="my-0 opacity-50" />

          {/* Form Field 2 */}
          <div className="grid grid-cols-3 items-start gap-4">
            <label className="text-[13px] text-right font-medium text-slate-600 pt-1">
              {vt('Operational Status:')}
            </label>
            <div className="col-span-2 space-y-3">
              <Radio.Group
                value={warehouses.status}
                onChange={(e) => setWarehouses({ ...warehouses, status: e.target.value })}
                className="flex flex-col gap-2"
              >
                <Radio value="stock" className="text-[13px]">
                  <span className="font-semibold">{vt('Stocked')}</span>
                  <p className="text-[11px] text-slate-400 -mt-1 leading-tight">{vt('Entity will be available for inventory indexing.')}</p>
                </Radio>
                <Radio value="none" className="text-[13px]">
                  <span className="font-semibold">{vt('Disabled')}</span>
                  <p className="text-[11px] text-slate-400 -mt-1 leading-tight">{vt('Entity will be created but remain inactive.')}</p>
                </Radio>
              </Radio.Group>
            </div>
          </div>
        </div>

        {/* System Message */}
        <div className="mt-4 flex gap-2 items-start px-1 text-slate-500">
          <FaInfoCircle className="mt-0.5 text-[#007aff]" />
          <p className="text-[11px] leading-relaxed">
            {vt('Note: Changes to system entities may take a few moments to propagate across all nodes in the management cluster.')}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end gap-2 border-t border-[#d2d2d7] pt-4">
          <form method="dialog">
            <button
              onClick={onAdd}
              className="px-4 py-1 rounded bg-white border border-[#d2d2d7] text-[13px] text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              {vt('Cancel')}
            </button>
          </form>
          <button
            onClick={() => setAlertBox(true)}
            className="px-4 py-1 rounded bg-[#007aff] border border-[#0070e0] text-[13px] text-white font-medium hover:bg-[#006ee0] active:bg-[#0062c9] shadow-sm transition-colors"
          >
            {vt('Create Record')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default CreateWarehouses;
