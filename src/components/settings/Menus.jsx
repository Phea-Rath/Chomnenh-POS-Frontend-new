import React, { useEffect, useRef, useState } from 'react';
import { IoIosSearch } from 'react-icons/io';
import { HiOutlinePlus, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineViewGrid } from 'react-icons/hi';
import { toast } from 'react-toastify';

// Services & Redux
import api from '../../services/api';
import { useOutletsContext } from '../../layouts/Management';
import { useGetCurrentMenusWebsiteQuery } from "@/features/auth/menusSlice";
import { useGetAllPermissionQuery } from "@/features/auth/permissionSlice";

// Components
import AlertBox from '../../services/AlertBox';
import CreateMenus from '../menus/CreateMenus';
import UpdateMenus from '../menus/UpdateMenus';
import { MENU_TYPE_LABELS } from '../menus/menuFormConfig';
import { getToken } from '@/utils/tokenStore';

const Menus = () => {
    const [data, setData] = useState([]);
    const [filteredMenu, setFilteredMenu] = useState([]);
    const [alertBox, setAlertBox] = useState(false);
    const [selectedId, setSelectedId] = useState(0);
    const [editData, setEditData] = useState({});

    const token = getToken();
    const { setLoading, darkMode } = useOutletsContext();
    const { data: response, refetch, isLoading: loadings } = useGetCurrentMenusWebsiteQuery({ token });
    const { refetch: permRefetch } = useGetAllPermissionQuery(token);

    const addModalRef = useRef(null);
    const updateModalRef = useRef(null);

    const buildFlatMenus = (items = [], parent = null, level = 0) => {
        const sorted = [...items].sort(
            (a, b) => Number(a.order_menu || 0) - Number(b.order_menu || 0)
        );
        return sorted.flatMap((item) => {
            const row = {
                ...item,
                _level: level,
                _parentName: parent?.menu_name || null
            };
            const children = item?.menus?.length
                ? buildFlatMenus(item.menus, item, level + 1)
                : [];
            return [row, ...children];
        });
    };

    useEffect(() => {
        const flatMenus = buildFlatMenus(response?.data || []);
        setData(flatMenus);
        setFilteredMenu(flatMenus);
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
        const filtered = data.filter((item) => {
            const nameMatch = item.menu_name?.toLowerCase().includes(query);
            const parentMatch = item._parentName?.toLowerCase().includes(query);
            return nameMatch || parentMatch;
        });
        setFilteredMenu(filtered);
    };

    const closeCreateModal = () => addModalRef.current?.close();

    const closeUpdateModal = () => {
        updateModalRef.current?.close();
        setEditData({});
    };

    const handleMutationSuccess = () => {
        refetch();
        permRefetch();
    };

    const openUpdate = (menu) => {
        setEditData({ ...menu });
        updateModalRef.current?.showModal();
    };

    return (
        <section className={`bg-transparent min-h-screen p-2 md:p-4 font-sans ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            <div className="max-w-7xl mx-auto">
                <AlertBox
                    isOpen={alertBox}
                    title="Delete Confirmation"
                    message="Are you sure you want to remove this menu item?"
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setAlertBox(false)}
                />

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Menus Management</h1>
                    <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">Manage your application navigation and routes.</p>
                </div>

                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <IoIosSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-500' : 'text-slate-400'} text-xl`} />
                            <input
                                onChange={onSearch}
                                type="text"
                                className={`w-full border rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all ${darkMode ? 'bg-slate-800 border-slate-600 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-200'}`}
                                placeholder="Search by name..."
                            />
                        </div>
                        <button
                            className="flex items-center justify-center gap-2 bg-cyan-600 text-white px-5 py-2 rounded-md hover:bg-cyan-700 h-10 transition-colors shadow-sm text-sm font-medium"
                            onClick={() => addModalRef.current?.showModal()}
                        >
                            <HiOutlinePlus className="text-lg" />
                            <span>Add Menu</span>
                        </button>
                    </div>
                </div>

                <div className={`bg-primary border rounded-xl overflow-hidden shadow-sm ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className={`border-b ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                    <th className={`px-6 py-4 text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Icon</th>
                                    <th className={`px-6 py-4 text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Name</th>
                                    <th className={`px-6 py-4 text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Type</th>
                                    <th className={`px-6 py-4 text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Route Path</th>
                                    <th className={`px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Action</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                {loadings ? (
                                    <tr>
                                        <td colSpan={5} className={`py-10 text-center text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : filteredMenu?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className={`py-10 text-center text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>No menus found.</td>
                                    </tr>
                                ) : filteredMenu.map((item) => (
                                    <tr key={item.menu_id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'}`}>
                                        <td className='px-6 py-4'>
                                            <div className="relative w-10 h-10">
                                                {item.menu_icon ? (
                                                    <>
                                                        <img 
                                                            src={item.menu_icon} 
                                                            alt={item.menu_name} 
                                                            className="w-10 h-10 object-cover rounded-lg"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div className="hidden w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 items-center justify-center text-slate-400">
                                                            <HiOutlineViewGrid size={20} />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                        <HiOutlineViewGrid size={20} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div style={{ paddingLeft: item._level * 20 }}>
                                                <div className="flex items-center gap-2">
                                                    {item._level > 0 && <span className="text-slate-300 dark:text-slate-600">└─</span>}
                                                    <span className={`font-semibold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{item.menu_name}</span>
                                                </div>
                                                {item._parentName && (
                                                    <div className={`text-[10px] mt-0.5 ml-6 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        Parent: {item._parentName}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                                ${Number(item.menu_type) === 1 ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30' :
                                                    Number(item.menu_type) === 2 ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30' :
                                                        Number(item.menu_type) === 4 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-700'}`}>
                                                {MENU_TYPE_LABELS[Number(item.menu_type)] || 'Untyped'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className={`text-xs px-2 py-1 rounded border border-slate-100 dark:border-slate-700 ${darkMode ? 'bg-slate-900 text-cyan-400' : 'bg-slate-50 text-cyan-600'}`}>{item.menu_path}</code>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openUpdate(item)}
                                                    className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-cyan-400' : 'hover:bg-slate-100 text-slate-400 hover:text-cyan-600'}`}
                                                    title="Edit"
                                                >
                                                    <HiOutlinePencilAlt size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.menu_id)}
                                                    className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-rose-400' : 'hover:bg-slate-100 text-slate-400 hover:text-rose-600'}`}
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
                </div>

                {/* Modals */}
                <dialog ref={addModalRef} className="modal backdrop-blur-sm">
                    <div className={`modal-box rounded-2xl shadow-2xl p-0 max-w-xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        <CreateMenus
                            onClose={closeCreateModal}
                            onSuccess={() => {
                                handleMutationSuccess();
                                closeCreateModal();
                            }}
                        />
                    </div>
                </dialog>

                <dialog ref={updateModalRef} className="modal backdrop-blur-sm">
                    <div className={`modal-box rounded-2xl shadow-2xl p-0 max-w-xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        <UpdateMenus
                            dataMenu={editData}
                            onClose={closeUpdateModal}
                            onSuccess={() => {
                                handleMutationSuccess();
                                closeUpdateModal();
                            }}
                        />
                    </div>
                </dialog>
            </div>
        </section>
    );
};

export default Menus;
