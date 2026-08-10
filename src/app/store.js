import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import {
  brandsApi,
  categoryApi,
  scalesApi,
  colorsApi,
  itemsApi,
  sizesApi,
  attributesApi,
  quanApi,
  productionsApi,
} from "@/features/products";

import {
  stocksApi,
  stockTypesApi,
  warehousesApi,
  stockDetailsApi,
  rawMaterialsApi,
} from "@/features/stocks";

import {
  expensesApi,
  expenseTypesApi,
} from "@/features/expenses";

import {
  salesApi,
  ordersApi,
  quotesApi,
  deliversApi,
} from "@/features/sales";

import {
  usersApi,
  userProfileApi,
  menusApi,
  permissionsApi,
  rolesApi,
} from "@/features/auth";

import {
  dashboardsApi,
  reportsApi,
} from "@/features/dashboard";

import {
  purchasesApi,
  suppliersApi,
} from "@/features/purchases";

import {
  customersApi,
} from "@/features/customers";

import {
  notificationsApi,
  exchangeRatesApi,
} from "@/features/system";

export const store = configureStore({
  reducer: {
    [brandsApi.reducerPath]: brandsApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [scalesApi.reducerPath]: scalesApi.reducer,
    [colorsApi.reducerPath]: colorsApi.reducer,
    [itemsApi.reducerPath]: itemsApi.reducer,
    [stockTypesApi.reducerPath]: stockTypesApi.reducer,
    [expenseTypesApi.reducerPath]: expenseTypesApi.reducer,
    [expensesApi.reducerPath]: expensesApi.reducer,
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
    [rawMaterialsApi.reducerPath]: rawMaterialsApi.reducer,
    [productionsApi.reducerPath]: productionsApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      colorsApi.middleware,
      categoryApi.middleware,
      brandsApi.middleware,
      scalesApi.middleware,
      itemsApi.middleware,
      stockTypesApi.middleware,
      expenseTypesApi.middleware,
      expensesApi.middleware,
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
      rawMaterialsApi.middleware,
      productionsApi.middleware,
    ),
});

setupListeners(store.dispatch);
export default store;
