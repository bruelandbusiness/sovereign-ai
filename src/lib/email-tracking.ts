const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://sovereignai.com";

/**
 * Generate a 1x1 transparent tracking pixel <img> tag for open tracking.
 */
function generateTrackingPixel(messageId: string): string {
  const trackingUrl = `${APP_URL}/api/email/track/open?mid=${encodeURIComponent(messageId)}`;
  return `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />`;
}

/**
 * Rewrite all <a href="..."> links in HTML to go through the click tracker.
 * Preserves mailto: and tel: links as-is.
 */
function wrapLinksForTracking(
  html: string,
  messageId: string
): string {
  // Match <a ... href="..." ...> tags and rewrite the href
  return html.replace(
    /<a\s([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
    (_match: string, before: string, url: string, after: string) => {
      // Don't track mailto:, tel:, or # links
      if (
        url.startsWith("mailto:") ||
        url.startsWith("tel:") ||
        url.startsWith("#")
      ) {
        return `<a ${before}href="${url}"${after}>`;
      }

      const trackingUrl = `${APP_URL}/api/email/track/click?mid=${encodeURIComponent(messageId)}&url=${encodeURIComponent(url)}`;
      return `<a ${before}href="${trackingUrl}"${after}>`;
    }
  );
}

/**
 * Inject both open-tracking pixel and click-tracking link wrapping into HTML.
 * Call this before sending any campaign/tracked email.
 */
export function injectTracking(html: string, messageId: string): string {
  // Wrap links first
  let tracked = wrapLinksForTracking(html, messageId);

  // Append tracking pixel before closing </body> or at end of HTML
  const pixel = generateTrackingPixel(messageId);
  if (tracked.includes("</body>")) {
    tracked = tracked.replace("</body>", `${pixel}</body>`);
  } else if (tracked.includes("</div>")) {
    // Insert before the last closing </div> (common in our email templates)
    const lastDivIndex = tracked.lastIndexOf("</div>");
    tracked =
      tracked.slice(0, lastDivIndex) + pixel + tracked.slice(lastDivIndex);
  } else {
    tracked += pixel;
  }

  return tracked;
}
