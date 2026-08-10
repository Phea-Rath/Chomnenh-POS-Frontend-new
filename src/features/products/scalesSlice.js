import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from "@/app/api";
import { url } from "@/app/api";
export const scalesApi = createApi({
    reducerPath: 'scales',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    tagTypes: ['Scales'],
    endpoints: (builder) => ({
        getAllScales: builder.query({
            query: (token) => queryData('/scales', token),
            providesTags: (result) =>
                result?.data
                    ? [
                          ...result.data.map(({ id, scale_id }) => ({ type: 'Scales', id: id || scale_id })),
                          { type: 'Scales', id: 'LIST' },
                      ]
                    : [{ type: 'Scales', id: 'LIST' }],
        }),
        getScaleById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/scales', token),
            providesTags: (result, error, { id }) => [{ type: 'Scales', id }],
        }),
        createScale: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/scales', token),
            invalidatesTags: [{ type: 'Scales', id: 'LIST' }],
        }),
        updateScale: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/scales', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Scales', id },
                { type: 'Scales', id: 'LIST' },
            ],
        }),
        deleteScale: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/scales', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Scales', id },
                { type: 'Scales', id: 'LIST' },
            ],
            async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    scalesApi.util.updateQueryData('getAllScales', undefined, (draft) => {
                        if (draft?.data) {
                            draft.data = draft.data.filter((item) => String(item.id || item.scale_id) !== String(id));
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
    useGetAllScalesQuery,
    useGetScaleByIdQuery,
    useCreateScaleMutation,
    useUpdateScaleMutation,
    useDeleteScaleMutation
} = scalesApi;