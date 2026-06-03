import { DatePicker } from "antd";
import { useEffect, useState } from "react";
import { BsBank } from "react-icons/bs";
import { FaDollarSign, FaMoneyBillWave } from "react-icons/fa";
import { IoIdCard } from "react-icons/io5";
import Input from "./Input";
import RichSearch from "./RichSearch";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PAYMENT_METHODS } from "../services/paymentService";
import { BiNote } from "react-icons/bi";
import dayjs from 'dayjs';
import AlertBox from "../services/AlertBox";

const initial = {
    transection_id:'',
    remark:'',
    amount: 0,
    payment_method:'',
    paid_at: null
}
const PaymentModel = ({isShow, onClose, onPayment, isLoading, onChange, balance, pay, data})=>{
    const {t} = useTranslation();
    const [form, setForm] = useState(initial);
    const [showAlert, setShowAlert] = useState(false);
    // const [_balance, setBalance] = useState(0);
    // const [_pay, setPay] = useState(0);
    

    
    useEffect(()=>{
        setForm(data || initial);
    },[data]);

    useEffect(()=>{
        onChange?.(form);
    },[form]);

    if(!isShow){
        return '';
    }

    const handleConfirmPayment = () => {
        onPayment?.(form);
        setShowAlert(false);
    };

    return(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <AlertBox
                isOpen={showAlert}
                title={t('confirmPayment')}
                message={t('confirmPaymentMessage')}
                onConfirm={handleConfirmPayment}
                onCancel={() => setShowAlert(false)}
                confirmText={t('ok')}
                cancelText={t('cancel')}
            />
            <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-xl"
            >
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 dark:text-white">
                <FaMoneyBillWave className="text-green-500" />
                {t('addPayment')}
            </h3>
            <div className="flex justify-between mb-4 dark:text-gray-300">
                <h1>{t('balance')}: <span className="text-red-500">{parseFloat(balance).toFixed(2)}</span></h1>
                <h1>{t('paidAmount')}: <span className="text-green-500">{parseFloat(pay).toFixed(2)}</span></h1>
            </div>
            <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    {t('paymentMethod')} <BsBank />
                </label>
                <RichSearch
                    data={PAYMENT_METHODS}
                    placeholder='e.g, cash or bank '
                    keyFields={{
                    id: 'value',
                    title: 'label'
                    }}
                    value={form.payment_method}
                    onSelected={(value) => setForm((pre)=>({...pre,payment_method: value}))}
                    
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    {t('transectionId')} <IoIdCard />
                </label>
                <Input
                    type="text"
                    value={form.transection_id}
                    placeholder="e.g, 12345678910"
                    onChange={(value) => setForm((pre)=>({...pre,transection_id: value}))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    step="0.01"
                    min="0"
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    {t('amount')} <FaDollarSign />
                </label>
                <Input
                    type="number"
                    value={form.amount}
                    onChange={(value) => setForm((pre)=>({...pre,amount: value}))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    step="0.01"
                    min="0"
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('paymentDate')}</label>
                
                <DatePicker
                    showTime
                    value={form.paid_at?dayjs(form.paid_at):''}
                    onChange={(date, dateString) => setForm((pre)=>({...pre,paid_at: dateString}))}
                    className="date-picker"
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    {t('remark')} <BiNote />
                </label>
                <textarea
                    type='textarea'
                    value={form.remark || ''}
                    placeholder="Remark for note. . ."
                    onChange={(e) => setForm((pre)=>({...pre,remark: e.target.value}))}
                    className="textarea-input"
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
                    onClick={()=>setShowAlert(true)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? t('processing') : t('addPayment')}
                </button>
                </div>
            </div>
            </motion.div>
        </div>
    )
}

export default PaymentModel;