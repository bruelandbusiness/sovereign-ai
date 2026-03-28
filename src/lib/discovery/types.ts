export interface RawDiscoveredLead {
  externalId?: string;
  sourceType: string;
  propertyAddress?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  propertyAge?: number;
  propertyType?: string;
  saleDate?: Date;
  salePrice?: number;
  permitType?: string;
  permitDate?: Date;
  reviewPlatform?: string;
  reviewRating?: number;
  reviewSnippet?: string;
  competitorName?: string;
  seasonalTrigger?: string;
  rawData?: Record<string, unknown>;
}

export interface PermitSourceConfig {
  county: string;
  state: string;
  permitTypes: string[];
  lookbackDays: number;
  apiUrl?: string;
}

export interface RealEstateSourceConfig {
  city: string;
  state: string;
  lookbackDays: number;
  apiKey?: string;
}

export interface CompetitorReviewConfig {
  competitorNames: string[];
  vertical: string;
  city: string;
  state: string;
  minRating?: number;
  maxRating?: number;
}

export interface SeasonalConfig {
  vertical: string;
  city: string;
  state: string;
}

export interface AgingHomeConfig {
  city: string;
  state: string;
  minAge: number;
  lookbackPermitYears: number;
}

export interface DiscoveryRunResult {
  clientId: string;
  sourcesRun: number;
  leadsDiscovered: number;
  leadsStored: number;
  errors: string[];
}
