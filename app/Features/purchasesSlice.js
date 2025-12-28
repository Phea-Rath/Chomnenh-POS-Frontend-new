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
      query: (token) => queryData("/purchase", token),
    }),
    getPurchaseById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/purchase", token),
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
    deletePurchase: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/purchase", token),
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
} = purchasesApi;
