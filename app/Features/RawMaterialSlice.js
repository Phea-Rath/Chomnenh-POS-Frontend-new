import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const rawMaterialsApi = createApi({
    reducerPath: 'rawMaterials',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllRawMaterial: builder.query({
            query: ({ limit = 10, page = 1, search, token }) => queryData(`/raw_materials?limit=${limit}&page=${page}&search=${search}`, token),
        }),
        getRawMaterialById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/raw_materials', token),
        }),
        createRawMaterial: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/raw_materials', token),
        }),
        updateRawMaterial: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/raw_materials', token),
        }),
        deleteRawMaterial: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/raw_materials', token),
        }),
        getTopRawMaterials: builder.query({
            query: ({ token, filter = 'quantity', limit = 5, operation }) => queryData(`/top-raw-materials?filter=${filter}&limit=${limit}&operation=${operation}`, token),
        }),
    }),
});

export const {
    useGetAllRawMaterialQuery,
    useGetRawMaterialByIdQuery,
    useCreateRawMaterialMutation,
    useUpdateRawMaterialMutation,
    useDeleteRawMaterialMutation,
    useGetTopRawMaterialsQuery,
} = rawMaterialsApi;