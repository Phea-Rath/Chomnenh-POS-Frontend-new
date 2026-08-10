import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from "@/app/api";
import { url } from "@/app/api";
export const deliversApi = createApi({
    reducerPath: 'delivers',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    tagTypes: ['Delivers'],
    endpoints: (builder) => ({
        getAllDeliver: builder.query({
            query: (token) => queryData('/delivers', token),
            providesTags: (result) =>
                result?.data
                    ? [
                          ...result.data.map(({ id, deliver_id }) => ({ type: 'Delivers', id: id || deliver_id })),
                          { type: 'Delivers', id: 'LIST' },
                      ]
                    : [{ type: 'Delivers', id: 'LIST' }],
        }),
        getDeliverById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/delivers', token),
            providesTags: (result, error, { id }) => [{ type: 'Delivers', id }],
        }),
        createDeliver: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/delivers', token),
            invalidatesTags: [{ type: 'Delivers', id: 'LIST' }],
        }),
        updateDeliver: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/delivers', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Delivers', id },
                { type: 'Delivers', id: 'LIST' },
            ],
        }),
        deleteDeliver: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/delivers', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Delivers', id },
                { type: 'Delivers', id: 'LIST' },
            ],
            async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    deliversApi.util.updateQueryData('getAllDeliver', undefined, (draft) => {
                        if (draft?.data) {
                            draft.data = draft.data.filter(
                                (item) => String(item.id || item.deliver_id) !== String(id)
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
    useGetAllDeliverQuery,
    useGetDeliverByIdQuery,
    useCreateDeliverMutation,
    useUpdateDeliverMutation,
    useDeleteDeliverMutation
} = deliversApi;