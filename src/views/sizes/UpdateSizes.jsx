import React, { useEffect, useState } from 'react'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllSizesQuery, useUpdateSizeMutation } from '../../../app/Features/sizesSlice';
import { toast } from 'react-toastify';


const UpdateSizes = ({ onAdd, data }) => {
  const { setLoading, loading, setAlert, setMessage, setAlertStatus, reload, setReload } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [sizes, setSizes] = useState({ size_name: "", created_by: "" });
  const token = localStorage.getItem('token');
  const { refetch } = useGetAllSizesQuery(token);
  const [updateSize, { isLoading, isError, message }] = useUpdateSizeMutation();
  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      await updateSize({ id: data.id, itemData: sizes, token });
      if (!isError) {
        refetch();
        toast.success('Size updated successfully');
        setAlertBox(false);
        setLoading(false);
        onAdd(); // Call the onAdd function to refresh the sizes list
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while updating the size');
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
        message="Are you sure you want update size?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">Update Size</legend>
        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">Size name</label>
            <input type="text" defaultValue={data.name} onChange={(e) => setSizes(prev => { return { ...prev, size_name: e.target.value, created_by: 0 } })} className="input bg-transparent border-gray-400" placeholder="Enter size name here. . ." />
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

export default UpdateSizes