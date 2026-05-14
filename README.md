# Graph Theory Visualizer

Interactive graph theory visualizations with step-by-step playback, synchronized code highlighting, variable tracking, and English/French localization.

## Catalog

| Category | Algorithms |
| --- | --- |
| Shortest Paths | Dijkstra, Bellman-Ford, Bellman |
| Spanning Trees | Kruskal, Prim |
| Connectivity | Connected Components, Kosaraju |
| Traversal / Properties | Eulerian Path, Eulerian Circuit |
| Coloring | Welsh-Powell, Edge Coloring |
| Flows | Maximum Flow |

## Features

- Graph-only algorithm catalog and generated routes
- Directed and undirected graph visualizations
- Edge weights, arrows, selected/rejected edge states, node coloring, distances, predecessors, stacks, and orders
- English and French routes (`/` and `/fr`)
- Dark and light themes with persisted preference
- Responsive sidebar, playback controls, code panel, and mobile drawers

## Development

```bash
npm install
npm run dev
npm run build
```

This project is built with Astro, React, Tailwind CSS, and Monaco Editor.

## Deploy to Vercel

This project is ready to deploy as a static Astro site on Vercel.

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

If you need a canonical site URL for the sitemap, set `SITE` in your Vercel environment variables.
