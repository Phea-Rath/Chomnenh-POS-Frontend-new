import React, { useEffect, useState } from "react";
import { AiFillDollarCircle } from "react-icons/ai";
import { FcCurrencyExchange } from "react-icons/fc";
import { FiEdit } from "react-icons/fi";
import {
  useGetExchangeRateByIdQuery,
  useUpdateExchangeRateMutation,
} from "../../app/Features/exchangeRatesSlice";
import { toast } from "react-toastify";

const ExchangeRate = () => {
  const token = localStorage.getItem("token");
  const proId = localStorage.getItem("profileId");
  const [usdToKhr, setUsdToKhr] = useState();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(usdToKhr);
  const { data, refetch } = useGetExchangeRateByIdQuery({ id: proId, token });
  const [updateExchageRate] = useUpdateExchangeRateMutation();
  useEffect(() => {
    setUsdToKhr(data?.data?.usd_to_khr);
  }, [data]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (!isNaN(inputValue) && inputValue > 0) {
        const res = await updateExchageRate({
          id: proId,
          itemData: { usd_to_khr: inputValue },
          token,
        });

        if (res?.data?.status == 200) {
          refetch();
          setUsdToKhr(Number(inputValue));
          toast.success("Change exchange rate successfully!");
          setIsEditing(false);
        }
      } else {
        toast.error("Please enter a valid positive number");
      }
    } catch (error) {
      toast.error(error.message || error);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <div className=" h-full bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full">
        <div className="flex flex-col justify-center items-center">
          <FcCurrencyExchange className="text-5xl" />
          <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
            USD to KHR Exchange Rate
          </h1>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
          {isEditing ? (
            <div className="flex items-center w-full">
              <input
                type="number"
                value={inputValue}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter USD to KHR rate"
              />
              <button
                onClick={handleSave}
                className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          ) : (
            <>
              <span className="text-lg font-semibold text-gray-700">
                1 USD = {usdToKhr} KHR
              </span>
              <button
                onClick={handleEditClick}
                className="text-blue-500 hover:text-blue-700"
                aria-label="Edit exchange rate"
              >
                <FiEdit size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExchangeRate;
