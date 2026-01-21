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
import { store } from "../app/store";
import { Provider } from "react-redux";
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
import PurchaseReportByUser from "./components/Reports/PurchaseByUser";
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
        path: "purchases/report",
        element: <PurchaseReport />,
      },
      {
        path: "purchases/report_user",
        element: <PurchaseReportByUser />,
      },
      {
        path: "expanse/report",
        element: <ExpenseReportByUser />,
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
    ],
  },
  {
    path: "/expanse-print",
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
  return (
    <Provider store={store} >
      <RouterProvider router={router}></RouterProvider>
    </Provider>
  );
}

export default App;
