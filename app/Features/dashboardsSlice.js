import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  queryData,
  queryDataById,
  createData,
  updateData,
  deleteData,
} from "../api";
import { url } from "../api";
export const dashboardsApi = createApi({
  reducerPath: "dashboard",
  baseQuery: fetchBaseQuery({
    baseUrl: url,
  }),
  endpoints: (builder) => ({
    getAllDashboardStock: builder.query({
      query: (token) => queryData("/stock_card", token),
    }),
    getDashboardStockByDate: builder.mutation({
      query: ({ itemData, token }) =>
        createData(itemData, "/stock_graphic", token),
    }),
    // createBrand: builder.mutation({
    //     query: ({ itemData, token }) => createData(itemData, '/brands', token),
    // }),
    getSaleByMonth: builder.query({
      query: (token) => queryData("/sale_by_month", token),
    }),
    getSaleByWeek: builder.query({
      query: (token) => queryData("/sale_by_week", token),
    }),
    getSaleByDay: builder.query({
      query: (token) => queryData("/sale_by_day", token),
    }),
    getSaleByHour: builder.query({
      query: (token) => queryData("/sale_by_hour", token),
    }),
    getPurchaseByMonth: builder.query({
      query: (token) => queryData("/purchase_by_month", token),
    }),
    getPurchaseByWeek: builder.query({
      query: (token) => queryData("/purchase_by_week", token),
    }),
    getPurchaseByDay: builder.query({
      query: (token) => queryData("/purchase_by_day", token),
    }),
    getPurchaseByHour: builder.query({
      query: (token) => queryData("/purchase_by_hour", token),
    }),
    getExpanseByMonth: builder.query({
      query: (token) => queryData("/expanse_by_month", token),
    }),
    getExpanseByWeek: builder.query({
      query: (token) => queryData("/expanse_by_week", token),
    }),
    getExpanseByDay: builder.query({
      query: (token) => queryData("/expanse_by_day", token),
    }),
    getExpanseByHour: builder.query({
      query: (token) => queryData("/expanse_by_hour", token),
    }),
  }),
});

export const {
  useGetAllDashboardStockQuery,
  useGetDashboardStockByDateMutation,
  useGetSaleByMonthQuery,
  useGetSaleByWeekQuery,
  useGetSaleByDayQuery,
  useGetSaleByHourQuery,
  useGetPurchaseByMonthQuery,
  useGetPurchaseByWeekQuery,
  useGetPurchaseByDayQuery,
  useGetPurchaseByHourQuery,
  useGetExpanseByMonthQuery,
  useGetExpanseByWeekQuery,
  useGetExpanseByDayQuery,
  useGetExpanseByHourQuery,
} = dashboardsApi;
