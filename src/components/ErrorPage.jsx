import React from 'react';
import { Result, Button, Typography, Space, Card, Row, Col } from 'antd';
import { useNavigate, useRouteError } from 'react-router';
import {
    HiHome,
    HiRefresh,
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
    MdOutlineSentimentDissatisfied,
    MdOutlineSearchOff
} from 'react-icons/md';

const { Title, Text, Paragraph } = Typography;

const ErrorPage = ({ errorType = '404' }) => {
    const navigate = useNavigate();
    const error = useRouteError();

    // Error configurations
    const errorConfigs = {
        '404': {
            icon: <MdOutlineSearchOff className="error-icon" />,
            title: "Page Not Found",
            subtitle: "Oops! The page you're looking for has vanished into the digital void.",
            description: "The page you are trying to access doesn't exist or has been moved. Don't worry, even the best explorers get lost sometimes.",
            gradient: "from-purple-500 to-pink-500",
            emoji: "🔍",
            suggestions: [
                "Check the URL for typos",
                "Navigate back to our homepage",
                "Use the search function to find what you need"
            ]
        },
        '500': {
            icon: <HiServer className="error-icon" />,
            title: "Server Error",
            subtitle: "Our servers are taking a coffee break. They'll be back soon!",
            description: "Something went wrong on our end. Our team has been notified and is working to fix the issue.",
            gradient: "from-red-500 to-orange-500",
            emoji: "⚡",
            suggestions: [
                "Refresh the page in a few moments",
                "Check your internet connection",
                "Try clearing your browser cache"
            ]
        },
        '403': {
            icon: <HiShieldExclamation className="error-icon" />,
            title: "Access Denied",
            subtitle: "This area is for authorized personnel only.",
            description: "You don't have permission to access this page. If you believe this is an error, please contact your administrator.",
            gradient: "from-blue-500 to-cyan-500",
            emoji: "🔒",
            suggestions: [
                "Check your login credentials",
                "Contact your system administrator",
                "Verify your user permissions"
            ]
        },
        'offline': {
            icon: <HiWifi className="error-icon" />,
            title: "You're Offline",
            subtitle: "No internet connection detected",
            description: "It seems you've lost connection to the internet. Please check your network and try again.",
            gradient: "from-gray-500 to-slate-600",
            emoji: "📶",
            suggestions: [
                "Check your WiFi or mobile data",
                "Restart your router",
                "Try using a different network"
            ]
        },
        'generic': {
            icon: <HiExclamationCircle className="error-icon" />,
            title: "Something Went Wrong",
            subtitle: "An unexpected error occurred",
            description: "We apologize for the inconvenience. Our team has been notified and is working on a fix.",
            gradient: "from-yellow-500 to-amber-500",
            emoji: "🚧",
            suggestions: [
                "Refresh the page",
                "Go back to the previous page",
                "Contact support if the issue persists"
            ]
        }
    };

    const config = errorConfigs[errorType] || errorConfigs.generic;

    const handleGoHome = () => {
        navigate('/');
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
                    <div className="absolute top-40 left-1/2 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
                </div>

                <div className="relative">
                    {/* Main Error Card */}
                    <Card
                        className="modern-error-card border-0 shadow-2xl backdrop-blur-sm bg-white/90"
                        styles={{
                            body: {
                                padding: 0
                            }
                        }}
                    >
                        <Row gutter={[0, 0]} className="min-h-[600px]">
                            {/* Left Section - Visual & Actions */}
                            <Col xs={24} lg={12} className="p-8 flex flex-col justify-between">
                                <div>
                                    {/* Error Icon */}
                                    <div className={`w-32 h-32 bg-gradient-to-br ${config.gradient} rounded-3xl flex items-center justify-center shadow-2xl mb-8 mx-auto`}>
                                        <div className="text-5xl text-white">
                                            {config.icon}
                                        </div>
                                    </div>

                                    {/* Error Code & Title */}
                                    <div className="text-center mb-6">
                                        <div className="flex items-center justify-center space-x-3 mb-4">
                                            <span className="text-6xl font-black bg-gradient-to-br bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                                                {errorType}
                                            </span>
                                            <span className="text-4xl">{config.emoji}</span>
                                        </div>
                                        <Title level={2} className="!mb-2 !text-gray-800 font-bold">
                                            {config.title}
                                        </Title>
                                        <Text className="text-lg text-gray-600 font-medium">
                                            {config.subtitle}
                                        </Text>
                                    </div>

                                    {/* Action Buttons */}
                                    <Space direction="vertical" className="w-full" size="middle">
                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<HiHome className="text-lg" />}
                                            onClick={handleGoHome}
                                            className="h-12 w-full rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 border-0"
                                        >
                                            Go Home
                                        </Button>

                                        <Button
                                            size="large"
                                            icon={<HiRefresh className="text-lg" />}
                                            onClick={handleRefresh}
                                            className="h-12 w-full rounded-xl font-semibold border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
                                        >
                                            Refresh Page
                                        </Button>

                                        <Button
                                            type="text"
                                            size="large"
                                            onClick={handleGoBack}
                                            className="h-10 w-full rounded-xl font-medium text-gray-600 hover:text-blue-600 transition-all duration-300"
                                        >
                                            ← Go Back
                                        </Button>
                                    </Space>
                                </div>

                                {/* Support Contact */}
                                <div className="text-center mt-8 pt-6 border-t border-gray-200">
                                    <Text className="text-gray-500 text-sm">
                                        Need immediate help?{' '}
                                        <a href="mailto:support@estore.com" className="text-blue-600 hover:text-blue-700 font-medium">
                                            Contact Support
                                        </a>
                                    </Text>
                                </div>
                            </Col>

                            {/* Right Section - Details & Suggestions */}
                            <Col xs={24} lg={12} className="bg-gradient-to-br from-slate-50 to-blue-50 p-8 border-l border-gray-200">
                                <div className="h-full flex flex-col">
                                    {/* Description */}
                                    <div className="mb-8">
                                        <div className="flex items-center space-x-2 mb-4">
                                            <BsLightningCharge className="text-2xl text-yellow-500" />
                                            <Title level={4} className="!mb-0 !text-gray-800">
                                                What happened?
                                            </Title>
                                        </div>
                                        <Paragraph className="text-gray-600 text-lg leading-relaxed">
                                            {config.description}
                                        </Paragraph>
                                    </div>

                                    {/* Quick Fixes */}
                                    <div className="mb-8">
                                        <div className="flex items-center space-x-2 mb-4">
                                            <BsRocketTakeoff className="text-2xl text-green-500" />
                                            <Title level={4} className="!mb-0 !text-gray-800">
                                                Quick Fixes
                                            </Title>
                                        </div>
                                        <Space direction="vertical" className="w-full" size="small">
                                            {config.suggestions.map((suggestion, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md"
                                                >
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    <Text className="text-gray-700">{suggestion}</Text>
                                                </div>
                                            ))}
                                        </Space>
                                    </div>

                                    {/* Technical Details (for developers) */}
                                    {error && process.env.NODE_ENV === 'development' && (
                                        <div className="mt-auto">
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                                <Text className="text-red-800 text-sm font-mono break-all">
                                                    {error.toString()}
                                                </Text>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status Indicator */}
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                                <Text className="text-gray-600 text-sm">System Status: Operational</Text>
                                            </div>
                                            <Text className="text-gray-400 text-sm">ESTORE v1.2.0</Text>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Card>

                    {/* Decorative Elements */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full shadow-lg"></div>
                    <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-400 rounded-full shadow-lg"></div>
                    <div className="absolute top-1/2 -right-6 w-4 h-4 bg-green-400 rounded-full shadow-lg"></div>
                </div>

                {/* Additional Help Section */}
                <div className="text-center mt-8">
                    <Text className="text-gray-500">
                        While you're here, check out our{' '}
                        <a href="/help" className="text-blue-600 hover:text-blue-700 font-medium">
                            Help Center
                        </a>{' '}
                        or browse our{' '}
                        <a href="/products" className="text-blue-600 hover:text-blue-700 font-medium">
                            Featured Products
                        </a>
                    </Text>
                </div>
            </div>

            {/* <style jsx>{`
        .modern-error-card {
          border-radius: 24px;
          overflow: hidden;
        }
        .error-icon {
          font-size: 4rem;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style> */}
        </div>
    );
};

export default ErrorPage;