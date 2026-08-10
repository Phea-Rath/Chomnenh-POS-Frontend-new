import React, { useEffect, useState } from 'react'
import { useOutletsContext } from '../../layouts/Management';
import AlertBox from '../../services/AlertBox';
import { useGetAllStockTypesQuery, useUpdateStockTypeMutation } from "@/features/stocks/stockTypesSlice";
import { toast } from 'react-toastify';
import { useViewText } from "@/localizations/viewText";
import { getToken } from '@/utils/tokenStore';
const UpdateStockTypes = ({ onAdd, data }) => {
  const { vt } = useViewText();
  const { setLoading, loading, setAlert, setMessage, setAlertStatus, reload, setReload } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [stock_types, setStockTypes] = useState({ stock_type_name: "", created_by: "" });
  const token = getToken();
  const { refetch } = useGetAllStockTypesQuery(token);
  const [updateStockType] = useUpdateStockTypeMutation();
  async function handleConfirm() {
    try {
      setAlertBox(false);
      setLoading(true);
      await updateStockType({ id: data.id, itemData: stock_types, token }).unwrap();
      toast.success(vt('Stock type updated successfully'));
      onAdd();
    } catch (error) {
      toast.error(error?.data?.message || error?.message || vt('An error occurred while updating the stock type'));
    } finally {
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
    <section className="view-page">
      <AlertBox
        isOpen={alertBox}
        title={vt('Question')}
        message={vt('Are you sure you want update stock_type?')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={vt('Ok')}
        cancelText={vt('Cancel')}
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">{vt('Update StockType')}</legend>
        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">{vt('StockType name')}</label>
            <input type="text" defaultValue={data?.name} onChange={(e) => setStockTypes(prev => { return { ...prev, stock_type_name: e.target.value, created_by: 0 } })} className="input bg-transparent border-gray-400" placeholder={vt('Enter stock_type name here. . .')} />
          </nav>
        </article>
        <div className='flex items-end gap-2'>
          <button onClick={handleSubmit} className="btn btn-success mt-4 flex-1">{vt('Submit')}</button>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button, it will close the modal */}
              <button className="btn btn-error">{vt('Close')}</button>
            </form>
          </div>
        </div>
      </fieldset>
    </section>
  )
}

export default UpdateStockTypes
