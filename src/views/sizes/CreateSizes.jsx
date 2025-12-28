import React, { useEffect, useState } from 'react'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useCreateSizeMutation, useGetAllSizesQuery } from '../../../app/Features/sizesSlice';
import { toast } from 'react-toastify';

const CreateSizes = ({ onAdd }) => {
  const { setLoading, loading, setAlert, setMessage, setAlertStatus } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [sizes, setSizes] = useState({ size_name: "", created_by: "" });
  const token = localStorage.getItem('token');
  const { refetch } = useGetAllSizesQuery(token);
  const [createSize, { isLoading, isError }] = useCreateSizeMutation();
  const userId = 1;


  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      await createSize({ itemData: sizes, token });
      if (!isError) {
        refetch();
        toast.success('Size created successfully');
        setAlertBox(false);
        setLoading(false);
        onAdd(); // Call the onAdd function to refresh the sizes list
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while creating the size');
      setAlertBox(false);
      setAlert(true);
    }
  }

  function handleSubmit() {
    setAlertBox(true);
  }

  function handleCancel() {
    setAlertBox(false);
  }



  function onSizeName(e) {
    setSizes(prev => { return { ...prev, size_name: e.target.value, created_by: 0 } });
  }

  return (
    <section>
      <AlertBox
        isOpen={alertBox}
        title="Question"
        message="Are you sure you want create size?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">Create Size</legend>

        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">Size name</label>
            <input onChange={onSizeName} type="text" className="input bg-transparent border-gray-400" placeholder="Enter size name here. . ." />
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

export default CreateSizes