/**
 * Centralized API Endpoint Constants for chomnenh-pos
 */
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/login',
    LOGOUT: '/logout',
    ME: '/user-login',
    PROFILE: '/user-profile',
  },
  STOCKS: {
    BASE: '/stocks',
    TYPES: '/stock-types',
    WAREHOUSES: '/warehouses',
    BY_WAREHOUSE: '/stocks-by-warehouse',
    DETAILS: '/stock-details',
  },
  ITEMS: {
    BASE: '/items',
    CATEGORIES: '/categories',
    BRANDS: '/brands',
    SCALES: '/scales',
    COLORS: '/colors',
    SIZES: '/sizes',
    ATTRIBUTES: '/attributes',
  },
  ORDERS: {
    BASE: '/orders',
    SALES: '/sales',
    QUOTATIONS: '/quotes',
    TOP_SELLERS: '/top-sellers',
  },
  PURCHASES: {
    BASE: '/purchases',
    SUPPLIERS: '/suppliers',
  },
  EXPENSES: {
    BASE: '/expenses',
    TYPES: '/expense-types',
  },
  CUSTOMERS: {
    BASE: '/customers',
  },
  USERS: {
    BASE: '/users',
    ROLES: '/roles',
    PERMISSIONS: '/permissions',
  },
  DASHBOARD: {
    OVERVIEW: '/dashboards',
    REPORTS: '/reports',
  },
};

export default ENDPOINTS;
