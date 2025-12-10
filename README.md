# RSSHub Routes Export by Category

This directory contains RSS route data exported as JSON files, organized by category.

## Hosted API

The exported JSON files are automatically deployed to GitHub Pages:

**Base URL:** `https://yai333.github.io/RSSHub/`

### Endpoints

| Endpoint                                                                  | Description                 |
| ------------------------------------------------------------------------- | --------------------------- |
| [`/index.json`](https://yai333.github.io/RSSHub/index.json)               | Summary with all categories |
| [`/social-media.json`](https://yai333.github.io/RSSHub/social-media.json) | Social Media routes         |
| [`/programming.json`](https://yai333.github.io/RSSHub/programming.json)   | Programming routes          |
| [`/{category}.json`](https://yai333.github.io/RSSHub/)                    | Any category file           |

### Example Usage

```javascript
// Fetch all social media routes
const response = await fetch('https://yai333.github.io/RSSHub/social-media.json');
const data = await response.json();
console.log(data.routes);
```

```bash
# Get category summary
curl https://yai333.github.io/RSSHub/index.json
```

## Local Usage

### Generate/Update Export Files

```bash
pnpm export:categories
```

This will regenerate all JSON files with the latest route data from `lib/routes/`.

## Output Files

### `index.json`

Summary file containing:

- Total number of categories and routes
- Generation timestamp
- List of all categories sorted by route count

```json
{
  "totalCategories": 24,
  "totalRoutes": 3147,
  "generatedAt": "2025-12-10T01:11:33.224Z",
  "categories": [
    { "category": "University", "count": 439, "file": "university.json" },
    { "category": "New media", "count": 428, "file": "new-media.json" },
    ...
  ]
}
```

### `{category}.json`

One file per category containing all routes in that category:

| File                     | Category                 |
| ------------------------ | ------------------------ |
| `social-media.json`      | Social Media             |
| `new-media.json`         | New Media                |
| `traditional-media.json` | Traditional Media        |
| `programming.json`       | Programming              |
| `university.json`        | University               |
| `government.json`        | Government               |
| `finance.json`           | Finance                  |
| `game.json`              | Gaming                   |
| `anime.json`             | ACG (Anime/Comics/Games) |
| `multimedia.json`        | Multimedia               |
| `blog.json`              | Blog                     |
| `bbs.json`               | BBS/Forums               |
| `program-update.json`    | Application Updates      |
| `picture.json`           | Pictures                 |
| `shopping.json`          | Shopping                 |
| `reading.json`           | Reading                  |
| `journal.json`           | Scientific Journals      |
| `study.json`             | Study                    |
| `forecast.json`          | Forecast and Alerts      |
| `design.json`            | Design                   |
| `travel.json`            | Travel                   |
| `live.json`              | Live Streaming           |
| `other.json`             | Uncategorized            |
| `popular.json`           | Popular (top subscribed) |

## Route Data Structure

Each category file contains:

```json
{
  "category": "social-media",
  "displayName": "Social Media",
  "displayNameZh": "社交媒体",
  "icon": "💬",
  "count": 237,
  "routes": [...]
}
```

Each route in the `routes` array:

```json
{
  "namespace": "twitter",
  "namespaceName": "X (Twitter)",
  "namespaceUrl": "x.com",
  "path": "/user/:id/:routeParams?",
  "fullPath": "/twitter/user/:id/:routeParams?",
  "name": "User timeline",
  "example": "/twitter/user/_RSSHub",
  "description": "Optional route description",
  "parameters": {
    "id": "username",
    "routeParams": "extra parameters"
  },
  "maintainers": ["DIYgod", "pseudoyu"],
  "categories": ["social-media"],
  "features": {
    "requireConfig": [...],
    "requirePuppeteer": false,
    "antiCrawler": false,
    "supportBT": false,
    "supportPodcast": false,
    "supportScihub": false
  },
  "radar": [
    {
      "source": ["x.com/:id"],
      "target": "/user/:id"
    }
  ],
  "lang": "en"
}
```

## Field Descriptions

| Field                       | Description                             |
| --------------------------- | --------------------------------------- |
| `namespace`                 | Route namespace (first path segment)    |
| `namespaceName`             | Human-readable namespace name           |
| `namespaceUrl`              | Source website URL                      |
| `path`                      | Route path pattern (Hono syntax)        |
| `fullPath`                  | Complete route path including namespace |
| `name`                      | Route display name                      |
| `example`                   | Example URL path                        |
| `description`               | Optional description/notes              |
| `parameters`                | URL parameter documentation             |
| `maintainers`               | GitHub handles of maintainers           |
| `categories`                | Assigned categories                     |
| `features.requireConfig`    | Required environment variables          |
| `features.requirePuppeteer` | Needs browser automation                |
| `features.antiCrawler`      | Target site has anti-crawler measures   |
| `features.supportBT`        | Supports BitTorrent                     |
| `features.supportPodcast`   | Supports podcast format                 |
| `radar`                     | RSSHub Radar detection rules            |
| `lang`                      | Primary language code                   |

## Notes

- Routes can appear in multiple category files if they have multiple categories assigned
- The `popular` category is populated based on subscription analytics and may be empty in local builds
- Run the export after adding/modifying routes to keep the JSON files up to date
