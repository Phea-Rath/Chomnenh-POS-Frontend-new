import React, { useState } from 'react'
import AlertBox from '../../services/AlertBox'
import { useOutletsContext } from '../../layouts/Management';
import { IoMdCloudUpload } from 'react-icons/io';
import { toast } from 'react-toastify';

const UpdateUsers = () => {
  const [viewImage, setViewImage] = useState();
  const [fileImage, setFileImage] = useState();
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [brands, setBrands] = useState({ brand_name: "", created_by: "" });
  const token = localStorage.getItem('token');
  function handleSubmit() {
    setAlertBox(true);
  }

  function changeUpload(e) {
    const fileUpload = e.target.files[0];
    setFileImage(e.target.files[0]);
    setViewImage(URL.createObjectURL(fileUpload));
  }
  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    setAlertBox(false);
    setLoading(true);
    try {
      const response = await api.put(`/brands/${data.id}`, brands, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      if (response.data.status == 200) {
        onAdd();
        toast.success(response.data.message || 'Brand updated successfully');
        setLoading(false);
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while updating the brand');
      setLoading(false);
    }
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
        <legend className="fieldset-legend text-xl text-black">Create Items</legend>
        <section className='grid grid-cols-3 items-center gap-5'>
          <nav>
            <fieldset className="fieldset">
              <legend className="fieldset-legend text-gray-700 flex justify-between items-center w-full"><h1>Pick a image</h1>{viewImage ? <button className="btn btn-ghost btn-xs btn-outline btn-error text-error hover:text-white" onClick={() => setViewImage(null)}>remove</button> : ""}</legend>
              <label htmlFor="image-item" className='w-full flex justify-center border-2 border-solid border-gray-400 p-1'>
                {viewImage ? <img className='h-50' src={viewImage} alt="" /> : <div className='flex-1 border-2 border-gray-400 h-50 border-dashed flex flex-col justify-center items-center gap-3'>
                  <IoMdCloudUpload className='text-5xl text-info' />
                  <h1>Upload your image here</h1>
                  <div className='btn btn-dash btn-info'>Browser file</div>
                </div>}
              </label>
              <input type="file" accept="image/*" onChange={changeUpload} id='image-item' hidden name='image-item' />
              {/* <label className="label">Max size 2MB</label> */}
            </fieldset>
          </nav>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">Username</label>
            <input type="text" onChange={() => setUsers(prev => { return { ...prev, username: event.target.value } })} className="input bg-transparent border-gray-400" placeholder="Enter code here. . ." />
            <label className="label">Password</label>
            <input type="password" onChange={() => setUsers(prev => { return { ...prev, password: event.target.value } })} className="input bg-transparent border-gray-400" placeholder="Enter password here. . ." />
            <label className="label">Confirm Password</label>
            <input type="password" onChange={() => setUsers(prev => { return { ...prev, confirm_password: event.target.value } })} className="input bg-transparent border-gray-400" placeholder="Enter confirm password here. . ." />
          </nav>
          <nav className='flex flex-col gap-3 flex-1'>
            <label className="label">Phone Number</label>
            <input type="tel" onChange={() => setUsers(prev => { return { ...prev, phone_number: event.target.value } })} className="input bg-transparent border-gray-400" placeholder="Enter tel here. . ." />
            <label className="label">Role</label>
            <select defaultValue="Pick a color" onChange={() => setUsers(prev => { return { ...prev, role: event.target.value } })} className="select bg-transparent border-gray-400">
              <option disabled={true}>Pick a role</option>
              <option>Admin</option>
              <option>User</option>
            </select>
          </nav>

        </section>
        <div className="flex w-full items-end justify-center gap-2 py-2">
          <button className="btn btn-primary mt-4 flex-1">Update</button>
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

export default UpdateUsers