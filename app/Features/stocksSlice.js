import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  queryData,
  queryDataById,
  createData,
  updateData,
  deleteData,
} from "../api";
import { url } from "../api";
export const stocksApi = createApi({
  reducerPath: "stocks",
  baseQuery: fetchBaseQuery({
    baseUrl: url,
  }),
  endpoints: (builder) => ({
    getAllStock: builder.query({
      query: (token) => queryData("/stock_masters", token),
    }),
    getPopularStock: builder.query({
      query: (token) => queryData("/popular_stock", token),
    }),
    getStockById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/stock_masters", token),
    }),
    getStockByOrderId: builder.query({
      query: ({ id, token }) => queryDataById(id, "/stock", token),
    }),
    createStock: builder.mutation({
      query: ({ itemData, token }) =>
        createData(itemData, "/stock_masters", token),
    }),
    updateStock: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/stock_masters", token),
    }),
    deleteStock: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/stock_masters", token),
    }),
  }),
});

export const {
  useGetAllStockQuery,
  useGetStockByIdQuery,
  useCreateStockMutation,
  useUpdateStockMutation,
  useDeleteStockMutation,
  useGetStockByOrderIdQuery,
  useGetPopularStockQuery,
} = stocksApi;
