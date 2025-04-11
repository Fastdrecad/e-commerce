import { BaseQueryFn, createApi } from "@reduxjs/toolkit/query/react";
import { AxiosError, AxiosRequestConfig } from "axios";
import axiosInstance from "./axiosInstance";
import { transformErrorResponse } from "@/utils/api";
import { ErrorResponse } from "@/types/api";

// Default API url
const apiUrl = import.meta.env.VITE_API_URL;

export const axiosBaseQuery =
  (
    { baseUrl } = { baseUrl: apiUrl }
  ): BaseQueryFn<AxiosRequestConfig<unknown>, unknown, ErrorResponse> =>
  async ({ url, method, data, params }) => {
    try {
      const result = await axiosInstance({
        url: baseUrl + url,
        method,
        data,
        params
      });
      return { data: result.data };
    } catch (e) {
      const error = e as AxiosError<ErrorResponse>;
      return {
        error: transformErrorResponse(error)
      };
    }
  };

export const apiService = createApi({
  baseQuery: axiosBaseQuery(),
  endpoints: () => ({}),
  reducerPath: "apiService"
});

export default apiService;
