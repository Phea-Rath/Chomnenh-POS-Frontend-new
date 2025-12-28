import React, { useEffect, useState } from 'react'
import { useOutletsContext } from '../../layouts/Management';
import AlertBox from '../../services/AlertBox';
import { useGetAllWarehousesQuery, useUpdateWarehouseMutation } from '../../../app/Features/warehousesSlice';
import { toast } from 'react-toastify';

const UpdateWarehouses = ({ onAdd, data }) => {
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [warehouses, setWarehouses] = useState({ warehouse_name: data.name, created_by: 0, status: data.status } || []);
  const token = localStorage.getItem('token');
  const { refetch } = useGetAllWarehousesQuery(token);
  const [updateWarehouse] = useUpdateWarehouseMutation();

  useEffect(() => {
    setWarehouses({ warehouse_name: data.name, created_by: 0, status: data.status } || []);
  }, [data]);

  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      const response = await updateWarehouse({ id: data.id, itemData: warehouses, token });
      if (response?.data.status === 200) {
        setAlertBox(false);
        refetch();
        toast.success(response.data.message || 'Warehouse updated successfully');
        onAdd();
      } else {
        throw new Error(response.error?.data?.message || "Failed to update warehouse");
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while updating the warehouse');
      setLoading(false);
      setAlertBox(false);
    }
  }

  function handleSubmit() {
    setAlertBox(true);
  }

  function handleCancel() {
    setAlertBox(false);
  }
  function onWarehouseStatus(e) {
    setWarehouses(prev => { return { ...prev, status: e.target.value } });
  }
  return (
    <section>
      <AlertBox
        isOpen={alertBox}
        title="Question"
        message="Are you sure you want update warehouse?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">Update wherehouse</legend>
        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">Wherehouse name</label>
            <input type="text" value={warehouses?.warehouse_name} onChange={(e) => setWarehouses(prev => { return { ...prev, warehouse_name: e.target.value, created_by: 0 } })} className="input bg-transparent border-gray-400" placeholder="Enter werehouse name here. . ." />
            <label className="label">Status</label>
            <div className='flex gap-2'>
              <input type="radio" checked={warehouses?.status === "stock"} onChange={onWarehouseStatus} name="radio-upware" value="stock" className="radio radio-info checked:bg-transparent" />
              <label className="label">Stock</label>
              <input type="radio" checked={warehouses?.status === "none"} onChange={onWarehouseStatus} name="radio-upware" value='none' className="radio radio-info checked:bg-transparent" />
              <label className="label">None</label>
            </div>
          </nav>
        </article>
        <div className='flex items-end gap-2'>
          <button onClick={handleSubmit} className="btn btn-success mt-4 flex-1">Update</button>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button, it will close the modal */}
              <button className="btn btn-error">Close</button>
            </form>
          </div>
        </div>
      </fieldset>
    </section>
  )
}

export default UpdateWarehouses