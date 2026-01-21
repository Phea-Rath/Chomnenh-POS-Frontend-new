import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const usersApi = createApi({
    reducerPath: 'users',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllUser: builder.query({
            query: (token) => queryData('/users', token),
        }),
        getUserById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/users', token),
        }),
        getUserByProId: builder.query({
            query: ({ id, token }) => queryDataById(id, '/user_by_profile', token),
        }),
        getUserLogin: builder.query({
            query: (token) => queryData('/user_login', token),
        }),
        getUserProfile: builder.query({
            query: ({ id, token }) => queryDataById(id, '/profiles', token),
        }),
        createUser: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/users', token),
        }),
        updateUser: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/users', token),
        }),
        deleteUser: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/users', token),
        }),
    }),
});

export const {
    useGetAllUserQuery,
    useGetUserByIdQuery,
    useGetUserByProIdQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
    useGetUserLoginQuery,
    useGetUserProfileQuery
} = usersApi;