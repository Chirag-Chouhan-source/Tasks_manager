import { configureStore } from "@reduxjs/toolkit";
import { api } from "@/services/api";
import filterReducer from "./slices/filterSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      filter: filterReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  });
};
