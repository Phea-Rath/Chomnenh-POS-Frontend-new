// components/Footer.jsx
import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white mt-16">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div>
                        <h3 className="text-xl font-bold mb-4">MarketPlace</h3>
                        <p className="text-gray-400">
                            Your one-stop destination for all your shopping needs. Quality products, great prices.
                        </p>
                        <div className="flex space-x-4 mt-4">
                            <FaFacebook className="text-gray-400 hover:text-white cursor-pointer" />
                            <FaTwitter className="text-gray-400 hover:text-white cursor-pointer" />
                            <FaInstagram className="text-gray-400 hover:text-white cursor-pointer" />
                            <FaLinkedin className="text-gray-400 hover:text-white cursor-pointer" />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><a href="#" className="hover:text-white">Home</a></li>
                            <li><a href="#" className="hover:text-white">Shop</a></li>
                            <li><a href="#" className="hover:text-white">About Us</a></li>
                            <li><a href="#" className="hover:text-white">Contact</a></li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h4 className="font-semibold mb-4">Customer Service</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><a href="#" className="hover:text-white">Help Center</a></li>
                            <li><a href="#" className="hover:text-white">Returns</a></li>
                            <li><a href="#" className="hover:text-white">Shipping Info</a></li>
                            <li><a href="#" className="hover:text-white">Size Guide</a></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-semibold mb-4">Newsletter</h4>
                        <p className="text-gray-400 mb-4">Subscribe for updates and offers</p>
                        <div className="flex">
                            <input
                                type="email"
                                placeholder="Your email"
                                className="px-3 py-2 bg-gray-700 text-white rounded-l-lg focus:outline-none flex-1"
                            />
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                    <p>&copy; 2024 MarketPlace. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;