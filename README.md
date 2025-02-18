# CygnasZero - Personal News Aggregator

A customizable news aggregator that helps you stay informed without social media distractions.

## Features

- Web scraping with configurable schedules
- Custom dashboard with content filtering and sorting
- Authentication with email and Google OAuth
- Responsive Vue.js frontend
- RESTful API with Express
- MongoDB database with Mongoose

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your environment variables
3. Install dependencies:
```bash
npm install
cd client && npm install
```

4. Start the development servers:
```bash
# Start backend
npm run dev

# Start frontend
npm run client
```

## Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

## Project Structure

```
├── client/              # Vue.js frontend
├── server/
│   ├── config/         # Configuration files
│   ├── middleware/     # Express middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── index.js        # Server entry point
├── tests/              # Unit tests
└── cypress/            # E2E tests
```

## API Documentation

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/google

### Content
- GET /api/content
- PATCH /api/content/:id/read

### Sources
- GET /api/source
- POST /api/source
- DELETE /api/source/:id
