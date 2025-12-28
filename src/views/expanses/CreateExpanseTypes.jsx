import React, { useEffect, useState } from 'react'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useCreateExpanseTypeMutation, useGetAllExpanseTypesQuery } from '../../../app/Features/expanseTypesSlice';
import { toast } from 'react-toastify';

const CreateExpanseTypes = ({ onAdd }) => {
  const token = localStorage.getItem('token');
  const { setLoading, loading, setAlert, setMessage, setAlertStatus, reload, setReload } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [expanse_types, setExpanseTypes] = useState({ expanse_type_name: "", created_by: "" });
  const { refetch } = useGetAllExpanseTypesQuery(token);
  const [createExpanseType, { isLoading, error }] = useCreateExpanseTypeMutation();

  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      const response = await createExpanseType({ itemData: expanse_types, token });
      if (response.data.status === 200) {
        refetch();
        onAdd();
        setLoading(false);
        toast.success('Expanse type created successfully');
      } else {
        toast.error('Failed to create expanse type');
        setAlertBox(false);
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while creating the expanse_type');
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

  function onExpanseTypeName(e) {
    setExpanseTypes(prev => { return { ...prev, expanse_type_name: e.target.value, created_by: 0 } });
  }

  return (
    <section>
      <AlertBox
        isOpen={alertBox}
        title="Question"
        message="Are you sure you want create expanse_type?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">Create expense type</legend>
        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">Expanse type name</label>
            <input onChange={onExpanseTypeName} type="text" className="input bg-transparent border-gray-400" placeholder="Enter expanse type name here. . ." />
          </nav>
        </article>
        <div className='flex items-end gap-2'>
          <button className="btn btn-success mt-4 flex-1" onClick={handleSubmit}>Add</button>
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

export default CreateExpanseTypes