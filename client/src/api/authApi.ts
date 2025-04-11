import { baseApi } from "./apiSlice";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    getUserProfile: builder.query({
      query: () => ({ url: "/auth/profile" }),
      providesTags: ["Auth"],
    }),
  }),
});

export const { useLoginMutation, useGetUserProfileQuery } = authApi;
