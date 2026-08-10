import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from "@/app/api";
import { url } from "@/app/api";
export const usersApi = createApi({
    reducerPath: 'users',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    tagTypes: ['Users'],
    endpoints: (builder) => ({
        getAllUser: builder.query({
            query: (token) => queryData(`/users`, token),
            providesTags: (result) =>
                result?.data
                    ? [
                          ...result.data.map(({ id, user_id }) => ({ type: 'Users', id: id || user_id })),
                          { type: 'Users', id: 'LIST' },
                      ]
                    : [{ type: 'Users', id: 'LIST' }],
        }),
        getUserById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/users', token),
            providesTags: (result, error, { id }) => [{ type: 'Users', id }],
        }),
        getUserByProId: builder.query({
            query: ({ id, token }) => queryDataById(id, '/user_by_profile', token),
            providesTags: [{ type: 'Users', id: 'LIST' }],
        }),
        getCurrentProfile: builder.query({
            query: (token ) => queryData('/profiles', token),
            providesTags: [{ type: 'Users', id: 'LIST' }],
        }),
        getUserLogin: builder.query({
            query: (token) => queryData('/user_login', token),
            providesTags: [{ type: 'Users', id: 'LIST' }],
        }),
        getUserProfile: builder.query({
            query: ({ id, token }) => queryDataById(id, '/profiles', token),
            providesTags: [{ type: 'Users', id: 'LIST' }],
        }),
        createUser: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/users', token),
            invalidatesTags: [{ type: 'Users', id: 'LIST' }],
        }),
        updateUser: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/users', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Users', id },
                { type: 'Users', id: 'LIST' },
            ],
        }),
        deleteUser: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/users', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Users', id },
                { type: 'Users', id: 'LIST' },
            ],
            async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    usersApi.util.updateQueryData('getAllUser', undefined, (draft) => {
                        if (draft?.data) {
                            draft.data = draft.data.filter(
                                (item) => String(item.id || item.user_id) !== String(id)
                            );
                        }
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
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
    useGetUserProfileQuery,
    useGetCurrentProfileQuery,
} = usersApi;