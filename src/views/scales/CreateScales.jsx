import React, { useEffect, useState } from 'react'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useCreateScaleMutation, useGetAllScalesQuery } from '../../../app/Features/scalesSlice';
import { toast } from 'react-toastify';

const CreateScales = ({ onAdd }) => {
  const { setLoading, loading, setAlert, setMessage, setAlertStatus } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [scales, setScales] = useState({ scale_name: "", created_by: "" });
  const token = localStorage.getItem('token');
  const { refetch } = useGetAllScalesQuery(token);
  const [createScale, { isLoading, error }] = useCreateScaleMutation();


  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      const res = await createScale({ itemData: scales, token });
      if (res.data.status === 200) {
        refetch();
        setLoading(false);
        setAlertBox(false);
        toast.success('Scale created successfully');
        onAdd();
      }
    } catch (error) {
      setLoading(false);
      setAlertBox(false);
      toast.error(error?.message || error || 'An error occurred while creating the scale');

    }
  }

  function handleSubmit() {
    setAlertBox(true);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  function onScaleName(e) {
    setScales(prev => { return { ...prev, scale_name: e.target.value, created_by: 0 } });
  }

  return (
    <section>
      <AlertBox
        isOpen={alertBox}
        title="Question"
        message="Are you sure you want create scale?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">Create Scale</legend>

        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">Scale name</label>
            <input onChange={onScaleName} type="text" className="input bg-transparent border-gray-400" placeholder="Enter scale name here. . ." />
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

export default CreateScales
