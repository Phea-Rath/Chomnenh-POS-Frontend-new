import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById } from '../api';
import { url } from '../api';
export const quotesApi = createApi({
    reducerPath: 'quotes',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllQuote: builder.query({
            query: (token) => queryData('/quotations', token),
        }),
        getQuoteById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/quotations', token),
        }),
    }),
});

export const {
    useGetAllQuoteQuery,
    useGetQuoteByIdQuery,
} = quotesApi;