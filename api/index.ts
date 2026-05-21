import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Inline CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    const url = new URL(req.url || "/", `https://${req.headers.host || "localhost"}`);
    const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
    const [resource, id] = parts;

    if (!resource || resource === "health") {
      return res.status(200).json({
        ok: true,
        service: "kinoharth-api",
        purpose: "AniList metadata proxy",
        timestamp: Date.now(),
      });
    }

    // Lazy-import to isolate potential module errors
    const { applyCors, assertApiKey, json, errorJson, readUrl, readInteger } = await import("../src/http");
    const anilist = await import("../src/anilist");

    applyCors(req as any, res as any);
    assertApiKey(req as any);

    const parsedUrl = readUrl(req as any);
    const page = readInteger(parsedUrl, "page", 1, 1, 500);
    const perPage = readInteger(parsedUrl, "perPage", 20, 1, 50);
    const directAnimeId = Number(resource);

    if (Number.isInteger(directAnimeId)) {
      return json(res as any, await anilist.getAnimeDetail(directAnimeId));
    }

    if (resource === "trending") {
      return json(res as any, await anilist.getTrendingAnime(page, perPage));
    }

    if (resource === "popular") {
      return json(res as any, await anilist.getPopularAnime(page, perPage));
    }

    if (resource === "recent" || resource === "recently-updated") {
      return json(res as any, await anilist.getRecentlyUpdatedAnime(page, perPage));
    }

    if (resource === "search") {
      const query = url.searchParams.get("q") || url.searchParams.get("search") || "";
      if (!query.trim()) {
        return res.status(200).json({
          Page: { pageInfo: { total: 0, currentPage: 1, hasNextPage: false }, media: [] },
        });
      }
      return json(res as any, await anilist.searchAnime(query, page, perPage));
    }

    if (resource === "catalog") {
      return json(
        res as any,
        await anilist.getAnimeCatalog({
          page,
          perPage,
          search: url.searchParams.get("q") || url.searchParams.get("search") || undefined,
          genre: url.searchParams.get("genre") || undefined,
          status: url.searchParams.get("status") || undefined,
          format: url.searchParams.get("format") || undefined,
        })
      );
    }

    if (resource === "anime" && id) {
      const animeId = Number(id);
      if (!Number.isInteger(animeId)) {
        return res.status(400).json({ error: "Invalid anime id." });
      }
      return json(res as any, await anilist.getAnimeDetail(animeId));
    }

    if (resource === "schedule") {
      const start = Number(url.searchParams.get("start"));
      const end = Number(url.searchParams.get("end"));
      if (!Number.isInteger(start) || !Number.isInteger(end)) {
        return res.status(400).json({ error: "Missing valid start/end unix timestamps." });
      }
      return json(
        res as any,
        await anilist.getAiringSchedule({ page, perPage, airingAtGreater: start, airingAtLesser: end })
      );
    }

    return res.status(404).json({ error: "Route not found." });
  } catch (error: unknown) {
    console.error("[kinoharth-api] Unhandled error:", error);
    const statusCode =
      typeof error === "object" && error !== null && "statusCode" in error && typeof (error as any).statusCode === "number"
        ? (error as any).statusCode
        : 500;
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(statusCode).json({ error: message });
  }
}
