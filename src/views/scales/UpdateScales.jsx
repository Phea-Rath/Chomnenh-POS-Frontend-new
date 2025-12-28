import React, { useEffect, useState } from 'react'
import { useOutletsContext } from '../../layouts/Management';
import AlertBox from '../../services/AlertBox';
import { useGetAllScalesQuery, useUpdateScaleMutation } from '../../../app/Features/scalesSlice';
import { toast } from 'react-toastify';

const UpdateScales = ({ onAdd, data }) => {
  const { setLoading, loading, setAlert, setMessage, setAlertStatus, reload, setReload } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [scales, setScales] = useState({ scale_name: "", created_by: "" });
  const token = localStorage.getItem('token');
  const { refetch } = useGetAllScalesQuery(token);
  const [updateScale, { isLoading, isError, message }] = useUpdateScaleMutation();

  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      const res = await updateScale({ id: data.id, itemData: scales, token });
      if (res.data.status === 200) {
        refetch();
        setLoading(false);
        setAlertBox(false);
        toast.success(res.data.message || 'Scale updated successfully');
        onAdd();
      }
    } catch (error) {
      setLoading(false);
      setAlertBox(false);
      toast.error(error?.message || error || 'An error occurred while updating the scale');
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
        message="Are you sure you want update scale?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">Update Scale</legend>
        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">Scale name</label>
            <input type="text" defaultValue={data.name} onChange={(e) => setScales(prev => { return { ...prev, scale_name: e.target.value, created_by: 0 } })} className="input bg-transparent border-gray-400" placeholder="Enter scale name here. . ." />
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

export default UpdateScales