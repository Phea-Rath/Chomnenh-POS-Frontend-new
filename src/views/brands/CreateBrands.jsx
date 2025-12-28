import React, { useEffect, useState } from 'react'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useCreateBrandMutation, useGetAllBrandQuery } from '../../../app/Features/brandsSlice';
import { toast } from 'react-toastify';

const CreateBrands = ({ onAdd }) => {
  const { setLoading, loading, setAlert, setMessage, setAlertStatus, } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [brands, setBrands] = useState({ brand_name: "", created_by: "" });
  const token = localStorage.getItem('token');
  const { refetch } = useGetAllBrandQuery(token);
  const [createBrand, { data, isLoading, error }] = useCreateBrandMutation();


  async function handleConfirm() {
    try {
      setLoading(true);
      await createBrand({ itemData: brands, token });
      refetch();
      if (!error && !isLoading) {
        setLoading(false);
        toast.success('Brand created successfully');
        onAdd();
        setAlertBox(false);
      } else {
        toast.error('Failed to create brand');
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while creating the brand');
      setLoading(false);
    }
  }

  function handleSubmit() {
    console.log(brands);
    setAlertBox(true);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  function onBrandName(e) {
    setBrands(prev => { return { ...prev, brand_name: e.target.value, created_by: 0 } });
  }

  return (
    <section>
      <AlertBox
        isOpen={alertBox}
        title="Question"
        message="Are you sure you want create brand?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">Create Brand</legend>

        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">Brand name</label>
            <input onChange={onBrandName} type="text" className="input bg-transparent border-gray-400" placeholder="Enter brand name here. . ." />
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

export default CreateBrands