import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  queryData,
  queryDataById,
  createData,
  updateData,
  deleteData,
} from "../api";
import { url } from "../api";

const withYear = (path, args) => {
  const token = typeof args === "string" ? args : args?.token;
  const year = typeof args === "object" ? args?.year : undefined;
  const qs = year ? `?year=${year}` : "";
  return queryData(`${path}${qs}`, token);
};
export const dashboardsApi = createApi({
  reducerPath: "dashboard",
  baseQuery: fetchBaseQuery({
    baseUrl: url,
  }),
  endpoints: (builder) => ({
    getAllDashboardStock: builder.query({
      query: (args) => withYear("/stock_card", args),
    }),
    getDashboardStockByDate: builder.mutation({
      query: ({ itemData, token }) =>
        createData(itemData, "/stock_graphic", token),
    }),
    // createBrand: builder.mutation({
    //     query: ({ itemData, token }) => createData(itemData, '/brands', token),
    // }),
    getSaleByMonth: builder.query({
      query: (args) => withYear("/sale_by_month", args),
    }),
    getSaleByWeek: builder.query({
      query: (args) => withYear("/sale_by_week", args),
    }),
    getSaleByDay: builder.query({
      query: (args) => withYear("/sale_by_day", args),
    }),
    getSaleByHour: builder.query({
      query: (args) => withYear("/sale_by_hour", args),
    }),
    getPurchaseByMonth: builder.query({
      query: (args) => withYear("/purchase_by_month", args),
    }),
    getPurchaseByWeek: builder.query({
      query: (args) => withYear("/purchase_by_week", args),
    }),
    getPurchaseByDay: builder.query({
      query: (args) => withYear("/purchase_by_day", args),
    }),
    getPurchaseByHour: builder.query({
      query: (args) => withYear("/purchase_by_hour", args),
    }),
    getExpanseByMonth: builder.query({
      query: (args) => withYear("/expense_by_month", args),
    }),
    getExpanseByWeek: builder.query({
      query: (args) => withYear("/expense_by_week", args),
    }),
    getExpanseByDay: builder.query({
      query: (args) => withYear("/expense_by_day", args),
    }),
    getExpanseByHour: builder.query({
      query: (args) => withYear("/expense_by_hour", args),
    }),
    getProfiteByMonth: builder.query({
      query: (args) => withYear("/profite_by_month", args),
    }),
    getProfiteByWeek: builder.query({
      query: (args) => withYear("/profite_by_week", args),
    }),
    getProfiteByDay: builder.query({
      query: (args) => withYear("/profite_by_day", args),
    }),
    getProfiteByHour: builder.query({
      query: (args) => withYear("/profite_by_hour", args),
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
  useGetProfiteByMonthQuery,
  useGetProfiteByWeekQuery,
  useGetProfiteByDayQuery,
  useGetProfiteByHourQuery,
} = dashboardsApi;
