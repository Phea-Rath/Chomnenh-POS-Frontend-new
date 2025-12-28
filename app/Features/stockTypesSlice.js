import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const stockTypesApi = createApi({
    reducerPath: 'stockTypes',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllStockTypes: builder.query({
            query: (token) => queryData('/stock_types', token),
        }),
        getStockTypeById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/stock_types', token),
        }),
        createStockType: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/stock_types', token),
        }),
        updateStockType: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/stock_types', token),
        }),
        deleteStockType: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/stock_types', token),
        }),
    }),
});

export const {
    useGetAllStockTypesQuery,
    useGetStockTypeByIdQuery,
    useCreateStockTypeMutation,
    useUpdateStockTypeMutation,
    useDeleteStockTypeMutation
} = stockTypesApi;