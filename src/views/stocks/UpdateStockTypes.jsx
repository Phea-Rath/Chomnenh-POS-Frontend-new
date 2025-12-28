import React, { useEffect, useState } from 'react'
import { useOutletsContext } from '../../layouts/Management';
import AlertBox from '../../services/AlertBox';
import { useGetAllStockTypesQuery, useUpdateStockTypeMutation } from '../../../app/Features/stockTypesSlice';
import { toast } from 'react-toastify';
const UpdateStockTypes = ({ onAdd, data }) => {
  const { setLoading, loading, setAlert, setMessage, setAlertStatus, reload, setReload } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [stock_types, setStockTypes] = useState({ stock_type_name: "", created_by: "" });
  const token = localStorage.getItem('token');
  const { refetch } = useGetAllStockTypesQuery(token);
  const [updateStockType] = useUpdateStockTypeMutation();
  async function handleConfirm() {
    try {
      setAlertBox(false);
      setLoading(true);
      const response = await updateStockType({ id: data.id, itemData: stock_types, token });
      if (response.data.status === 200) {
        refetch();
        toast.success(response.data.message || 'Stock type updated successfully');
        setAlertBox(false);
        setLoading(false);
        onAdd();
      } else {
        throw new Error(response.error.data.message || "Failed to update stock type");
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while updating the stock type');
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

  return (
    <section>
      <AlertBox
        isOpen={alertBox}
        title="Question"
        message="Are you sure you want update stock_type?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">Update StockType</legend>
        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">StockType name</label>
            <input type="text" defaultValue={data?.name} onChange={(e) => setStockTypes(prev => { return { ...prev, stock_type_name: e.target.value, created_by: 0 } })} className="input bg-transparent border-gray-400" placeholder="Enter stock_type name here. . ." />
          </nav>
        </article>
        <div className='flex items-end gap-2'>
          <button onClick={handleSubmit} className="btn btn-success mt-4 flex-1">Submit</button>
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

export default UpdateStockTypes