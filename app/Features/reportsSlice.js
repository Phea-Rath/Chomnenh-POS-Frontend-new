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
        getPurchaseByUserReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/purchase_report_user', token),
        }),
        getExpanseReport: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/expanse_report', token),
        }),

    }),
});

export const {
    useGetSaleByCustomerReportMutation,
    useGetSaleByItemReportMutation,
    useGetPurchaseByUserReportMutation,
    useGetExpanseReportMutation
} = reportsApi;