import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  queryData,
  queryDataById,
  createData,
  updateData,
  deleteData,
} from "../api";
import { url } from "../api";
export const exchangeRatesApi = createApi({
  reducerPath: "exchangeRates",
  baseQuery: fetchBaseQuery({
    baseUrl: url,
  }),
  endpoints: (builder) => ({
    getExchangeRateById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/exchange_rate", token),
    }),
    updateExchangeRate: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/exchange_rate", token),
    }),
  }),
});

export const { useGetExchangeRateByIdQuery, useUpdateExchangeRateMutation } =
  exchangeRatesApi;
