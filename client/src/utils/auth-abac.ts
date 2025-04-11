/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Attribute Base Access Control
 * Here we define what access control will look like.
 * Calling hasPermission() we check if user has permission to access resource.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type User = {
  uid: string;
  isAuthenticated?: boolean;
  roles: Role[];
  data: {
    firstName?: string;
    lastName?: string;
    displayName: string;
    photoURL?: string;
    email?: string;
    loginRedirectUrl?: string;
  };
};

// Role types
export type Role = "ADMIN";

type PermissionCheck<Key extends keyof Permissions> =
  | boolean
  | ((user: User, data: Permissions[Key]["dataType"]) => boolean);

type RolesWithPermissions = {
  [R in Role]: Partial<{
    [Key in keyof Permissions]: Partial<{
      [Action in Permissions[Key]["action"]]: PermissionCheck<Key>;
    }>;
  }>;
};

type Permissions = {
  APP: {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    dataType: {};
    action: "view";
  };
};

// Role permissions - EDITOR
const EDITOR = {
  view: true,
  create: true,
  update: true,
  delete: true,
};

// Role permissions - VIEWER
const VIEWER = {
  view: true,
  create: false,
  update: false,
  delete: false,
};

const ROLES = {
  ADMIN: {
    APP: EDITOR,
  },
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
  user: User,
  resource: Resource,
  action: Permissions[Resource]["action"],
  data?: Permissions[Resource]["dataType"]
) {
  return user.roles.some((role) => {
    if (!ROLES[role]) return false;

    const permission = (ROLES as RolesWithPermissions)[role][resource]?.[
      action
    ];
    if (permission == null) return false;

    if (typeof permission === "boolean") return permission;
    return data != null && permission(user, data);
  });
}
