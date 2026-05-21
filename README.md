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

## Local Testing

Run a quick handler-level test without starting Vercel:

```bash
npx tsx -e "import handler from './api/index.ts'; (async()=>{ const res={code:200,headers:{},status(c){this.code=c;return this},setHeader(k,v){this.headers[k]=v},json(b){this.body=b;console.log(JSON.stringify({code:this.code,title:b?.Page?.media?.[0]?.title?.romaji || b?.Media?.title?.romaji || b?.service},null,2))},end(){}}; await handler({method:'GET',url:'/api/search?q=naruto&perPage=1',headers:{}},res); })();"
```

Expected result:

```json
{
  "code": 200,
  "title": "NARUTO"
}
```

For local browser testing with Vercel:

```bash
npm run start -- --listen 3005 --yes
```

Then open:

```txt
http://localhost:3005
http://localhost:3005/api/health
http://localhost:3005/api/search?q=naruto&perPage=1
http://localhost:3005/api/anime/21
```

If `KINOHARTH_API_KEY` is configured, send:

```txt
X-KinoHarth-Key: your_key_here
```

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
