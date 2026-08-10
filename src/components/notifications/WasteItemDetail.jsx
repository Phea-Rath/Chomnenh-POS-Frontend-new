import { useEffect, useState } from 'react';
import { Button, message, Popconfirm, Tag, Divider, Input, InputNumber } from 'antd';
import { toast } from 'react-toastify';
import {
    FaEdit, FaCheck, FaTimes, FaBox, FaCalendarAlt,
    FaTag, FaPalette, FaRuler, FaArrowLeft, FaUndo
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router';
import { useGetAllWasteQuery } from "@/features/system/notificationSlice";
import { Atom } from 'react-loading-indicators';
import { useCreateStockMutation } from "@/features/stocks/stocksSlice";
import { useTranslation } from 'react-i18next';
import { getToken } from '@/utils/tokenStore';

const WasteItemDetail = () => {
    const { t } = useTranslation();
    const token = getToken();
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
            <div className='h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 transition-colors'>
                <Atom color="#4F46E5" size="medium" text={t('loadingDetails')} textColor="#4F46E5" />
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
                    stock_remark: t('restockedFromWaste', { date: data.expire_date }),
                    items: [{
                        item_id: data.item_id,
                        quantity: data.waste_quantity,
                        expire_date: data.expire_date
                    }]
                },
                token
            });
            if (res?.data?.status === 200) {
                toast.success(t('returnSuccess'));
                refetch();
                navigate(-1);
            }
        } catch (error) {
            toast.error(t('processFailed'));
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8">
            {/* Header Navigation */}
            <div className="max-w-5xl mx-auto mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                >
                    <FaArrowLeft className="mr-2" /> {t('backToList')}
                </button>
            </div>

            <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none overflow-hidden transition-colors">
                <div className="flex flex-col md:flex-row">

                    {/* Left Side: Image Section */}
                    <div className="md:w-5/12 bg-slate-50 dark:bg-gray-900/50 flex items-center justify-center p-8 relative">
                        <div className="absolute top-4 left-4">
                            <Tag color="red" className="px-3 py-1 rounded-full font-bold uppercase tracking-wider">{t('wasteItem')}</Tag>
                        </div>
                        <img
                            className="max-h-[400px] w-full object-contain mix-blend-multiply dark:mix-blend-normal drop-shadow-2xl"
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
                                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                                    {data?.item_name}
                                </h1>
                                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">${data?.item_price}</span>
                            </div>
                            <code className="text-sm bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-3 py-1 rounded-md uppercase">
                                {t('sku')}: {data?.item_code}
                            </code>
                        </header>

                        {/* Product Specs Grid */}
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                                <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm mr-3"><FaTag className="text-indigo-500" /></div>
                                <div>
                                    <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold">{t('category')}</p>
                                    <p className="text-slate-700 dark:text-slate-300 font-medium">{data?.category_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                                <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm mr-3"><FaRuler className="text-indigo-500" /></div>
                                <div>
                                    <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold">{t('size')}</p>
                                    <p className="text-slate-700 dark:text-slate-300 font-medium">{data?.size_name}</p>
                                </div>
                            </div>
                        </div>

                        <Divider className="dark:border-slate-700" />

                        {/* Editable Section */}
                        <div className="space-y-6">
                            {/* Expire Date */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-slate-600 dark:text-slate-400 font-semibold">
                                    <FaCalendarAlt className="mr-3 text-slate-400 dark:text-slate-500" /> {t('date')}
                                </div>
                                <div className="flex items-center">
                                    {isEditingDate ? (
                                        <div className="flex gap-2">
                                            <Input
                                                type="date"
                                                size="small"
                                                value={tempDate}
                                                onChange={(e) => setTempDate(e.target.value)}
                                                className="dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                                            />
                                            <Button type="primary" size="small" shape="circle" icon={<FaCheck />} onClick={() => { setData({ ...data, expire_date: tempDate }); setIsEditingDate(false); }} />
                                            <Button danger size="small" shape="circle" icon={<FaTimes />} onClick={() => setIsEditingDate(false)} />
                                        </div>
                                    ) : (
                                        <div className="group flex items-center cursor-pointer" onClick={() => setIsEditingDate(true)}>
                                            <span className="text-slate-700 dark:text-slate-300 mr-2">{data?.expire_date}</span>
                                            <FaEdit className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stock Quantity */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-slate-600 dark:text-slate-400 font-semibold">
                                    <FaBox className="mr-3 text-slate-400 dark:text-slate-500" /> {t('quantityToReturn')}
                                </div>
                                <div className="flex items-center font-bold text-lg text-slate-800 dark:text-slate-200">
                                    {data?.waste_quantity} <span className="text-xs text-slate-400 ml-1 font-normal">{t('units')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-10 flex flex-col sm:flex-row gap-4">
                            <Popconfirm
                                title={t('processReturn')}
                                description={t('returnConfirmMsg')}
                                onConfirm={confirm}
                                okText={t('confirm')}
                                cancelText={t('cancel')}
                                okButtonProps={{ className: 'bg-indigo-600' }}
                            >
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    icon={<FaUndo />}
                                    className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none border-none font-bold"
                                >
                                    {t('inWastedStock')}
                                </Button>
                            </Popconfirm>

                            <Button
                                danger
                                size="large"
                                onClick={() => navigate(-1)}
                                className="h-12 rounded-xl border-2 font-bold dark:bg-transparent dark:text-red-500 dark:border-red-500 hover:dark:bg-red-500 hover:dark:text-white"
                            >
                                {t('discard')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WasteItemDetail;