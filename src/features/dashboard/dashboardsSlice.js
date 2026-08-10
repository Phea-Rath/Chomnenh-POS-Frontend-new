import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  queryData,
  createData,
} from "@/app/api";
import { url } from "@/app/api";

const withYear = (path, args) => {
  const token = typeof args === "string" ? args : args?.token;
  const year = typeof args === "object" ? args?.year : undefined;
  const qs = year ? `?year=${year}` : "";
  return queryData(`${path}${qs}`, token);
};

const withDashboardFilter = ({ token, operation, start_date, end_date, user_id }) => {
  // const params = new URLSearchParams();

  // if (operation) params.append("operation", operation);
  // if (start_date) params.append("start_date", start_date);
  // if (end_date) params.append("end_date", end_date);
  // if (user_id) params.append("user_id", user_id);

  // const qs = params.toString();
  return createData({ operation, start_date, end_date, user_id }, `/dashboard_filter`, token);
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
    getDashboardFilter: builder.query({
      query: (args) => withDashboardFilter(args),
    }),
  }),
});

export const {
  useGetAllDashboardStockQuery,
  useGetDashboardStockByDateMutation,
  useGetDashboardFilterQuery,
} = dashboardsApi;
