import {
  ROLES,
  EMAIL_PROVIDER,
  TOKEN_TYPES,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  PRODUCT_STATUS,
  Role,
  Provider,
  TokenType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus
} from "../constants";

/**
 * Type guard to check if a value is a valid role
 * @param role Value to check
 * @returns True if the value is a valid role
 */
export const isValidRole = (role: string): role is Role => {
  return Object.values(ROLES).includes(role as any);
};

/**
 * Type guard to check if a value is a valid provider
 * @param provider Value to check
 * @returns True if the value is a valid provider
 */
export const isValidProvider = (provider: string): provider is Provider => {
  return Object.values(EMAIL_PROVIDER).includes(provider as any);
};

/**
 * Type guard to check if a value is a valid token type
 * @param type Value to check
 * @returns True if the value is a valid token type
 */
export const isValidTokenType = (type: string): type is TokenType => {
  return Object.values(TOKEN_TYPES).includes(type as any);
};

/**
 * Type guard to check if a value is a valid order status
 * @param status Value to check
 * @returns True if the value is a valid order status
 */
export const isValidOrderStatus = (status: string): status is OrderStatus => {
  return Object.values(ORDER_STATUS).includes(status as any);
};

/**
 * Type guard to check if a value is a valid payment method
 * @param method Value to check
 * @returns True if the value is a valid payment method
 */
export const isValidPaymentMethod = (
  method: string
): method is PaymentMethod => {
  return Object.values(PAYMENT_METHOD).includes(method as any);
};

/**
 * Type guard to check if a value is a valid payment status
 * @param status Value to check
 * @returns True if the value is a valid payment status
 */
export const isValidPaymentStatus = (
  status: string
): status is PaymentStatus => {
  return Object.values(PAYMENT_STATUS).includes(status as any);
};

/**
 * Type guard to check if a value is a valid product status
 * @param status Value to check
 * @returns True if the value is a valid product status
 */
export const isValidProductStatus = (
  status: string
): status is ProductStatus => {
  return Object.values(PRODUCT_STATUS).includes(status as any);
};

/**
 * Get all values from an enum
 * @param enumObj The enum object
 * @returns Array of enum values
 */
export const getEnumValues = <T extends Record<string, string>>(
  enumObj: T
): string[] => {
  return Object.values(enumObj);
};

/**
 * Get enum key names
 * @param enumObj The enum object
 * @returns Array of enum key names
 */
export const getEnumKeys = <T extends Record<string, string>>(
  enumObj: T
): string[] => {
  return Object.keys(enumObj).filter(
    (key) => isNaN(Number(key)) // Filter out numeric keys
  );
};
