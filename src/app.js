import express from "express";
import cors from "cors";
import path from 'path';
import cookieParser from "cookie-parser";

const app = express();
const corsOrigin = "http://localhost:5173";

app.use(cors({
    origin: corsOrigin,
    credentials: true,
}));

app.use('/hls', express.static(path.join(process.cwd(), 'hls_segment/1')))

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Important: Serve the HLS segments directory
app.use('/hls_segment', express.static(path.join(process.cwd(), 'public/hls_segment')));
app.use(cookieParser());

// Routes
import userRouter from "./routes/user.routes.js";
import databaseRouter from "./routes/refresh.routes.js";
import moviesRouter from "./routes/movie.routes.js";
import watchRouter from "./routes/watch.routes.js";
import tvShowRouter from "./routes/tvShow.routes.js";
import animeRouter from "./routes/anime.routes.js";
import encodeRouter from "./routes/encode.routes.js"

app.use("/api/v1/users", userRouter);
app.use("/api/v1/database", databaseRouter);
app.use("/api/v1/movies", moviesRouter);
app.use("/api/v1/watch", watchRouter);
app.use("/api/v1/tvshow", tvShowRouter);
app.use("/api/v1/anime", animeRouter);
app.use("/api/v1/encode", encodeRouter)

export { app };
