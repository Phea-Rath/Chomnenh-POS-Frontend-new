import { useEffect, useState } from 'react';
import { Button, message, Popconfirm, Tag, Divider, Input, InputNumber } from 'antd';
import { toast } from 'react-toastify';
import {
    FaEdit, FaCheck, FaTimes, FaBox, FaCalendarAlt,
    FaTag, FaPalette, FaRuler, FaArrowLeft, FaUndo
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router';
import { useGetAllWasteQuery } from '../../../app/Features/notificationSlice';
import { Atom } from 'react-loading-indicators';
import { useCreateStockMutation } from '../../../app/Features/stocksSlice';

const WasteItemDetail = () => {
    const token = localStorage.getItem('token');
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: wasteData, refetch, isLoading } = useGetAllWasteQuery(token);

    const [data, setData] = useState({});
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [isEditingStock, setIsEditingStock] = useState(false);
    const [tempDate, setTempDate] = useState();
    const [tempStock, setTempStock] = useState();
    const [createStock] = useCreateStockMutation();

    useEffect(() => {
        const findItem = wasteData?.data?.find(item => item.item_id == id);
        if (findItem) {
            setData(findItem);
            setTempDate(findItem.expire_date);
            setTempStock(findItem.waste_quantity);
        }
    }, [wasteData, id]);

    if (isLoading || !data) {
        return (
            <div className='h-screen flex flex-col justify-center items-center bg-gray-50'>
                <Atom color="#4F46E5" size="medium" text="Loading details..." textColor="#4F46E5" />
            </div>
        );
    }

    const confirm = async () => {
        try {
            const res = await createStock({
                itemData: {
                    stock_type_id: 4,
                    warehouse_id: 1,
                    order_id: null,
                    from_warehouse: 4,
                    stock_date: new Date().toISOString().split('T')[0],
                    stock_remark: `Restocked from Waste - Expired on ${data.expire_date}`,
                    items: [{
                        item_id: data.item_id,
                        quantity: data.waste_quantity,
                        expire_date: data.expire_date
                    }]
                },
                token
            });
            if (res?.data?.status === 200) {
                toast.success('Successfully returned to waste stock');
                refetch();
                navigate(-1);
            }
        } catch (error) {
            toast.error('Failed to process request');
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8">
            {/* Header Navigation */}
            <div className="max-w-5xl mx-auto mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium"
                >
                    <FaArrowLeft className="mr-2" /> Back to List
                </button>
            </div>

            <div className="max-w-5xl mx-auto bg-transparent rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden">
                <div className="flex flex-col md:flex-row">

                    {/* Left Side: Image Section */}
                    <div className="md:w-5/12 bg-transparent flex items-center justify-center p-8 relative">
                        <div className="absolute top-4 left-4">
                            <Tag color="red" className="px-3 py-1 rounded-full font-bold uppercase tracking-wider">Waste Item</Tag>
                        </div>
                        <img
                            className="max-h-[400px] w-full object-contain mix-blend-multiply drop-shadow-2xl"
                            src={data?.item_image}
                            alt={data?.item_name}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/400?text=No+Image";
                            }}
                        />
                    </div>

                    {/* Right Side: Details Section */}
                    <div className="md:w-7/12 p-8 md:p-12">
                        <header className="mb-8">
                            <div className="flex justify-between items-start mb-2">
                                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                                    {data?.item_name}
                                </h1>
                                <span className="text-xl font-bold text-indigo-600">${data?.item_price}</span>
                            </div>
                            <code className="text-sm bg-slate-100 text-slate-500 px-3 py-1 rounded-md uppercase">
                                SKU: {data?.item_code}
                            </code>
                        </header>

                        {/* Product Specs Grid */}
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="flex items-center p-3 bg-slate-50 rounded-2xl">
                                <div className="p-2 bg-white rounded-xl shadow-sm mr-3"><FaTag className="text-indigo-500" /></div>
                                <div>
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Category</p>
                                    <p className="text-slate-700 font-medium">{data?.category_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-slate-50 rounded-2xl">
                                <div className="p-2 bg-white rounded-xl shadow-sm mr-3"><FaRuler className="text-indigo-500" /></div>
                                <div>
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Size</p>
                                    <p className="text-slate-700 font-medium">{data?.size_name}</p>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        {/* Editable Section */}
                        <div className="space-y-6">
                            {/* Expire Date */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-slate-600 font-semibold">
                                    <FaCalendarAlt className="mr-3 text-slate-400" /> Expiration
                                </div>
                                <div className="flex items-center">
                                    {isEditingDate ? (
                                        <div className="flex gap-2">
                                            <Input
                                                type="date"
                                                size="small"
                                                value={tempDate}
                                                onChange={(e) => setTempDate(e.target.value)}
                                            />
                                            <Button type="primary" size="small" shape="circle" icon={<FaCheck />} onClick={() => { setData({ ...data, expire_date: tempDate }); setIsEditingDate(false); }} />
                                            <Button danger size="small" shape="circle" icon={<FaTimes />} onClick={() => setIsEditingDate(false)} />
                                        </div>
                                    ) : (
                                        <div className="group flex items-center cursor-pointer" onClick={() => setIsEditingDate(true)}>
                                            <span className="text-slate-700 mr-2">{data?.expire_date}</span>
                                            <FaEdit className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stock Quantity */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-slate-600 font-semibold">
                                    <FaBox className="mr-3 text-slate-400" /> Quantity to Return
                                </div>
                                <div className="flex items-center font-bold text-lg text-slate-800">
                                    {data?.waste_quantity} <span className="text-xs text-slate-400 ml-1 font-normal">units</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-10 flex flex-col sm:flex-row gap-4">
                            <Popconfirm
                                title="Process Return"
                                description="Are you sure you want to return this to waste stock?"
                                onConfirm={confirm}
                                okText="Yes, Proceed"
                                cancelText="Cancel"
                                okButtonProps={{ className: 'bg-indigo-600' }}
                            >
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    icon={<FaUndo />}
                                    className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 border-none font-bold"
                                >
                                    In Wasted Stock
                                </Button>
                            </Popconfirm>

                            <Button
                                danger
                                size="large"
                                onClick={() => navigate(-1)}
                                className="h-12 rounded-xl border-2 font-bold"
                            >
                                Discard
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WasteItemDetail;