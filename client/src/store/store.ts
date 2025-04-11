import { configureStore, Middleware } from "@reduxjs/toolkit";
import { rootReducer } from "./lazyLoadedSlices";
import { baseApi } from "@/api/apiSlice";

export type RootState = ReturnType<typeof rootReducer>;
const IS_DEVELOPMENT = import.meta.env.VITE_API_NODE_ENV !== "PRODUCTION";

const middlewares: Middleware[] = [baseApi.middleware];

export const makeStore = () => {
  const store = configureStore({
    reducer: rootReducer,
    devTools: IS_DEVELOPMENT,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(middlewares),
    preloadedState: undefined,
  });
  return store;
};

export type AppStore = typeof store;
export type AppDispatch = AppStore["dispatch"];

const store = makeStore();

export default store;
