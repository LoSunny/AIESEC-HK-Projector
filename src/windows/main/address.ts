/** Resolve browser address input to a website or an encoded Google search. */
export function resolveAddress(raw: string): URL {
    const input = raw.trim();
    if (!input) throw new Error("Enter a website address or search keywords.");
    const explicitScheme = /^[a-z][a-z\d+.-]*:/i.test(input) && !/^localhost:\d+(?:[/?#]|$)/i.test(input);
    if (explicitScheme) {
        const url = new URL(input);
        if (!["http:", "https:"].includes(url.protocol) || !url.hostname) {
            throw new Error("Enter an HTTP or HTTPS website address or search keywords.");
        }
        return url;
    }
    if (!/\s/.test(input)) {
        try {
            const url = new URL(`https://${input}`);
            if (!url.username && !url.password &&
                (url.hostname.includes(".") || url.hostname === "localhost" || url.hostname.startsWith("["))) return url;
        } catch { /* Treat non-address text as search keywords. */
        }
    }
    const search = new URL("https://www.google.com/search");
    search.searchParams.set("q", input);
    return search;
}
