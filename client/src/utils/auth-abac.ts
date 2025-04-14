import { selectUser } from "@/features/auth/authSlice";
import { User } from "@/types/user/user";
import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";

export type Role = "SUPER_ADMIN" | "CUSTOMER" | "GUEST" | "ORDER_MANAGER";

type CRUDOperations = "view" | "create" | "update" | "delete";

type Permissions = {
  APP: {
    dataType: object;
    action: CRUDOperations;
  };
  BILLING_AND_PAYMENT: {
    dataType: unknown;
    action: CRUDOperations;
  };
  ADD_NEW_ROLE: {
    dataType: unknown;
    action: CRUDOperations;
  };
};

type PermissionCheck<Key extends keyof Permissions> =
  | boolean
  | ((user: User, data: Permissions[Key]["dataType"]) => boolean);

type RolesWithPermissions = {
  [R in Role]: Partial<{
    [Key in keyof Permissions]: Partial<{
      [Action in CRUDOperations]: PermissionCheck<Key>;
    }>;
  }>;
};

// Role permissions
const EDITOR = {
  view: true,
  create: true,
  update: true,
  delete: true
};

const VIEWER = {
  view: true,
  create: false,
  update: false,
  delete: false
};

const CREATE_ONLY = {
  view: true,
  create: true,
  update: false,
  delete: false
};

const ROLES = {
  SUPER_ADMIN: {
    APP: EDITOR,
    BILLING_AND_PAYMENT: EDITOR,
    ADD_NEW_ROLE: EDITOR
  },
  GUEST: {
    APP: VIEWER,
    BILLING_AND_PAYMENT: VIEWER,
    ADD_NEW_ROLE: VIEWER
  },
  ORDER_MANAGER: {
    APP: CREATE_ONLY,
    BILLING_AND_PAYMENT: CREATE_ONLY
  },
  CUSTOMER: {
    APP: CREATE_ONLY,
    BILLING_AND_PAYMENT: VIEWER
  }
} as const satisfies RolesWithPermissions;

/**
 * Method to check if a user has permission
 * @param user
 * @param resource
 * @param action
 * @param data
 * @returns
 */
export function hasPermission<Resource extends keyof Permissions>(
  user: User | null,
  resource: Resource,
  action: CRUDOperations,
  data?: Permissions[Resource]["dataType"]
): boolean {
  return (
    user?.roles.some((role) => {
      const permission = (ROLES as RolesWithPermissions)[role]?.[resource]?.[
        action
      ];
      if (permission == null) return false;

      return typeof permission === "function"
        ? permission(user, data!)
        : permission;
    }) ?? false
  );
}

/**
 * Method to check  if users have view, create, update, and delete permissions for specific features.
 * @param feature
 * @returns
 */
export const useHasPermission = (feature: keyof Permissions) => {
  const user = useAppSelector(selectUser);

  const permissions = useMemo(() => {
    if (!user) {
      return {
        canCreate: false,
        canUpdate: false,
        canView: false,
        canDelete: false
      };
    }

    return {
      canCreate: hasPermission(user, feature, "create"),
      canUpdate: hasPermission(user, feature, "update"),
      canView: hasPermission(user, feature, "view"),
      canDelete: hasPermission(user, feature, "delete")
    };
  }, [user, feature]);

  return permissions;
};
