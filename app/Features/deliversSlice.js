import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const deliversApi = createApi({
    reducerPath: 'delivers',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllDeliver: builder.query({
            query: (token) => queryData('/delivers', token),
        }),
        getDeliverById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/delivers', token),
        }),
        createDeliver: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/delivers', token),
        }),
        updateDeliver: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/delivers', token),
        }),
        deleteDeliver: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/delivers', token),
        }),
    }),
});

export const {
    useGetAllDeliverQuery,
    useGetDeliverByIdQuery,
    useCreateDeliverMutation,
    useUpdateDeliverMutation,
    useDeleteDeliverMutation
} = deliversApi;