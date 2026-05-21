# KinoHarth API

AniList metadata proxy for KinoHarth.

This service is intentionally limited to AniList metadata. Streaming, Miruro,
TMDB, and watch playback stay in the main KinoHarth project.

## Endpoints

- `GET /api/health`
- `GET /api/trending?page=1&perPage=20`
- `GET /api/popular?page=1&perPage=20`
- `GET /api/recent?page=1&perPage=20`
- `GET /api/search?q=one%20piece&page=1&perPage=24`
- `GET /api/catalog?q=&genre=&status=&format=&page=1&perPage=24`
- `GET /api/anime/:id`
- `GET /api/schedule?start=1710000000&end=1710086400&page=1&perPage=50`

## Environment

Copy `.env.example` to `.env.local` for local development.

`KINOHARTH_API_KEY` is optional. If set, clients must send it with the
`X-KinoHarth-Key` header.

## Vercel

Deploy this folder as a separate Vercel project. The frontend can then call:

```txt
https://your-api-project.vercel.app/api/anime/21
```

Keep stream-related variables in the main KinoHarth project:

- `STREAM_PROVIDER`
- `MIRURO_API_BASE_URL`
- `TMDB_ACCESS_TOKEN`
- `TMDB_IMAGE_BASE_URL`
