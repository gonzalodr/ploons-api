# Ploons API

Backend for a Foodies Social Network. Share, discover, and save recipes, connect with other food lovers, and engage in real-time conversations.

## Description

Ploons API is the modular and scalable backend of a social platform focused on culinary recipes. Built with Node.js and TypeScript, it provides a comprehensive set of RESTful endpoints and real-time communication via WebSockets, enabling users to:

- Register and authenticate using JWT and refresh tokens.
- Create, edit, and delete recipes with images.
- Interact through likes, comments (with nested replies), and share posts.
- Follow other users and build a personalized feed.
- Save favorite recipes.
- Search for recipes and profiles with fuzzy matching support (trigrams).
- Chat in real time with other users.

The API is built with a clean and modular approach, implementing best practices such as separation of concerns, centralized error handling, robust validation with Zod, and interactive documentation with Swagger.

## Key Features

**Complete Authentication** -- Registration, OTP verification, login, token renewal, password recovery, and logout.

**Profile Management** -- Query and update personal information, biography, social media links, and avatar (with Cloudinary uploads).

**Recipes** -- Create, edit, delete, and retrieve recipes (public and private). Support for ordered ingredients and detailed steps.

**Social Interactions** -- Likes, comments (with nested replies), user following, recipe saving, and sharing posts.

**Smart Feed** -- Feed of posts from followed users and a trending section based on recent activity (likes, comments, shares).

**Advanced Search** -- Search recipes by title, description, or ingredients, and search profiles by username or full name, with fuzzy matching support.

**Real-time Chat** -- One-to-one messaging with typing indicators, read receipts, and connection status, powered by Socket.IO.

**Security and Performance** -- Helmet for header protection, configured CORS, rate limiting, response compression, and structured logging with Winston.

**Interactive Documentation** -- Swagger UI available at `/api-docs` to explore and test the endpoints.

**Image Management** -- Upload and manage images (avatar and recipes) using Cloudinary, with automatic deletion of previous versions.

## Technologies Used

| Area                | Technologies                         |
| ------------------- | ------------------------------------ |
| Runtime             | Node.js                              |
| Language            | TypeScript                           |
| Framework           | Express.js                           |
| ORM                 | Prisma (with PostgreSQL)             |
| Database            | PostgreSQL (Supabase)                |
| Authentication      | Supabase Auth (JWT)                  |
| Image Storage       | Cloudinary                           |
| WebSockets          | Socket.IO                            |
| Validation          | Zod                                  |
| Documentation       | Swagger (OpenAPI)                    |
| Logging             | Winston + DailyRotateFile            |
| Security            | Helmet, CORS, Express Rate Limit     |
| Compression         | Compression                          |
| File Handling       | Multer                               |
| Environment Variables | dotenv                             |
| Transpilation       | tsc + tsc-alias                      |
| Package Manager     | pnpm                                 |

## Project Structure

```
ploons-api/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── prisma/
│   └── schema.prisma                  # Database models and schema
├── src/
│   ├── index.ts                       # Application entry point
│   ├── config/                        # Configurations (Cloudinary, Supabase, Prisma)
│   ├── docs/                          # Swagger documentation (JSON)
│   ├── enums/                         # Global enumerations
│   ├── middlewares/                   # Middlewares (auth, validation, multer, errors)
│   ├── modules/                       # Functional modules (each with its own controllers, services, and routes)
│   │   ├── auth/                      # Authentication and OTP
│   │   ├── profile/                   # User profile
│   │   ├── recipe/                    # Recipe management
│   │   ├── comment/                   # Comments and replies
│   │   ├── like/                      # Likes
│   │   ├── follow/                    # Followers/following
│   │   ├── saved/                     # Saved recipes
│   │   ├── share/                     # Shared recipes
│   │   ├── feed/                      # Post feed
│   │   ├── search/                    # Search (recipes and profiles)
│   │   └── chat/                      # Messaging (HTTP + WebSockets)
│   ├── sockets/                       # Socket.IO configuration and handlers
│   ├── types/                         # Type definitions (extended Express)
│   └── utils/                         # Utilities (errors, pagination, cloudinary, logger, etc.)
└── logs/                              # (Generated) Rotating logs
```

The architecture follows an adapted MVC pattern, clearly separating routes, controllers, and services to keep the code decoupled, testable, and maintainable.

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- A Supabase account (for database and authentication)
- A Cloudinary account (for image storage)

## Setup and Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/your-username/ploons-api.git
    cd ploons-api
    ```

2.  Install dependencies:

    ```bash
    pnpm install
    ```

3.  Configure environment variables:

    Copy the `.env.example` file to `.env` and fill in the values:

    ```bash
    cp .env.example .env
    ```

    Edit the `.env` file with your Supabase and Cloudinary credentials:

    ```env
    PORT=4000
    ENVIRONMENT="development"
    FRONTEND_URL="http://localhost:3000"

    DATABASE_URL="postgresql://postgres:password@db.xxxx.supabase.co:6543/postgres?pgbouncer=true"
    DIRECT_URL="postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres"

    SUPABASE_URL="https://xxxx.supabase.co"
    SUPABASE_ANON_KEY="your-anon-key"

    CLOUDINARY_CLOUD_NAME="your-cloud-name"
    CLOUDINARY_API_KEY="your-api-key"
    CLOUDINARY_API_SECRET="your-api-secret"
    ```

4.  Synchronize the database schema:

    Prisma will generate the client and apply the schema:

    ```bash
    pnpm prisma generate
    pnpm prisma db pull   # (optional) if the database already exists
    ```

5.  Run in development mode:

    ```bash
    pnpm dev
    ```

    The server will be available at `http://localhost:4000`.

6.  Build for production:

    ```bash
    pnpm build
    pnpm start
    ```

## Main Endpoints

Full interactive documentation is available at the `/api-docs` route when the server is running. Below is a summary of the modules and their functionalities:

| Module  | Method | Route                               | Description                             |
| ------- | ------ | ----------------------------------- | --------------------------------------- |
| Auth    | POST   | `/auth/register`                    | Register new user (sends OTP)           |
|         | POST   | `/auth/verify-otp`                  | Verify registration OTP                 |
|         | POST   | `/auth/login`                       | User login                              |
|         | POST   | `/auth/refresh`                     | Refresh access token                    |
|         | POST   | `/auth/forgot-password`             | Request password recovery               |
|         | POST   | `/auth/verify-reset-otp`            | Verify OTP for password recovery        |
|         | PATCH  | `/auth/reset-password`              | Reset password                          |
| Profile | GET    | `/profile/me`                       | Get my profile                          |
|         | PUT    | `/profile/me`                       | Update my profile (including avatar)    |
|         | GET    | `/profile/:profileId`               | Get public profile by ID                |
| Recipe  | POST   | `/recipe/`                          | Create recipe (`multipart/form-data`)   |
|         | GET    | `/recipe/:recipeId`                 | Get public recipe                       |
|         | GET    | `/recipe/private/:recipeId`         | Get private recipe (owner only)         |
|         | PUT    | `/recipe/:recipeId`                 | Update recipe                           |
|         | DELETE | `/recipe/:recipeId`                 | Delete recipe                           |
|         | GET    | `/recipe/me`                        | List my recipes (paginated)             |
| Comment | POST   | `/comment/recipe/:recipeId`         | Create comment on a recipe              |
|         | POST   | `/comment/recipe/reply/:parentId`   | Reply to a comment                      |
|         | GET    | `/comment/recipe/:recipeId`         | Get parent comments of a recipe         |
|         | GET    | `/comment/recipe/replies/:parentId` | Get replies of a comment                |
|         | PUT    | `/comment/recipe/:commentId`        | Update comment                          |
|         | DELETE | `/comment/recipe/:commentId`        | Delete comment                          |
| Like    | POST   | `/like/recipe/toggle/:recipeId`     | Toggle like/unlike                      |
|         | GET    | `/like/recipe/:recipeId`            | List users who liked a recipe           |
|         | GET    | `/like/recipe/:recipeId/status`     | Check if I liked a recipe               |
| Follow  | POST   | `/follow/toggle/:followingId`       | Follow/unfollow a user                  |
|         | GET    | `/follow/me/followers`              | My followers                            |
|         | GET    | `/follow/me/following`              | Users I follow                          |
|         | GET    | `/follow/followers/?userId=`        | Followers of a user (public)            |
|         | GET    | `/follow/following/?userId=`        | Following of a user (public)            |
| Saved   | POST   | `/save/:recipeId`                   | Save/unsave a recipe                    |
|         | GET    | `/save/me`                          | My saved recipes                        |
| Share   | POST   | `/share/`                           | Share a recipe                          |
|         | GET    | `/share/me`                         | My shared recipes                       |
| Feed    | GET    | `/feed/`                            | Following feed                          |
|         | GET    | `/feed/trending`                    | Trending feed                           |
| Search  | GET    | `/search/recipes/?q=`               | Search recipes                          |
|         | GET    | `/search/profiles/?q=`              | Search profiles                         |
| Chat    | GET    | `/chat/conversations`               | My conversations                        |
|         | GET    | `/chat/messages/:conversation_id`   | Messages of a conversation              |
|         | POST   | `/chat/send`                        | Send a message (HTTP)                   |

For endpoints requiring authentication, send the JWT token in the `Authorization: Bearer <access_token>` header. To refresh the token, use the `X-Refresh-Token` header.

## Real-Time Communication (WebSocket)

Ploons API integrates Socket.IO for instant messaging. The main events are:

**Client to Server**

| Event          | Description                                    |
| -------------- | ---------------------------------------------- |
| `send_message` | Send a message to another user                 |
| `typing`       | Indicate that the user is typing               |
| `mark_read`    | Mark messages as read in a conversation        |

**Server to Client**

| Event             | Description                              |
| ----------------- | ---------------------------------------- |
| `receive_message` | Notify a new incoming message            |
| `message_sent`    | Delivery confirmation to the sender      |
| `user_typing`     | Notify that another user is typing       |
| `user_status`     | Notify status change (online/offline)    |

Authentication for the WebSocket connection is performed using the JWT token sent in the handshake.

## Tools and Best Practices

- **Prisma ORM:** Data modeling and secure queries with support for migrations and complex relationships.
- **Supabase Auth:** User management, email verification, password recovery, and JWT tokens.
- **Cloudinary:** Image storage and optimization, with automatic deletion of obsolete resources.
- **Zod:** Data validation at the controller and service layers, ensuring input integrity.
- **Winston:** Structured logging with daily file rotation, facilitating debugging and monitoring.
- **Centralized Error Middleware:** Catches and handles errors uniformly, differentiating operational and validation errors.
- **Security:** Helmet, restrictive CORS, rate limiting, and compression enabled by default.
- **Pagination:** Common utility for paginated responses, supporting infinite scroll on the frontend.

## Use of Artificial Intelligence (OpenCode)

During the development of this project, OpenCode, an AI assistant, was used as a supporting tool for complementary tasks:

- Detection of syntactic and logical errors in code fragments.
- Generation of repetitive code (schemas, basic controllers, routes) to accelerate development.
- Refactoring suggestions and best practices.

It is important to note that **all architectural decisions, business logic, project structure, and integration of the different modules have been manually designed and validated**. The use of AI was limited to auxiliary tasks, always under direct supervision, ensuring that every line of code meets the quality standards and functional requirements of the system.

## Deployment

The API is ready to be deployed in any Node.js-compatible environment. Recommendations include:

- Setting environment-specific variables for production.
- Using a process manager (like PM2) or Docker containers.
- Ensuring the database and Cloudinary are accessible from the production environment.

Example production command:

```bash
pnpm build
NODE_ENV=production pnpm start
```

## Author

This project was developed as part of a personal portfolio. For any inquiries, please contact via [GitHub](https://github.com/gonzalodr) or [e-mail](gonzalodormos26@gmail.com).