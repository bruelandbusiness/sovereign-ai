import type { AdminRole } from "@/lib/require-admin";

/**
 * Resource types that can be governed by permissions.
 */
export type ResourceType =
  | "leads"
  | "reviews"
  | "content"
  | "billing"
  | "services"
  | "users"
  | "settings"
  | "analytics"
  | "admin";

/**
 * Actions that can be performed on resources.
 */
export type Action =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "import"
  | "respond"
  | "configure"
  | "publish"
  | "manage"
  | "refund"
  | "activate"
  | "deactivate"
  | "impersonate"
  | "access_panel"
  | "manage_clients"
  | "system_config";

/**
 * A permission string in the format "resource:action".
 */
export type Permission = `${ResourceType}:${Action}`;

/**
 * An immutable set of permissions.
 */
export type PermissionSet = readonly Permission[];

/**
 * Input for checking whether a role can perform an action on a resource.
 */
export interface PermissionCheck {
  readonly role: AdminRole;
  readonly resource: ResourceType;
  readonly action: Action;
}

/**
 * All platform permissions grouped by resource type.
 */
export const PERMISSIONS = {
  leads: {
    view: "leads:view" as const,
    create: "leads:create" as const,
    edit: "leads:edit" as const,
    delete: "leads:delete" as const,
    export: "leads:export" as const,
    import: "leads:import" as const,
  },
  reviews: {
    view: "reviews:view" as const,
    respond: "reviews:respond" as const,
    configure: "reviews:configure" as const,
    export: "reviews:export" as const,
  },
  content: {
    view: "content:view" as const,
    create: "content:create" as const,
    edit: "content:edit" as const,
    publish: "content:publish" as const,
    delete: "content:delete" as const,
  },
  billing: {
    view: "billing:view" as const,
    manage: "billing:manage" as const,
    refund: "billing:refund" as const,
  },
  services: {
    view: "services:view" as const,
    activate: "services:activate" as const,
    deactivate: "services:deactivate" as const,
    configure: "services:configure" as const,
  },
  users: {
    view: "users:view" as const,
    create: "users:create" as const,
    edit: "users:edit" as const,
    delete: "users:delete" as const,
    impersonate: "users:impersonate" as const,
  },
  settings: {
    view: "settings:view" as const,
    edit: "settings:edit" as const,
  },
  analytics: {
    view: "analytics:view" as const,
    export: "analytics:export" as const,
  },
  admin: {
    access_panel: "admin:access_panel" as const,
    manage_clients: "admin:manage_clients" as const,
    system_config: "admin:system_config" as const,
  },
} as const;

/**
 * Permissions granted to each role.
 *
 * Follows the existing RBAC hierarchy from require-admin.ts:
 *   viewer < manager < admin < superadmin
 *
 * Each level inherits all permissions from the level below it.
 */
const VIEWER_PERMISSIONS: PermissionSet = [
  PERMISSIONS.leads.view,
  PERMISSIONS.reviews.view,
  PERMISSIONS.content.view,
  PERMISSIONS.billing.view,
  PERMISSIONS.services.view,
  PERMISSIONS.analytics.view,
  PERMISSIONS.settings.view,
];

const MANAGER_PERMISSIONS: PermissionSet = [
  ...VIEWER_PERMISSIONS,
  PERMISSIONS.leads.create,
  PERMISSIONS.leads.edit,
  PERMISSIONS.leads.export,
  PERMISSIONS.leads.import,
  PERMISSIONS.reviews.respond,
  PERMISSIONS.reviews.export,
  PERMISSIONS.content.create,
  PERMISSIONS.content.edit,
  PERMISSIONS.content.publish,
  PERMISSIONS.services.activate,
  PERMISSIONS.services.deactivate,
  PERMISSIONS.users.view,
  PERMISSIONS.analytics.export,
  PERMISSIONS.settings.edit,
];

const ADMIN_PERMISSIONS: PermissionSet = [
  ...MANAGER_PERMISSIONS,
  PERMISSIONS.leads.delete,
  PERMISSIONS.reviews.configure,
  PERMISSIONS.content.delete,
  PERMISSIONS.billing.manage,
  PERMISSIONS.services.configure,
  PERMISSIONS.users.create,
  PERMISSIONS.users.edit,
  PERMISSIONS.users.delete,
  PERMISSIONS.admin.access_panel,
  PERMISSIONS.admin.manage_clients,
];

const SUPERADMIN_PERMISSIONS: PermissionSet = [
  ...ADMIN_PERMISSIONS,
  PERMISSIONS.billing.refund,
  PERMISSIONS.users.impersonate,
  PERMISSIONS.admin.system_config,
];

export const ROLE_PERMISSIONS: Readonly<Record<AdminRole, PermissionSet>> = {
  viewer: VIEWER_PERMISSIONS,
  manager: MANAGER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  superadmin: SUPERADMIN_PERMISSIONS,
} as const;

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(
  role: AdminRole,
  permission: Permission,
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check if a role has at least one of the given permissions.
 */
export function hasAnyPermission(
  role: AdminRole,
  permissions: readonly Permission[],
): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  return permissions.some((p) => rolePerms.includes(p));
}

/**
 * Check if a role has all of the given permissions.
 */
export function hasAllPermissions(
  role: AdminRole,
  permissions: readonly Permission[],
): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  return permissions.every((p) => rolePerms.includes(p));
}

/**
 * Return all permissions granted to a role.
 */
export function getPermissionsForRole(role: AdminRole): PermissionSet {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role can perform an action on a resource type.
 */
export function canAccessResource(check: PermissionCheck): boolean {
  const permission: Permission = `${check.resource}:${check.action}`;
  return hasPermission(check.role, permission);
}

/**
 * Return which permissions from the list are not granted to the role.
 *
 * Returns an empty array if the role has all requested permissions.
 */
export function getMissingPermissions(
  role: AdminRole,
  required: readonly Permission[],
): Permission[] {
  const rolePerms = ROLE_PERMISSIONS[role];
  return required.filter((p) => !rolePerms.includes(p));
}
