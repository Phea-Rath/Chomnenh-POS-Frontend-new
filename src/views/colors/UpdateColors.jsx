import React, { useEffect, useState } from 'react'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllColorQuery, useUpdateColorMutation } from '../../../app/Features/colorsSlice';
import { toast } from 'react-toastify';


const UpdateColors = ({ onAdd, data }) => {
  const { setLoading, loading, setAlert, setMessage, setAlertStatus } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [colors, setColors] = useState({ color_name: "", color_pick: '', created_by: "" });
  const token = localStorage.getItem('token');
  const { refetch } = useGetAllColorQuery(token);
  const [updateColor, { isLoading, error }] = useUpdateColorMutation();

  useEffect(() => {
    setColors({ color_name: data.name || "", color_pick: data.color_pick || '', });
  }, [data]);

  function handleSubmit() {
    setAlertBox(true);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      await updateColor({ id: data.id, itemData: colors, token });
      if (error) {
        toast.error(error?.message || error || 'An error occurred while updating the color');
        setLoading(false);
      } else {
        refetch();
        toast.success('Color updated successfully');
        setLoading(false);
        onAdd();
      }
    } catch (error) {
      setAlertBox(false);
      toast.error(error?.message || error || 'An error occurred while updating the color');
      setLoading(false);
    }
  }

  function onColorPick(e) {
    setColors(prev => { return { ...prev, color_pick: e.target.value } });
  }

  return (
    <section>
      <AlertBox
        isOpen={alertBox}
        title="Question"
        message="Are you sure you want update color?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">Update Color</legend>
        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">Color name</label>
            <input type="text" defaultValue={colors.color_name} onChange={(e) => setColors(prev => { return { ...prev, color_name: e.target.value, created_by: 0 } })} className="input bg-transparent border-gray-400" placeholder="Enter color name here. . ." />
          </nav>
        </article>
        <article className='flex gap-5 items-center'>
          {/* <nav className='flex flex-col gap-3 flex-1'>
          <label className="label">Color name</label>
          <input onChange={onColorName} type="text" className="input bg-transparent border-gray-400" placeholder="Enter color name here. . ." />
          </nav> */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-gray-500">Pick a color</legend>
            <input
              type="color"
              value={colors.color_pick}
              onChange={onColorPick}
              className="h-12 w-24 p-1 rounded cursor-pointer border border-gray-300"
            />
            <p className="label">Selected color: <span className="font-mono">{colors.color_pick}</span></p>
          </fieldset>
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

export default UpdateColors