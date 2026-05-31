# Auth — Notion credentials database

Login and registration store hashed passwords in a dedicated Notion database (separate from user profiles).

## Environment

```env
NOTION_API_KEY=secret_...
NOTION_USERS_DATABASE_ID=...
```

Share the database with your Notion integration.

## Database schema

Create a Notion database with these properties:

| Property       | Type        | Notes                          |
|----------------|-------------|--------------------------------|
| `email`        | Title       | Unique login identifier        |
| `userId`       | Rich text   | Derived from email (slug)      |
| `passwordHash` | Rich text   | `scrypt:…` — never store plain |
| `createdAt`    | Rich text   | ISO timestamp                  |
| `lastLoginAt`  | Rich text   | Updated on each sign-in        |
| `authProvider` | Rich text   | `email` or `google`            |

## Coral MCP (later)

Agents should call auth through `backend/coral-mcp` instead of hitting Notion directly. The Next.js API routes import this module today; Coral can expose the same operations as tools.

## API (frontend)

- `POST /api/auth/session` — sign in (email + password)
- `DELETE /api/auth/session` — sign out
- `POST /api/auth/register` — create account
