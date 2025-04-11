import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./apiService";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Auth"],
  endpoints: () => ({}),
});
