import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaDownload, FaPrint } from "react-icons/fa";
import { IoArrowBackCircle } from "react-icons/io5";
import { useReactToPrint } from "react-to-print";
import { QRCodeCanvas } from "qrcode.react";
import { useLocation, useNavigate, useParams } from "react-router";
import { motion } from "framer-motion";
import handleDownload from "../../services/imageDowload";
import { useGetOrderByIdQuery } from "../../../app/Features/ordersSlice";
import { useGetAllUserQuery, useGetUserProfileQuery } from "../../../app/Features/usersSlice";
import { useTranslation } from "react-i18next";
import timeAgo from "../../services/timeAgo";
import Button from "../../utils/Button";
import { currencyFormat } from "../../services/serviceFunction";

const OrderInvoice = () => {
  const { t } = useTranslation();
  const path = useLocation().pathname;
  const navigator = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const {data:users}=useGetAllUserQuery(token);
  const profileId = Number(localStorage.getItem("profileId") || localStorage.getItem("prifileId"));
  const invoiceRef = useRef(null);
  const [data, setData] = useState({});

  const { data: invoiceData, isLoading } = useGetOrderByIdQuery({ id, token });
  const { data: profileData } = useGetUserProfileQuery({ id: profileId, token });

  useEffect(() => {
    setData(invoiceData?.data || {});
  }, [invoiceData]);

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    contentRef: invoiceRef,
  });

  const money = (value) => Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formatDate = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  console.log(data);
  
  const exchangeRate = Number(data?.exchange_rate || 4000);
  const sellerName = data?.created_by_name || "N/A";
  const customerName = data?.customer_name || data?.customer?.customer_name || t("walkInCustomer");
  const customerPhone = data?.order_tel || data?.customer?.customer_tel || "N/A";
  const customerAddress = data?.order_address || data?.customer?.customer_address || "N/A";
  const deliverName = data?.deliver_name || "N/A";
  const deliverFee = Number(data?.delivery_fee || 0);
  const paymentMethod = data?.order_payment_method || "cash";
  const paymentStatus = data?.order_payment_status || (Number(data?.balance || 0) > 0 ? "partial" : "paid");
  const qrValue = useMemo(() => {
    return JSON.stringify({
      order_no: data?.order_no || id,
      customer: customerName,
      total: Number(data?.order_total || 0),
      phone: customerPhone,
    });
  }, [customerName, customerPhone, data?.order_no, data?.order_total, id]);

  const itemRows = Array.isArray(data?.items) ? data.items : [];
  const totals = {
    subtotal: Number(data?.order_subtotal || 0),
    discount: Number(data?.order_discount || 0),
    delivery: Number(data?.delivery_fee || 0),
    tax: Number(data?.order_tax || 0),
    total: Number(data?.order_total || 0),
    paid: Number(data?.payment || 0),
    balance: Number(data?.balance || 0),
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">{t("loadingInvoice")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent px-4 py-8 min-h-screen">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigator(-1)}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 print:hidden"
        >
          <IoArrowBackCircle className="mr-2" size={24} />
          {t("back")}
        </button>

        <div className="mb-6 flex flex-wrap justify-end gap-3 print:hidden">
          <Button
            onClick={handlePrint}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <FaPrint className="mr-2" /> {t("print")}
          </Button>
          <Button
            onClick={() => handleDownload(invoiceRef, "pdf", "invoice", data?.order_no || id)}
            className="flex items-center rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            <FaDownload className="mr-2" /> {t("downloadPDF")}
          </Button>
          <Button
            onClick={() => handleDownload(invoiceRef, "png", "invoice", data?.order_no || id)}
            className="flex items-center rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
          >
            <FaDownload className="mr-2" /> {t("downloadPNG")}
          </Button>
          <Button
            onClick={() => handleDownload(invoiceRef, "jpg", "invoice", data?.order_no || id)}
            className="flex items-center rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
          >
            <FaDownload className="mr-2" /> {t("downloadJPG")}
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            ref={invoiceRef}
            className="mx-auto overflow-hidden border border-gray-200 dark:border-0 px-6 py-8 bg-primary dark:bg-gray-800 print:rounded-none print:border-0 print:shadow-none sm:px-10"
          >
            <div className="mx-auto max-w-4xl">
              <div className="border-b-2 border-blue-800 flex justify-between pb-2 text-center">
                <div>
                  {profileData?.data?.image ? (
                    <img
                      src={profileData.data.image}
                      alt={profileData?.data?.profile_name || "Business logo"}
                      className="mx-auto mb-3 h-20 w-20 object-contain"
                    />
                  ) : null}
                </div>
                
                <div>
                  <h2 className="mt-6 text-3xl font-bold tracking-[0.08em] text-blue-500 uppercase">{t("invoice")}</h2>
                </div>
              </div>
              <div className="flex justify-between py-2">
                <div>
                  <h1 className="font-bold text-red-700 dark:text-red-400">No: {data?.order_no || "N/A"}</h1>
                  <div className="text-xs  text-gray-700 dark:text-gray-400">
                    <p>{t("exchangeRate")}: <span className="font-semibold">1$ = {exchangeRate} ៛</span></p>
                    <p>{t("status")}: <span className={`${data?.order_payment_status == "paid"? "text-green-600": "text-orange-600 dark:text-orange-400"}`}>{data?.order_payment_status}</span></p>
                  </div>
                </div>
                <ul className="text-xs text-blue-600">
                  <li><span>{t('date')}</span>: {formatDate(data?.order_date)}</li>
                  <li><span>{t('dueDate')}</span>: {formatDate(data?.due_date)}</li>
                  <li><span>{t('creditTerm')}</span>: {data?.due_date? timeAgo(data?.due_date): "N/A"}</li>
                </ul>
              </div>

              <div className="mt-1 grid !text-xs grid-cols-1 gap-8 text-[15px] leading-7 text-gray-800 dark:text-gray-200 md:grid-cols-2">
                <div className="flex">
                  <div className="px-2 font-semibold">
                    <h1>MAINLING INFO</h1>
                  </div>
                  <ul className="border-l-2 border-blue-800 px-2 leading-4.5">
                    <li className="font-semibold">{profileData?.data?.profile_name || t("company")}</li>
                    <li>{profileData?.data?.address || t("address")}</li>
                    <li>{profileData?.data?.telephone || "N/A"}</li>
                  </ul>
                </div>
                <div className="flex">
                  <div className="px-2 font-semibold">
                    <h1>BILL TO</h1>
                  </div>
                  <ul className="border-l-2 border-blue-800 px-2  leading-4.5">
                    <li>{t('name')}: <span className="font-semibold">{customerName}</span></li>
                    <li><span>{t('store')}</span>: {'N/A'}</li>
                    <li><span>{t('address')}</span>: {customerAddress}</li>
                    <li><span>{t('tel')}</span>: {customerPhone}</li>
                  </ul>
                </div>
                
                
              </div>
              <div className="w-full text-xs mt-6 text-gray-800 dark:text-gray-300">
                  <ul className="grid grid-cols-4 font-semibold">
                    <li>{t("salePerson").toLocaleUpperCase()}</li>
                    <li>{t("shippingMethod").toLocaleUpperCase()}</li>
                    <li>{t("deliveryDate").toLocaleUpperCase()}</li>
                    <li>{t("deliverFee").toLocaleUpperCase()}</li>
                  </ul>
                  <hr className="my-1 text-blue-700"/>
                  <ul className="grid grid-cols-4">
                    <li>{t("mrms").toLocaleUpperCase()}: <span>{sellerName}</span></li>
                    <li>{deliverName}</li>
                    <li>N/A</li>
                    <li>{currencyFormat(deliverFee)}</li>
                  </ul>
                </div>

                <table className="w-full table-auto mt-3 text-xs text-gray-800 border-collapse border border-gray-400">
                  <thead className=" bg-blue-50 dark:bg-blue-400/50 dark:text-gray-200">
                    <th className="border !border-blue-800 dark:!border-gray-300 p-1 py-3">{t('no').toLocaleUpperCase()}</th>
                    <th className="border !border-blue-800 dark:!border-gray-300 p-1 py-3">{t('description').toLocaleUpperCase()}</th>
                    <th className="border !border-blue-800 dark:!border-gray-300 p-1 py-3">{t('code').toLocaleUpperCase()}</th>
                    <th className="border !border-blue-800 dark:!border-gray-300 p-1 py-3">{t('qty').toLocaleUpperCase()}</th>
                    <th className="border !border-blue-800 dark:!border-gray-300 p-1 py-3">{t('unitPrice').toLocaleUpperCase()}</th>
                    <th className="border !border-blue-800 dark:!border-gray-300 p-1 py-3">{t('discount').toLocaleUpperCase()}</th>
                    <th className="border !border-blue-800 dark:!border-gray-300 p-1 py-3">{t('amount').toLocaleUpperCase()}</th>
                  </thead>
                  <tbody>
                    {itemRows.map((item, index) => {
                      const qty = Number(item.quantity || 0);
                      const price = Number(item.item_price || item.price || 0);
                      const rowTotal = qty * price;


                      return (
                        <tr key={item.id || index} className="border-b dark:text-gray-200 border-gray-100 dark:border-gray-700 align-top">
                          <td className="border !border-x-blue-800 dark:!border-gray-400 !border-y-gray-300 p-1 py-2 text-center">{index + 1}</td>
                          <td className="border !border-x-blue-800 dark:!border-gray-400 !border-y-gray-300 p-1 py-2">
                            {item.item_name}
                            
                          </td>
                          <td className="border !border-x-blue-800 dark:!border-gray-400 !border-y-gray-300 p-1 py-2">{item.item_code}</td>
                          <td className="border !border-x-blue-800 dark:!border-gray-400 !border-y-gray-300 p-1 py-2 text-center">
                            {qty} {item.scale_name || ""}
                          </td>
                          <td className="border !border-x-blue-800 dark:!border-gray-400 !border-y-gray-300 p-1 py-2 text-end">{money(price)}$</td>
                          <td className="border !border-x-blue-800 dark:!border-gray-400 !border-y-gray-300 p-1 py-2 text-end">{item.discount}</td>
                          <td className="border !border-x-blue-800 dark:!border-gray-400 !border-y-gray-300 p-1 py-2 text-end">{money(rowTotal)}$ </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-blue-50  dark:bg-blue-400/50 dark:text-gray-200">
                      <td colSpan={6} className="border !border-blue-800 dark:!border-gray-300 text-end p-1 py-2 font-semibold">SUBTOTAL AMOUNT</td>
                      <td className="p-1 text-end !border-blue-800 dark:!border-gray-300 font-semibold border">{money(totals.subtotal)} $</td>
                    </tr>
                    <tr className="bg-blue-50  dark:bg-blue-400/50 dark:text-gray-200">
                      <td colSpan={6} className="border !border-blue-800 dark:!border-gray-300 text-end p-1 py-2 font-semibold">DISCOUNT TOTAL</td>
                      <td className="p-1 text-end text-red-600 dark:text-red-300 font-semibold !border-blue-800 dark:!border-gray-300 border">-{money(totals.discount)} $</td>
                    </tr>
                    <tr className="bg-blue-50  dark:bg-blue-400/50 dark:text-gray-200">
                      <td colSpan={6} className="border !border-blue-800 dark:!border-gray-300 text-end p-1 py-2 font-semibold">PAID</td>
                      <td className="p-1 text-green-600 font-semibold text-end !border-blue-800 dark:!border-gray-300 border">{money(totals.paid)} $</td>
                    </tr>
                    <tr className="bg-blue-50  dark:bg-blue-400/50 dark:text-gray-200">
                      <td colSpan={6} className="border !border-blue-800 dark:!border-gray-300 text-end p-1 py-2 font-semibold">TOTAL AMOUNT($)</td>
                      <td className="p-1 text-end !border-blue-800 dark:!border-gray-300 font-semibold border">{money(totals.total)} $</td>
                    </tr>
                    <tr className="bg-blue-50  dark:bg-blue-400/50 dark:text-gray-200">
                      <td colSpan={6} className="border !border-blue-800 dark:!border-gray-300 text-end p-1 py-2 font-semibold">TOTAL AMOUNT(៛)</td>
                      <td className="p-1 text-end !border-blue-800 dark:!border-gray-300 font-semibold border">{money(totals.total * exchangeRate)} ៛</td>
                    </tr>
                    <tr className="bg-blue-50  dark:bg-blue-400/50 dark:text-gray-200">
                      <td colSpan={6} className="border !border-blue-800 dark:!border-gray-300 text-end p-1 py-2 font-semibold">BALANCE($)</td>
                      <td className="p-1 text-red-600 dark:text-red-300 font-semibold text-end !border-blue-800 dark:!border-gray-300 border">{money(totals.balance)} $</td>
                    </tr>
                    <tr className="bg-blue-50  dark:bg-blue-400/50 dark:text-gray-200">
                      <td colSpan={6} className="border !border-blue-800 dark:!border-gray-300 text-end p-1 py-2 font-semibold">BALANCE(៛)</td>
                      <td className="p-1 text-red-600 dark:text-red-300 font-semibold text-end !border-blue-800 dark:!border-gray-300 border">{money(totals.balance * exchangeRate)} ៛</td>
                    </tr>
                    
                  </tbody>
                </table>

              <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[180px,1fr]">
                {/* <div className="flex justify-center md:justify-start">
                  <div className="rounded-sm border border-gray-300 dark:border-gray-600 bg-white p-3">
                    <img src={profileData?.data?.qr_code} width={200} height={120} alt="" />
                    <p className="mt-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {profileData?.data?.profile_name || t("invoice")}
                    </p>
                  </div>
                </div> */}

                
              </div>

              <div className=" grid grid-cols-4 gap-8 text-center text-xs text-gray-700 dark:text-gray-200">
                <div>
                  <p className="mb-16 font-medium">{t("customer").toLocaleUpperCase()}</p>
                  <div className="pt-3">
                    <p className="font-semibold">{t("mrms")}: {customerName != 'N/A'? customerName: '. . . . . . . .'}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-16 font-medium">{t("deliver").toLocaleUpperCase()}</p>
                  <div className="pt-3">
                    <p className="font-semibold">{t("mrms")}: {deliverName != 'N/A'? deliverName: '. . . . . . . .'}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-16 font-medium">{t("stock").toLocaleUpperCase()}</p>
                  <div className="pt-3">
                    <p className="font-semibold">{t("mrms")}: . . . . . . . .</p>
                  </div>
                </div>
                <div>
                  <p className="mb-16 font-medium">{t("seller").toLocaleUpperCase()}</p>
                  <div className="pt-3">
                    <p className="font-semibold">{t("mrms")}: {sellerName != 'N/A'? sellerName: '. . . . . . . .'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderInvoice;
