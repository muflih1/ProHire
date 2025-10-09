import "dotenv/config"
import express from "express";
import cors from "cors"
import trpcRoutes from "./routes/trpc.route.js"
import authRoutes from "./routes/auth.route.js"
import type { appRouter } from "./trpc/routers/index.js";
import { errorHandler } from "./middlewares/error-handler.middleware.js";
import cookieParser from "cookie-parser";
import { deserializeSession } from "./lib/session.js";
import morgan from "morgan";

const app = express();

app
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use(cors({ origin: 'http://localhost:5173', credentials: true }))
  .use(cookieParser())
  .use(morgan('dev'))
  .use((req, res, next) => {
    console.log('[API SERVER]', req.method, req.originalUrl)
    next();
  })
  .use(deserializeSession);

app.use('/api/auth', authRoutes)
app.use("/api/trpc", trpcRoutes);

app.get('/api/session', (req, res) => {
  return res.send(req.session)
})

app.use(errorHandler)

app.listen(3000, async () => {
  console.log("Server running on http://localhost:3000");
});

export type AppRouter = typeof appRouter;
