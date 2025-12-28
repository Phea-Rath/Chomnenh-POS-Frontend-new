import React, { use, useEffect, useState } from 'react'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllWarehousesQuery, useCreateWarehouseMutation } from '../../../app/Features/warehousesSlice';
import { toast } from 'react-toastify';

const CreateWarehouses = ({ onAdd }) => {
  const { setLoading, loading, setAlert, setMessage, setAlertStatus, reload, setReload } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [warehouses, setWarehouses] = useState({ warehouse_name: "", created_by: "", status: "stock" });
  const token = localStorage.getItem('token');
  const { refetch } = useGetAllWarehousesQuery(token);
  const [createWarehouse] = useCreateWarehouseMutation();

  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      const response = await createWarehouse({ itemData: warehouses, token });
      if (response?.data.status === 200) {
        setAlertBox(false);
        refetch();
        toast.success(response.data.message || 'Warehouse created successfully');
        setLoading(false);
        onAdd();
      } else {
        throw new Error(response.error?.data?.message || "Failed to create warehouse");
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while creating the warehouse');
      setLoading(false);
      setAlertBox(false);

    }
  }

  function handleSubmit() {
    setAlertBox(true);
    if (!warehouses.status) {
      setWarehouses(prev => { return { ...prev, status: "stock" } });
    }
  }

  function handleCancel() {
    setAlertBox(false);
  }

  function onWarehouseName(e) {
    setWarehouses(prev => { return { ...prev, warehouse_name: e.target.value, created_by: 0 } });
  }
  function onWarehouseStatus(e) {
    setWarehouses(prev => { return { ...prev, status: e.target.value || "stock" } });
  }

  return (
    <section>
      <AlertBox
        isOpen={alertBox}
        title="Question"
        message="Are you sure you want create warehouse?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">Create wherehouse</legend>
        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">Wherehouse name</label>
            <input type="text" onChange={onWarehouseName} className="input bg-transparent border-gray-400" placeholder="Enter werehouse name here. . ." />
            <label className="label">Status</label>
            <div className='flex gap-2'>
              <input type="radio" onChange={onWarehouseStatus} name="radio-createware" value="stock" className="radio radio-info checked:bg-transparent" defaultChecked />
              <label className="label">Stock</label>
              <input type="radio" onChange={onWarehouseStatus} name="radio-createware" value='none' className="radio radio-info checked:bg-transparent" />
              <label className="label">None</label>
            </div>
          </nav>
        </article>
        <div className='flex items-end gap-2'>
          <button onClick={handleSubmit} className="btn btn-success mt-4 flex-1">Add</button>
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

export default CreateWarehouses