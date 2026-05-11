import { useGetAllProfileQuery } from "../../app/Features/userProfileSlice";
import CompanyCard from "./components/CompanyCard";

const CompaniesPage = () => {
    const { data: companies } = useGetAllProfileQuery();

    return (
        <div className=" -mt-8 text-gray-800 -mx-4 pb-12">
            {/* Discover Hero Section */}
            <div className="bg-gradient-to-r from-[#325b8d] to-[#37475a] py-12 mb-8">
                <div className="container mx-auto px-6">
                    <h1 className="text-3xl font-bold text-white mb-2">Discover Top Companies</h1>
                    <p className="text-gray-300 max-w-2xl">
                        Explore our curated selection of verified sellers and official brand stores.
                        Find everything from local artisans to global manufacturers.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Verified Companies</h2>
                    <span className="text-sm text-gray-600">{companies?.data?.length || 0} companies found</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
                    {companies?.data.map((company) => (
                        <CompanyCard key={company.id} data={company} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CompaniesPage;