import React, { useEffect, useState } from 'react'
import { useOutletsContext } from '../../layouts/Management';
import AlertBox from '../../services/AlertBox';
import { useGetAllExpanseTypesQuery, useUpdateExpanseTypeMutation } from '../../../app/Features/expanseTypesSlice';
import { toast } from 'react-toastify';
const UpdateExpanseType = ({ onAdd, data }) => {
  const { setLoading, loading, setAlert, setMessage, setAlertStatus } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const token = localStorage.getItem('token');
  const [expanse_types, setExpanseTypes] = useState({ expanse_type_name: "", created_by: "" });
  const { refetch } = useGetAllExpanseTypesQuery(token);
  const [updateExpanseType, { isLoading, error }] = useUpdateExpanseTypeMutation();

  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      const response = await updateExpanseType({ id: data?.id, itemData: expanse_types, token });
      if (response.data.status === 200) {
        refetch();
        onAdd();
        setLoading(false);
        toast.success(response.data.message || 'Expanse type updated successfully');
      } else {
        toast.error(response.data.message || 'Failed to update expanse type');
        setAlertBox(false);
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while updating the expanse_type');
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
        message="Are you sure you want update expanse_type?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">Update ExpanseType</legend>
        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">ExpanseType name</label>
            <input type="text" defaultValue={data?.name} onChange={(e) => setExpanseTypes(prev => { return { ...prev, expanse_type_name: e.target.value, created_by: 0 } })} className="input bg-transparent border-gray-400" placeholder="Enter expanse_type name here. . ." />
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

export default UpdateExpanseType