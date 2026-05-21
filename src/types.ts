export type AniListDate = {
  year?: number | null;
  month?: number | null;
  day?: number | null;
};

export type Anime = {
  id: number;
  type?: string | null;
  title: {
    romaji?: string | null;
    english?: string | null;
    native?: string | null;
  };
  description?: string | null;
  coverImage: {
    extraLarge?: string | null;
    large?: string | null;
    medium?: string | null;
    color?: string | null;
  };
  bannerImage?: string | null;
  averageScore?: number | null;
  popularity?: number | null;
  season?: string | null;
  seasonYear?: number | null;
  format?: string | null;
  status?: string | null;
  episodes?: number | null;
  duration?: number | null;
  genres: string[];
  source?: string | null;
  startDate?: AniListDate | null;
  studios?: {
    nodes?: {
      name: string;
      isAnimationStudio: boolean;
    }[];
  };
  nextAiringEpisode?: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  } | null;
  streamingEpisodes?: {
    title: string;
    thumbnail?: string | null;
    url: string;
    site?: string | null;
  }[] | null;
  trailer?: {
    id: string;
    site: string;
    thumbnail?: string | null;
  } | null;
};

export type AnimePageInfo = {
  total?: number;
  currentPage?: number;
  hasNextPage?: boolean;
};

export type AnimePageResponse = {
  Page?: {
    pageInfo?: AnimePageInfo;
    media?: Anime[];
    airingSchedules?: {
      id: number;
      airingAt: number;
      timeUntilAiring: number;
      episode: number;
      media: Anime;
    }[];
  };
};
