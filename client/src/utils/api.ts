import { AxiosError } from "axios";
import { ErrorResponse } from "@/types/api";

/**
 * Convert Error from backend to custom format
 * @param error
 * @returns
 */
export const transformErrorResponse = (error: AxiosError<ErrorResponse>) => {
  if (error.response?.data) {
    const { status, data } = error.response;
    return {
      status,
      message: data.message || "An unexpected error occurred.",
      error: data.error || "Error",
      path: data.path,
      timestamp: data.timestamp
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name
    };
  }

  return { message: "An unexpected error occurred." };
};
