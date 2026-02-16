import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import Management from "./layouts/Management";
import Home from "./components/Home";
import ListItem from "./components/items/ListItem";
import CategoryList from "./components/categorys/CategoryList";
import Brands from "./components/brands/Brands";
import Scales from "./components/scales/Scales";
import Werehouses from "./components/stocks/Werehouses";
import StockType from "./components/stocks/StockType";
import Expanses from "./components/expanses/Expanses";
import ExpansesType from "./components/expanses/ExpansesType";
import Sales from "./components/orders/Sales";
import OrderList from "./components/orders/OrderList";
import AddInStock from "./views/stocks/AddInStock";
import Stocks from "./components/stocks/Stocks";
import StockTransfer from "./views/stocks/StockTransfer";
import StockTransferList from "./components/stocks/StockTransferList";
import RecordStock from "./components/stocks/RecordStock";
import StockTransition from "./components/stocks/StockTransaction";
import RecordStockSales from "./components/stocks/RecordStockSales";
import Analysis from "./components/dashboard/Analysis";
import PrintExpanse from "./components/expanses/PrintExpanse";
import LoginForm from "./components/logins/LoginForm";
import Register from "./components/logins/Register";
import Settings from "./components/settings/Settings";
import CreateExpanses from "./views/expanses/CreateExpanses";
import UpdateOrders from "./views/orders/UpdateOrders";
import EMenu from "./components/EMenu";
import RegisterForm from "./components/logins/RegisterForm";
import StockDetail from "./components/stocks/StockDetails";
import UserProfile from "./components/logins/UserProfile";
import UserDetails from "./components/logins/UserDetails";
import ItemDetails from "./components/items/ItemDetails";
import CreateItems from "./views/items/CreateItems";
import OrderReceipt from "./components/orders/OrderReceipt";
import Notification from "./components/notifications/page";
import OrderOnline from "./components/notifications/orderOnline";
import SaleOnline from "./components/orders/SaleOnline";
import OrderDetails from "./components/notifications/orderDetails";
import WasteItemDetail from "./components/notifications/WasteItemDetail";
import Permission from "./components/settings/Permission";
import ImportItems from "./components/items/ImportItems";
import Menus from "./components/settings/Menus";
import Reports from "./components/Reports/Reports";
import SaleReportByCustomer from "./components/Reports/SaleReportByCustomer";
import SaleReportByItem from "./components/Reports/SaleReportByItem";
import Purchases from "./components/Purchases/PurchaseList";
import CreatePurchase from "./views/Purchases/CreatePurchase";
import SupplierList from "./components/Suppliers/SupplierList";
import SupplierForm from "./views/Suppliers/SupplierForm";
import PurchaseReceipt from "./components/Purchases/PurchaseReceipt";
import PurchaseReport from "./components/Reports/PurchaseReport";
import CodeScanner from "./components/orders/CodeScanner";
import PurchaseReportByItem from "./components/Reports/PurchaseByItem";
import ExpenseReportByUser from "./components/Reports/ExpanseReport";
import ExchangeRateForm from "./components/ExchangeRate";
import Dashboard from "./components/dashboard/Dashboard";
import CustomerList from "./components/customers/CustomerList";
import CustomerForm from "./components/customers/CustomerForm";
import RoleList from "./components/Roles/RoleList";
import RoleForm from "./components/Roles/RoleForm";
import OrderInvoice from "./components/orders/OrderInvoice";
import Page from "./markets/Page";
import Main from "./markets/Main";
import ErrorPage from "./components/ErrorPage";
import QuotationForm from "./components/quotations/QuotationForm";
import QuotationList from "./components/quotations/QuotationList";
import QuotationDetail from "./components/quotations/QuotationDetail";
import QuotationReceipt from "./components/quotations/QuotationReceipt";
import StockTransferDetail from "./components/stocks/StockTransferDetail";
import GuestOrderTracking from "./components/orders/GuestOrderTracking";
import DeliverForm from "./components/delivers/DeliverForm";
import DeliverList from "./components/delivers/DeliverList";
import OrderTracking from "./components/orders/OrderTracking";
import ForgotPassword from "./components/logins/ForgotPassword";
import RawMaterials from "./components/RawMaterials/RawMaterialPage";
import RawMaterialForm from "./components/RawMaterials/RawMaterialForm";
import ProductionForm from "./components/productions/ProductionForm";
import Production from "./components/productions/Production";
import ProductionDetail from "./components/productions/ProductionDetail";
import RawMaterialDetail from "./components/RawMaterials/RawMaterialDetail";
import { useGetAllOrderQuery, useGetOrderByUserQuery } from "../app/Features/ordersSlice";
import { useGetAllItemInStockQuery, useGetAllItemsQuery } from "../app/Features/itemsSlice";
import { useGetAllUserQuery } from "../app/Features/usersSlice";
import { useGetAllSaleQuery } from "../app/Features/salesSlice";
import { useGetAllOrderOnlineQuery, useGetAllWasteQuery } from "../app/Features/notificationSlice";
import Echo from "./echo";
import { toast } from "react-toastify";
import { useEffect } from "react";
import RawMaterialReport from "./components/Reports/RawMaterialReport";
import ProfitAnalysis from "./components/Reports/AnalysisProfit";


function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginForm />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Management />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "analystic",
        index: 1,
        element: <Dashboard />,
      },
      {
        path: "exchange_rate",
        element: <ExchangeRateForm />,
      },
      {
        path: "list",
        element: <ListItem />,
      },
      {
        path: "list/create",
        element: <CreateItems />,
      },
      {
        path: "list/update/:id",
        element: <CreateItems />,
      },
      {
        path: "list/detail/:id",
        element: <ItemDetails />,
      },
      {
        path: "list/import",
        element: <ImportItems />,
      },
      {
        path: "category",
        element: <CategoryList />,
      },
      {
        path: "brand",
        element: <Brands />,
      },
      {
        path: "scale",
        element: <Scales />,
      },
      {
        path: "werehouse",
        element: <Werehouses />,
      },
      {
        path: "stock-type",
        element: <StockType />,
      },
      //customers
      {
        path: "customers",
        element: <CustomerList />,
      },
      {
        path: "customers/create",
        element: <CustomerForm />,
      },
      {
        path: "customers/edit/:id",
        element: <CustomerForm />,
      },
      {
        path: "expanse",
        element: <Expanses />,
        children: [
          {
            path: "create",
            element: <CreateExpanses />,
          },
          {
            path: "update",
            element: <CreateExpanses />,
          },
        ],
      },
      {
        path: "expanse-type",
        element: <ExpansesType />,
      },
      {
        path: "setting",
        element: <Settings />,
      },
      {
        path: "orders",
        element: <Sales />,
      },
      {
        path: "order-tracking",
        element: <OrderTracking />,
      },
      {
        path: "order-list/edit/:id",
        element: <UpdateOrders />,
      },
      {
        path: "order-list/receipt/:id",
        element: <OrderReceipt />,
      },
      {
        path: "order-list/invoice/:id",
        element: <OrderInvoice />,
      },
      {
        path: "order-list",
        element: <OrderList />,
      },
      {
        path: "stock-list",
        element: <Stocks />,
      },
      {
        path: "add-to-stock",
        element: <AddInStock />,
      },
      {
        path: "stock-list/detail/:id",
        element: <StockDetail />,
      },
      {
        path: "stock-list/update/:id",
        element: <AddInStock />,
      },
      {
        path: "stock-transfer-list",
        element: <StockTransferList />,
      },
      {
        path: "stock-transfer-list/detail/:id",
        element: <StockTransferDetail />,
      },
      {
        path: "stock-transfer-list/update/:id",
        element: <StockTransfer />,
      },
      {
        path: "transfer-stock",
        element: <StockTransfer />,
      },
      {
        path: "record-stock",
        element: <RecordStock />,
      },
      {
        path: "record-stock-sale",
        element: <RecordStockSales />,
      },
      {
        path: "stock-transition",
        element: <StockTransition />,
      },
      {
        path: "analyze-stock",
        element: <Analysis />,
      },
      {
        path: "e-menu",
        element: <EMenu />,
      },
      {
        path: "code-scanner",
        element: <CodeScanner />,
      },
      {
        path: "notification",
        element: <Notification />,
      },
      {
        path: "detail-notification/:id",
        element: <OrderDetails />,
      },
      {
        path: "detail-waste/:id",
        element: <WasteItemDetail />,
      },
      {
        path: "users",
        element: <Register />,
      },
      {
        path: "user_detail/:id",
        element: <UserDetails />,
      },
      {
        path: "profile/:id",
        element: <UserProfile />,
      },
      {
        path: "register",
        element: <RegisterForm />,
      },
      {
        path: "permission",
        element: <Permission />,
      },
      {
        path: "menus",
        element: <Menus />,
      },
      {
        path: "report",
        element: <Reports />,
      },
      {
        path: "report/sales",
        element: <SaleReportByCustomer />,
      },
      {
        path: "report/sales_item",
        element: <SaleReportByItem />,
      },
      {
        path: "report/purchases",
        element: <PurchaseReport />,
      },
      {
        path: "report/purchase-item",
        element: <PurchaseReportByItem />,
      },
      {
        path: "report/expenses",
        element: <ExpenseReportByUser />,
      },
      {
        path: "report/raw-materials",
        element: <RawMaterialReport />,
      },
      {
        path: "report/analysis-profit",
        element: <ProfitAnalysis />,
      },
      {
        path: "purchases",
        element: <Purchases />,
      },
      {
        path: "add-purchase",
        element: <CreatePurchase />,
      },
      {
        path: "purchases/update/:id",
        element: <CreatePurchase />,
      },
      {
        path: "purchases/receipt/:id",
        element: <PurchaseReceipt />,
      },

      {
        path: "suppliers",
        element: <SupplierList />,
      },
      {
        path: "suppliers",
        element: <SupplierList />,
      },
      {
        path: "suppliers/create",
        element: <SupplierForm />,
      },
      {
        path: "suppliers/edit/:id",
        element: <SupplierForm />,
      },
      //roles
      {
        path: "roles",
        element: <RoleList />,
      },
      {
        path: "roles/create",
        element: <RoleForm />,
      },
      {
        path: "roles/edit/:id",
        element: <RoleForm />,
      },
      {
        path: "quotations/create",
        element: <QuotationForm />,
      },
      {
        path: "quotations/edit/:id",
        element: <QuotationForm />,
      },
      {
        path: "quotations",
        element: <QuotationList />,
      },
      {
        path: "quotations/detail/:id",
        element: <QuotationDetail />,
      },
      {
        path: "quotations/receipt/:id",
        element: <QuotationReceipt />,
      },
      {
        path: "deliver/create",
        element: <DeliverForm />,
      },
      {
        path: "deliver/edit/:id",
        element: <DeliverForm />,
      },
      {
        path: "delivers",
        element: <DeliverList />,
      },
      {
        path: "raw-materials",
        element: <RawMaterials />,
      },
      {
        path: "raw-materials/create",
        element: <RawMaterialForm />,
      },

      {
        path: "raw-materials/edit/:id",
        element: <RawMaterialForm />,
      },
      {
        path: "raw-materials/view/:id",
        element: <RawMaterialDetail />,
      },
      {
        path: "production",
        element: <Production />,
      },
      {
        path: "production/create/",
        element: <ProductionForm />,
      },
      {
        path: "production/edit/:id",
        element: <ProductionForm />,
      },
      {
        path: "production/view/:id",
        element: <ProductionDetail />,
      },

    ],
  },
  {
    path: "/expanse-print/:id",
    element: <PrintExpanse />,
  },
  {
    path: "/:token/order-now/:id",
    element: <SaleOnline />,
  },
  {
    path: "/:token/order-now/:id/order-tracking",
    element: <GuestOrderTracking />,
  },
  {
    path: "/market",
    element: <Main />,
  },
]
);



function App() {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const guestId = localStorage.getItem('guestId');
  const profileId = localStorage.getItem('profileId');
  const { data: dataWaste, isLoading, refetch } = useGetAllWasteQuery(token);
  const { data: dataOrderOnline, isLoading: isLoadingOnline, refetch: refetchOnline } = useGetAllOrderOnlineQuery(token);
  const { refetch: refetchOrder } = useGetAllOrderQuery(token);
  const { refetch: refetchSale } = useGetAllSaleQuery({
    token,
    limit: 10,
    page: 1,
    search: ''
  });
  const { refetch: refetchItem } = useGetAllItemsQuery({
    token,
    limit: 10,
    page: 1,
    search: ''
  });
  const { refetch: refetchGuestOrder } = useGetOrderByUserQuery({ id: guestId, token });
  // const { refetch: refetchItemInStock } = useGetAllItemInStockQuery(token);
  // const { refetch: userRefetch } = useGetAllUserQuery(token);

  useEffect(() => {
    Echo.private(`my-private-channel.user.${profileId}`).listen("PrivateChannelEvent", (data) => {
      // const audio = new Audio("../../public/sounds/auto.wav");
      const audio = new Audio("/sounds/auto.wav");
      audio.currentTime = 0; // restart from beginning
      audio.play().catch((err) => console.log("🔇 Sound blocked:", err));
      console.log("📡 Event received:", data); // 👈 Debug first
      toast.info(`💬 New orders by ${data.data}`);
      refetch();
      refetchOnline();
      refetchSale();
      refetchItem();
      // refetchItemInStock();
    });
    Echo.private(`check-online.user.${profileId}`).listen("OnlineEvent", (data) => {
      // refetch();
      toast.info(`💬 Order tracking updated ${data.data}`);
      refetchSale();
      refetchGuestOrder();
      refetchOnline();
      refetchOrder();
    });
    Echo.channel("my-public-channel").listen("PublicChannelEvent", (data) => {
      const audio = new Audio("/sounds/auto.wav");
      audio.currentTime = 0; // restart from beginning
      audio.play().catch((err) => console.log("🔇 Sound blocked:", err));
      console.log("📡 Event received:", data); // 👈 Debug first
      toast.info(`💬 New orders by ${data.message}`);
    });

  }, []);

  return (
    <RouterProvider router={router}></RouterProvider>
  );
}

export default App;
