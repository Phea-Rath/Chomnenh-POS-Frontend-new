import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const attributesApi = createApi({
    reducerPath: 'attributes',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllAttribute: builder.query({
            query: (token) => queryData('/attributes', token),
        }),
        getAttributeById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/attributes', token),
        }),
        createAttribute: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/attributes', token),
        }),
        updateAttribute: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/attributes', token),
        }),
        deleteAttribute: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/attributes', token),
        }),
    }),
});

export const {
    useGetAllAttributeQuery,
    useGetAttributeByIdQuery,
    useCreateAttributeMutation,
    useUpdateAttributeMutation,
    useDeleteAttributeMutation
} = attributesApi;