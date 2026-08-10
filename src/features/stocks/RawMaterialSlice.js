import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from "@/app/api";
import { url } from "@/app/api";
export const rawMaterialsApi = createApi({
    reducerPath: 'rawMaterials',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    tagTypes: ['RawMaterials'],
    endpoints: (builder) => ({
        getAllRawMaterial: builder.query({
            query: ({ limit = 10, page = 1, search, token, filter = 'all', supplier_id = 0 }) => queryData(`/raw_materials?limit=${limit}&page=${page}&search=${search}&filter=${filter}&supplier_id=${supplier_id}`, token),
            providesTags: (result) =>
                result?.data
                    ? [
                          ...result.data.map(({ id, material_id }) => ({ type: 'RawMaterials', id: id || material_id })),
                          { type: 'RawMaterials', id: 'LIST' },
                      ]
                    : [{ type: 'RawMaterials', id: 'LIST' }],
        }),
        getRawMaterialById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/raw_materials', token),
            providesTags: (result, error, { id }) => [{ type: 'RawMaterials', id }],
        }),
        createRawMaterial: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/raw_materials', token),
            invalidatesTags: [{ type: 'RawMaterials', id: 'LIST' }],
        }),
        updateRawMaterial: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/raw_materials', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'RawMaterials', id },
                { type: 'RawMaterials', id: 'LIST' },
            ],
        }),
        deleteRawMaterial: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/raw_materials', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'RawMaterials', id },
                { type: 'RawMaterials', id: 'LIST' },
            ],
            async onQueryStarted({ id, queryArgs }, { dispatch, queryFulfilled }) {
                let patchResult;
                if (queryArgs) {
                    patchResult = dispatch(
                        rawMaterialsApi.util.updateQueryData('getAllRawMaterial', queryArgs, (draft) => {
                            if (draft?.data) {
                                draft.data = draft.data.filter(
                                    (item) => String(item.id || item.material_id) !== String(id)
                                );
                            }
                        })
                    );
                }
                try {
                    await queryFulfilled;
                } catch {
                    if (patchResult) patchResult.undo();
                }
            },
        }),
        getTopRawMaterials: builder.query({
            query: ({ token, filter = 'quantity', limit = 5, operation }) => queryData(`/top-raw-materials?filter=${filter}&limit=${limit}&operation=${operation}`, token),
            providesTags: [{ type: 'RawMaterials', id: 'LIST' }],
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