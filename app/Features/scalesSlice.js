import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const scalesApi = createApi({
    reducerPath: 'scales',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllScales: builder.query({
            query: (token) => queryData('/scales', token),
        }),
        getScaleById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/scales', token),
        }),
        createScale: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/scales', token),
        }),
        updateScale: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/scales', token),
        }),
        deleteScale: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/scales', token),
        }),
    }),
});
export const {
    useGetAllScalesQuery,
    useGetScaleByIdQuery,
    useCreateScaleMutation,
    useUpdateScaleMutation,
    useDeleteScaleMutation
} = scalesApi;