import React, { useEffect, useRef, useState } from 'react'
import { IoIosSearch } from 'react-icons/io'
import RegisterForm from './RegisterForm'
import api from '../../services/api';
import { useOutletsContext } from '../../layouts/Management';
import AlertBox from '../../services/AlertBox';
import UpdateUsers from './UpdateUsers';
import { Link, useNavigate } from 'react-router';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { toast } from 'react-toastify';
import { Modal } from 'antd';

const Register = () => {
  const [open, setOpen] = useState(false);
  const [openResponsive, setOpenResponsive] = useState(false);
  const [data, setData] = useState([]);
  const [user, setUser] = useState([]);
  const navigator = useNavigate();
  const token = localStorage.getItem('token');
  const [id, setId] = useState(0)
  // const [loadings, setLoadings] = useState(false)
  const [alertBox, setAlertBox] = useState(false)
  const [edit, setEdit] = useState({});
  const { setLoading, setAlert, setMessage, setAlertStatus, reload, setReload } = useOutletsContext();
  const { data: response, refetch, isLoading: loadings } = useGetAllUserQuery(token);
  const addModalRef = useRef(null);
  const updateModalRef = useRef(null);
  useEffect(() => {

    // const response = await api.get("/users", { headers: { Authorization: `Bearer ${token}` } });
    setData(response?.data);
    setUser(response?.data);
  }, [response]);

  function handleDelete(user_id) {
    setAlertBox(true);
    setId(user_id);
  }
  function handleCancel() {
    setAlertBox(false);
  }
  async function handleConfirm() {
    try {
      const response = await api.delete(`/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      if (response.data.status == 200) {
        setReload(!reload);
        setAlertBox(false);
        refetch();
        setLoading(false);
        toast.success(response.data.message || 'User deleted successfully');
      }
    } catch (error) {
      setAlertBox(false);
      setLoading(false);
      toast.error(error?.message || error || 'An error occurred while deleting the user');
    }
  }
  function onSearch() {
    if (event.target.value) {
      const filterUser = data.filter((item) => item.username.toLowerCase().includes(event.target.value.toLowerCase()));
      setUser(filterUser);
    } else {
      setUser(data);
    }
  }

  function handleUpdate() {
    updateModalRef.current?.showModal();

  }
  return (
    <section className='px-2 md:px-10 flex flex-col gap-5'>
      <AlertBox
        isOpen={alertBox}
        title="Question"
        message="Are you sure you want delete user?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <article className='flex justify-between items-end'>
        <fieldset className="fieldset p-0 relative">
          <legend className="fieldset-legend text-gray-700 text-xl">Accounts</legend>
          <input onChange={onSearch} type="text" className="input text-gray-700 bg-white border-none border-gray-400 pl-8 focus:outline-none" placeholder="ស្វែងរក. . ." />
          <IoIosSearch className=' absolute left-2 top-[10px] z-1 text-xl text-gray-400' />
        </fieldset>
        <button className="btn btn-outline btn-success"
          // onClick={() => setOpenResponsive(true)}
          onClick={() => navigator('/dashboard/register')}
        >Register</button>
        <Modal
          // title="Register"
          centered
          open={openResponsive}
          footer={null}
          // onOk={() => setOpenResponsive(false)}
          onCancel={() => setOpenResponsive(false)}
          width={{
            xs: '90%',
            sm: '80%',
            md: '70%',
            lg: '70%',
            xl: '70%',
            xxl: '70%',
          }}
        >
          <RegisterForm />
        </Modal>


        <dialog id="my_modal_4" ref={addModalRef} className="modal -z-1">
          <div className="modal-box w-11/12 max-w-5xl bg-gray-100">
            <RegisterForm />
          </div>
        </dialog>
        <dialog id="my_modal_4" ref={updateModalRef} className="modal">
          <div className="modal-box w-11/12 max-w-5xl bg-gray-100">
            <UpdateUsers />
          </div>
        </dialog>
      </article>
      <div className="overflow-x-auto">
        <table className="table bg-white border-gray-500 text-black">
          {/* head */}
          <thead className='text-black'>
            <tr>
              {/* <th>
                <label>
                  <input type="checkbox" className="checkbox bg-gray-700 checked:bg-gray-600" />
                </label>
              </th> */}
              {/* <th>No</th> */}
              <th>Name</th>
              <th>Role</th>
              <th>Phone mnumber</th>
              <th>Created_by</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {/* row 1 */}
            {user?.length == 0 ? <tr>{loadings ? <th colSpan={4} className='text-center text-info'>Loading<span className="loading loading-dots loading-xs"></span></th> :
              <th colSpan={4} className='text-center text-error'>Not User</th>}</tr>
              : user?.map(({ id, username, phone_number, role, created_by, image }, index) => <tr key={index}>
                {/* <th>
                <label>
                  <input type="checkbox" className="checkbox bg-gray-700 checked:bg-gray-600" />
                </label>
              </th> */}
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="mask mask-squircle h-12 w-12">
                        <img
                          src={image || "https://img.daisyui.com/images/profile/demo/2@94.webp"}
                          alt="Avatar Tailwind CSS Component" />
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">{username}</div>
                      <div className="text-sm opacity-50">Phnom Penh</div>
                    </div>
                  </div>
                </td>
                <td>
                  {/* {role} */}
                  {/* <br /> */}
                  <span className="badge badge-primary badge-sm">{role}</span>
                </td>
                <td>{phone_number}</td>
                <td>{created_by}</td>
                <th className='flex gap-1'>
                  <Link to={'/dashboard/user_detail/' + id}><button className="btn btn-ghost btn-xs btn-outline btn-accent text-accent hover:text-white">details</button></Link>
                  {/* <button className="btn btn-ghost btn-xs btn-outline btn-primary text-primary hover:text-white" onClick={handleUpdate}>edit</button> */}
                  <button className="btn btn-ghost btn-xs btn-outline btn-error text-error hover:text-white" onClick={() => handleDelete(id)}>delete</button>
                </th>
              </tr>)}

          </tbody>
          {/* foot */}
          {/* <tfoot>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Job</th>
              <th>Favorite Color</th>
              <th></th>
            </tr>
          </tfoot> */}
        </table>
      </div>
    </section>
  )
}

export default Register