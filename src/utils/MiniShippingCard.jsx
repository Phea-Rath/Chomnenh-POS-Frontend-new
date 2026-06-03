import React from 'react';
import { motion } from 'framer-motion';
import { FaTruck, FaExpandAlt, FaCalendarAlt, FaStickyNote } from 'react-icons/fa';
import { GiAirplaneDeparture, GiCargoShip } from "react-icons/gi";
import dayjs from 'dayjs';

export default function MiniShippingCard({ shipping, onClick }) {
    console.log(shipping);
    
    // Dynamic values with safe fallbacks
    const shippingFee = shipping?.shipping_fee ?? 0;
    const trackingId = shipping?.tracking_number || "--=--";
    const shippingMethod = shipping?.shipping_method || "Standard Shipping";
    const date = shipping?.shipping_date;
    const shippingDateShort = date 
        ? dayjs(date).format("DD/MM/YY") 
        : "MM/YY";
    const remark = shipping?.remark || "No remark";

    const ShippingCardLayout = ({ isExpanded = false }) => (
        <div className={`
            relative overflow-hidden
            aspect-[1.586/1] w-full
            rounded-2xl p-5
            bg-gradient-to-br from-blue-900 via-cyan-950 to-blue-900
            text-white shadow-xl
            border border-white/10
            flex flex-col justify-between
            ${!isExpanded ? 'cursor-pointer' : ''}
        `}>
            {/* Branding */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="w-8 h-6 rounded bg-gradient-to-tr from-cyan-400 via-blue-200 to-cyan-300 opacity-80 border border-cyan-500/20 shadow-sm mb-1 flex items-center justify-center">
                       {shipping?.vai == 'truck'? <FaTruck className="text-cyan-900 " />:shipping?.vai == 'sea'? <GiCargoShip className="text-cyan-900" />:<GiAirplaneDeparture className="text-cyan-900 " />}
                    </div>
                    <span className="text-[10px] tracking-widest text-cyan-400 font-medium uppercase">
                        {shippingMethod}
                    </span>
                    <br />
                    <span className='text-[10px] tracking-widest text-cyan-400 font-medium uppercase'>{trackingId}</span>
                </div>
                <div className="flex items-center gap-2">
                    {!isExpanded && <FaExpandAlt className="text-xs text-cyan-400/70" />}
                    <span className="italic font-black text-lg tracking-wider text-cyan-200/90 select-none">
                        SHIPPING
                    </span>
                </div>
            </div>

            {/* Amount */}
            <div className="my-auto pt-2">
                <p className="text-[10px] uppercase tracking-widest text-cyan-300 font-medium mb-0.5">
                    Shipping Fee
                </p>
                <div className={`${isExpanded ? 'text-3xl' : 'text-2xl'} font-bold font-mono tracking-tight flex items-baseline gap-0.5 transition-all`}>
                    <span className="text-xl font-normal opacity-70">$</span>
                    {parseFloat(shippingFee).toFixed(2)}
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
                        {shippingDateShort}
                    </p>
                </div>
            </div>

            {/* Soft background ambient glow */}
            <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
        </div>
    );

    return (
        <div className="max-w-xs w-full group" onClick={onClick}>
            <motion.button
                type='button'
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-left block focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-2xl"
            >
                <ShippingCardLayout isExpanded={false} />
            </motion.button>
            <p className="text-[11px] text-center text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Click to edit shipping details
            </p>
        </div>
    );
}
