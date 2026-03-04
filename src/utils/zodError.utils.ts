import { ZodError } from "zod";

export interface ErrorResponse {
  message: string;
  errors?: Array<{ path: string; message: string }>;
}

export const formatError = (error: unknown, message: string = "Internal server error"): ErrorResponse => {
  if (error instanceof ZodError) {
    return {
      message: "Validation error",
      errors: error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    };
  }

  return {
    message: error instanceof Error ? error.message : message,
  };
};