import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateDataByPost, deleteData } from "@/app/api";
import { url } from "@/app/api";
export const suppliersApi = createApi({
    reducerPath: 'suppliers',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    tagTypes: ['Suppliers'],
    endpoints: (builder) => ({
        getAllSupplier: builder.query({
            query: (token) => queryData('/suppliers', token),
            providesTags: (result) =>
                result?.data
                    ? [
                          ...result.data.map(({ id, supplier_id }) => ({ type: 'Suppliers', id: id || supplier_id })),
                          { type: 'Suppliers', id: 'LIST' },
                      ]
                    : [{ type: 'Suppliers', id: 'LIST' }],
        }),
        getSupplierById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/suppliers', token),
            providesTags: (result, error, { id }) => [{ type: 'Suppliers', id }],
        }),
        createSupplier: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/suppliers', token),
            invalidatesTags: [{ type: 'Suppliers', id: 'LIST' }],
        }),
        updateSupplier: builder.mutation({
            query: ({ id, itemData, token }) => updateDataByPost(id, itemData, '/suppliers', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Suppliers', id },
                { type: 'Suppliers', id: 'LIST' },
            ],
        }),
        deleteSupplier: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/suppliers', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Suppliers', id },
                { type: 'Suppliers', id: 'LIST' },
            ],
            async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    suppliersApi.util.updateQueryData('getAllSupplier', undefined, (draft) => {
                        if (draft?.data) {
                            draft.data = draft.data.filter((item) => String(item.id || item.supplier_id) !== String(id));
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
    useGetAllSupplierQuery,
    useGetSupplierByIdQuery,
    useCreateSupplierMutation,
    useUpdateSupplierMutation,
    useDeleteSupplierMutation
} = suppliersApi;