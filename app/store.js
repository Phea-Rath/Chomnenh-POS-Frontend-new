import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { brandsApi } from "./Features/brandsSlice";
import { categoryApi } from "./Features/categoriesSlice";
import { scalesApi } from "./Features/scalesSlice";
import { colorsApi } from "./Features/colorsSlice";
import { itemsApi } from "./Features/itemsSlice";
import { stockTypesApi } from "./Features/stockTypesSlice";
import { expanseTypesApi } from "./Features/expanseTypesSlice";
import { expansesApi } from "./Features/expansesSlice";
import { warehousesApi } from "./Features/warehousesSlice";
import { sizesApi } from "./Features/sizesSlice";
import { stocksApi } from "./Features/stocksSlice";
import { salesApi } from "./Features/salesSlice";
import { stockDetailsApi } from "./Features/stockDetailsSlice";
import { ordersApi } from "./Features/ordersSlice";
import { usersApi } from "./Features/usersSlice";
import { dashboardsApi } from "./Features/dashboardsSlice";
import { userProfileApi } from "./Features/userProfileSlice";
import { notificationsApi } from "./Features/notificationSlice";
import { menusApi } from "./Features/menusSlice";
import { permissionsApi } from "./Features/permissionSlice";
import { reportsApi } from "./Features/reportsSlice";
import { purchasesApi } from "./Features/purchasesSlice";
import { suppliersApi } from "./Features/suppliesSlice";
import { customersApi } from "./Features/customersSlice";
import { rolesApi } from "./Features/rolesSlice";
import { exchangeRatesApi } from "./Features/exchangeRatesSlice";
import { attributesApi } from "./Features/attributesSlice";
import { quanApi } from "./Features/quantitySlice";
import { quotesApi } from "./Features/quoteSlice";
import { deliversApi } from "./Features/deliversSlice";
export const store = configureStore({
  reducer: {
    [brandsApi.reducerPath]: brandsApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [scalesApi.reducerPath]: scalesApi.reducer,
    [colorsApi.reducerPath]: colorsApi.reducer,
    [itemsApi.reducerPath]: itemsApi.reducer,
    [stockTypesApi.reducerPath]: stockTypesApi.reducer,
    [expanseTypesApi.reducerPath]: expanseTypesApi.reducer,
    [expansesApi.reducerPath]: expansesApi.reducer,
    [warehousesApi.reducerPath]: warehousesApi.reducer,
    [sizesApi.reducerPath]: sizesApi.reducer,
    [stocksApi.reducerPath]: stocksApi.reducer,
    [salesApi.reducerPath]: salesApi.reducer,
    [stockDetailsApi.reducerPath]: stockDetailsApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [dashboardsApi.reducerPath]: dashboardsApi.reducer,
    [userProfileApi.reducerPath]: userProfileApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [menusApi.reducerPath]: menusApi.reducer,
    [permissionsApi.reducerPath]: permissionsApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    [purchasesApi.reducerPath]: purchasesApi.reducer,
    [suppliersApi.reducerPath]: suppliersApi.reducer,
    [customersApi.reducerPath]: customersApi.reducer,
    [rolesApi.reducerPath]: rolesApi.reducer,
    [exchangeRatesApi.reducerPath]: exchangeRatesApi.reducer,
    [attributesApi.reducerPath]: attributesApi.reducer,
    [quanApi.reducerPath]: quanApi.reducer,
    [quotesApi.reducerPath]: quotesApi.reducer,
    [deliversApi.reducerPath]: deliversApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      colorsApi.middleware,
      categoryApi.middleware,
      brandsApi.middleware,
      scalesApi.middleware,
      itemsApi.middleware,
      stockTypesApi.middleware,
      expanseTypesApi.middleware,
      expansesApi.middleware,
      warehousesApi.middleware,
      sizesApi.middleware,
      stocksApi.middleware,
      salesApi.middleware,
      stockDetailsApi.middleware,
      ordersApi.middleware,
      usersApi.middleware,
      dashboardsApi.middleware,
      userProfileApi.middleware,
      notificationsApi.middleware,
      menusApi.middleware,
      permissionsApi.middleware,
      reportsApi.middleware,
      purchasesApi.middleware,
      suppliersApi.middleware,
      customersApi.middleware,
      rolesApi.middleware,
      exchangeRatesApi.middleware,
      attributesApi.middleware,
      quanApi.middleware,
      quotesApi.middleware,
      deliversApi.middleware,
    ),
});
setupListeners(store.dispatch);
