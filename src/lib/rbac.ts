export const PROJECT_ROLES = {
    COORDINATOR: "COORDINATOR",
    PARTNER: "PARTNER",
    MEMBER: "MEMBER",
    ADMIN: "ADMIN" // System admin, implicit all access
} as const;

export type ProjectRole = keyof typeof PROJECT_ROLES;

export const PERMISSIONS = {
    // Project Management
    UPDATE_PROJECT: "UPDATE_PROJECT",
    DELETE_PROJECT: "DELETE_PROJECT",
    MANAGE_TEAM: "MANAGE_TEAM", // Invite/Remove members
    
    // Financials
    VIEW_BUDGET: "VIEW_BUDGET",
    EDIT_BUDGET: "EDIT_BUDGET",
    MANAGE_COSTS: "MANAGE_COSTS", // Edit Cost Grid
    
    // Content
    CREATE_WORK: "CREATE_WORK",
    EDIT_WORK: "EDIT_WORK",
    APPROVE_MODULE: "APPROVE_MODULE",
} as const;

export type Permission = keyof typeof PERMISSIONS;

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    [PROJECT_ROLES.COORDINATOR]: [
        "UPDATE_PROJECT", "DELETE_PROJECT", "MANAGE_TEAM",
        "VIEW_BUDGET", "EDIT_BUDGET", "MANAGE_COSTS",
        "CREATE_WORK", "EDIT_WORK", "APPROVE_MODULE"
    ],
    [PROJECT_ROLES.PARTNER]: [
        "VIEW_BUDGET", // Maybe only own budget?
        "CREATE_WORK", "EDIT_WORK"
    ],
    [PROJECT_ROLES.MEMBER]: [
        "EDIT_WORK" // Can edit assigned tasks/modules
    ],
    [PROJECT_ROLES.ADMIN]: [
        // All permissions
        ...Object.values(PERMISSIONS)
    ]
};

export function hasProjectPermission(role: string | null | undefined, permission: Permission): boolean {
    if (!role) return false;
    
    // Normalize role string to uppercase just in case
    const normalizedRole = role.toUpperCase();
    
    if (normalizedRole === PROJECT_ROLES.ADMIN) return true; // Superuser
    
    const permissions = ROLE_PERMISSIONS[normalizedRole];
    return permissions?.includes(permission) ?? false;
}
