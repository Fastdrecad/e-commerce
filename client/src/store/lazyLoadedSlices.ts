import { combineSlices } from "@reduxjs/toolkit";
import { appSlice } from "./appSettings";
import { baseApi } from "@/api/apiSlice";
import { authSlice } from "@/features/auth/authSlice";
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LazyLoadedSlices {}

export const rootReducer = combineSlices(appSlice, authSlice, {
  [baseApi.reducerPath]: baseApi.reducer
}).withLazyLoadedSlices<LazyLoadedSlices>();
