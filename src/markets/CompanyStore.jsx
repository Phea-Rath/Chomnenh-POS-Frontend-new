import { useParams, useNavigate } from "react-router";
import { useGetAllItemsForMarketPlaceQuery } from "../../app/Features/itemsSlice";
import { useGetProfileByIdQuery } from "../../app/Features/userProfileSlice";
import ProductGrid from "./pages/ProductGrid";
import { FaPhoneAlt, FaMapMarkerAlt, FaEnvelope, FaGlobe } from "react-icons/fa";

const CompanyStore = () => {
    const { proId } = useParams();
    const navigate = useNavigate();
    const { data: profileData, isLoading: profileLoading } = useGetProfileByIdQuery(proId);
    const { data: productsData, isLoading: productsLoading } = useGetAllItemsForMarketPlaceQuery({ limit: 30, page: 1, profile_id: proId });

    const profile = profileData?.data?.[0] || profileData?.data; // Handle both array and object responses
    const products = productsData?.data || [];

    const onProductClick = (product) => {
        navigate(`/market/product_detail/${product.id}`);
    };

    if (profileLoading || productsLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e77600]"></div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen -mt-8 -mx-4">
            {/* Brand Banner */}
            <div className="relative h-64 md:h-80 bg-gray-200 overflow-hidden">
                <img 
                    src={profile?.image || "https://images-na.ssl-images-amazon.com/images/G/01/stores/intel/Storefront_Banner_Intel_Core_1500x300.jpg"} 
                    alt="Banner" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Brand Header */}
            <div className="container mx-auto px-6 relative -mt-16 z-10 pb-8 border-b border-gray-100">
                <div className="flex flex-col md:flex-row items-end gap-6">
                    {/* Logo Overlay */}
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-white p-2 shadow-lg rounded-sm border border-gray-100 flex items-center justify-center">
                        <img 
                            src={profile?.image} 
                            alt={profile?.profile_name} 
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>

                    {/* Brand Info */}
                    <div className="flex-1 pb-2">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile?.profile_name}</h1>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                                <FaPhoneAlt className="text-gray-400" />
                                <span>{profile?.telephone}</span>
                            </div>
                            {profile?.address && (
                                <div className="flex items-center gap-1.5">
                                    <FaMapMarkerAlt className="text-gray-400" />
                                    <span>{profile.address}</span>
                                </div>
                            )}
                            <button className="text-blue-700 hover:text-orange-700 hover:underline font-medium">
                                Follow Brand
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs (Amazon Style) */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="container mx-auto px-6">
                    <div className="flex gap-8">
                        <button className="py-4 border-b-2 border-[#e77600] text-[#e77600] font-bold text-sm">Storefront</button>
                        <button className="py-4 text-gray-600 hover:text-gray-900 font-medium text-sm">All Products</button>
                        <button className="py-4 text-gray-600 hover:text-gray-900 font-medium text-sm">Reviews</button>
                        <button className="py-4 text-gray-600 hover:text-gray-900 font-medium text-sm">About</button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="container mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-gray-800">Featured Products</h2>
                    <span className="text-sm text-gray-500">{products.length} products found</span>
                </div>

                <ProductGrid 
                    products={products} 
                    onProductClick={onProductClick}
                />
            </main>
        </div>
    );
};

export default CompanyStore;