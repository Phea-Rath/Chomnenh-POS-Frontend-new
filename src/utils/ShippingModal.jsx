import { DatePicker } from "antd";
import { useEffect, useState } from "react";
import { FaTruck, FaDollarSign, FaBox, FaCalendarAlt } from "react-icons/fa";
import { IoIdCard } from "react-icons/io5";
import Input from "./Input";
import RichSearch from "./RichSearch";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SHIPPING_METHODS } from "../services/paymentService";
import { BiNote } from "react-icons/bi";
import dayjs from 'dayjs';

const initial = {
    tracking_number: '',
    remark: '',
    shipping_fee: 0,
    carrier:'',
    shipping_method: '',
    shipping_date: null,
    ship_term: 0,
    vai: 'truck'
}

const ShippingModal = ({ isShow, onClose, onConfirm, data, purchaseDate }) => {
    const { t } = useTranslation();
    const [form, setForm] = useState(initial);

    useEffect(() => {
        setForm(data || initial);
    }, [data, isShow]);

    if (!isShow) {
        return null;
    }

    const handleConfirm = () => {
        onConfirm?.(form);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-xl"
            >
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 dark:text-white">
                    <FaTruck className="text-blue-500" />
                    {t('shippingDetails')}
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('shippingMethod')} <FaBox />
                        </label>
                        <RichSearch
                            data={SHIPPING_METHODS}
                            placeholder='e.g, DHL, FedEx'
                            keyFields={{
                                id: 'value',
                                title: 'label'
                            }}
                            value={form.carrier}
                            onSelected={(value) => setForm((pre) => ({ ...pre, carrier: value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('shippingVia')}
                        </label>
                        <div className="flex gap-4">
                            {['truck', 'air', 'sea'].map((v) => (
                                <label key={v} className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                                    <input
                                        type="radio"
                                        name="vai"
                                        value={v}
                                        checked={form.vai == v}
                                        onChange={(e) => setForm((pre) => ({ ...pre, vai: e.target.value }))}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="capitalize">{t(v)}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('trackingNumber')} <IoIdCard />
                        </label>
                        <Input
                            type="text"
                            value={form.tracking_number}
                            placeholder="e.g, TRK123456789"
                            onChange={(value) => setForm((pre) => ({ ...pre, tracking_number: value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('shippingFee')} <FaDollarSign />
                        </label>
                        <Input
                            type="number"
                            value={form.shipping_fee}
                            onChange={(value) => setForm((pre) => ({ ...pre, shipping_fee: parseFloat(value) || 0}))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                            step="0.01"
                            min="0"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            {t('confirm')}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ShippingModal;
