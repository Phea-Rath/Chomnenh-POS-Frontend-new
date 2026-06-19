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
            query: ({ token, limit = 12, page = 1, search = '', start_date = '', end_date = '', customer_id = '' }) => 
                queryData(`/quotations?limit=${limit}&page=${page}&search=${search}&start_date=${start_date}&end_date=${end_date}&customer_id=${customer_id}`, token),
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