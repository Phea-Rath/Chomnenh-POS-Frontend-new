import React, { useEffect, useRef, useState } from 'react';
import { IoIosSearch } from 'react-icons/io';
import { HiOutlinePlus, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineDotsVertical } from 'react-icons/hi';
import { toast } from 'react-toastify';

// Services & Redux
import api from '../../services/api';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllMenuQuery } from '../../../app/Features/menusSlice';
import { useGetAllPermissionQuery } from '../../../app/Features/permissionSlice';

// Components
import AlertBox from '../../services/AlertBox';
import CreateMenus from '../../views/menus/CreateMenus';
import UpdateMenus from '../../views/menus/UpdateMenus';

const Menus = () => {
    const [data, setData] = useState([]);
    const [filteredMenu, setFilteredMenu] = useState([]);
    const [alertBox, setAlertBox] = useState(false);
    const [selectedId, setSelectedId] = useState(0);
    const [editData, setEditData] = useState({});

    const token = localStorage.getItem('token');
    const { setLoading, reload, setReload } = useOutletsContext();
    const { data: response, refetch, isLoading: loadings } = useGetAllMenuQuery(token);
    const { refetch: permRefetch } = useGetAllPermissionQuery(token);

    const addModalRef = useRef(null);
    const updateModalRef = useRef(null);

    useEffect(() => {
        setData(response?.data || []);
        setFilteredMenu(response?.data || []);
    }, [response]);

    const handleDelete = (id) => {
        setSelectedId(id);
        setAlertBox(true);
    };

    const handleConfirmDelete = async () => {
        try {
            setLoading(true);
            const res = await api.delete(`/menus/${selectedId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 200) {
                toast.success('Menu removed');
                refetch();
                permRefetch();
                setAlertBox(false);
            }
        } catch (error) {
            toast.error('Could not delete item');
        } finally {
            setLoading(false);
        }
    };

    const onSearch = (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = data.filter((item) =>
            item.menu_name.toLowerCase().includes(query)
        );
        setFilteredMenu(filtered);
    };

    const openUpdate = (menu) => {
        setEditData({
            name: menu.menu_name,
            id: menu.menu_id,
            path: menu.menu_path,
            icon: menu.menu_icon,
            type: menu.menu_type
        });
        updateModalRef.current?.showModal();
    };

    return (
        <section className="bg-transparent min-h-screen p-6 font-sans text-slate-700">
            <AlertBox
                isOpen={alertBox}
                title="Delete Confirmation"
                message="Are you sure you want to remove this menu item?"
                onConfirm={handleConfirmDelete}
                onCancel={() => setAlertBox(false)}
            />

            {/* Simple Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Menus</h1>
                    <p className="text-sm text-slate-500">Manage your application navigation and routes.</p>
                </div>
                <button
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
                    onClick={() => addModalRef.current?.showModal()}
                >
                    <HiOutlinePlus className="text-lg" />
                    <span>Add Menu</span>
                </button>
            </div>

            {/* Search Bar (Simple Style) */}
            <div className="relative max-w-md mb-6">
                <IoIosSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                <input
                    onChange={onSearch}
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="Search by name..."
                />
            </div>

            {/* Simple Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Route Path</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loadings ? (
                            <tr>
                                <td colSpan={4} className="py-10 text-center text-slate-400 text-sm">Loading menus...</td>
                            </tr>
                        ) : filteredMenu?.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-10 text-center text-slate-400 text-sm">No menus found.</td>
                            </tr>
                        ) : filteredMenu.map((item) => (
                            <tr key={item.menu_id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-medium text-slate-900">{item.menu_name}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${item.menu_type == 1 ? 'bg-blue-50 text-blue-700' :
                                            item.menu_type == 2 ? 'bg-purple-50 text-purple-700' :
                                                item.menu_type == 4 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                        {item.menu_type == 1 ? 'Sidebar' : item.menu_type == 2 ? 'Home' : item.menu_type == 4 ? 'Report' : 'Setting'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{item.menu_path}</code>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => openUpdate(item)}
                                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                                            title="Edit"
                                        >
                                            <HiOutlinePencilAlt size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.menu_id)}
                                            className="text-slate-400 hover:text-red-600 transition-colors"
                                            title="Delete"
                                        >
                                            <HiOutlineTrash size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            <dialog ref={addModalRef} className="modal backdrop-blur-sm">
                <div className="modal-box bg-white rounded-2xl shadow-2xl p-0 max-w-xl">
                    <CreateMenus onAdd={() => addModalRef.current?.close()} />
                </div>
            </dialog>

            <dialog ref={updateModalRef} className="modal backdrop-blur-sm">
                <div className="modal-box bg-white rounded-2xl shadow-2xl p-0 max-w-xl">
                    <UpdateMenus dataMenu={editData} onAdd={() => updateModalRef.current?.close()} />
                </div>
            </dialog>
        </section>
    );
};

export default Menus;