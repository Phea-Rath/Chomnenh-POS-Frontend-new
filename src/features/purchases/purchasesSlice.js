import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  queryData,
  queryDataById,
  createData,
  updateData,
  deleteData,
  cancelData,
} from "@/app/api";
import { url } from "@/app/api";
export const purchasesApi = createApi({
  reducerPath: "purchases",
  baseQuery: fetchBaseQuery({
    baseUrl: url,
  }),
  tagTypes: ["Purchases"],
  endpoints: (builder) => ({
    getAllPurchase: builder.query({
      query: ({ token, limit, page, search }) => queryData(`/purchase?limit=${limit}&page=${page}&search=${search}`, token),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id, purchase_id }) => ({ type: "Purchases", id: id || purchase_id })),
              { type: "Purchases", id: "LIST" },
            ]
          : [{ type: "Purchases", id: "LIST" }],
    }),
    getAllPurchaseRaw: builder.query({
      query: ({ token, limit, page, search }) => queryData(`/purchase_raw_list?limit=${limit}&page=${page}&search=${search}`, token),
      providesTags: [{ type: "Purchases", id: "LIST" }],
    }),
    getPurchaseById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/purchase", token),
      providesTags: (result, error, { id }) => [{ type: "Purchases", id }],
    }),
    getPurchaseRawById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/purchase_raw", token),
      providesTags: (result, error, { id }) => [{ type: "Purchases", id }],
    }),
    createPurchase: builder.mutation({
      query: ({ itemData, token }) => createData(itemData, "/purchase", token),
      invalidatesTags: [{ type: "Purchases", id: "LIST" }],
    }),
    updatePurchase: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/purchase", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Purchases", id },
        { type: "Purchases", id: "LIST" },
      ],
    }),
    paymentPurchase: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/purchase_payment", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Purchases", id },
        { type: "Purchases", id: "LIST" },
      ],
    }),
    cancelPurchase: builder.mutation({
      query: ({ id, token }) => cancelData(id, "/purchase_cancel", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Purchases", id },
        { type: "Purchases", id: "LIST" },
      ],
    }),
    uncancelPurchase: builder.mutation({
      query: ({ id, token }) => cancelData(id, "/purchase_uncancel", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Purchases", id },
        { type: "Purchases", id: "LIST" },
      ],
    }),
    confirmPurchase: builder.mutation({
      query: ({ id, token }) => cancelData(id, "/purchase_confirm", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Purchases", id },
        { type: "Purchases", id: "LIST" },
      ],
    }),
    confirmPurchaseRaw: builder.mutation({
      query: ({ id, token }) => cancelData(id, "/purchase_confirm_raw", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Purchases", id },
        { type: "Purchases", id: "LIST" },
      ],
    }),
    deletePurchase: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/purchase", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Purchases", id },
        { type: "Purchases", id: "LIST" },
      ],
      async onQueryStarted({ id, queryArgs }, { dispatch, queryFulfilled }) {
        let patchResult;
        if (queryArgs) {
          patchResult = dispatch(
            purchasesApi.util.updateQueryData("getAllPurchase", queryArgs, (draft) => {
              if (draft?.data) {
                draft.data = draft.data.filter(
                  (item) => String(item.id || item.purchase_id) !== String(id)
                );
                if (draft.pagination && typeof draft.pagination.total === "number") {
                  draft.pagination.total -= 1;
                }
              }
            })
          );
        }
        try {
          await queryFulfilled;
        } catch {
          if (patchResult) patchResult.undo();
        }
      },
    }),
    deletePurchaseRaw: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/purchase_raw", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Purchases", id },
        { type: "Purchases", id: "LIST" },
      ],
      async onQueryStarted({ id, queryArgs }, { dispatch, queryFulfilled }) {
        let patchResult;
        if (queryArgs) {
          patchResult = dispatch(
            purchasesApi.util.updateQueryData("getAllPurchaseRaw", queryArgs, (draft) => {
              if (draft?.data) {
                draft.data = draft.data.filter(
                  (item) => String(item.id || item.purchase_id) !== String(id)
                );
                if (draft.pagination && typeof draft.pagination.total === "number") {
                  draft.pagination.total -= 1;
                }
              }
            })
          );
        }
        try {
          await queryFulfilled;
        } catch {
          if (patchResult) patchResult.undo();
        }
      },
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
  useGetPurchaseRawByIdQuery,
} = purchasesApi;
