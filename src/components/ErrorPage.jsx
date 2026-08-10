import React from 'react';
import { useNavigate, useRouteError } from 'react-router';
import { motion } from 'framer-motion';
import { HiHome } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';

const ErrorPage = () => {
    const navigate = useNavigate();
    const error = useRouteError();
    const { t } = useTranslation();

    return (
        <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-center fixed inset-0 z-[9999]">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 max-w-xl w-full"
            >
                {/* Large Stylized Error Code */}
                <div className="relative mb-8">
                    <motion.h1 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.8, type: "spring" }}
                        className="text-[12rem] md:text-[15rem] font-black leading-none text-slate-200 dark:text-white/5 select-none tracking-tighter"
                    >
                        {error?.status || '404'}
                    </motion.h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl md:text-3xl font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white bg-slate-50 dark:bg-gray-900 px-4">
                            {'Error'}
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {error?.statusText || 'Unexpected Event'}
                        </h2>
                        <p className="text-slate-500 dark:text-gray-400 font-medium max-w-md mx-auto">
                            {error?.message ||"The requested resource could not be found or a system error occurred."}
                        </p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="pt-4"
                    >
                        <button
                            onClick={() => navigate('/home')}
                            className="inline-flex items-center gap-3 bg-cyan-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-cyan-700 transition-all shadow-xl shadow-cyan-500/20 hover:scale-105 active:scale-95 group"
                        >
                            <HiHome className="text-2xl transition-transform group-hover:-translate-y-0.5" />
                            <span>{'Back to Home'}</span>
                        </button>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default ErrorPage;
