import {
  getAiringSchedule,
  getAnimeCatalog,
  getAnimeDetail,
  getPopularAnime,
  getRecentlyUpdatedAnime,
  getTrendingAnime,
  searchAnime,
} from "../src/anilist";
import {
  applyCors,
  assertApiKey,
  errorJson,
  json,
  readInteger,
  readUrl,
  type ApiRequest,
  type ApiResponse,
} from "../src/http";

function routeParts(url: URL) {
  return url.pathname
    .replace(/^\/api\/?/, "")
    .split("/")
    .filter(Boolean);
}

async function handleGet(req: ApiRequest, res: ApiResponse) {
  assertApiKey(req);

  const url = readUrl(req);
  const [resource, id] = routeParts(url);
  const page = readInteger(url, "page", 1, 1, 500);
  const perPage = readInteger(url, "perPage", 20, 1, 50);

  if (!resource || resource === "health") {
    return json(res, {
      ok: true,
      service: "kinoharth-api",
      purpose: "AniList metadata proxy",
    });
  }

  if (resource === "trending") {
    return json(res, await getTrendingAnime(page, perPage));
  }

  if (resource === "popular") {
    return json(res, await getPopularAnime(page, perPage));
  }

  if (resource === "recent" || resource === "recently-updated") {
    return json(res, await getRecentlyUpdatedAnime(page, perPage));
  }

  if (resource === "search") {
    const query = url.searchParams.get("q") || url.searchParams.get("search") || "";

    if (!query.trim()) {
      return json(res, { Page: { pageInfo: { total: 0, currentPage: 1, hasNextPage: false }, media: [] } });
    }

    return json(res, await searchAnime(query, page, perPage));
  }

  if (resource === "catalog") {
    return json(
      res,
      await getAnimeCatalog({
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
      return json(res, { error: "Invalid anime id." }, 400, 60);
    }

    return json(res, await getAnimeDetail(animeId));
  }

  if (resource === "schedule") {
    const start = Number(url.searchParams.get("start"));
    const end = Number(url.searchParams.get("end"));

    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      return json(res, { error: "Missing valid start/end unix timestamps." }, 400, 60);
    }

    return json(
      res,
      await getAiringSchedule({
        page,
        perPage,
        airingAtGreater: start,
        airingAtLesser: end,
      })
    );
  }

  return json(res, { error: "Route not found." }, 404, 60);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    json(res, { error: "Method not allowed." }, 405, 60);
    return;
  }

  try {
    await handleGet(req, res);
  } catch (error) {
    errorJson(res, error);
  }
}
