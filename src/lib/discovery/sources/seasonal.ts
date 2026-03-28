import { logger } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { SeasonalConfig, RawDiscoveredLead } from "../types";

interface SeasonalRule {
  vertical: string;
  seasons: string[];
  months: number[];
  trigger: string;
  demandType: string;
}

/**
 * Hardcoded seasonal demand rules by vertical.
 * Used when no weather API key is configured.
 */
const SEASONAL_RULES: SeasonalRule[] = [
  {
    vertical: "hvac",
    seasons: ["summer"],
    months: [6, 7, 8],
    trigger: "summer_heat",
    demandType: "AC maintenance and repair demand peaks",
  },
  {
    vertical: "hvac",
    seasons: ["winter"],
    months: [11, 12, 1, 2],
    trigger: "winter_cold",
    demandType: "Heating system demand peaks",
  },
  {
    vertical: "roofing",
    seasons: ["spring", "fall"],
    months: [3, 4, 5, 9, 10],
    trigger: "storm_season",
    demandType: "Post-storm roof inspection demand",
  },
  {
    vertical: "roofing",
    seasons: ["summer"],
    months: [6, 7, 8],
    trigger: "hail_season",
    demandType: "Hail damage repair season",
  },
  {
    vertical: "plumbing",
    seasons: ["winter"],
    months: [11, 12, 1, 2],
    trigger: "freeze_risk",
    demandType: "Frozen pipe prevention and repair",
  },
  {
    vertical: "plumbing",
    seasons: ["spring"],
    months: [3, 4, 5],
    trigger: "spring_thaw",
    demandType: "Post-winter pipe inspection demand",
  },
  {
    vertical: "landscaping",
    seasons: ["spring"],
    months: [3, 4, 5],
    trigger: "spring_growth",
    demandType: "Spring landscaping and lawn care season",
  },
  {
    vertical: "pest_control",
    seasons: ["spring", "summer"],
    months: [4, 5, 6, 7],
    trigger: "pest_season",
    demandType: "Pest activity increases with warmth",
  },
];

interface WeatherAlert {
  event: string;
  severity: string;
  headline: string;
  description: string;
}

/**
 * Check for seasonal demand triggers relevant to a client's vertical and location.
 *
 * If WEATHER_API_KEY is set, fetches real-time weather alerts for the area.
 * Otherwise, falls back to hardcoded seasonal rules based on current month.
 */
export async function checkSeasonalTriggers(
  config: SeasonalConfig,
): Promise<RawDiscoveredLead[]> {
  const leads: RawDiscoveredLead[] = [];
  const vertical = config.vertical.toLowerCase();
  const currentMonth = new Date().getMonth() + 1; // 1-indexed

  // Try weather-based triggers if API key is available
  const weatherApiKey = process.env.WEATHER_API_KEY;
  if (weatherApiKey) {
    const weatherLeads = await fetchWeatherTriggers(
      weatherApiKey,
      config,
      vertical,
    );
    leads.push(...weatherLeads);
  }

  // Always check hardcoded seasonal rules as a baseline
  const matchingRules = SEASONAL_RULES.filter(
    (rule) =>
      rule.vertical === vertical && rule.months.includes(currentMonth),
  );

  for (const rule of matchingRules) {
    const triggerData = JSON.stringify({
      season: rule.seasons[0],
      trigger: rule.trigger,
      demandType: rule.demandType,
    });

    leads.push({
      externalId: `seasonal:${vertical}:${rule.trigger}:${config.city}:${config.state}`,
      sourceType: "seasonal",
      seasonalTrigger: triggerData,
      rawData: {
        vertical,
        city: config.city,
        state: config.state,
        rule: rule.trigger,
        demandType: rule.demandType,
        currentMonth,
        seasons: rule.seasons,
      },
    });
  }

  logger.info("[discovery:seasonal] Checked seasonal triggers", {
    vertical,
    city: config.city,
    state: config.state,
    currentMonth,
    matchingRules: matchingRules.length,
    totalLeads: leads.length,
  });

  return leads;
}

async function fetchWeatherTriggers(
  apiKey: string,
  config: SeasonalConfig,
  vertical: string,
): Promise<RawDiscoveredLead[]> {
  const leads: RawDiscoveredLead[] = [];

  try {
    const params = new URLSearchParams({
      q: `${config.city},${config.state},US`,
      appid: apiKey,
    });

    const url = `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      logger.warn("[discovery:seasonal] Weather API returned non-OK", {
        status: response.status,
      });
      return [];
    }

    const data = (await response.json()) as {
      alerts?: WeatherAlert[];
      main?: { temp?: number };
    };

    // Check for extreme temperature triggers
    const tempKelvin = data.main?.temp;
    if (tempKelvin != null) {
      const tempF = ((tempKelvin - 273.15) * 9) / 5 + 32;

      if (vertical === "hvac" && tempF > 95) {
        leads.push({
          externalId: `weather:extreme-heat:${config.city}:${config.state}`,
          sourceType: "seasonal",
          seasonalTrigger: JSON.stringify({
            season: "summer",
            weatherEvent: "extreme_heat",
            temperature: Math.round(tempF),
            demandType: "Extreme heat AC demand surge",
          }),
          rawData: { tempF: Math.round(tempF), city: config.city },
        });
      }

      if ((vertical === "hvac" || vertical === "plumbing") && tempF < 20) {
        leads.push({
          externalId: `weather:extreme-cold:${config.city}:${config.state}`,
          sourceType: "seasonal",
          seasonalTrigger: JSON.stringify({
            season: "winter",
            weatherEvent: "extreme_cold",
            temperature: Math.round(tempF),
            demandType: "Extreme cold heating/pipe freeze demand",
          }),
          rawData: { tempF: Math.round(tempF), city: config.city },
        });
      }
    }

    // Check weather alerts for storm-related triggers
    if (data.alerts && Array.isArray(data.alerts)) {
      for (const alert of data.alerts) {
        const eventLower = (alert.event || "").toLowerCase();
        const isStormRelated =
          eventLower.includes("storm") ||
          eventLower.includes("hail") ||
          eventLower.includes("wind") ||
          eventLower.includes("tornado") ||
          eventLower.includes("hurricane");

        if (vertical === "roofing" && isStormRelated) {
          leads.push({
            externalId: `weather:alert:${eventLower.replace(/\s+/g, "-")}:${config.city}`,
            sourceType: "seasonal",
            seasonalTrigger: JSON.stringify({
              weatherEvent: alert.event,
              severity: alert.severity,
              demandType: "Storm damage roof repair demand",
            }),
            rawData: {
              event: alert.event,
              severity: alert.severity,
              headline: alert.headline,
            },
          });
        }
      }
    }
  } catch (err) {
    logger.errorWithCause(
      "[discovery:seasonal] Weather API call failed",
      err,
      { city: config.city },
    );
  }

  return leads;
}
