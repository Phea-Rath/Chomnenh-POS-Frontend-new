import React from 'react';
import { Button, Typography, Space, Card, Row, Col, Tooltip } from 'antd';
import { useNavigate, useRouteError } from 'react-router';
import { motion } from 'framer-motion';
import {
    HiHome,
    HiRefresh,
    HiArrowLeft,
    HiOutlineSupport,
    HiExclamationCircle,
    HiServer,
    HiWifi,
    HiShieldExclamation
} from 'react-icons/hi';
import {
    BsRocketTakeoff,
    BsLightningCharge
} from 'react-icons/bs';
import {
    MdOutlineSearchOff
} from 'react-icons/md';

const { Title, Text, Paragraph } = Typography;

const ErrorPage = ({ errorType = '404' }) => {
    const navigate = useNavigate();
    const error = useRouteError();

    // Error configurations
    const errorConfigs = {
        '404': {
            icon: <MdOutlineSearchOff />,
            title: "Lost in Space?",
            subtitle: "The page you're looking for has drifted into the void.",
            description: "We searched every corner of our digital universe but couldn't find this page. It might have been moved or deleted.",
            gradient: "from-indigo-500 via-purple-500 to-pink-400",
            glowColor: "rgba(99, 102, 241, 0.2)",
            emoji: "🔭",
            suggestions: [
                "Verify the URL path is correct",
                "Try searching for related products",
                "Start fresh from the homepage"
            ]
        },
        '500': {
            icon: <HiServer />,
            title: "System Overload",
            subtitle: "Our servers are experiencing some turbulence.",
            description: "A technical glitch occurred on our end. Our engineering team has been dispatched to investigate and fix the issue.",
            gradient: "from-rose-500 via-red-500 to-orange-400",
            glowColor: "rgba(244, 63, 94, 0.2)",
            emoji: "⚙️",
            suggestions: [
                "Wait a minute and refresh",
                "Clear your browser cache",
                "Report this if it persists"
            ]
        },
        '403': {
            icon: <HiShieldExclamation />,
            title: "Access Restricted",
            subtitle: "You've reached a high-security zone.",
            description: "Your current permissions don't allow access to this area. Please sign in with appropriate credentials or contact an admin.",
            gradient: "from-blue-600 via-cyan-500 to-teal-400",
            glowColor: "rgba(37, 99, 235, 0.2)",
            emoji: "🔐",
            suggestions: [
                "Switch to an authorized account",
                "Verify your login status",
                "Contact technical support"
            ]
        },
        'offline': {
            icon: <HiWifi />,
            title: "Signal Lost",
            subtitle: "You're currently navigating offline.",
            description: "It looks like your connection has dropped. Please check your network settings and try reconnecting.",
            gradient: "from-slate-600 via-gray-500 to-zinc-400",
            glowColor: "rgba(71, 85, 105, 0.2)",
            emoji: "📡",
            suggestions: [
                "Check your Wi-Fi or mobile data",
                "Toggle Airplane mode on and off",
                "Refresh once you're back online"
            ]
        },
        'generic': {
            icon: <HiExclamationCircle />,
            title: "Unexpected Event",
            subtitle: "Something didn't go as planned.",
            description: "We've encountered an unknown error. Don't worry, your data is safe, but we need to restart the current operation.",
            gradient: "from-amber-500 via-yellow-500 to-orange-300",
            glowColor: "rgba(245, 158, 11, 0.2)",
            emoji: "🚧",
            suggestions: [
                "Reload the current page",
                "Go back to the previous screen",
                "Contact us for assistance"
            ]
        }
    };

    const getErrorType = () => {
        if (error?.status) return error.status.toString();
        if (errorType && errorType !== '404') return errorType;
        if (error?.message === 'Network Error') return 'offline';
        return '404';
    };

    const activeErrorType = getErrorType();
    const config = errorConfigs[activeErrorType] || errorConfigs.generic;

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 flex items-center justify-center p-6">
            {/* Animated Light Mesh Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 45, 0],
                        x: [0, 50, 0],
                        y: [0, 30, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-100/50 blur-[120px]"
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.3, 1],
                        rotate: [0, -30, 0],
                        x: [0, -40, 0],
                        y: [0, 50, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-[120px]"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 max-w-5xl w-full"
            >
                <Card 
                    className="overflow-hidden border-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] bg-white/80 backdrop-blur-xl rounded-[2.5rem]"
                    styles={{ body: { padding: 0 } }}
                >
                    <Row align="stretch">
                        {/* Visual Section */}
                        <Col xs={24} lg={11} className="relative overflow-hidden p-12 flex flex-col items-center justify-center bg-slate-50/50 border-r border-slate-100">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.8, type: "spring" }}
                                className="relative mb-12"
                            >
                                {/* Large Glowing Error Code */}
                                <div className="absolute inset-0 blur-[60px] opacity-30 flex items-center justify-center">
                                    <span className={`text-[12rem] font-black text-transparent bg-gradient-to-r ${config.gradient} bg-clip-text`}>
                                        {activeErrorType}
                                    </span>
                                </div>
                                <span className="relative text-[10rem] font-black leading-none tracking-tighter text-slate-200/50 select-none">
                                    {activeErrorType}
                                </span>
                                
                                {/* Floating Icon */}
                                <motion.div
                                    animate={{ y: [0, -20, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-3xl bg-gradient-to-br ${config.gradient} shadow-2xl flex items-center justify-center text-6xl text-white`}
                                >
                                    {config.icon}
                                </motion.div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="text-center">
                                <Title level={1} className="!text-slate-900 !mb-2 !text-5xl font-bold tracking-tight">
                                    {config.title}
                                </Title>
                                <Text className="text-slate-500 text-xl font-medium block mb-8">
                                    {config.subtitle} {config.emoji}
                                </Text>
                            </motion.div>

                            {/* Main Actions */}
                            <motion.div variants={itemVariants} className="w-full max-w-xs space-y-4">
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    icon={<HiHome className="text-xl" />}
                                    onClick={() => navigate('/')}
                                    className="h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 border-0 shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] transition-all font-semibold"
                                >
                                    Back to Home
                                </Button>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        size="large"
                                        icon={<HiRefresh />}
                                        onClick={() => window.location.reload()}
                                        className="h-12 rounded-xl bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-400 transition-all shadow-sm"
                                    >
                                        Reload
                                    </Button>
                                    <Button
                                        size="large"
                                        icon={<HiArrowLeft />}
                                        onClick={() => navigate(-1)}
                                        className="h-12 rounded-xl bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-400 transition-all shadow-sm"
                                    >
                                        Go Back
                                    </Button>
                                </div>
                            </motion.div>
                        </Col>

                        {/* Details Section */}
                        <Col xs={24} lg={13} className="p-12 flex flex-col bg-white">
                            <motion.div variants={itemVariants} className="mb-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 text-2xl">
                                        <BsLightningCharge />
                                    </div>
                                    <Title level={3} className="!text-slate-800 !mb-0 font-semibold">Diagnosis</Title>
                                </div>
                                <Paragraph className="text-slate-600 text-lg leading-relaxed">
                                    {config.description}
                                </Paragraph>
                            </motion.div>

                            <motion.div variants={itemVariants} className="mb-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 text-2xl">
                                        <BsRocketTakeoff />
                                    </div>
                                    <Title level={3} className="!text-slate-800 !mb-0 font-semibold">Quick Fixes</Title>
                                </div>
                                <div className="space-y-3">
                                    {config.suggestions.map((item, idx) => (
                                        <div key={idx} className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-150 transition-transform"></div>
                                            <Text className="text-slate-700 font-medium">{item}</Text>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <div className="mt-auto pt-8 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <Space size="large">
                                        <Tooltip title="Talk to support">
                                            <a href="mailto:support@estore.com" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-medium">
                                                <HiOutlineSupport className="text-xl" />
                                                Support
                                            </a>
                                        </Tooltip>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <Text className="text-slate-500 text-xs uppercase tracking-widest font-bold">Systems Online</Text>
                                        </div>
                                    </Space>
                                    <Text className="text-slate-400 font-mono text-xs">BUILD_v1.2.4_STABLE</Text>
                                </div>
                            </div>

                            {/* Technical Stack (Dev Only) */}
                            {error && process.env.NODE_ENV === 'development' && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100"
                                >
                                    <Text className="text-red-500 font-mono text-xs break-all">
                                        [ERR_TRACE]: {error.toString()}
                                    </Text>
                                </motion.div>
                            )}
                        </Col>
                    </Row>
                </Card>

                {/* Footer Links */}
                <motion.div variants={itemVariants} className="mt-8 flex justify-center gap-8">
                    {['Help Center', 'Status Page', 'Documentation', 'Privacy'].map((link) => (
                        <a key={link} href={`/${link.toLowerCase().replace(' ', '-')}`} className="text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium">
                            {link}
                        </a>
                    ))}
                </motion.div>
            </motion.div>

            {/* Global Overrides for Ant Design in light mode */}
            <style>{`
                .ant-typography { color: inherit !important; }
                .ant-card { background: transparent !important; }
                .ant-btn-primary { 
                    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2), 0 4px 6px -2px rgba(37, 99, 235, 0.1);
                }
            `}</style>
        </div>
    );
};

export default ErrorPage;
