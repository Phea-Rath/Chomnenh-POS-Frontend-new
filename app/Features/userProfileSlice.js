import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { updateData, updateDataByPost } from '../api';
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
        updateQrCode: builder.mutation({
            query: ({ id, itemData, path, token }) => updateDataByPost(id, itemData, path, token),
        }),
        updateTelegramService: builder.mutation({
            query: ({ id, itemData, path, token }) => updateData(id, itemData, path, token),
        }),
    }),
});

export const {
    useUpdateImageMutation,
    useUpdateQrCodeMutation,
    useUpdateTelegramServiceMutation,
    useUpdateNumberPhoneMutation,
    useUpdateNameMutation
} = userProfileApi;