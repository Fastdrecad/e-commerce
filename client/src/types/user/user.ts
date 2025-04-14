import { Role } from "@/utils/auth-abac";

/**
 * The type definition for a user object.
 */

export type User = {
  id: string;
  roles: Role[];
  data: {
    firstName: string;
    lastName: string;
    email: string;
    isEmailVerified: boolean;
  };
};

/**
 * The type definition for a user object from the backend.
 */

export type UserBackend = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isEmailVerified?: boolean;
  role?: string;
  RoleIds?: Role[];
};

/**
 * Mapping function used to transform backend data into the required frontend format
 */

export const backendUserToFrontendModel = (data: UserBackend): User => {
  return {
    id: data.id,
    roles: data.RoleIds || [],
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      isEmailVerified: data.isEmailVerified !== false
    }
  };
};
