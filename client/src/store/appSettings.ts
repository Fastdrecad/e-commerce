import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";

type ThemeState = {
  mode: "light" | "dark";
};

//Detect system theme preference
const getPreferredTheme = (): "light" | "dark" => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};
const initialState: ThemeState = {
  mode:
    (localStorage.getItem("themeMode") as "light" | "dark") ||
    getPreferredTheme(),
};

export const appSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
      localStorage.setItem("themeMode", state.mode);
    },
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.mode = action.payload;
      localStorage.setItem("themeMode", state.mode);
    },
  },
});

export const selectTheme = (state: RootState) => state.settings.mode;

export const { toggleTheme, setTheme } = appSlice.actions;

// Export  Reducer
export default appSlice.reducer;
