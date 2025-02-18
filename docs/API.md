# API Documentation

## Authentication

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /api/auth/login
Login with credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

## Content

### GET /api/content
Get paginated content.

**Query Parameters:**
- page (default: 1)
- limit (default: 10)
- sort (-date, date, -title, title)
- search (optional)

### PATCH /api/content/:id/read
Mark content as read/unread.

**Request Body:**
```json
{
  "read": true
}
```

## Sources

### GET /api/source
Get all sources for authenticated user.

### POST /api/source
Create a new source.

**Request Body:**
```json
{
  "url": "https://example.com",
  "schedule": "*/30 * * * *",
  "contentType": "article",
  "selectors": {
    "title": ".article-title",
    "content": ".article-content",
    "date": ".article-date"
  }
}
```

### DELETE /api/source/:id
Delete a source.
