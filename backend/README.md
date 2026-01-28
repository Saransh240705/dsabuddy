# DSABuddy Backend

Node.js + Express + Prisma (PostgreSQL) backend for DSABuddy platform.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env` file:
```env
DATABASE_URL="postgresql://user:password@host:port/dbname"
JWT_SECRET="your-jwt-secret-key"
PORT=5000
FRONTEND_URL="http://localhost:5173"
BASE_URL="http://localhost:5000"
SESSION_SECRET="your-session-secret"

# Optional
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
EMAIL_USER=""
EMAIL_PASS=""
CLOUD_NAME=""
CLOUD_API_KEY=""
CLOUD_API_SECRET=""
LEETCODE_SESSION=""
LEETCODE_CSRF_TOKEN=""
SYNC_SECRET="admin-sync-key"
MONGO_URI=""
```

### 3. Database Setup

#### Generate Prisma Client
```bash
npx prisma generate
```

#### Run Migrations
```bash
npx prisma migrate deploy
```

#### Reset Database (dev only)
```bash
npx prisma migrate reset
```

#### Create New Migration
```bash
npx prisma migrate dev --name migration_name
```

### 4. Start Server

#### Development
```bash
npm run dev
```

#### Production
```bash
npm start
```

## Prisma Commands

### Database
```bash
# Open Prisma Studio (GUI for database)
npx prisma studio

# Push schema changes without migration (dev only)
npx prisma db push

# Pull schema from existing database
npx prisma db pull

# Seed database
npx prisma db seed

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

## Custom Scripts

### Sync Problems from LeetCode/Codeforces
```bash
npm run sync:problems
```

This fetches problems from external platforms and stores them in the database.

## API Endpoints

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/update-password`

### Users
- `GET /api/users/leaderboard`
- `GET /api/users/:userName`
- `PATCH /api/users/me`

### Questions
- `GET /api/questions`
- `GET /api/questions/:id`
- `POST /api/questions`
- `PATCH /api/questions/:id`
- `DELETE /api/questions/:id`

### Companies
- `GET /api/companies`
- `GET /api/companies/:slug`
- `GET /api/companies/:slug/questions`
- `POST /api/companies`
- `PATCH /api/companies/:id`
- `DELETE /api/companies/:id`

### Tags
- `GET /api/tags`
- `POST /api/tags`
- `DELETE /api/tags/:id`

### User Progress
- `GET /api/user-questions`
- `PUT /api/user-questions/:questionId`
- `DELETE /api/user-questions/:questionId`
- `GET /api/daily-activity`
- `POST /api/daily-activity/increment`

### Platform Connections
- `GET /api/platform-connections`
- `PUT /api/platform-connections/:platform`
- `DELETE /api/platform-connections/:platform`
- `POST /api/platform-connections/:platform/sync`

### Admin Sync
- `POST /api/sync/problems` (requires x-sync-key header)

## Database Schema

Key models:
- `User` - User accounts with auth
- `Question` - Coding problems (from LeetCode, Codeforces, etc.)
- `Company` - Tech companies
- `Tag` - Problem tags/topics
- `UserQuestion` - User progress on questions
- `DailyActivity` - Daily problem-solving activity
- `PlatformConnection` - User's LeetCode/Codeforces usernames and stats

## Development

### Watch logs
```bash
npm run dev
```

### Check database
```bash
npx prisma studio
```
