import { FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router";
const CompanyCard = ({ data: company }) => {
    const navigate = useNavigate();
    if (!company) return null;

    function handleVisitStore() {
        navigate(`${company.id}`);
    }

    return (
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col group cursor-pointer">
            {/* Brand Logo/Image Container */}
            <div className="aspect-square w-full bg-gray-50 flex items-center justify-center p-6 border-b border-gray-100">
                <img
                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    src={company?.image}
                    alt={company.profile_name}
                />
            </div>

            {/* Content Area */}
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                    {company?.profile_name}
                </h3>

                <div className="mt-2 space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FaPhoneAlt className="text-gray-400" />
                        <span>{company?.telephone || 'No contact info'}</span>
                    </div>
                    {company?.address && (
                        <div className="flex items-start gap-2 text-xs text-gray-600">
                            <FaMapMarkerAlt className="text-gray-400 mt-0.5" />
                            <span className="line-clamp-2">{company.address}</span>
                        </div>
                    )}
                </div>

                <button onClick={handleVisitStore} className="mt-4 w-full bg-[#f0f2f2] hover:bg-[#e3e6e6] border border-[#d5d9d9] py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
                    Visit Store
                </button>
            </div>
        </div>
    );
};

export default CompanyCard;