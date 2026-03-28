/**
 * Vertical-specific homeowner email templates for service delivery outreach.
 * These emails are sent TO homeowners on behalf of contractor clients.
 *
 * Verticals: HVAC, Roofing, Plumbing, Electrical, Pest Control
 * Each vertical has one or more campaign sequences with day offsets.
 */

export type Vertical = "hvac" | "roofing" | "plumbing" | "electrical" | "pest_control";
export type Season = "summer" | "winter" | "spring" | "fall";

export interface VerticalEmailContext {
  firstName: string;
  contractorName: string;
  contractorPhone: string;
  address: string; // CAN-SPAM physical address
  city: string;
  neighborhood: string;
  zipCode: string;
  serviceArea: string;
  unsubscribeUrl: string;
  // Vertical-specific
  decade?: string;        // e.g., "1990" for roofing/plumbing
  pipeMaterial?: string;  // plumbing
  pipeLifespan?: string;  // plumbing
  pestType?: string;      // pest control
  pestReason?: string;    // pest control
  peakMonth?: string;     // pest control
  tempRange?: string;     // HVAC winter
  recentWeatherEvent?: string; // roofing
  season?: Season;
}

export interface VerticalEmail {
  subject: string;
  html: string; // With CAN-SPAM footer
  vertical: Vertical;
  campaign: string;
  dayOffset: number;
}

// ---------------------------------------------------------------------------
// Shared HTML helpers
// ---------------------------------------------------------------------------

const BODY_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: #333333;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`.replace(/\n/g, " ").trim();

const FOOTER_STYLE = `
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
  color: #999999;
  line-height: 1.5;
`.replace(/\n/g, " ").trim();

const LINK_STYLE = "color: #2563eb; text-decoration: none;";
const CTA_STYLE = `
  display: inline-block;
  margin-top: 16px;
  padding: 10px 0;
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
`.replace(/\n/g, " ").trim();

function canSpamFooter(ctx: VerticalEmailContext): string {
  return `
    <div style="${FOOTER_STYLE}">
      <p style="margin: 0 0 4px 0;">
        Sent on behalf of <strong>${ctx.contractorName}</strong>
      </p>
      <p style="margin: 0 0 4px 0;">${ctx.address}</p>
      <p style="margin: 0 0 12px 0;">
        <a href="${ctx.unsubscribeUrl}" style="${LINK_STYLE}">Unsubscribe</a>
        &nbsp;|&nbsp; You received this because your home is in our ${ctx.serviceArea} service area.
      </p>
    </div>
  `;
}

function wrapHtml(body: string, ctx: VerticalEmailContext): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="${BODY_STYLE}">
${body}
${canSpamFooter(ctx)}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// HVAC Templates
// ---------------------------------------------------------------------------

function hvacSummer(ctx: VerticalEmailContext): VerticalEmail[] {
  return [
    {
      vertical: "hvac",
      campaign: "hvac_summer",
      dayOffset: 0,
      subject: `is your AC ready for ${ctx.city} summer?`,
      html: wrapHtml(`
  <p style="margin: 0 0 16px 0;">Hi ${ctx.firstName},</p>

  <p style="margin: 0 0 16px 0;">
    Summer in ${ctx.city} doesn't give much warning. One day it's fine, the next your AC
    is running nonstop — and that's usually when people find out something's wrong.
  </p>

  <p style="margin: 0 0 16px 0;">
    <strong>${ctx.contractorName}</strong> is offering homeowners in ${ctx.neighborhood} a
    quick pre-season AC check before the rush hits. It takes about 30 minutes, covers the
    major failure points, and makes sure you're not calling for emergency service in July.
  </p>

  <p style="margin: 0 0 16px 0;">
    If you want to lock one in, you can call or text us directly:
  </p>

  <p style="margin: 0 0 16px 0;">
    <a href="tel:${ctx.contractorPhone}" style="${CTA_STYLE}">${ctx.contractorPhone}</a>
  </p>

  <p style="margin: 0 0 0 0;">
    Stay cool,<br>
    <strong>${ctx.contractorName}</strong>
  </p>
      `, ctx),
    },
    {
      vertical: "hvac",
      campaign: "hvac_summer",
      dayOffset: 3,
      subject: "one thing most homeowners don't check",
      html: wrapHtml(`
  <p style="margin: 0 0 16px 0;">${ctx.firstName} —</p>

  <p style="margin: 0 0 16px 0;">
    Most homeowners remember to swap their air filter, but almost nobody checks the
    condensate drain line. It's a small PVC pipe near your outdoor unit — and when
    it clogs (which it does every year), you get water damage, mold, or your system
    shuts itself off as a safety measure.
  </p>

  <p style="margin: 0 0 16px 0;">
    Takes two minutes to clear it with a wet/dry vac. Or if you'd rather have a pro
    handle it along with a full system check, that's exactly what our pre-season
    tune-up covers.
  </p>

  <p style="margin: 0 0 16px 0;">
    <a href="tel:${ctx.contractorPhone}" style="${CTA_STYLE}">Call or text: ${ctx.contractorPhone}</a>
  </p>

  <p style="margin: 0 0 0 0;">
    — <strong>${ctx.contractorName}</strong>
  </p>
      `, ctx),
    },
  ];
}

function hvacWinter(ctx: VerticalEmailContext): VerticalEmail[] {
  const tempRange = ctx.tempRange || "below freezing";

  return [
    {
      vertical: "hvac",
      campaign: "hvac_winter",
      dayOffset: 0,
      subject: `${ctx.neighborhood} — heating season prep`,
      html: wrapHtml(`
  <p style="margin: 0 0 16px 0;">Hi ${ctx.firstName},</p>

  <p style="margin: 0 0 16px 0;">
    With temperatures in ${ctx.city} expected to drop ${tempRange} this season,
    now is the time to make sure your heating system is ready. A furnace that
    hasn't been serviced in over a year is more likely to break down when you
    need it most — and emergency calls in January are never cheap.
  </p>

  <p style="margin: 0 0 16px 0;">
    <strong>${ctx.contractorName}</strong> is scheduling heating inspections for
    homeowners in ${ctx.neighborhood} this month. We check the heat exchanger,
    ignition system, and airflow — the three things that cause 90% of mid-winter
    breakdowns.
  </p>

  <p style="margin: 0 0 16px 0;">
    Want to get ahead of it? Give us a call:
  </p>

  <p style="margin: 0 0 16px 0;">
    <a href="tel:${ctx.contractorPhone}" style="${CTA_STYLE}">${ctx.contractorPhone}</a>
  </p>

  <p style="margin: 0 0 0 0;">
    Stay warm,<br>
    <strong>${ctx.contractorName}</strong>
  </p>
      `, ctx),
    },
  ];
}

// ---------------------------------------------------------------------------
// Roofing Templates
// ---------------------------------------------------------------------------

function roofing(ctx: VerticalEmailContext): VerticalEmail[] {
  const decade = ctx.decade || "2000";
  const weatherNote = ctx.recentWeatherEvent
    ? `<p style="margin: 0 0 16px 0;">
        After the recent ${ctx.recentWeatherEvent}, it's especially worth checking for
        damage that might not be visible from the ground.
      </p>`
    : "";

  return [
    {
      vertical: "roofing",
      campaign: "roofing_inspection",
      dayOffset: 0,
      subject: `${ctx.neighborhood} homes built in the ${decade}s`,
      html: wrapHtml(`
  <p style="margin: 0 0 16px 0;">Hi ${ctx.firstName},</p>

  <p style="margin: 0 0 16px 0;">
    A lot of homes in ${ctx.neighborhood} were built in the ${decade}s, which means the
    original roof is hitting the age where small problems start turning into expensive ones.
    Cracked flashing, curling shingles, and worn sealant around vents are the kinds of
    things you can't see from the driveway — but they lead to leaks if they go unchecked.
  </p>

  ${weatherNote}

  <p style="margin: 0 0 16px 0;">
    <strong>${ctx.contractorName}</strong> is offering free roof inspections for homeowners in
    ${ctx.neighborhood}. We'll get up there, document everything with photos, and give you an
    honest assessment — no pressure, no scare tactics.
  </p>

  <p style="margin: 0 0 16px 0;">
    If you'd like to schedule one, just call or text:
  </p>

  <p style="margin: 0 0 16px 0;">
    <a href="tel:${ctx.contractorPhone}" style="${CTA_STYLE}">${ctx.contractorPhone}</a>
  </p>

  <p style="margin: 0 0 0 0;">
    Best,<br>
    <strong>${ctx.contractorName}</strong>
  </p>
      `, ctx),
    },
  ];
}

// ---------------------------------------------------------------------------
// Plumbing Templates
// ---------------------------------------------------------------------------

function plumbing(ctx: VerticalEmailContext): VerticalEmail[] {
  const pipeMaterial = ctx.pipeMaterial || "copper or galvanized steel";
  const pipeLifespan = ctx.pipeLifespan || "40–50 years";
  const decade = ctx.decade || "1980";

  return [
    {
      vertical: "plumbing",
      campaign: "plumbing_inspection",
      dayOffset: 0,
      subject: `${ctx.firstName}, quick note about your home's plumbing`,
      html: wrapHtml(`
  <p style="margin: 0 0 16px 0;">Hi ${ctx.firstName},</p>

  <p style="margin: 0 0 16px 0;">
    Homes built in the ${decade}s in ${ctx.neighborhood} typically have ${pipeMaterial}
    pipes, which have a lifespan of about ${pipeLifespan}. If yours haven't been inspected
    in a while, small issues like pinhole leaks, corroded joints, or low water pressure
    could be developing behind the walls without any obvious signs.
  </p>

  <p style="margin: 0 0 16px 0;">
    <strong>${ctx.contractorName}</strong> is running plumbing inspections for homeowners in
    ${ctx.neighborhood}. We check the main supply line, water heater, visible pipe
    conditions, and water pressure — and we'll let you know exactly where things stand.
  </p>

  <p style="margin: 0 0 16px 0;">
    Interested? Call or text us anytime:
  </p>

  <p style="margin: 0 0 16px 0;">
    <a href="tel:${ctx.contractorPhone}" style="${CTA_STYLE}">${ctx.contractorPhone}</a>
  </p>

  <p style="margin: 0 0 0 0;">
    — <strong>${ctx.contractorName}</strong>
  </p>
      `, ctx),
    },
  ];
}

// ---------------------------------------------------------------------------
// Electrical Templates
// ---------------------------------------------------------------------------

function electrical(ctx: VerticalEmailContext): VerticalEmail[] {
  return [
    {
      vertical: "electrical",
      campaign: "electrical_safety",
      dayOffset: 0,
      subject: `${ctx.neighborhood} electrical safety check`,
      html: wrapHtml(`
  <p style="margin: 0 0 16px 0;">Hi ${ctx.firstName},</p>

  <p style="margin: 0 0 16px 0;">
    Outdated wiring and overloaded panels are the #1 cause of residential electrical
    fires — and most homeowners don't know there's a problem until something trips,
    sparks, or worse. If your home's electrical system hasn't been inspected in the
    last few years, it's worth a look.
  </p>

  <p style="margin: 0 0 16px 0;">
    <strong>${ctx.contractorName}</strong> is offering electrical safety inspections for
    homeowners in ${ctx.neighborhood}. We check your panel, wiring condition, GFCI
    outlets, and grounding — everything that keeps your home safe and up to code.
  </p>

  <p style="margin: 0 0 16px 0;">
    Want to schedule one? Call or text:
  </p>

  <p style="margin: 0 0 16px 0;">
    <a href="tel:${ctx.contractorPhone}" style="${CTA_STYLE}">${ctx.contractorPhone}</a>
  </p>

  <p style="margin: 0 0 0 0;">
    Stay safe,<br>
    <strong>${ctx.contractorName}</strong>
  </p>
      `, ctx),
    },
  ];
}

// ---------------------------------------------------------------------------
// Pest Control Templates
// ---------------------------------------------------------------------------

function pestControl(ctx: VerticalEmailContext): VerticalEmail[] {
  const pestType = ctx.pestType || "pest";
  const pestReason = ctx.pestReason || "seasonal activity patterns";
  const peakMonth = ctx.peakMonth || "the coming weeks";

  return [
    {
      vertical: "pest_control",
      campaign: "pest_control_seasonal",
      dayOffset: 0,
      subject: `${pestType} season is starting in ${ctx.city}`,
      html: wrapHtml(`
  <p style="margin: 0 0 16px 0;">Hi ${ctx.firstName},</p>

  <p style="margin: 0 0 16px 0;">
    ${pestType} activity in ${ctx.city} typically peaks around ${peakMonth}, driven
    by ${pestReason}. Once they establish a foothold in or around your home, they're
    significantly harder (and more expensive) to deal with.
  </p>

  <p style="margin: 0 0 16px 0;">
    <strong>${ctx.contractorName}</strong> is scheduling preventive treatments for
    homeowners in ${ctx.neighborhood} before the peak hits. A single visit now can
    save you from a full infestation later.
  </p>

  <p style="margin: 0 0 16px 0;">
    Want to get ahead of it? Call or text:
  </p>

  <p style="margin: 0 0 16px 0;">
    <a href="tel:${ctx.contractorPhone}" style="${CTA_STYLE}">${ctx.contractorPhone}</a>
  </p>

  <p style="margin: 0 0 0 0;">
    — <strong>${ctx.contractorName}</strong>
  </p>
      `, ctx),
    },
  ];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the full set of emails for a given vertical + season combination.
 * Each email includes the subject, rendered HTML with CAN-SPAM footer,
 * campaign identifier, and day offset for the send schedule.
 */
export function getVerticalEmails(
  vertical: Vertical,
  season: Season,
  ctx: VerticalEmailContext,
): VerticalEmail[] {
  switch (vertical) {
    case "hvac":
      if (season === "summer" || season === "spring") {
        return hvacSummer(ctx);
      }
      if (season === "winter" || season === "fall") {
        return hvacWinter(ctx);
      }
      return hvacSummer(ctx);

    case "roofing":
      return roofing(ctx);

    case "plumbing":
      return plumbing(ctx);

    case "electrical":
      return electrical(ctx);

    case "pest_control":
      return pestControl(ctx);

    default: {
      const _exhaustive: never = vertical;
      throw new Error(`Unknown vertical: ${_exhaustive}`);
    }
  }
}

/**
 * Returns the list of campaign identifiers available for a given vertical.
 */
export function getAvailableCampaigns(vertical: Vertical): string[] {
  switch (vertical) {
    case "hvac":
      return ["hvac_summer", "hvac_winter"];
    case "roofing":
      return ["roofing_inspection"];
    case "plumbing":
      return ["plumbing_inspection"];
    case "electrical":
      return ["electrical_safety"];
    case "pest_control":
      return ["pest_control_seasonal"];
    default: {
      const _exhaustive: never = vertical;
      throw new Error(`Unknown vertical: ${_exhaustive}`);
    }
  }
}
