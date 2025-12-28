import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const stockDetailsApi = createApi({
    reducerPath: 'stockDetails',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllStockDetail: builder.query({
            query: (token) => queryData('/stock_details', token),
        }),
        getStockDetailById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/stock_details', token),
        }),
        createStockDetail: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/stock_details', token),
        }),
        updateStockDetail: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/stock_details', token),
        }),
        deleteStockDetail: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/stock_details', token),
        }),
    }),
});

export const {
    useGetAllStockDetailQuery,
    useGetStockDetailByIdQuery,
    useCreateStockDetailMutation,
    useUpdateStockDetailMutation,
    useDeleteStockDetailMutation
} = stockDetailsApi;