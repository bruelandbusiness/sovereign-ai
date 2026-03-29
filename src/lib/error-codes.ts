// ---------------------------------------------------------------------------
// Error Code Registry for Sovereign AI Platform
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ErrorCategory =
  | "AUTH"
  | "CLIENT"
  | "PAYMENT"
  | "SERVICE"
  | "DATA"
  | "SYSTEM";

export type ErrorSeverity = "low" | "medium" | "high" | "critical";

export interface ErrorCode {
  readonly code: number;
  readonly key: string;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly message: string;
  readonly suggestion: string;
  readonly httpStatus: number;
  readonly retryable: boolean;
}

export interface ErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: number;
    readonly key: string;
    readonly category: ErrorCategory;
    readonly severity: ErrorSeverity;
    readonly message: string;
    readonly suggestion: string;
  };
  readonly timestamp: string;
  readonly requestId?: string;
}

// ---------------------------------------------------------------------------
// Error Code Registry
// ---------------------------------------------------------------------------

export const ERROR_CODES: ReadonlyArray<ErrorCode> = [
  // -----------------------------------------------------------------------
  // AUTH (1000-1099)
  // -----------------------------------------------------------------------
  {
    code: 1000,
    key: "invalid_credentials",
    category: "AUTH",
    severity: "high",
    message: "The provided credentials are invalid.",
    suggestion: "Check your email and password, then try again.",
    httpStatus: 401,
    retryable: false,
  },
  {
    code: 1001,
    key: "session_expired",
    category: "AUTH",
    severity: "medium",
    message: "Your session has expired.",
    suggestion: "Please sign in again to continue.",
    httpStatus: 401,
    retryable: false,
  },
  {
    code: 1002,
    key: "insufficient_permissions",
    category: "AUTH",
    severity: "high",
    message: "You do not have permission to perform this action.",
    suggestion: "Contact your administrator to request access.",
    httpStatus: 403,
    retryable: false,
  },
  {
    code: 1003,
    key: "token_expired",
    category: "AUTH",
    severity: "medium",
    message: "Your authentication token has expired.",
    suggestion: "Refresh your token or sign in again.",
    httpStatus: 401,
    retryable: true,
  },
  {
    code: 1004,
    key: "magic_link_expired",
    category: "AUTH",
    severity: "medium",
    message: "This magic link has expired.",
    suggestion: "Request a new magic link to sign in.",
    httpStatus: 401,
    retryable: false,
  },
  {
    code: 1005,
    key: "rate_limited",
    category: "AUTH",
    severity: "medium",
    message: "Too many authentication attempts.",
    suggestion: "Wait a few minutes before trying again.",
    httpStatus: 429,
    retryable: true,
  },
  {
    code: 1006,
    key: "account_locked",
    category: "AUTH",
    severity: "critical",
    message: "Your account has been locked due to repeated failed attempts.",
    suggestion: "Contact support to unlock your account.",
    httpStatus: 403,
    retryable: false,
  },
  {
    code: 1007,
    key: "account_disabled",
    category: "AUTH",
    severity: "critical",
    message: "Your account has been disabled.",
    suggestion: "Contact support for more information.",
    httpStatus: 403,
    retryable: false,
  },
  {
    code: 1008,
    key: "mfa_required",
    category: "AUTH",
    severity: "medium",
    message: "Multi-factor authentication is required.",
    suggestion: "Complete MFA verification to proceed.",
    httpStatus: 401,
    retryable: false,
  },
  {
    code: 1009,
    key: "mfa_invalid",
    category: "AUTH",
    severity: "high",
    message: "The MFA code is invalid or expired.",
    suggestion: "Enter a new code from your authenticator app.",
    httpStatus: 401,
    retryable: false,
  },
  {
    code: 1010,
    key: "oauth_error",
    category: "AUTH",
    severity: "high",
    message: "OAuth authentication failed.",
    suggestion: "Try signing in with a different method.",
    httpStatus: 401,
    retryable: true,
  },

  // -----------------------------------------------------------------------
  // CLIENT (2000-2099)
  // -----------------------------------------------------------------------
  {
    code: 2000,
    key: "not_found",
    category: "CLIENT",
    severity: "low",
    message: "The requested resource was not found.",
    suggestion: "Verify the resource ID and try again.",
    httpStatus: 404,
    retryable: false,
  },
  {
    code: 2001,
    key: "already_exists",
    category: "CLIENT",
    severity: "medium",
    message: "A resource with this identifier already exists.",
    suggestion: "Use a different identifier or update the existing resource.",
    httpStatus: 409,
    retryable: false,
  },
  {
    code: 2002,
    key: "invalid_input",
    category: "CLIENT",
    severity: "low",
    message: "The provided input is invalid.",
    suggestion: "Check the request body and fix the validation errors.",
    httpStatus: 400,
    retryable: false,
  },
  {
    code: 2003,
    key: "quota_exceeded",
    category: "CLIENT",
    severity: "high",
    message: "You have exceeded your usage quota.",
    suggestion: "Upgrade your plan or wait for the quota to reset.",
    httpStatus: 429,
    retryable: false,
  },
  {
    code: 2004,
    key: "subscription_required",
    category: "CLIENT",
    severity: "medium",
    message: "An active subscription is required to access this feature.",
    suggestion: "Subscribe to a plan to unlock this feature.",
    httpStatus: 402,
    retryable: false,
  },
  {
    code: 2005,
    key: "invalid_file_type",
    category: "CLIENT",
    severity: "low",
    message: "The uploaded file type is not supported.",
    suggestion: "Upload a file in one of the supported formats.",
    httpStatus: 400,
    retryable: false,
  },
  {
    code: 2006,
    key: "file_too_large",
    category: "CLIENT",
    severity: "low",
    message: "The uploaded file exceeds the maximum allowed size.",
    suggestion: "Reduce the file size or split it into smaller files.",
    httpStatus: 413,
    retryable: false,
  },
  {
    code: 2007,
    key: "method_not_allowed",
    category: "CLIENT",
    severity: "low",
    message: "This HTTP method is not allowed for the requested endpoint.",
    suggestion: "Check the API documentation for supported methods.",
    httpStatus: 405,
    retryable: false,
  },
  {
    code: 2008,
    key: "conflict",
    category: "CLIENT",
    severity: "medium",
    message: "The request conflicts with the current state of the resource.",
    suggestion: "Reload the resource and retry your operation.",
    httpStatus: 409,
    retryable: true,
  },
  {
    code: 2009,
    key: "gone",
    category: "CLIENT",
    severity: "low",
    message: "The requested resource is no longer available.",
    suggestion: "This resource has been permanently removed.",
    httpStatus: 410,
    retryable: false,
  },

  // -----------------------------------------------------------------------
  // PAYMENT (3000-3099)
  // -----------------------------------------------------------------------
  {
    code: 3000,
    key: "payment_failed",
    category: "PAYMENT",
    severity: "high",
    message: "The payment could not be processed.",
    suggestion: "Verify your payment details and try again.",
    httpStatus: 402,
    retryable: true,
  },
  {
    code: 3001,
    key: "card_declined",
    category: "PAYMENT",
    severity: "high",
    message: "Your card was declined.",
    suggestion: "Try a different payment method or contact your bank.",
    httpStatus: 402,
    retryable: false,
  },
  {
    code: 3002,
    key: "subscription_cancelled",
    category: "PAYMENT",
    severity: "medium",
    message: "Your subscription has been cancelled.",
    suggestion: "Resubscribe to restore access.",
    httpStatus: 402,
    retryable: false,
  },
  {
    code: 3003,
    key: "invoice_overdue",
    category: "PAYMENT",
    severity: "critical",
    message: "Your invoice is overdue.",
    suggestion: "Pay the outstanding balance to avoid service interruption.",
    httpStatus: 402,
    retryable: false,
  },
  {
    code: 3004,
    key: "card_expired",
    category: "PAYMENT",
    severity: "high",
    message: "Your card has expired.",
    suggestion: "Update your payment method with a valid card.",
    httpStatus: 402,
    retryable: false,
  },
  {
    code: 3005,
    key: "insufficient_funds",
    category: "PAYMENT",
    severity: "high",
    message: "Insufficient funds for this transaction.",
    suggestion: "Add funds to your account or use a different payment method.",
    httpStatus: 402,
    retryable: true,
  },
  {
    code: 3006,
    key: "refund_failed",
    category: "PAYMENT",
    severity: "high",
    message: "The refund could not be processed.",
    suggestion: "Contact support for assistance with your refund.",
    httpStatus: 500,
    retryable: true,
  },
  {
    code: 3007,
    key: "coupon_invalid",
    category: "PAYMENT",
    severity: "low",
    message: "The coupon code is invalid or has expired.",
    suggestion: "Check the coupon code and try again.",
    httpStatus: 400,
    retryable: false,
  },
  {
    code: 3008,
    key: "plan_change_restricted",
    category: "PAYMENT",
    severity: "medium",
    message: "You cannot change plans at this time.",
    suggestion: "Complete your current billing cycle before changing plans.",
    httpStatus: 409,
    retryable: false,
  },
  {
    code: 3009,
    key: "billing_address_invalid",
    category: "PAYMENT",
    severity: "medium",
    message: "The billing address could not be verified.",
    suggestion: "Update your billing address and try again.",
    httpStatus: 400,
    retryable: false,
  },

  // -----------------------------------------------------------------------
  // SERVICE (4000-4099)
  // -----------------------------------------------------------------------
  {
    code: 4000,
    key: "service_unavailable",
    category: "SERVICE",
    severity: "critical",
    message: "The service is temporarily unavailable.",
    suggestion: "Please try again in a few minutes.",
    httpStatus: 503,
    retryable: true,
  },
  {
    code: 4001,
    key: "integration_error",
    category: "SERVICE",
    severity: "high",
    message: "An error occurred with an external integration.",
    suggestion: "Check the integration status or try again later.",
    httpStatus: 502,
    retryable: true,
  },
  {
    code: 4002,
    key: "api_timeout",
    category: "SERVICE",
    severity: "high",
    message: "The request timed out.",
    suggestion: "Try again or reduce the scope of your request.",
    httpStatus: 504,
    retryable: true,
  },
  {
    code: 4003,
    key: "webhook_failed",
    category: "SERVICE",
    severity: "high",
    message: "The webhook delivery failed.",
    suggestion: "Verify the webhook endpoint URL and try redelivering.",
    httpStatus: 502,
    retryable: true,
  },
  {
    code: 4004,
    key: "upstream_error",
    category: "SERVICE",
    severity: "high",
    message: "An upstream service returned an error.",
    suggestion: "The issue is with a third-party service. Try again later.",
    httpStatus: 502,
    retryable: true,
  },
  {
    code: 4005,
    key: "circuit_breaker_open",
    category: "SERVICE",
    severity: "critical",
    message: "The service circuit breaker is open due to repeated failures.",
    suggestion: "The system is recovering. Please wait and try again.",
    httpStatus: 503,
    retryable: true,
  },
  {
    code: 4006,
    key: "dependency_unavailable",
    category: "SERVICE",
    severity: "critical",
    message: "A required dependency is unavailable.",
    suggestion: "The team has been notified. Please try again later.",
    httpStatus: 503,
    retryable: true,
  },
  {
    code: 4007,
    key: "rate_limit_upstream",
    category: "SERVICE",
    severity: "medium",
    message: "An upstream API rate limit has been reached.",
    suggestion: "Wait a few minutes before retrying.",
    httpStatus: 429,
    retryable: true,
  },
  {
    code: 4008,
    key: "ai_model_unavailable",
    category: "SERVICE",
    severity: "high",
    message: "The AI model is currently unavailable.",
    suggestion: "Try a different model or wait for the service to recover.",
    httpStatus: 503,
    retryable: true,
  },
  {
    code: 4009,
    key: "ai_model_overloaded",
    category: "SERVICE",
    severity: "medium",
    message: "The AI model is overloaded with requests.",
    suggestion: "Your request has been queued. Please wait.",
    httpStatus: 429,
    retryable: true,
  },

  // -----------------------------------------------------------------------
  // DATA (5000-5099)
  // -----------------------------------------------------------------------
  {
    code: 5000,
    key: "validation_failed",
    category: "DATA",
    severity: "medium",
    message: "Data validation failed.",
    suggestion: "Check the data format and required fields.",
    httpStatus: 422,
    retryable: false,
  },
  {
    code: 5001,
    key: "import_error",
    category: "DATA",
    severity: "high",
    message: "Data import failed.",
    suggestion: "Verify the import file format and content.",
    httpStatus: 422,
    retryable: false,
  },
  {
    code: 5002,
    key: "export_failed",
    category: "DATA",
    severity: "high",
    message: "Data export failed.",
    suggestion: "Try again or reduce the export scope.",
    httpStatus: 500,
    retryable: true,
  },
  {
    code: 5003,
    key: "data_corrupted",
    category: "DATA",
    severity: "critical",
    message: "Data integrity check failed.",
    suggestion: "Contact support. The data may need to be restored.",
    httpStatus: 500,
    retryable: false,
  },
  {
    code: 5004,
    key: "schema_mismatch",
    category: "DATA",
    severity: "high",
    message: "The data does not match the expected schema.",
    suggestion: "Ensure the data conforms to the required schema version.",
    httpStatus: 422,
    retryable: false,
  },
  {
    code: 5005,
    key: "migration_failed",
    category: "DATA",
    severity: "critical",
    message: "A data migration failed to complete.",
    suggestion: "Contact support for assistance with the migration.",
    httpStatus: 500,
    retryable: false,
  },
  {
    code: 5006,
    key: "duplicate_data",
    category: "DATA",
    severity: "medium",
    message: "Duplicate data was detected.",
    suggestion: "Remove duplicates or merge the records.",
    httpStatus: 409,
    retryable: false,
  },
  {
    code: 5007,
    key: "data_limit_exceeded",
    category: "DATA",
    severity: "medium",
    message: "The data size exceeds the allowed limit.",
    suggestion: "Reduce the dataset size or paginate the request.",
    httpStatus: 413,
    retryable: false,
  },
  {
    code: 5008,
    key: "encoding_error",
    category: "DATA",
    severity: "medium",
    message: "The data encoding is not supported.",
    suggestion: "Ensure the data is encoded in UTF-8.",
    httpStatus: 400,
    retryable: false,
  },
  {
    code: 5009,
    key: "transformation_error",
    category: "DATA",
    severity: "high",
    message: "Data transformation failed during processing.",
    suggestion: "Check the source data format and transformation rules.",
    httpStatus: 422,
    retryable: false,
  },

  // -----------------------------------------------------------------------
  // SYSTEM (6000-6099)
  // -----------------------------------------------------------------------
  {
    code: 6000,
    key: "internal_error",
    category: "SYSTEM",
    severity: "critical",
    message: "An unexpected internal error occurred.",
    suggestion: "Please try again. If the problem persists, contact support.",
    httpStatus: 500,
    retryable: true,
  },
  {
    code: 6001,
    key: "database_error",
    category: "SYSTEM",
    severity: "critical",
    message: "A database error occurred.",
    suggestion: "Please try again. Our team has been notified.",
    httpStatus: 500,
    retryable: true,
  },
  {
    code: 6002,
    key: "cache_miss",
    category: "SYSTEM",
    severity: "low",
    message: "The requested data was not found in the cache.",
    suggestion: "The data will be fetched from the source.",
    httpStatus: 500,
    retryable: true,
  },
  {
    code: 6003,
    key: "queue_full",
    category: "SYSTEM",
    severity: "high",
    message: "The processing queue is full.",
    suggestion: "Wait a moment and try again.",
    httpStatus: 503,
    retryable: true,
  },
  {
    code: 6004,
    key: "memory_limit",
    category: "SYSTEM",
    severity: "critical",
    message: "The system has reached its memory limit.",
    suggestion: "Reduce request complexity or try again later.",
    httpStatus: 503,
    retryable: true,
  },
  {
    code: 6005,
    key: "disk_full",
    category: "SYSTEM",
    severity: "critical",
    message: "Storage capacity has been reached.",
    suggestion: "Our team has been notified. Please try again later.",
    httpStatus: 503,
    retryable: true,
  },
  {
    code: 6006,
    key: "configuration_error",
    category: "SYSTEM",
    severity: "critical",
    message: "A system configuration error was detected.",
    suggestion: "Contact support. The team has been alerted.",
    httpStatus: 500,
    retryable: false,
  },
  {
    code: 6007,
    key: "deployment_in_progress",
    category: "SYSTEM",
    severity: "low",
    message: "A deployment is currently in progress.",
    suggestion: "Wait a few minutes for the deployment to complete.",
    httpStatus: 503,
    retryable: true,
  },
  {
    code: 6008,
    key: "maintenance_mode",
    category: "SYSTEM",
    severity: "medium",
    message: "The system is undergoing scheduled maintenance.",
    suggestion: "Please try again after the maintenance window.",
    httpStatus: 503,
    retryable: true,
  },
  {
    code: 6009,
    key: "feature_disabled",
    category: "SYSTEM",
    severity: "low",
    message: "This feature is currently disabled.",
    suggestion: "Contact your administrator to enable this feature.",
    httpStatus: 403,
    retryable: false,
  },
] as const;

// ---------------------------------------------------------------------------
// Lookup indexes (built once, used many times)
// ---------------------------------------------------------------------------

const errorByCode: ReadonlyMap<number, ErrorCode> = new Map(
  ERROR_CODES.map((e) => [e.code, e]),
);

const errorByKey: ReadonlyMap<string, ErrorCode> = new Map(
  ERROR_CODES.map((e) => [e.key, e]),
);

const errorsByCategory: ReadonlyMap<ErrorCategory, ReadonlyArray<ErrorCode>> =
  ERROR_CODES.reduce((acc, error) => {
    const existing = acc.get(error.category) ?? [];
    acc.set(error.category, [...existing, error]);
    return acc;
  }, new Map<ErrorCategory, ErrorCode[]>());

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Look up error details by numeric code.
 *
 * @param code - The numeric error code (e.g. 1000).
 * @returns The matching ErrorCode, or undefined if not found.
 */
export function getErrorByCode(code: number): ErrorCode | undefined {
  return errorByCode.get(code);
}

/**
 * Look up error details by string key.
 *
 * @param key - The error key (e.g. "invalid_credentials").
 * @returns The matching ErrorCode, or undefined if not found.
 */
export function getErrorByKey(key: string): ErrorCode | undefined {
  return errorByKey.get(key);
}

/**
 * Get all errors belonging to a specific category.
 *
 * @param category - The error category to filter by.
 * @returns An array of ErrorCode entries for that category.
 */
export function getErrorsByCategory(
  category: ErrorCategory,
): ReadonlyArray<ErrorCode> {
  return errorsByCategory.get(category) ?? [];
}

/**
 * Build a standardized error response object.
 *
 * @param code - The numeric error code.
 * @param overrides - Optional overrides for message and suggestion.
 * @param requestId - Optional request ID for tracing.
 * @returns A complete ErrorResponse object, or undefined if the code is unknown.
 */
export function createErrorResponse(
  code: number,
  overrides?: { message?: string; suggestion?: string },
  requestId?: string,
): ErrorResponse | undefined {
  const errorDef = errorByCode.get(code);
  if (!errorDef) {
    return undefined;
  }

  return {
    success: false,
    error: {
      code: errorDef.code,
      key: errorDef.key,
      category: errorDef.category,
      severity: errorDef.severity,
      message: overrides?.message ?? errorDef.message,
      suggestion: overrides?.suggestion ?? errorDef.suggestion,
    },
    timestamp: new Date().toISOString(),
    ...(requestId !== undefined ? { requestId } : {}),
  };
}

/**
 * Determine whether an error is transient and safe to retry.
 *
 * @param code - The numeric error code.
 * @returns true if the error is retryable, false otherwise.
 *          Returns false for unknown codes.
 */
export function isRetryableError(code: number): boolean {
  return errorByCode.get(code)?.retryable ?? false;
}

/**
 * Map an error code to its corresponding HTTP status code.
 *
 * @param code - The numeric error code.
 * @returns The HTTP status code, or 500 for unknown error codes.
 */
export function getHttpStatusForError(code: number): number {
  return errorByCode.get(code)?.httpStatus ?? 500;
}
