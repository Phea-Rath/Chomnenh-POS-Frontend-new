import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const permissionsApi = createApi({
    reducerPath: 'permissions',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllPermission: builder.query({
            query: (token) => queryData('/permission', token),
        }),
        getPermissionById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/permission', token),
        }),
        createPermission: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/permission', token),
        }),
        // updatePermission: builder.mutation({
        //     query: ({ id, itemData, token }) => updateData(id, itemData, '/permission', token),
        // }),
        // deletePermission: builder.mutation({
        //     query: ({ id, token }) => deleteData(id, '/permission', token),
        // }),
    }),
});

export const {
    useGetAllPermissionQuery,
    useGetPermissionByIdQuery,
    useCreatePermissionMutation,
    useUpdatePermissionMutation,
    useDeletePermissionMutation
} = permissionsApi;