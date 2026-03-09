import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '@docs/swagger.json';

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
import authRouter from '@module/auth/auth.routes';
import profileRouter from '@module/profile/profile.routes';
import recipeRouter from '@module/recipe/recipe.routes';
import likeRouter from '@module/like/like.routes';
import commentRouter from '@module/comment/comment.routes';
import followRouter from '@module/follow/follow.routes';
import savedRouter from '@module/saved/saved.routes';
import searchRouter from '@module/search/search.routes';
import feedRouter from '@module/feed/feed.routes';
// 5. ednpoints
app.use('/auth',authRouter);
app.use('/profile',profileRouter);
app.use('/recipe',recipeRouter);
app.use('/like',likeRouter);
app.use('/comment',commentRouter);
app.use('/follow',followRouter);
app.use('/save',savedRouter);
app.use('/search',searchRouter);
app.use('/feed',feedRouter);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Run server in: http://localhost:${PORT}`);
});