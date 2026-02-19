import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const reportsApi = createApi({
    reducerPath: 'reports',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({

        getSaleByCustomerReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/sale_report', token),
        }),
        getSaleByItemReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/sale_report_item', token),
        }),
        getPurchaseByItemReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/purchase_report_item', token),
        }),
        getPurchaseReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/purchase_report', token),
        }),
        getExpanseReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/expanse_report', token),
        }),
        getRawMaterialReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/raw_material_report', token),
        }),
        getProductionReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/production_report', token),
        }),
        getProductionByRawReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/production_report_raw', token),
        }),

    }),
});

export const {
    useGetSaleByCustomerReportMutation,
    useGetSaleByItemReportMutation,
    useGetPurchaseByItemReportMutation,
    useGetPurchaseReportMutation,
    useGetExpanseReportMutation,
    useGetRawMaterialReportMutation,
    useGetProductionReportMutation,
    useGetProductionByRawReportMutation
} = reportsApi;
