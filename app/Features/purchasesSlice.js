import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  queryData,
  queryDataById,
  createData,
  updateData,
  deleteData,
  cancelData,
} from "../api";
import { url } from "../api";
export const purchasesApi = createApi({
  reducerPath: "purchases",
  baseQuery: fetchBaseQuery({
    baseUrl: url,
  }),
  endpoints: (builder) => ({
    getAllPurchase: builder.query({
      query: ({ token, limit, page, search }) => queryData(`/purchase?limit=${limit}&page=${page}&search=${search}`, token),
    }),
    getAllPurchaseRaw: builder.query({
      query: ({ token, limit, page, search }) => queryData(`/purchase_raw_list?limit=${limit}&page=${page}&search=${search}`, token),
    }),
    getPurchaseById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/purchase", token),
    }),
    getPurchaseRawById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/purchase_raw", token),
    }),
    createPurchase: builder.mutation({
      query: ({ itemData, token }) => createData(itemData, "/purchase", token),
    }),
    updatePurchase: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/purchase", token),
    }),
    paymentPurchase: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/purchase_payment", token),
    }),
    cancelPurchase: builder.mutation({
      query: ({ id, token }) => cancelData(id, "/purchase_cancel", token),
    }),
    uncancelPurchase: builder.mutation({
      query: ({ id, token }) => cancelData(id, "/purchase_uncancel", token),
    }),
    confirmPurchase: builder.mutation({
      query: ({ id, token }) => cancelData(id, "/purchase_confirm", token),
    }),
    confirmPurchaseRaw: builder.mutation({
      query: ({ id, token }) => cancelData(id, "/purchase_confirm_raw", token),
    }),
    deletePurchase: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/purchase", token),
    }),
    deletePurchaseRaw: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/purchase_raw", token),
    }),
  }),
});

export const {
  useGetAllPurchaseQuery,
  useGetPurchaseByIdQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useDeletePurchaseMutation,
  useCancelPurchaseMutation,
  useConfirmPurchaseMutation,
  useUncancelPurchaseMutation,
  usePaymentPurchaseMutation,
  useGetAllPurchaseRawQuery,
  useConfirmPurchaseRawMutation,
  useDeletePurchaseRawMutation,
} = purchasesApi;
