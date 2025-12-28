import React, { useEffect, useState } from 'react'
import api from '../../services/api';
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllBrandQuery, useUpdateBrandMutation } from '../../../app/Features/brandsSlice';
import { toast } from 'react-toastify';


const UpdateBrands = ({ onAdd, dataBrand }) => {
  const { setLoading, loading, setAlert, setMessage, setAlertStatus, reload, setReload } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [brands, setBrands] = useState({ brand_name: "", created_by: "" });
  const token = localStorage.getItem('token');
  const { refetch } = useGetAllBrandQuery(token);
  const [updateBrand, { data, isLoading, error, message }] = useUpdateBrandMutation();
  useEffect(() => {
    setBrands({ brand_name: dataBrand.name || '', });
  }, [dataBrand])

  async function handleConfirm() {
    try {
      setLoading(true);
      await updateBrand({ id: dataBrand.id, itemData: brands, token });
      refetch();
      if (!error && !isLoading) {
        setLoading(false);
        toast.success('Brand updated successfully');
        onAdd();
        setAlertBox(false);
      } else {
        toast.error('Failed to update brand');
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while updating the brand');
      setLoading(false);
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
        message="Are you sure you want update brand?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">Update Brand</legend>
        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">Brand name</label>
            <input type="text" defaultValue={brands.brand_name} onChange={(e) => setBrands(prev => { return { ...prev, brand_name: e.target.value, created_by: 0 } })} className="input bg-transparent border-gray-400" placeholder="Enter brand name here. . ." />
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

export default UpdateBrands