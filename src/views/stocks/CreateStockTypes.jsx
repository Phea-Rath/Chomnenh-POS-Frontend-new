import React, { useEffect, useState } from 'react'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useCreateStockTypeMutation, useGetAllStockTypesQuery } from '../../../app/Features/stockTypesSlice';
import { toast } from 'react-toastify';
import { useViewText } from '../viewText';

const CreateStockTypes = ({ onAdd }) => {
  const { vt } = useViewText();
  const { setLoading, loading, setAlert, setMessage, setAlertStatus, reload, setReload } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [stock_types, setStockTypes] = useState({ stock_type_name: "", created_by: "" });
  const token = localStorage.getItem('token');
  const { refetch } = useGetAllStockTypesQuery(token);
  const [createStockType, { isLoading, isError, message }] = useCreateStockTypeMutation();

  async function handleConfirm() {
    try {
      setAlertBox(false);
      setLoading(true);
      const response = await createStockType({ itemData: stock_types, token });
      if (response.data.status === 200) {
        refetch();
        toast.success(response.data.message || vt('Stock type created successfully'));
        setAlertBox(false);
        setLoading(false);
        onAdd();
      } else {
        throw new Error(response.error.data.message || vt('Failed to create stock type'));
      }
    } catch (error) {
      toast.error(error?.message || error || vt('An error occurred while creating the stock type'));
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

  function onStockTypeName(e) {
    setStockTypes(prev => { return { ...prev, stock_type_name: e.target.value, created_by: 0 } });
  }

  return (
    <section className="view-page">
      <AlertBox
        isOpen={alertBox}
        title={vt('Question')}
        message={vt('Are you sure you want create stock_type?')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={vt('Ok')}
        cancelText={vt('Cancel')}
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">{vt('Create stock type')}</legend>
        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">{vt('Stock type name')}</label>
            <input onChange={onStockTypeName} type="text" className="input bg-transparent border-gray-400" placeholder={vt('Enter stock type name here. . .')} />
          </nav>
        </article>
        <div className='flex items-end gap-2'>
          <button className="btn btn-success mt-4 flex-1" onClick={handleSubmit}>{vt('Add')}</button>
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

export default CreateStockTypes
