import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/store/store";
import { User } from "@/types/user/user";

// Auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
}

// Set initial auth state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isEmailVerified: false
};

// Create auth slice with reducers
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Set user data after successful login
     */
    setUserData: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        isAuthenticated: boolean;
      }>
    ) => {
      const { user, token, isAuthenticated } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = isAuthenticated;
      state.isEmailVerified = user.data.isEmailVerified !== false;
    },

    /**
     * Mark email as verified
     */
    setEmailVerified: (state) => {
      state.isEmailVerified = true;
      if (state.user) {
        state.user.data.isEmailVerified = true;
      }
    },

    /**
     * Clear all auth state on logout
     */
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isEmailVerified = false;
    }
  }
});

// Export actions and reducer
export const { setUserData, setEmailVerified, logout } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectAuthState = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectUser = (state: RootState): User | null => state.auth.user;
export const selectToken = (state: RootState) => state.auth.token;
