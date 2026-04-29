import { useState } from "react";
import { FaPhoneAlt, FaMapMarkerAlt, FaCopy, FaCheck } from "react-icons/fa";
import { IoCheckmark, IoCopyOutline } from "react-icons/io5";
import { useNavigate } from "react-router";
const CompanyCard = ({ data: company }) => {
    const [copy, setCopy] = useState(false);
    const navigate = useNavigate();
    if (!company) return null;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(company.telephone);
        setCopy(true);
        setTimeout(() => setCopy(false), 2000);
    }

    function handleVisitStore() {
        navigate(`${company.id}`);
    }

    return (
        <div className=" rounded-sm overflow-hidden flex flex-col group cursor-pointer">
            {/* Brand Logo/Image Container */}
            <div onClick={handleVisitStore} className="aspect-square relative rounded-full w-full overflow-hidden group-hover:shadow-lg transition-shadow duration-300 bg-gray-50 flex items-center justify-center p-6 border-b border-gray-100">
                <img
                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    src={company?.image}
                    alt={company.profile_name}
                />
            </div>

            {/* Content Area */}
            <div className="p-4 flex-1 flex flex-col">
                <h3 onClick={handleVisitStore} className="text-md font-bold text-gray-900 text-center group-hover:text-blue-700 transition-colors line-clamp-1">
                    {company?.profile_name}
                </h3>

                <div className="mt-2 space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-xs justify-between text-gray-600">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <FaPhoneAlt className="text-gray-400" />
                            <span>{company?.telephone || 'No contact info'}</span>
                        </div>
                        <div onClick={handleCopy} className="flex items-center gap-2 hover:bg-gray-200 p-1 rounded-md">
                            {copy ? <IoCheckmark className="cursor-pointer" /> :
                                <IoCopyOutline className="cursor-pointer" />}
                        </div>
                    </div>
                    {company?.address && (
                        <div className="flex items-start gap-2 text-xs text-gray-600">
                            <FaMapMarkerAlt className="text-gray-400 mt-0.5" />
                            <span className="line-clamp-2">{company.address}</span>
                        </div>
                    )}
                </div>

                {/* <button onClick={handleVisitStore} className="mt-4 w-full bg-[#f0f2f2] hover:bg-[#e3e6e6] border border-[#d5d9d9] py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
                    Visit Store
                </button> */}
            </div>
        </div>
    );
};

export default CompanyCard;