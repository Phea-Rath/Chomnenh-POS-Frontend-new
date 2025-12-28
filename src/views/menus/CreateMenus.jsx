import React, { useEffect, useState } from 'react'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useCreateMenuMutation, useGetAllMenuQuery } from '../../../app/Features/menusSlice';
import { toast } from 'react-toastify';
import { useGetAllPermissionQuery, useGetPermissionByIdQuery } from '../../../app/Features/permissionSlice';

const CreateMenus
  = ({ onAdd }) => {
    const { setLoading, loading, setAlert, setMessage, setAlertStatus, } = useOutletsContext();
    const [alertBox, setAlertBox] = useState(false);
    const [menus, setMenus] = useState({ menu_name: "", menu_type: "", menu_icon: "", menu_path: '' });
    const token = localStorage.getItem('token');
    const { refetch } = useGetAllMenuQuery(token);
    const userId = localStorage.getItem('userId');
    const { refetch: permRefetch } = useGetPermissionByIdQuery({ id: userId, token });
    // const { refetch: permRefetch } = useGetAllPermissionQuery(token);
    const [createMenu, { data, isLoading, error }] = useCreateMenuMutation();


    async function handleConfirm() {
      try {
        setLoading(true);
        await createMenu({ itemData: menus, token });
        refetch();
        permRefetch();
        if (!error && !isLoading) {
          setLoading(false);
          toast.success('Menu created successfully');
          onAdd();
          setAlertBox(false);
        } else {
          toast.error('Failed to create menu');
        }
      } catch (error) {
        toast.error(error?.message || error || 'An error occurred while creating the menu');
        setLoading(false);
      }
    }

    function handleSubmit() {
      console.log(menus);
      setAlertBox(true);
    }

    function handleCancel() {
      setAlertBox(false);
    }

    function onMenuName(field) {
      switch (field) {
        case 'name':
          setMenus(prev => { return { ...prev, menu_name: event.target.value, created_by: 0 } });
          break;
        case 'type':
          setMenus(prev => { return { ...prev, menu_type: event.target.value } });
          break;
        case 'icon':
          setMenus(prev => { return { ...prev, menu_icon: event.target.value } });
          break;
        case 'path':
          setMenus(prev => { return { ...prev, menu_path: event.target.value } });
          break;
      }

    }

    return (
      <section>
        <AlertBox
          isOpen={alertBox}
          title="Question"
          message="Are you sure you want create menu?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText="Ok"
          cancelText="Cancel"
        />
        <fieldset className="fieldset w-full text-black bg-transparent">
          <legend className="fieldset-legend text-xl text-black">Create Menu</legend>

          <article className='grid grid-cols-1 sm:grid-cols-2 text-xs gap-5 items-center'>
            <nav className='flex flex-col gap-3 flex-1'>
              <label className="label">ឈ្មោះមីនុយ</label>
              <input
                onChange={() => onMenuName('name')}
                type="text"
                className="input text-xs bg-transparent border-gray-400"
                placeholder="Enter here. . ." />
            </nav>
            <nav className='flex flex-col gap-3 flex-1'>
              <label className="label">ទីតាំងមីនុយ</label>
              <select
                onChange={() => onMenuName('type')}
                type="text"
                className="input text-xs bg-transparent border-gray-400"
                placeholder="Enter here. . ." >
                <option value={1}>SideBar</option>
                <option value={2}>Home</option>
                <option value={3}>Setting</option>
                <option value={4}>Report</option>
              </select>
            </nav>
            <nav className='flex flex-col gap-3 flex-1'>
              <label className="label">មីនុយ​ path</label>
              <input
                onChange={() => onMenuName('path')}
                type="text"
                className="input text-xs bg-transparent border-gray-400"
                placeholder="Enter here. . ." />
            </nav>
            <nav className='flex flex-col gap-3 flex-1'>
              <label className="label">មីនុយ​ icon</label>
              <input
                onChange={() => onMenuName('icon')}
                type="text"
                className="input text-xs bg-transparent border-gray-400"
                placeholder="Enter here. . ." />
              <p className="label text-xs">Get icon name from <a href='https://react-icons.github.io/react-icons' target='_blank' className='text-primary underline'>react-icon</a></p>
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

export default CreateMenus
