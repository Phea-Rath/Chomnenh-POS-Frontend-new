import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from "@/app/api";
import { url } from "@/app/api";
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
            query: ({ itemData, token }) => createData(itemData, '/expense_report', token),
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
        getProductionByItemReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/production_report_item', token),
        }),
        getStockReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/stock_report', token),
        }),
        getStockByItemReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/stock_report_item', token),
        }),
        getAPReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/ap-report', token),
        }),
        getARReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/ar-report', token),
        }),
        getDebtAnalysis: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/debt-analysis', token),
        }),
        getStockByRawReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/stock_report_raw', token),
        }),
        getIncomeStatement: builder.query({
            query: ({token, start_date, end_date}) => queryData(`/income-statement?start_date=${start_date}&end_date=${end_date}`, token),
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
    useGetProductionByRawReportMutation,
    useGetStockReportMutation,
    useGetStockByItemReportMutation,
    useGetProductionByItemReportMutation,
    useGetAPReportMutation,
    useGetARReportMutation,
    useGetDebtAnalysisMutation,
    useGetStockByRawReportMutation,
    useGetIncomeStatementQuery
} = reportsApi;
