import { use, useEffect, useState } from 'react';
import { Button, message, Popconfirm } from 'antd';
import { toast } from 'react-toastify';
import { FaEdit, FaCheck, FaTimes, FaBox, FaCalendarAlt, FaTag, FaPalette, FaRuler } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router';
import { useGetAllWasteQuery } from '../../../app/Features/notificationSlice';
import { Atom } from 'react-loading-indicators';
import { useCreateStockMutation } from '../../../app/Features/stocksSlice';
import api from '../../services/api';

const WasteItemDetail = () => {
    const token = localStorage.getItem('token');
    const { id } = useParams();
    const navigator = useNavigate();
    const { data: wasteData, refetch, isLoading, isError } = useGetAllWasteQuery(token);

    // State for data and editing
    const [data, setData] = useState({});
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [isEditingStock, setIsEditingStock] = useState(false);
    const [tempDate, setTempDate] = useState();
    const [tempStock, setTempStock] = useState();
    const [createStock] = useCreateStockMutation();

    useEffect(() => {
        const findItem = wasteData?.data?.find(item => item.item_id == id);
        setData(findItem);
        setTempDate(findItem?.expire_date);
        setTempStock(findItem?.in_stock);
    }, [wasteData]);

    if (isLoading || wasteData.length === 0) {
        return <div className='h-full flex justify-center items-center'>
            <Atom color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} size="medium" text="Loading data" textColor="#327fcd" />
        </div>
    }

    // Handlers for editing
    const handleDateEdit = () => {
        setIsEditingDate(true);
        setTempDate(data.expire_date);
    };

    const handleStockEdit = () => {
        setIsEditingStock(true);
        setTempStock(data.in_stock);
    };

    const handleDateSave = () => {
        setData({ ...data, expire_date: tempDate });
        setIsEditingDate(false);
    };

    const handleStockSave = () => {
        setData({ ...data, in_stock: tempStock });
        setIsEditingStock(false);
    };

    const handleDateCancel = () => {
        setIsEditingDate(false);
    };

    const handleStockCancel = () => {
        setIsEditingStock(false);
    };

    const handleToWaste = async () => {


    };
    const confirm = async () => {
        try {
            const res = await createStock({
                itemData: {
                    stock_type_id: 4, // Assuming 5 is the ID for Waste
                    warehouse_id: 1,
                    order_id: null,
                    from_warehouse: 4,
                    stock_date: new Date().toISOString().split('T')[0],
                    stock_remark: `Restocked from Waste - Expired on ${data.expire_date}`,
                    items: [{
                        item_id: data.item_id,
                        quantity: data.in_stock,
                        expire_date: data.expire_date
                    }]
                },
                token
            });
            // const res = await api.post("/stock_masters", {
            //     stock_type_id: 4, // Assuming 5 is the ID for Waste
            //     warehouse_id: 1,
            //     order_id: null,
            //     from_warehouse: 4,
            //     stock_date: new Date().toISOString().split('T')[0],
            //     stock_remark: `Restocked from Waste - Expired on ${data.expire_date}`,
            //     items: [{
            //         item_id: data.item_id,
            //         quantity: data.in_stock,
            //         expire_date: data.expire_date
            //     }]
            // }, {
            //     headers: {
            //         Authorization: `Bearer ${token}`
            //     }
            // })
            if (res?.data.status === 200) {
                toast.success(res?.data.message || 'Item returned to waste stock successfully');
                refetch();
                navigator(-1);
            }
        } catch (error) {
            toast.error(error?.data?.message || 'Failed to return item to waste stock');
        }
    };
    const cancel = e => {
        message.error('Click on No');
    };
    return (
        <div className="h-[calc(100vh-128px)] bg-gradient-to-br from-blue-50 to-green-50 py-4 px-4">
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="md:flex">
                    <div className="md:flex-shrink-0 md:w-2/5">
                        <img
                            className="h-64 w-full object-contain md:h-full"
                            src={data?.item_image}
                            alt={data?.item_name}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/300x300?text=Image+Not+Found";
                            }}
                        />
                    </div>
                    <div className="p-6 md:w-3/5">
                        <div className="flex justify-between items-start">
                            <h2 className="text-2xl font-bold text-gray-800">{data?.item_name}</h2>
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                {data?.item_code}
                            </span>
                        </div>

                        <div className="mt-4 flex items-center">
                            <FaTag className="text-gray-500 mr-2" />
                            <span className="text-gray-700 font-semibold">Category:</span>
                            <span className="ml-2 text-gray-600">{data?.category_name}</span>
                        </div>

                        <div className="mt-3 flex items-center">
                            <FaPalette className="text-gray-500 mr-2" />
                            <span className="text-gray-700 font-semibold">Color:</span>
                            <div
                                className="ml-2 w-6 h-6 rounded-full border border-gray-300"
                                style={{ backgroundColor: data?.color_pick }}
                                title={`Color ID: ${data?.color_id}`}
                            ></div>
                        </div>

                        <div className="mt-3 flex items-center">
                            <FaRuler className="text-gray-500 mr-2" />
                            <span className="text-gray-700 font-semibold">Size:</span>
                            <span className="ml-2 text-gray-600">{data?.size_name}</span>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="text-gray-700 font-semibold">Price:</span>
                                <span className="ml-2 text-green-600 font-bold">${data?.item_price}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                    <FaCalendarAlt className="text-gray-500 mr-2" />
                                    <span className="text-gray-700 font-semibold">Expire Date:</span>
                                </div>
                                <div className="flex items-center">
                                    {isEditingDate ? (
                                        <>
                                            <input
                                                type="date"
                                                value={tempDate}
                                                onChange={(e) => setTempDate(e.target.value)}
                                                className="border rounded px-2 py-1 text-sm"
                                            />
                                            <button onClick={handleDateSave} className="ml-2 text-green-500 hover:text-green-700">
                                                <FaCheck />
                                            </button>
                                            <button onClick={handleDateCancel} className="ml-1 text-red-500 hover:text-red-700">
                                                <FaTimes />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-gray-600">{data?.expire_date}</span>
                                            <button onClick={handleDateEdit} className="ml-2 text-blue-500 hover:text-blue-700">
                                                <FaEdit />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <FaBox className="text-gray-500 mr-2" />
                                    <span className="text-gray-700 font-semibold">Quantity in Stock:</span>
                                </div>
                                <div className="flex items-center">
                                    {isEditingStock ? (
                                        <>
                                            <input
                                                type="number"
                                                min="0"
                                                value={tempStock}
                                                onChange={(e) => setTempStock(e.target.value)}
                                                className="border rounded px-2 py-1 text-sm w-20"
                                            />
                                            <button onClick={handleStockSave} className="ml-2 text-green-500 hover:text-green-700">
                                                <FaCheck />
                                            </button>
                                            <button onClick={handleStockCancel} className="ml-1 text-red-500 hover:text-red-700">
                                                <FaTimes />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-gray-600">{data?.in_stock}</span>
                                            {/* <button onClick={handleStockEdit} className="ml-2 text-blue-500 hover:text-blue-700">
                                                <FaEdit />
                                            </button> */}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex space-x-3">
                            <Popconfirm
                                title="Stock Confirmation"
                                description="Are you sure to return item to waste stock?"
                                onConfirm={confirm}
                                onCancel={cancel}
                                okText="Yes"
                                cancelText="No"
                            >
                                <Button type='primary'>Return to StockWaste</Button>
                            </Popconfirm>
                            {/* <button onClick={handleToWaste} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center flex-1">
                                Return to StockWaste
                            </button> */}
                            <Button type='primary' danger onClick={() => navigator(-1)} className="flex-1">
                                Back
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WasteItemDetail;