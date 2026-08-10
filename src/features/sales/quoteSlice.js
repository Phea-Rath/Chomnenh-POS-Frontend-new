import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById } from "@/app/api";
import { url } from "@/app/api";
export const quotesApi = createApi({
    reducerPath: 'quotes',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    tagTypes: ['Quotes'],
    endpoints: (builder) => ({
        getAllQuote: builder.query({
            query: ({ token, limit = 12, page = 1, search = '', start_date = '', end_date = '', customer_id = '' }) => 
                queryData(`/quotations?limit=${limit}&page=${page}&search=${search}&start_date=${start_date}&end_date=${end_date}&customer_id=${customer_id}`, token),
            providesTags: (result) =>
                result?.data
                    ? [
                          ...result.data.map(({ id, quotation_id }) => ({ type: 'Quotes', id: id || quotation_id })),
                          { type: 'Quotes', id: 'LIST' },
                      ]
                    : [{ type: 'Quotes', id: 'LIST' }],
        }),
        getQuoteById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/quotations', token),
            providesTags: (result, error, { id }) => [{ type: 'Quotes', id }],
        }),
        createQuote: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/quotations', token),
            invalidatesTags: [{ type: 'Quotes', id: 'LIST' }],
        }),
        updateQuote: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/quotations', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Quotes', id },
                { type: 'Quotes', id: 'LIST' },
            ],
        }),
        deleteQuote: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/quotations', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Quotes', id },
                { type: 'Quotes', id: 'LIST' },
            ],
            async onQueryStarted({ id, queryArgs }, { dispatch, queryFulfilled }) {
                let patchResult;
                if (queryArgs) {
                    patchResult = dispatch(
                        quotesApi.util.updateQueryData('getAllQuote', queryArgs, (draft) => {
                            if (draft?.data) {
                                draft.data = draft.data.filter(
                                    (item) => String(item.id || item.quotation_id) !== String(id)
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
        updateQuoteStatus: builder.mutation({
            query: ({ id, status, token }) => ({
                url: `/quote_status/${id}/${status}`,
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Quotes', id },
                { type: 'Quotes', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetAllQuoteQuery,
    useGetQuoteByIdQuery,
    useCreateQuoteMutation,
    useUpdateQuoteMutation,
    useDeleteQuoteMutation,
    useUpdateQuoteStatusMutation,
} = quotesApi;