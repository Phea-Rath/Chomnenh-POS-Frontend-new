import React, { useEffect, useState } from 'react';
import { FaHdd, FaInfoCircle, FaSyncAlt } from 'react-icons/fa';
import { Input, Radio, Divider } from 'antd';
import { toast } from 'react-toastify';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllWarehousesQuery, useUpdateWarehouseMutation } from "@/features/stocks/warehousesSlice";
import { useViewText } from "@/localizations/viewText";
import { getToken } from '@/utils/tokenStore';

const UpdateWarehouses = ({ onAdd, data }) => {
  const { vt } = useViewText();
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [warehouses, setWarehouses] = useState({
    warehouse_name: data?.name || "",
    created_by: 0,
    status: data?.status || "stock"
  });

  const token = getToken();
  const { refetch } = useGetAllWarehousesQuery(token);
  const [updateWarehouse] = useUpdateWarehouseMutation();

  useEffect(() => {
    if (data) {
      setWarehouses({
        warehouse_name: data.name,
        created_by: 0,
        status: data.status
      });
    }
  }, [data]);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const response = await updateWarehouse({ id: data.id, itemData: warehouses, token }).unwrap();

      if (response?.status === 200 || response) {
        refetch();
        toast.success(vt('System record updated'));
        onAdd(); // Close modal
      }
    } catch (error) {
      toast.error(error?.data?.message || vt('Update failed: System error'));
    } finally {
      setLoading(false);
      setAlertBox(false);
    }
  };

  const isChanged = data?.name !== warehouses.warehouse_name || data?.status !== warehouses.status;

  return (
    <section className="view-page bg-[#f5f5f7] rounded-lg overflow-hidden border border-[#d2d2d7] shadow-lg font-sans">
      <AlertBox
        isOpen={alertBox}
        title={vt('Confirm System Change')}
        message={`${vt('Commit modifications to entity ID:')} ${data?.id}?`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
      />

      {/* OS-Style Title Bar */}
      <div className="bg-white px-5 py-3 border-b border-[#d2d2d7] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaSyncAlt className="text-slate-400 text-xs animate-spin-slow" />
          <span className="text-[13px] font-semibold text-slate-700">{vt('Modify Facility Record')}</span>
        </div>
        <div className="flex gap-1.5 opacity-40">
          <div className="w-3 h-3 rounded-full bg-slate-400" />
          <div className="w-3 h-3 rounded-full bg-slate-400" />
          <div className="w-3 h-3 rounded-full bg-slate-400" />
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white border border-[#d2d2d7] rounded-md p-6 space-y-6 shadow-sm">

          {/* Grid Layout: Name */}
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-[12px] text-right font-medium text-slate-500 uppercase tracking-tight">
              {vt('Entity Name')}
            </label>
            <div className="col-span-2">
              <Input
                size="small"
                value={warehouses.warehouse_name}
                onChange={(e) => setWarehouses(prev => ({ ...prev, warehouse_name: e.target.value }))}
                className="rounded border-[#d2d2d7] focus:border-[#007aff] focus:ring-1 focus:ring-[#007aff] text-[13px] py-1"
              />
            </div>
          </div>

          <Divider className="my-0 opacity-50" />

          {/* Grid Layout: Status */}
          <div className="grid grid-cols-3 items-start gap-4">
            <label className="text-[12px] text-right font-medium text-slate-500 uppercase tracking-tight pt-1">
              {vt('Hub Status')}
            </label>
            <div className="col-span-2">
              <Radio.Group
                value={warehouses.status}
                onChange={(e) => setWarehouses(prev => ({ ...prev, status: e.target.value }))}
                className="flex flex-col gap-3"
              >
                <Radio value="stock" className="text-[13px]">
                  <span className="font-semibold text-slate-700">{vt('Stocked')}</span>
                  {/* <p className="text-[11px] text-slate-400 leading-tight">Entity processes stock movements.</p> */}
                </Radio>
                <Radio value="none" className="text-[13px]">
                  <span className="font-semibold text-slate-700">{vt('Disabled')}</span>
                </Radio>
              </Radio.Group>
            </div>
          </div>
        </div>

        {/* System Guidance */}
        <div className="mt-4 flex gap-2 items-start px-1 text-slate-400">
          <FaInfoCircle className="mt-0.5 text-slate-300" />
          <p className="text-[11px] italic">
            {vt('Reference ID:')} {data?.id}. {vt('Modifications will sync across the inventory cluster upon saving.')}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end gap-2 border-t border-[#d2d2d7] pt-4">
          <form method="dialog">
            <button
              onClick={onAdd}
              className="px-4 py-1.5 rounded bg-white border border-[#d2d2d7] text-[12px] text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              {vt('Cancel')}
            </button>
          </form>
          <button
            onClick={() => setAlertBox(true)}
            disabled={!isChanged}
            className={`px-5 py-1.5 rounded text-[12px] font-semibold transition-all shadow-sm
              ${isChanged
                ? 'bg-[#007aff] border border-[#0070e0] text-white hover:bg-[#006ee0]'
                : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            {vt('Commit Update')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default UpdateWarehouses;
