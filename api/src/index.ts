import "dotenv/config"
import express from "express";
import cors from "cors"
import trpcRoutes from "./routes/trpc.route.js"
import authRoutes from "./routes/auth.route.js"
import organizationRoutes from "./routes/organization.route.js"
import type { appRouter } from "./trpc/routers/_app.js";
import { errorHandler } from "./middlewares/error-handler.middleware.js";
import cookieParser from "cookie-parser";
import { deserializeSession } from "./lib/session.js";
import morgan from "morgan";
import { getEnv } from "./env.js";

const app = express();

app
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use(cors({ origin: 'http://localhost:5173', credentials: true }))
  .use(cookieParser())
  .use(morgan('dev'))
  .use(deserializeSession);

app.use('/api/auth', authRoutes)
app.use('/api/organizations', organizationRoutes)
app.use("/api/trpc", trpcRoutes);

app.use(errorHandler)

const PORT = Number(getEnv('PORT', '5000'))
app.listen(PORT, async () => {
  console.log(`Listening at http://localhost:${PORT}`);
});


export type AppRouter = typeof appRouter;
