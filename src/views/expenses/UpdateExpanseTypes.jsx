import React, { useEffect, useState } from 'react'
import { useOutletsContext } from '../../layouts/Management';
import AlertBox from '../../services/AlertBox';
import { useGetAllExpanseTypesQuery, useUpdateExpanseTypeMutation } from '../../../app/Features/expenseTypesSlice';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useViewText } from '../viewText';
const UpdateExpanseType = ({ onAdd, data }) => {
  const { vt } = useViewText();
  const { setLoading, loading, setAlert, setMessage, setAlertStatus } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const token = localStorage.getItem('token');
  const [expense_types, setExpanseTypes] = useState({ expense_type_name: "", created_by: "" });
  const { refetch } = useGetAllExpanseTypesQuery(token);
  const [updateExpanseType, { isLoading, error }] = useUpdateExpanseTypeMutation();

  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      // const response = await updateExpanseType({ id: data?.id, itemData: expense_types, token });
      const response = await api.put(`/expense_types/${data?.id}`, expense_types, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.status === 200) {
        refetch();
        onAdd();
        setLoading(false);
        toast.success(response.data.message || vt('Expanse type updated successfully'));
      } else {
        toast.error(response.data.message || vt('Failed to update expense type'));
        setAlertBox(false);
      }
    } catch (error) {
      toast.error(error?.message || error || vt('An error occurred while updating the expense_type'));
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
        message={vt('Are you sure you want update expense_type?')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={vt('Ok')}
        cancelText={vt('Cancel')}
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">{vt('Update ExpanseType')}</legend>
        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">{vt('ExpanseType name')}</label>
            <input type="text" defaultValue={data?.name} onChange={(e) => setExpanseTypes(prev => { return { ...prev, expense_type_name: e.target.value, created_by: 0 } })} className="input bg-transparent border-gray-400" placeholder={vt('Enter expense_type name here. . .')} />
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

export default UpdateExpanseType
