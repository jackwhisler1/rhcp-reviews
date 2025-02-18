import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import expressMongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import multer from "multer";
// Routes
import albumsRouter from "./routes/albums.js";
import songsRouter from "./routes/songs.js";
import usersRouter from "./routes/users.js";
import groupsRouter from "./routes/groups.js";
import reviewRoutes from "./routes/reviews.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { authenticate } from "./middleware/auth.js";
import asyncRouteHandler from "./middleware/asyncRouteHandler.js";

// Config
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();
// Express setup
export const app = express();
const PORT = process.env.PORT || 5000;
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not defined");
}

// Middleware chain
app.use(cors());
app.use(express.json());
app.use(expressMongoSanitize());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

// Static files
app.use("/images", express.static(path.join(__dirname, "./images")));

const upload = multer({ dest: "uploads/" });
app.post(
  "/api/upload",
  authenticate,
  upload.single("image"),
  asyncRouteHandler(async (req, res) => {
    // Handle file storage (S3/local)
    res.json({ url: `/images/${req.file?.filename}` });
  })
);

// Routes
app.use("/api/albums", albumsRouter);
app.use("/api/songs", songsRouter);
app.use("/api/users", usersRouter);
app.use("/api/groups", authenticate, groupsRouter);
app.use("/api/reviews", authenticate, reviewRoutes);

// Error handler
app.use(errorHandler);
// Server start
app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode`
  );
  console.log(`Listening on http://localhost:${PORT}`);
});
