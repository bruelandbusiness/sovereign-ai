/**
 * Comprehensive form validation utility.
 * Pure TypeScript, no DOM access. All validators return an error message
 * string on failure or null on success.
 */

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

/** A single validation function. Returns an error message or null. */
export type ValidationRule = (value: unknown) => string | null;

/** Configuration for validating a single field. */
export interface FieldValidator {
  readonly fieldName: string;
  readonly label: string;
  readonly validators: readonly ValidationRule[];
}

/** A map of field names to their validators. */
export type FormSchema = Record<string, FieldValidator>;

/** Error details for a single field. */
export interface FieldError {
  readonly field: string;
  readonly label: string;
  readonly errors: readonly string[];
}

/** Result of validating an entire form. */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly FieldError[];
  readonly errorsByField: Readonly<Record<string, FieldError>>;
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

function toString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
// Built-in Validators
// ---------------------------------------------------------------------------

/** Validates that the field is not empty. */
export function required(): ValidationRule {
  return (value: unknown): string | null => {
    const str = toString(value);
    if (str.length === 0) {
      return "This field is required";
    }
    return null;
  };
}

/** Validates a basic email format. */
export function email(): ValidationRule {
  return (value: unknown): string | null => {
    const str = toString(value);
    if (str.length === 0) {
      return null;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(str)) {
      return "Please enter a valid email address";
    }
    return null;
  };
}

/** Validates a US phone number format. */
export function phone(): ValidationRule {
  return (value: unknown): string | null => {
    const str = toString(value);
    if (str.length === 0) {
      return null;
    }
    const digits = str.replace(/[\s\-().+]/g, "");
    const phoneRegex = /^1?\d{10}$/;
    if (!phoneRegex.test(digits)) {
      return "Please enter a valid US phone number";
    }
    return null;
  };
}

/** Validates a URL format. */
export function url(): ValidationRule {
  return (value: unknown): string | null => {
    const str = toString(value);
    if (str.length === 0) {
      return null;
    }
    const urlRegex =
      /^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(:[0-9]+)?(\/[^\s]*)?$/;
    if (!urlRegex.test(str)) {
      return "Please enter a valid URL";
    }
    return null;
  };
}

/** Validates minimum string length. */
export function minLength(n: number): ValidationRule {
  return (value: unknown): string | null => {
    const str = toString(value);
    if (str.length === 0) {
      return null;
    }
    if (str.length < n) {
      return `Must be at least ${n} characters`;
    }
    return null;
  };
}

/** Validates maximum string length. */
export function maxLength(n: number): ValidationRule {
  return (value: unknown): string | null => {
    const str = toString(value);
    if (str.length > n) {
      return `Must be no more than ${n} characters`;
    }
    return null;
  };
}

/** Validates a numeric minimum bound. */
export function min(n: number): ValidationRule {
  return (value: unknown): string | null => {
    const num = toNumber(value);
    if (num === null) {
      return null;
    }
    if (num < n) {
      return `Must be at least ${n}`;
    }
    return null;
  };
}

/** Validates a numeric maximum bound. */
export function max(n: number): ValidationRule {
  return (value: unknown): string | null => {
    const num = toNumber(value);
    if (num === null) {
      return null;
    }
    if (num > n) {
      return `Must be no more than ${n}`;
    }
    return null;
  };
}

/** Validates against a custom regex pattern. */
export function pattern(regex: RegExp, message: string): ValidationRule {
  return (value: unknown): string | null => {
    const str = toString(value);
    if (str.length === 0) {
      return null;
    }
    if (!regex.test(str)) {
      return message;
    }
    return null;
  };
}

/** Validates a US zip code (5-digit or 5+4 format). */
export function zipCode(): ValidationRule {
  return (value: unknown): string | null => {
    const str = toString(value);
    if (str.length === 0) {
      return null;
    }
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(str)) {
      return "Please enter a valid US zip code (e.g. 12345 or 12345-6789)";
    }
    return null;
  };
}

/**
 * Validates a credit card number using the Luhn algorithm.
 * This is format validation only -- it does not verify that the
 * card number is actually issued or active.
 */
export function creditCard(): ValidationRule {
  return (value: unknown): string | null => {
    const str = toString(value).replace(/[\s-]/g, "");
    if (str.length === 0) {
      return null;
    }
    if (!/^\d{13,19}$/.test(str)) {
      return "Please enter a valid credit card number";
    }
    // Luhn algorithm
    let sum = 0;
    let alternate = false;
    for (let i = str.length - 1; i >= 0; i--) {
      let digit = parseInt(str[i], 10);
      if (alternate) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      alternate = !alternate;
    }
    if (sum % 10 !== 0) {
      return "Please enter a valid credit card number";
    }
    return null;
  };
}

/**
 * Validates a strong password: 8+ characters, at least one uppercase,
 * one lowercase, one digit, and one special character.
 */
export function strongPassword(): ValidationRule {
  return (value: unknown): string | null => {
    const str = toString(value);
    if (str.length === 0) {
      return null;
    }
    const issues: string[] = [];
    if (str.length < 8) {
      issues.push("at least 8 characters");
    }
    if (!/[A-Z]/.test(str)) {
      issues.push("an uppercase letter");
    }
    if (!/[a-z]/.test(str)) {
      issues.push("a lowercase letter");
    }
    if (!/\d/.test(str)) {
      issues.push("a number");
    }
    if (!/[^A-Za-z0-9]/.test(str)) {
      issues.push("a special character");
    }
    if (issues.length > 0) {
      return `Password must contain ${issues.join(", ")}`;
    }
    return null;
  };
}

// ---------------------------------------------------------------------------
// Composition & Validation Utilities
// ---------------------------------------------------------------------------

/** Combines multiple validators into a single validator for one field. */
export function composeValidators(
  ...validators: readonly ValidationRule[]
): ValidationRule {
  return (value: unknown): string | null => {
    for (const validator of validators) {
      const error = validator(value);
      if (error !== null) {
        return error;
      }
    }
    return null;
  };
}

/**
 * Validates all fields in a form against a schema.
 *
 * @param formData - A record of field names to their current values.
 * @param schema - The form schema defining validators per field.
 * @returns A ValidationResult with all errors collected.
 */
export function validateForm(
  formData: Readonly<Record<string, unknown>>,
  schema: FormSchema
): ValidationResult {
  const fieldErrors: FieldError[] = [];
  const errorsByField: Record<string, FieldError> = {};

  for (const [fieldName, fieldValidator] of Object.entries(schema)) {
    const value = formData[fieldName];
    const errors: string[] = [];

    for (const rule of fieldValidator.validators) {
      const error = rule(value);
      if (error !== null) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      const fieldError: FieldError = {
        field: fieldName,
        label: fieldValidator.label,
        errors,
      };
      fieldErrors.push(fieldError);
      errorsByField[fieldName] = fieldError;
    }
  }

  return {
    valid: fieldErrors.length === 0,
    errors: fieldErrors,
    errorsByField,
  };
}

/** Returns the first error message for a given field, or null. */
export function getFirstError(
  result: ValidationResult,
  fieldName: string
): string | null {
  const fieldError = result.errorsByField[fieldName];
  if (fieldError && fieldError.errors.length > 0) {
    return fieldError.errors[0];
  }
  return null;
}

/** Returns true if the entire form is valid. */
export function isFormValid(result: ValidationResult): boolean {
  return result.valid;
}

// ---------------------------------------------------------------------------
// Common Pre-built Schemas
// ---------------------------------------------------------------------------

function field(
  fieldName: string,
  label: string,
  validators: readonly ValidationRule[]
): FieldValidator {
  return { fieldName, label, validators };
}

export const COMMON_SCHEMAS = {
  /** Contact form: name, email, phone (optional), message. */
  contact: {
    name: field("name", "Name", [required(), minLength(2), maxLength(100)]),
    email: field("email", "Email", [required(), email()]),
    phone: field("phone", "Phone", [phone()]),
    message: field("message", "Message", [
      required(),
      minLength(10),
      maxLength(2000),
    ]),
  },

  /** Lead capture: name, email, company, trade. */
  leadCapture: {
    name: field("name", "Name", [required(), minLength(2), maxLength(100)]),
    email: field("email", "Email", [required(), email()]),
    company: field("company", "Company", [
      required(),
      minLength(2),
      maxLength(200),
    ]),
    trade: field("trade", "Trade", [required(), minLength(2), maxLength(100)]),
  },

  /** Login form: email, password. */
  login: {
    email: field("email", "Email", [required(), email()]),
    password: field("password", "Password", [required()]),
  },

  /** Registration: name, email, password, confirmPassword. */
  registration: {
    name: field("name", "Name", [required(), minLength(2), maxLength(100)]),
    email: field("email", "Email", [required(), email()]),
    password: field("password", "Password", [required(), strongPassword()]),
    confirmPassword: field("confirmPassword", "Confirm Password", [
      required(),
    ]),
  },
} as const satisfies Record<string, FormSchema>;
