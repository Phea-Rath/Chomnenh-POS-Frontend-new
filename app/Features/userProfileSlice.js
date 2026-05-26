import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryDataNoToken, updateData, updateDataByPost } from '../api';
import { url } from '../api';
export const userProfileApi = createApi({
    reducerPath: 'userProfile',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        updateImage: builder.mutation({
            query: ({ id, itemData, path, token }) => updateDataByPost(id, itemData, path, token),
        }),
        updateNumberPhone: builder.mutation({
            query: ({ id, itemData, path, token }) => updateData(id, itemData, path, token),
        }),
        updateName: builder.mutation({
            query: ({ id, itemData, path, token }) => updateData(id, itemData, path, token),
        }),
        updateRole: builder.mutation({
            query: ({ id, itemData, path, token }) => updateData(id, itemData, path, token),
        }),
        updateAddress: builder.mutation({
            query: ({ id, itemData, path, token }) => updateData(id, itemData, path, token),
        }),
        updateQrCode: builder.mutation({
            query: ({ id, itemData, path, token }) => updateDataByPost(id, itemData, path, token),
        }),
        updateTelegramService: builder.mutation({
            query: ({ id, itemData, path, token }) => updateData(id, itemData, path, token),
        }),
        getAllProfile: builder.query({
            query: () => queryDataNoToken('/get-all-profiles'),
        }),
        getProfileById: builder.query({
            query: (id) => queryDataNoToken(`/profile-by-id/${id}`),
        }),
        getProfileByUser: builder.query({
            query: (id) => queryDataNoToken(`/profile-by-user/${id}`),
        }),
    }),
});

export const {
    useUpdateImageMutation,
    useUpdateQrCodeMutation,
    useUpdateTelegramServiceMutation,
    useUpdateNumberPhoneMutation,
    useUpdateNameMutation,
    useUpdateAddressMutation,
    useUpdateRoleMutation,
    useGetAllProfileQuery,
    useGetProfileByIdQuery,
    useGetProfileByUserQuery,
} = userProfileApi;