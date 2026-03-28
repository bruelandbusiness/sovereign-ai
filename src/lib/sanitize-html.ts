/**
 * Client-side HTML sanitizer using the browser's DOMParser.
 *
 * Strips dangerous elements (script, iframe, object, embed, form, etc.)
 * and dangerous attributes (on* event handlers, javascript: URLs).
 *
 * Use this whenever rendering user-supplied or API-sourced HTML with
 * dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove dangerous elements (including <style> for CSS injection)
  const dangerousTags = doc.querySelectorAll(
    "script, iframe, object, embed, form, link[rel=import], meta, base, applet, style, svg[onload], noscript, template, math"
  );
  dangerousTags.forEach((el) => el.remove());

  // Remove event handlers, javascript: URLs, and data: URLs from all elements
  const allElements = doc.querySelectorAll("*");
  allElements.forEach((el) => {
    const attrs = [...el.attributes];
    for (const attr of attrs) {
      if (
        attr.name.startsWith("on") ||
        (attr.value &&
          /^\s*(javascript|data|vbscript):/i.test(attr.value.trim()))
      ) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return doc.body.innerHTML;
}
