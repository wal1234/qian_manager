/**
 * 权限检查工具函数
 */

/**
 * 用户权限数据对象
 */
export interface PermissionData {
  roles: string[];
  permissions: string[];
}

// 模拟缓存的用户权限数据
let currentUserPermissions: PermissionData = {
  roles: ['admin'],
  permissions: ['*']
};

/**
 * 设置当前用户权限数据
 * @param permissions 权限数据
 */
export function setPermissions(permissions: PermissionData): void {
  currentUserPermissions = permissions;
}

/**
 * 检查是否有指定角色
 * @param role 角色标识
 * @returns 是否拥有该角色
 */
export function hasRole(role: string): boolean {
  if (!role) return false;
  
  // 超级管理员角色直接返回true
  if (currentUserPermissions.roles.includes('admin')) {
    return true;
  }
  
  return currentUserPermissions.roles.includes(role);
}

/**
 * 检查是否有指定角色中的任意一个
 * @param roles 角色标识数组
 * @returns 是否拥有其中任意一个角色
 */
export function hasAnyRole(roles: string[]): boolean {
  if (!roles || roles.length === 0) return false;
  
  return roles.some(role => hasRole(role));
}

/**
 * 检查是否有指定权限
 * @param permission 权限标识
 * @returns 是否拥有该权限
 */
export function hasPermission(permission: string): boolean {
  if (!permission) return false;
  
  // 超级管理员权限直接返回true
  if (currentUserPermissions.permissions.includes('*')) {
    return true;
  }
  
  return currentUserPermissions.permissions.includes(permission);
}

/**
 * 检查是否有指定权限集合中的全部权限
 * @param permissions 权限标识数组
 * @returns 是否拥有全部权限
 */
export function hasPermissions(permissions: string[]): boolean {
  if (!permissions || permissions.length === 0) return false;
  
  return permissions.every(permission => hasPermission(permission));
}

/**
 * 检查是否有指定权限集合中的任意一个权限
 * @param permissions 权限标识数组
 * @returns 是否拥有任意一个权限
 */
export function hasAnyPermission(permissions: string[]): boolean {
  if (!permissions || permissions.length === 0) return false;
  
  return permissions.some(permission => hasPermission(permission));
}

/**
 * Vue自定义指令: v-hasRole
 * 用法: v-hasRole="'admin'"
 */
export const hasRoleDirective = {
  mounted(el: HTMLElement, binding: any) {
    const role = binding.value;
    if (!hasRole(role)) {
      el.parentNode?.removeChild(el);
    }
  }
};

/**
 * Vue自定义指令: v-hasPermission
 * 用法: v-hasPermission="'system:user:list'"
 */
export const hasPermissionDirective = {
  mounted(el: HTMLElement, binding: any) {
    const permission = binding.value;
    if (!hasPermission(permission)) {
      el.parentNode?.removeChild(el);
    }
  }
}; 