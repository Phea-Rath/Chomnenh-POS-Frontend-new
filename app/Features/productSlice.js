import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const productionsApi = createApi({
    reducerPath: 'productions',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllProduction: builder.query({
            query: ({ token, limit = 12, page = 1, search }) => queryData(`/production?limit=${limit}&page=${page}&search=${search}`, token),
        }),
        getProductionById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/production', token),
        }),
        createProduction: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/production', token),
        }),
        updateProduction: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/production', token),
        }),
        deleteProduction: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/production', token),
        }),
    }),
});

export const {
    useGetAllProductionQuery,
    useGetProductionByIdQuery,
    useCreateProductionMutation,
    useUpdateProductionMutation,
    useDeleteProductionMutation
} = productionsApi;