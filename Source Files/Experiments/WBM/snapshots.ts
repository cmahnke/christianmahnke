import * as cheerio from 'cheerio';
import { URLSearchParams } from 'url';
import { URL } from 'url';

// Define a type for the expected snapshot result
type SnapshotResult = Map<string, Date | null>;

/**
 * Gets the date of the earliest snapshot for one or more given URLs from the Internet Archive.
 *
 * If a list of URLs is provided, it attempts to group them by domain to make
 * optimized CDX API calls using `matchType=domain`.
 *
 * @param {string | string[]} urls The URL(s) for which to retrieve the snapshot date.
 * @returns {Promise<SnapshotResult>} A Promise that resolves to a Map where keys are the original URLs
 * and values are their earliest snapshot Date objects, or null if not found/error.
 */
export async function getSnapshotDate(urls: string | string[]): Promise<SnapshotResult> {
    const urlList = Array.isArray(urls) ? urls : [urls];
    const results: SnapshotResult = new Map();

    if (urlList.length === 0) {
        console.warn("No URLs provided to getSnapshotDate.");
        return results;
    }

    // Group URLs by domain
    const domainsToUrls = new Map<string, string[]>();
    urlList.forEach(inputUrl => {
        try {
            const parsedUrl = new URL(inputUrl);
            const domain = parsedUrl.hostname;
            if (!domainsToUrls.has(domain)) {
                domainsToUrls.set(domain, []);
            }
            domainsToUrls.get(domain)!.push(inputUrl);
        } catch (e: any) {
            console.error(`Unknown parsing error: ${inputUrl}`);
            results.set(inputUrl, null);
        }
    });

    const cdxApiUrl = "http://web.archive.org/cdx/search/cdx";

    for (const [domain, urlsInDomain] of domainsToUrls.entries()) {
        const params = new URLSearchParams({
            url: domain,
            output: "json",
            matchType: "domain",
            filter: "statuscode:200",
            sort: "timestamp",
        });

        console.log(`Fetching ${urlsInDomain.length} from ${domain}`)
        const requestUrl = `${cdxApiUrl}?${params.toString()}`;

        let rawResponseBody: string | undefined;

        try {
            const response = await fetch(requestUrl);

            if (!response.ok) {
                // If response is not OK, try to read body before throwing for error context
                rawResponseBody = await response.text().catch(() => 'Could not read response body');
                if (response.status === 404) {
                    // Specific handling for 404 from CDX API (no captures)
                    // No need to throw an error, just means no snapshots.
                } else {
                    throw new Error(`HTTP error for ${domain}! status: ${response.status}`);
                }
            } else {
                // If response is OK, try to read JSON. If this fails, catch it below.
                const jsonText = await response.text();
                rawResponseBody = jsonText;
                try {
                    const data: string[][] = JSON.parse(jsonText);
                    const captures = (data.length > 0 && data[0][0] === 'urlkey') ? data.slice(1) : data;

                    const earliestSnapshotsForPaths = new Map<string, Date>();

                    for (const capture of captures) {
                        const originalUrl = capture[2];
                        const timestampStr = capture[1];

                        try {
                            const capturedDate = new Date(
                                parseInt(timestampStr.substring(0, 4), 10),
                                parseInt(timestampStr.substring(4, 6), 10) - 1,
                                parseInt(timestampStr.substring(6, 8), 10),
                                parseInt(timestampStr.substring(8, 10), 10),
                                parseInt(timestampStr.substring(10, 12), 10),
                                parseInt(timestampStr.substring(12, 14), 10)
                            );

                            if (urlsInDomain.includes(originalUrl)) {
                                const currentEarliest = earliestSnapshotsForPaths.get(originalUrl);
                                if (!currentEarliest || capturedDate < currentEarliest) {
                                    earliestSnapshotsForPaths.set(originalUrl, capturedDate);
                                }
                            }

                        } catch (parseError: any) {
                            // Silently fail timestamp parsing if not critical, or log if detailed debug is needed
                        }
                    }

                    urlsInDomain.forEach(reqUrl => {
                        const foundDate = earliestSnapshotsForPaths.get(reqUrl);
                        results.set(reqUrl, foundDate || null);
                    });

                } catch (jsonParseError: any) {
                    throw new Error(`Failed to parse JSON response: ${jsonParseError.message} : ${response.text}`);
                }
            }


        } catch (error: any) {
            console.error(JSON.stringify({
                status: "failed_cdx_api_request",
                domain: domain,
                error: error.message || 'Unknown network error',
                raw_response_body: rawResponseBody || 'No response body read'
            }));
            urlsInDomain.forEach(reqUrl => results.set(reqUrl, null));
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
}

export function extractOriginalUrlFromArchiveUrl(archiveUrl: string): string | null {
    if (!archiveUrl || typeof archiveUrl !== 'string') {
        return null;
    }

    const regex = /(https?:\/\/(?:web\.archive\.org|archive\.org)\/web\/\d+(?:id_)?\/)(https?:\/\/.*)/;
    const match = archiveUrl.match(regex);

    if (match && match.length >= 3) {
        return match[2];
    } else {
        if (archiveUrl.includes("/web/*/")) {
            return archiveUrl.split("/web/*/")[1] || null;
        }
        if (archiveUrl.includes("/details/")) {
            return null;
        }
        return null;
    }
}

/**
 * Fetches a URL, parses its HTML content, and returns a list of all
 * anchor tags (<a>) that link to archive.org.
 *
 * @param {string} url The URL of the HTML page to fetch and parse.
 * @returns {Promise<string[]>} A promise that resolves to an array of archive.org link URLs.
 * Returns an empty array if no links are found or on error. Sends JSON to console on failure.
 */
export async function getArchiveLinksFromHtml(url: string): Promise<string[]> {
    if (!url || typeof url !== 'string') {
        console.error(`URL cannot be empty or not a string for HTML parsing. ${url}`)
        return [];
    }

    let htmlContent: string | undefined;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            htmlContent = await response.text().catch(() => 'Could not read response body');
            console.error(`Failed to fetch HTML from ${url}: HTTP status ${response.status}`);
            return [];
        }

        htmlContent = await response.text();
        const $ = cheerio.load(htmlContent);

        const archiveLinks: string[] = [];

        $('a').each((i, element) => {
            const href = $(element).attr('href');

            if (href) {
                if (href.startsWith('https://archive.org/') || href.startsWith('http://archive.org/') ||
                    href.startsWith('https://web.archive.org/') || href.startsWith('http://web.archive.org/')) {
                    archiveLinks.push(href);
                }
            }
        });

        return archiveLinks;

    } catch (error: any) {
        console.error(`Unknown parsing or network error ${url}`);
        return [];
    }
}

// --- Usage Example ---
(async () => {
    // --- MAIN EXAMPLE: Parsing gifcities.org, extracting original URLs, and fetching snapshot dates ---
    console.log("\n--- Parsing gifcities.org for archive.org links, extracting original URLs, and fetching snapshot dates ---");
    const gifCitiesUrl = "https://gifcities.org/search?q=Construction&offset=200&page_size=2000";
    console.log(`Fetching and parsing links from: ${gifCitiesUrl}`);

    const gifCitiesArchiveLinks = await getArchiveLinksFromHtml(gifCitiesUrl);

    if (gifCitiesArchiveLinks.length > 0) {
        console.log(`Found ${gifCitiesArchiveLinks.length} archive.org links on ${gifCitiesUrl}.`);

        const uniqueOriginalUrls = new Set<string>();

        gifCitiesArchiveLinks.forEach(link => {
            const original = extractOriginalUrlFromArchiveUrl(link);
            if (original) {
                uniqueOriginalUrls.add(original);
            }
        });

        const urlsToQuery = Array.from(uniqueOriginalUrls);
        console.log(`\nExtracted ${urlsToQuery.length} unique original URLs. Fetching snapshots...`);

        const urlSnapshotDates = await getSnapshotDate(urlsToQuery);

        console.log("\n--- Snapshot Dates for Extracted Original URLs from gifcities.org ---");
        urlSnapshotDates.forEach((date, url) => {
            if (date) {
                console.log(`URL: ${url}`);
                console.log(`  Earliest Snapshot: ${date.toISOString().replace(/T/, ' ').replace(/\.\d+Z$/, ' UTC')}`);
            } else {
                console.log(`URL: ${url}`);
                console.log(`  Earliest Snapshot: Not found`);
            }
        });

    } else {
        console.log(`No archive.org links found on ${gifCitiesUrl}.`);
    }

})();