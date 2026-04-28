// App.js
import React, { useState } from 'react';
import Footer from './Footer';
import Header from './Header';
import HeaderPanel from './HeaderPanel';
import NavBar from './NavBar';
import { Outlet, useLocation, useNavigate } from 'react-router';

function Main() {
    const navigate = useNavigate();
    const location = useLocation();
    const [scroll, setScroll] = useState(0);
    const isDetailPage = location.pathname.includes('/market/product_detail/');

    const onScroll = (e) => {
        setScroll(e.target.scrollTop);
    };

    return (
        <div onScroll={onScroll} className="min-h-screen bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 h-[100vh] overflow-auto scroll-smooth">
            <div className={`w-full fixed ${scroll > 180 ? ' top-0' : ' -top-20'} transition-all duration-300 z-50`}>
                <Header onBack={isDetailPage ? () => navigate('/market') : null} />
            </div>
            <section className="relative z-40">
                <HeaderPanel />
                <NavBar />
            </section>
            <main className="">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

export default Main;
