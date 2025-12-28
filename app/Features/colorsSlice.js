import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const colorsApi = createApi({
    reducerPath: 'colors',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllColor: builder.query({
            query: (token) => queryData('/colors', token),
        }),
        getColorById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/colors', token),
        }),
        createColor: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/colors', token),
        }),
        updateColor: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/colors', token),
        }),
        deleteColor: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/colors', token),
        }),
    }),
});

export const {
    useGetAllColorQuery,
    useGetColorByIdQuery,
    useCreateColorMutation,
    useUpdateColorMutation,
    useDeleteColorMutation
} = colorsApi;