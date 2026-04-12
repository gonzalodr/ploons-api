import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '@docs/swagger.json';
import { prisma } from '@config/db.config';

const PORT = process.env.PORT || 4000;
const ENVIRONMENT = process.env.ENVIRONMENT || 'development';
const FRONTEND_URL = ENVIRONMENT === 'production' ? process.env.FRONTEND_URL : 'http://127.0.0.1:3000';

if (ENVIRONMENT === 'production' && !FRONTEND_URL) {
  throw new Error('FRONTEND_URL is required in production');
}

const app = express();
// 1. cors config
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Refresh-Token']
}));

app.use(express.json());
app.use(cookieParser());

// 2. path test and documentation with swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/health', (req, res) => { res.json({ status: 'ok', message: 'Run server' }); });

// 4. End point integrations
import authRouter from 'src/modules/auth/auth.routes';
import profileRouter from 'src/modules/profile/profile.routes';
import recipeRouter from 'src/modules/recipe/recipe.routes';
import likeRouter from 'src/modules/like/like.routes';
import commentRouter from 'src/modules/comment/comment.routes';
import followRouter from 'src/modules/follow/follow.routes';
import savedRouter from 'src/modules/saved/saved.routes';
import searchRouter from 'src/modules/search/search.routes';
import feedRouter from 'src/modules/feed/feed.routes';
// 5. ednpoints
app.use('/auth', authRouter);
app.use('/profile', profileRouter);
app.use('/recipe', recipeRouter);
app.use('/like', likeRouter);
app.use('/comment', commentRouter);
app.use('/follow', followRouter);
app.use('/save', savedRouter);
app.use('/search', searchRouter);
app.use('/feed', feedRouter);
//5.5 handler endpoints not found
app.use((req, res) => {
  res.status(404).json({ error: `Route \`${req.originalUrl}\` not found` });
});
// 6. listen ports
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  if (ENVIRONMENT === 'development') {
    console.log(`🚀 Run server in: http://localhost:${PORT}`);
  }
});
// 7. close server
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  server.close();
});