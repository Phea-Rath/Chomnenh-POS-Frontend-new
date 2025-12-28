import React, { useEffect, useRef, useState } from 'react'
import { IoIosSearch } from 'react-icons/io'
import api from '../../services/api';
import { useOutletsContext } from '../../layouts/Management';
import AlertBox from '../../services/AlertBox';
import { Button, Flex, Modal } from 'antd';
import { Link, useNavigate } from 'react-router';
import { useGetAllMenuQuery } from '../../../app/Features/menusSlice';
import { toast } from 'react-toastify';
import CreateMenus from '../../views/menus/CreateMenus';
import UpdateMenus from '../../views/menus/UpdateMenus';
import { useGetAllPermissionQuery } from '../../../app/Features/permissionSlice';

const Menus = () => {
    const [open, setOpen] = useState(false);
    const [openResponsive, setOpenResponsive] = useState(false);
    const [data, setData] = useState([]);
    const [menu, setUser] = useState([]);
    const navigator = useNavigate();
    const token = localStorage.getItem('token');
    const [id, setId] = useState(0)
    // const [loadings, setLoadings] = useState(false)
    const [alertBox, setAlertBox] = useState(false)
    const [edit, setEdit] = useState({});
    const { setLoading, setAlert, setMessage, setAlertStatus, reload, setReload } = useOutletsContext();
    const { data: response, refetch, isLoading: loadings } = useGetAllMenuQuery(token);
    const addModalRef = useRef(null);
    const updateModalRef = useRef(null);
    const { refetch: permRefetch } = useGetAllPermissionQuery(token);
    useEffect(() => {

        // const response = await api.get("/menus", { headers: { Authorization: `Bearer ${token}` } });
        setData(response?.data);
        setUser(response?.data);
    }, [response]);

    function handleDelete(menu_id) {
        setAlertBox(true);
        setId(menu_id);
    }
    function handleCancel() {
        setAlertBox(false);
    }
    async function handleConfirm() {
        try {
            const response = await api.delete(`/menus/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            if (response.data.status == 200) {
                setReload(!reload);
                setAlertBox(false);
                refetch();
                permRefetch();
                setLoading(false);
                toast.success(response.data.message || 'User deleted successfully');
            }
        } catch (error) {
            setAlertBox(false);
            setLoading(false);
            toast.error(error?.message || error || 'An error occurred while deleting the menu');
        }
    }
    function onSearch() {
        if (event.target.value) {
            const filterUser = data.filter((item) => item.menu_name.toLowerCase().includes(event.target.value.toLowerCase()));
            setUser(filterUser);
        } else {
            setUser(data);
        }
    }

    function handleUpdate(menu_name, menu_id, menu_path, menu_icon, menu_type) {
        updateModalRef.current?.showModal();
        setEdit(prev => { return { ...prev, name: menu_name, id: menu_id, path: menu_path, icon: menu_icon, type: menu_type } })

    }
    return (
        <section className='px-2 md:px-10 flex flex-col gap-5'>
            <AlertBox
                isOpen={alertBox}
                title="Question"
                message="Are you sure you want delete menu?"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirmText="Ok"
                cancelText="Cancel"
            />
            <article className='flex justify-between items-end'>
                <fieldset className="fieldset p-0 relative">
                    <legend className="fieldset-legend text-gray-700 text-xl">Menus</legend>
                    <input onChange={onSearch} type="text" className="input text-gray-700 bg-white border-none border-gray-400 pl-8 focus:outline-none" placeholder="ស្វែងរក. . ." />
                    <IoIosSearch className=' absolute left-2 top-[10px] z-1 text-xl text-gray-400' />
                </fieldset>
                <button className="btn btn-outline btn-success" onClick={() => addModalRef.current?.showModal()}>Add New</button>
                <dialog id="my_modal_5" ref={addModalRef} className="modal modal-bottom sm:modal-middle">
                    <div className="modal-box bg-gray-100">
                        <CreateMenus data={edit} onAdd={() => addModalRef.current?.close()} />
                    </div>
                </dialog>
                <dialog id="my_modal_5" ref={updateModalRef} className="modal modal-bottom sm:modal-middle">
                    <div className="modal-box bg-gray-100">
                        <UpdateMenus dataMenu={edit} onAdd={() => updateModalRef.current?.close()} />
                    </div>
                </dialog>
            </article>
            <div className="overflow-x-auto">
                <table className="table bg-white border-gray-500 text-black min-w-[700px]">
                    {/* head */}
                    <thead className='text-black'>
                        <tr>
                            <th>No</th>
                            <th>Name</th>
                            <td>Type</td>
                            <th>Path</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* row 1 */}
                        {menu?.length == 0 ? <tr>{loadings ? <th colSpan={4} className='text-center text-info'>Loading<span className="loading loading-dots loading-xs"></span></th> :
                            <th colSpan={4} className='text-center text-error'>Not Menu</th>}</tr>
                            : menu?.map((menu, index) => <tr key={index}>
                                <td>{index += 1}</td>
                                <td>{menu.menu_name}</td>
                                <td>
                                    {menu.menu_type == 1 || menu.menu_type == 0 ? <span className="badge badge-warning text-white badge-sm">SideBar/Footer</span> : menu.menu_type == 2 ? <span className="badge badge-error text-white badge-sm">Home</span> : menu.menu_type == 4 ? <span className="badge badge-success text-white badge-sm">Report</span> : <span className="badge badge-info text-white badge-sm">Settings</span>}
                                </td>
                                <td>
                                    <span className="badge badge-primary badge-sm">{menu.menu_path}</span>
                                </td>
                                <th className='flex gap-1'>
                                    <button className="btn btn-ghost btn-xs btn-outline btn-primary text-primary hover:text-white" onClick={() => handleUpdate(menu.menu_name, menu.menu_id, menu.menu_path, menu.menu_icon, menu.menu_type)}>edit</button>
                                    <button className="btn btn-ghost btn-xs btn-outline btn-error text-error hover:text-white" onClick={() => handleDelete(menu.menu_id)}>delete</button>
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

export default Menus