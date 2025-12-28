import React, { useEffect, useState } from 'react'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useCreateCategoryMutation, useGetAllCategoriesQuery } from '../../../app/Features/categoriesSlice';
import { toast } from 'react-toastify';


const CreateCategory = ({ onAdd }) => {
  const { setLoading, loading, setAlert, setMessage, setAlertStatus } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [category, setCategory] = useState({ category_name: "", created_by: "" });
  const token = localStorage.getItem('token');
  const { refetch } = useGetAllCategoriesQuery(token);
  const [createCategory, { isLoading, error }] = useCreateCategoryMutation();

  async function handleConfirm() {
    try {
      await createCategory({ itemData: category, token });
      refetch();
      if (!error && !isLoading) {
        toast.success('Category created successfully');
        setAlertBox(false);
        setLoading(false);
        onAdd();
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while creating the category');
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
        message="Are you sure you want create category?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">Create Category</legend>
        <article className='flex gap-5 items-center'>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">Category name</label>
            <input type="text" onChange={(e) => setCategory(prev => { return { ...prev, category_name: e.target.value, created_by: 0 } })} className="input bg-transparent border-gray-400" placeholder="Enter category name here. . ." />
          </nav>
        </article>
        <div className='flex items-end gap-2'>
          <button onClick={handleSubmit} className="btn btn-success mt-4 flex-1">Add</button>
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

export default CreateCategory