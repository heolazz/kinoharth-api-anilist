import type { AnimePageResponse } from "./types";

const ANILIST_API_URL =
  process.env.ANILIST_API_URL || "https://graphql.anilist.co";

const ANIME_FRAGMENT = `
  id
  type
  title {
    romaji
    english
    native
  }
  description(asHtml: true)
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  averageScore
  popularity
  season
  seasonYear
  format
  status
  episodes
  duration
  genres
  source
  startDate {
    year
    month
    day
  }
  studios {
    nodes {
      name
      isAnimationStudio
    }
  }
  nextAiringEpisode {
    airingAt
    timeUntilAiring
    episode
  }
  streamingEpisodes {
    title
    thumbnail
    url
    site
  }
`;

async function fetchAniList<T>(query: string, variables: Record<string, unknown>) {
  const response = await fetch(ANILIST_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`AniList responded with ${response.status}: ${text.slice(0, 240)}`);
  }

  const payload = JSON.parse(text) as { data?: T; errors?: { message: string }[] };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  return payload.data as T;
}

export function getTrendingAnime(page = 1, perPage = 20) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(sort: [TRENDING_DESC, POPULARITY_DESC], type: ANIME, isAdult: false) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniList<AnimePageResponse>(query, { page, perPage });
}

export function getPopularAnime(page = 1, perPage = 20) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(sort: [POPULARITY_DESC, SCORE_DESC], type: ANIME, isAdult: false) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniList<AnimePageResponse>(query, { page, perPage });
}

export function getRecentlyUpdatedAnime(page = 1, perPage = 20) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(sort: [UPDATED_AT_DESC], type: ANIME, isAdult: false) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniList<AnimePageResponse>(query, { page, perPage });
}

export function searchAnime(search: string, page = 1, perPage = 24) {
  const query = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(search: $search, sort: [SEARCH_MATCH, POPULARITY_DESC], type: ANIME, isAdult: false) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniList<AnimePageResponse>(query, { search, page, perPage });
}

export function getAnimeCatalog({
  page = 1,
  perPage = 24,
  search,
  genre,
  status,
  format,
}: {
  page?: number;
  perPage?: number;
  search?: string;
  genre?: string;
  status?: string;
  format?: string;
}) {
  const query = `
    query ($page: Int, $perPage: Int, $search: String, $genre: String, $status: MediaStatus, $format: MediaFormat) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(
          search: $search
          genre: $genre
          status: $status
          format: $format
          sort: [POPULARITY_DESC, SCORE_DESC]
          type: ANIME
          isAdult: false
        ) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniList<AnimePageResponse>(query, {
    page,
    perPage,
    search,
    genre,
    status,
    format,
  });
}

export function getAnimeDetail(id: number) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${ANIME_FRAGMENT}
        trailer {
          id
          site
          thumbnail
        }
        characters(sort: [ROLE, RELEVANCE, ID], perPage: 10) {
          edges {
            role
            node {
              id
              name { full }
              image { large }
            }
            voiceActors(language: JAPANESE) {
              id
              name { full }
              image { large }
            }
          }
        }
        recommendations(perPage: 10, sort: RATING_DESC) {
          edges {
            node {
              mediaRecommendation {
                ${ANIME_FRAGMENT}
              }
            }
          }
        }
        relations {
          edges {
            relationType
            node {
              ${ANIME_FRAGMENT}
            }
          }
        }
      }
    }
  `;

  return fetchAniList<{ Media?: unknown }>(query, { id });
}

export function getAiringSchedule({
  page = 1,
  perPage = 50,
  airingAtGreater,
  airingAtLesser,
}: {
  page?: number;
  perPage?: number;
  airingAtGreater: number;
  airingAtLesser: number;
}) {
  const query = `
    query ($page: Int, $perPage: Int, $airingAtGreater: Int, $airingAtLesser: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        airingSchedules(
          airingAt_greater: $airingAtGreater
          airingAt_lesser: $airingAtLesser
          sort: [TIME]
          notYetAired: true
        ) {
          id
          airingAt
          timeUntilAiring
          episode
          media {
            ${ANIME_FRAGMENT}
          }
        }
      }
    }
  `;

  return fetchAniList<AnimePageResponse>(query, {
    page,
    perPage,
    airingAtGreater,
    airingAtLesser,
  });
}
