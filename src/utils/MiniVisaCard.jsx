import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaStickyNote, FaTimes, FaExpandAlt } from 'react-icons/fa';
import { IoIdCard } from 'react-icons/io5';
import { BsBank } from 'react-icons/bs';
import dayjs from 'dayjs'; // Assumed from your code

export default function MiniVisaPaymentCard({ payment, onClick }) {
    const [isOpen, setIsOpen] = useState(false);

    // Dynamic values with safe fallbacks
    const amount = payment?.amount ?? 0;
    const transactionId = payment?.transection_id || "--=--";
    const paymentMethod = payment?.payment_method || "Debit Card";
    const paymentDateLong = payment?.payment_date 
        ? dayjs(payment.payment_date).format("DD MMM YYYY hh:mm A") 
        : "Pending Date";
    const date = payment?.payment_date ?? payment?.paid_at;
    const paymentDateShort = date 
        ? dayjs(date).format("DD/MM/YY") 
        : "MM/YY";
    const remark = payment?.remark || "No remark";

    // Shared Visa layout component to keep code DRY
    const VisaCardLayout = ({ isExpanded = false }) => (
        <div className={`
            relative overflow-hidden
            aspect-[1.586/1] w-full
            rounded-2xl p-5
            bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900
            text-white shadow-xl
            border border-white/10
            flex flex-col justify-between
            ${!isExpanded ? 'cursor-pointer' : ''}
        `}>
            {/* Visual SIM Chip Graphic & Visa/Bank Branding */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="w-8 h-6 rounded bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-300 opacity-80 border border-amber-500/20 shadow-sm mb-1 text-center font-extrabold">C</div>
                    <span className="text-[10px] tracking-widest text-slate-400 font-medium uppercase">
                        {paymentMethod}
                    </span>
                    <br />
                    <span className='text-[10px] tracking-widest text-slate-400 font-medium uppercase'>{transactionId}</span>
                </div>
                <div className="flex items-center gap-2">
                    {!isExpanded && <FaExpandAlt className="text-xs text-slate-400/70" />}
                    <span className="italic font-black text-lg tracking-wider text-indigo-200/90 select-none">
                        PAYMENT
                    </span>
                </div>
            </div>

            {/* Amount */}
            <div className="my-auto pt-2">
                <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-medium mb-0.5">
                    Amount Paid
                </p>
                <div className={`${isExpanded ? 'text-3xl' : 'text-2xl'} font-bold font-mono tracking-tight flex items-baseline gap-0.5 transition-all`}>
                    <span className="text-xl font-normal opacity-70">$</span>
                    {!isExpanded && parseFloat(amount).toFixed(2)}
                    {isExpanded && <input 
                        type="number"
                        value={parseFloat(amount).toFixed(2)}
                        className={`${isExpanded ? 'text-3xl' : 'text-2xl'} no-spinner focus:outline-none border-0 font-bold font-mono tracking-tight flex items-baseline gap-0.5 transition-all`}
                         />}
                </div>
            </div>

            {/* Bottom details */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium mb-0.5">
                        Remark
                    </p>
                    <p className="font-mono text-[10px] w-40 tracking-widest truncate text-slate-200 break-all">
                        {remark}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium mb-0.5">
                        Date
                    </p>
                    <p className="font-mono text-xs text-slate-200">
                        {paymentDateShort}
                    </p>
                </div>
            </div>

            {/* Soft background ambient glow */}
            <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        </div>
    );

    return (
        <>
            {/* TRIGGER: Clickable Small Card Wrapper */}
            <div className="max-w-xs w-full group" onClick={onClick}>
                <motion.button
                    type='button'
                    onClick={() => setIsOpen(true)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left block focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl"
                >
                    <VisaCardLayout isExpanded={false} />
                </motion.button>
                
                {/* Embedded subtle instructions underneath */}
                <p className="text-[11px] text-center text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Click to view full receipt receipt details
                </p>
            </div>

            {/* POP OUT MODAL OVERLAY */}
            {/* <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", duration: 0.4 }}
                            className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                        >
                            =
                            <button 
                                type='button'
                                onClick={() => setIsOpen(false)}
                                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <FaTimes className="text-base" />
                            </button>

                            
                            <div className="mb-5">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                                    Transaction Receipt
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Electronic verification receipt logs
                                </p>
                            </div>

                            
                            <div className="mb-6 shadow-lg">
                                <VisaCardLayout isExpanded={true} />
                            </div>

                            
                            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                                <div className="grid grid-cols-[20px_1fr] gap-3">
                                    <IoIdCard className="text-blue-500 mt-0.5 text-base" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transaction ID</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 break-all">{transactionId}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[20px_1fr] gap-3">
                                    <BsBank className="text-purple-500 mt-0.5 text-base" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Gateway Method</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{paymentMethod}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[20px_1fr] gap-3">
                                    <FaCalendarAlt className="text-orange-500 mt-0.5 text-base" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Exact Processing Timestamp</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{paymentDateLong}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[20px_1fr] gap-3">
                                    <FaStickyNote className="text-amber-500 mt-0.5 text-base" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remarks / Status</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/40 mt-1">
                                            {remark}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            
                            <button
                                type='button'
                                onClick={() => setIsOpen(false)}
                                className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition-colors"
                            >
                                Close View
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence> */}
        </>
    );
}