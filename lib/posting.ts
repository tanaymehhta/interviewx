// Reads a job posting from a link without a browser. Pure fetch and text work, so it can be tested alone.

/** Sites that always answer with a login page. Other unreadable pages are caught from the fetch result. */
const WALLED = /(^|\.)linkedin\.com$/i;
export const isWalled = (url: string) => {
  try { return WALLED.test(new URL(url).hostname); } catch { return true; }
};

const strip = (html: string) => html
  .replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
  .replace(/\s+/g, " ").trim();

/** Workday draws its pages with JavaScript, but the same posting is public JSON at /wday/cxs/{tenant}/{site}/job/... */
export function workdayJson(url: string): string | null {
  const m = /^https?:\/\/(([^./]+)\.wd\d+\.myworkdayjobs\.com)\/(?:[a-z]{2}-[A-Z]{2}\/)?([^/]+)\/(job\/[^?#]+)/.exec(url);
  return m && `https://${m[1]}/wday/cxs/${m[2]}/${m[3]}/${m[4]}`;
}

/** The schema.org JobPosting that career pages add for Google Jobs, if the page has one. */
export function jsonLdPosting(html: string): string | null {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      const items = Array.isArray(data) ? data : data["@graph"] ?? [data];
      const job = items.find((i: Record<string, unknown>) => i?.["@type"] === "JobPosting" && i.description);
      if (job) return strip(`${job.title ?? ""}. ${job.hiringOrganization?.name ?? ""}. ${strip(String(job.description))}`);
    } catch { /* not JSON; try the next block */ }
  }
  return null;
}

/**
 * Reads a public posting as plain text: Workday's JSON, else the page's JobPosting data, else the
 * page text. Returns null when the page cannot be read: fetch error, not HTML, or too little text
 * (login pages and pages drawn by JavaScript).
 * ponytail: plain fetch, no browser. Other client-rendered postings come back unreadable and the
 * person pastes the text; use a scraping service if that happens too often.
 */
export async function readPosting(url: string, signal: AbortSignal): Promise<string | null> {
  try {
    const get = (u: string, accept: string) => fetch(u, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
      headers: { "user-agent": "Mozilla/5.0 (compatible; InterviewX/1.0)", accept },
      redirect: "follow",
    });
    let text: string;
    const workday = workdayJson(url);
    if (workday) {
      const res = await get(workday, "application/json");
      if (!res.ok) return null;
      const j = (await res.json()).jobPostingInfo;
      text = strip(`${j.title}. ${j.location ?? ""}. ${j.timeType ?? ""}. ${j.jobDescription}`);
    } else {
      const res = await get(url, "text/html");
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;
      if (isWalled(res.url)) return null; // redirected to a login wall
      const html = await res.text();
      text = jsonLdPosting(html) ?? strip(html);
    }
    if (text.length < 600 || /sign in to (view|continue|apply)|log in to continue|enable javascript/i.test(text.slice(0, 1500))) return null;
    return text.slice(0, 15_000);
  } catch {
    return null;
  }
}
