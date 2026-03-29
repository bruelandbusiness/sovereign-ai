// ---------------------------------------------------------------------------
// Internationalization / Localization Utility
// ---------------------------------------------------------------------------
// Locale-aware translations, number/currency/date formatting, and pluralization
// for key home-services markets: US English, Mexican Spanish, Canadian French.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

/** Supported BCP-47 locale tags. */
export type Locale = "en-US" | "es-MX" | "fr-CA";

/** Dot-notated translation key (e.g. "nav.dashboard"). */
export type TranslationKey =
  | `nav.${
      | "dashboard"
      | "leads"
      | "reviews"
      | "services"
      | "settings"
      | "help"}`
  | `action.${
      | "save"
      | "cancel"
      | "delete"
      | "edit"
      | "create"
      | "submit"
      | "export"}`
  | `status.${
      | "active"
      | "inactive"
      | "pending"
      | "completed"
      | "failed"}`
  | `message.${
      | "success"
      | "error"
      | "loading"
      | "noResults"
      | "confirmDeletion"}`
  | `time.${
      | "today"
      | "yesterday"
      | "thisWeek"
      | "thisMonth"
      | "hoursAgo"
      | "minutesAgo"}`;

/** A complete set of translations for one locale. */
export type TranslationMap = Readonly<Record<TranslationKey, string>>;

/** Configuration metadata for a single locale. */
export interface LocaleConfig {
  readonly locale: Locale;
  readonly label: string;
  readonly currency: string;
  readonly language: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** All locales the application supports, with metadata. */
export const SUPPORTED_LOCALES: readonly LocaleConfig[] = [
  { locale: "en-US", label: "English (US)", currency: "USD", language: "en" },
  { locale: "es-MX", label: "Español (México)", currency: "MXN", language: "es" },
  { locale: "fr-CA", label: "Français (Canada)", currency: "CAD", language: "fr" },
] as const;

/** Default / fallback locale. */
export const DEFAULT_LOCALE: Locale = "en-US";

/** Full translation table for every supported locale. */
export const TRANSLATIONS: Readonly<Record<Locale, TranslationMap>> = {
  "en-US": {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.leads": "Leads",
    "nav.reviews": "Reviews",
    "nav.services": "Services",
    "nav.settings": "Settings",
    "nav.help": "Help",
    // Actions
    "action.save": "Save",
    "action.cancel": "Cancel",
    "action.delete": "Delete",
    "action.edit": "Edit",
    "action.create": "Create",
    "action.submit": "Submit",
    "action.export": "Export",
    // Status
    "status.active": "Active",
    "status.inactive": "Inactive",
    "status.pending": "Pending",
    "status.completed": "Completed",
    "status.failed": "Failed",
    // Messages
    "message.success": "Success",
    "message.error": "Error",
    "message.loading": "Loading…",
    "message.noResults": "No results",
    "message.confirmDeletion": "Are you sure you want to delete this item?",
    // Time
    "time.today": "Today",
    "time.yesterday": "Yesterday",
    "time.thisWeek": "This week",
    "time.thisMonth": "This month",
    "time.hoursAgo": "hours ago",
    "time.minutesAgo": "minutes ago",
  },

  "es-MX": {
    // Navigation
    "nav.dashboard": "Tablero",
    "nav.leads": "Prospectos",
    "nav.reviews": "Reseñas",
    "nav.services": "Servicios",
    "nav.settings": "Configuración",
    "nav.help": "Ayuda",
    // Actions
    "action.save": "Guardar",
    "action.cancel": "Cancelar",
    "action.delete": "Eliminar",
    "action.edit": "Editar",
    "action.create": "Crear",
    "action.submit": "Enviar",
    "action.export": "Exportar",
    // Status
    "status.active": "Activo",
    "status.inactive": "Inactivo",
    "status.pending": "Pendiente",
    "status.completed": "Completado",
    "status.failed": "Fallido",
    // Messages
    "message.success": "Éxito",
    "message.error": "Error",
    "message.loading": "Cargando…",
    "message.noResults": "Sin resultados",
    "message.confirmDeletion":
      "¿Está seguro de que desea eliminar este elemento?",
    // Time
    "time.today": "Hoy",
    "time.yesterday": "Ayer",
    "time.thisWeek": "Esta semana",
    "time.thisMonth": "Este mes",
    "time.hoursAgo": "horas atrás",
    "time.minutesAgo": "minutos atrás",
  },

  "fr-CA": {
    // Navigation
    "nav.dashboard": "Tableau de bord",
    "nav.leads": "Prospects",
    "nav.reviews": "Avis",
    "nav.services": "Services",
    "nav.settings": "Paramètres",
    "nav.help": "Aide",
    // Actions
    "action.save": "Enregistrer",
    "action.cancel": "Annuler",
    "action.delete": "Supprimer",
    "action.edit": "Modifier",
    "action.create": "Créer",
    "action.submit": "Soumettre",
    "action.export": "Exporter",
    // Status
    "status.active": "Actif",
    "status.inactive": "Inactif",
    "status.pending": "En attente",
    "status.completed": "Terminé",
    "status.failed": "Échoué",
    // Messages
    "message.success": "Succès",
    "message.error": "Erreur",
    "message.loading": "Chargement…",
    "message.noResults": "Aucun résultat",
    "message.confirmDeletion":
      "Êtes-vous sûr de vouloir supprimer cet élément?",
    // Time
    "time.today": "Aujourd'hui",
    "time.yesterday": "Hier",
    "time.thisWeek": "Cette semaine",
    "time.thisMonth": "Ce mois-ci",
    "time.hoursAgo": "heures passées",
    "time.minutesAgo": "minutes passées",
  },
} as const;

// ---------------------------------------------------------------------------
// Helpers (private)
// ---------------------------------------------------------------------------

function isSupported(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.some((cfg) => cfg.locale === locale);
}

function configFor(locale: Locale): LocaleConfig {
  const cfg = SUPPORTED_LOCALES.find((c) => c.locale === locale);
  if (!cfg) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  return cfg;
}

// ---------------------------------------------------------------------------
// t() — Translate
// ---------------------------------------------------------------------------

/**
 * Look up a translated string for the given key and locale.
 *
 * Falls back to `en-US` when the requested locale is missing or does not
 * contain the key.  Returns the raw key if no translation exists at all.
 */
export function t(key: TranslationKey, locale: Locale = DEFAULT_LOCALE): string {
  const map = TRANSLATIONS[locale];
  if (map && key in map) {
    return map[key];
  }

  // Fallback to English
  const fallback = TRANSLATIONS[DEFAULT_LOCALE];
  if (fallback && key in fallback) {
    return fallback[key];
  }

  return key;
}

// ---------------------------------------------------------------------------
// formatNumber()
// ---------------------------------------------------------------------------

/**
 * Format a number according to the given locale (e.g. thousands separators).
 *
 * @param value   The number to format.
 * @param locale  Target locale (defaults to `en-US`).
 * @param options Additional `Intl.NumberFormat` options.
 */
export function formatNumber(
  value: number,
  locale: Locale = DEFAULT_LOCALE,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

// ---------------------------------------------------------------------------
// formatCurrency()
// ---------------------------------------------------------------------------

/**
 * Format a monetary value using the currency associated with the locale.
 *
 * - `en-US` → USD
 * - `es-MX` → MXN
 * - `fr-CA` → CAD
 *
 * @param value            Numeric amount.
 * @param locale           Target locale.
 * @param currencyOverride Explicit ISO-4217 currency code (overrides locale default).
 */
export function formatCurrency(
  value: number,
  locale: Locale = DEFAULT_LOCALE,
  currencyOverride?: string,
): string {
  const cfg = configFor(locale);
  const currency = currencyOverride ?? cfg.currency;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

// ---------------------------------------------------------------------------
// formatDate()
// ---------------------------------------------------------------------------

/**
 * Format a `Date` for display in the given locale.
 *
 * @param date    The date to format.
 * @param locale  Target locale.
 * @param options Additional `Intl.DateTimeFormat` options.  Defaults to a
 *                medium-length date representation when nothing is provided.
 */
export function formatDate(
  date: Date,
  locale: Locale = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions,
): string {
  const defaults: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return new Intl.DateTimeFormat(locale, options ?? defaults).format(date);
}

// ---------------------------------------------------------------------------
// pluralize()
// ---------------------------------------------------------------------------

/**
 * Return the singular or plural form of a word based on a count.
 *
 * For Spanish and French, if no explicit `plural` is supplied the function
 * appends an "s" — which is correct for the vast majority of nouns in both
 * languages.
 *
 * @param count    The quantity determining which form to use.
 * @param singular The singular form of the word.
 * @param plural   The plural form (defaults to `singular + "s"`).
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  const resolvedPlural = plural ?? `${singular}s`;
  return count === 1 ? singular : resolvedPlural;
}

// ---------------------------------------------------------------------------
// getLocaleFromBrowser()
// ---------------------------------------------------------------------------

/**
 * Detect the best supported locale from an HTTP `Accept-Language` header.
 *
 * Parses quality values (`q=…`) and returns the highest-priority locale
 * that is in {@link SUPPORTED_LOCALES}.  Falls back to {@link DEFAULT_LOCALE}
 * when no match is found.
 *
 * This function has **no DOM access** — it works with a raw header string,
 * making it safe for use in server-side environments (Next.js middleware,
 * API routes, edge functions, etc.).
 *
 * @param acceptLanguage  The raw `Accept-Language` header value.
 */
export function getLocaleFromBrowser(acceptLanguage: string): Locale {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  // Parse into a list of { tag, quality } sorted by descending quality.
  const parsed = acceptLanguage
    .split(",")
    .map((entry) => {
      const [tag = "", qPart] = entry.trim().split(";");
      const trimmedTag = tag.trim();
      let quality = 1;
      if (qPart) {
        const match = /q\s*=\s*([\d.]+)/.exec(qPart);
        if (match?.[1]) {
          quality = parseFloat(match[1]);
        }
      }
      return { tag: trimmedTag, quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of parsed) {
    // Exact match (e.g. "fr-CA")
    if (isSupported(tag)) {
      return tag;
    }

    // Language-only match (e.g. "es" → "es-MX")
    const language = tag.split("-")[0]?.toLowerCase();
    if (language) {
      const match = SUPPORTED_LOCALES.find(
        (cfg) => cfg.language === language,
      );
      if (match) {
        return match.locale;
      }
    }
  }

  return DEFAULT_LOCALE;
}
