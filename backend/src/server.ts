import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
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
import { createServer, Server } from "http";
import helmet from "helmet";

// Config
const directory = process.cwd();
dotenv.config();

// Express setup
export const app = express();
export const server = createServer(app);
export let activePort: number;

export const startServer = () => {
  return new Promise<Server>((resolve) => {
    const instance = server.listen(0, () => {
      // Use 0 for random port
      activePort = (instance.address() as any).port;
      console.log(`Server running on port ${activePort}`);
      resolve(instance);
    });
  });
};

export const stopServer = () => {
  return new Promise((resolve) => {
    server.close(() => resolve(true));
  });
};

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
app.use(
  "/src/images", // Match the URL path you're using
  express.static(path.join(directory, "../src/images")),
  (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err) {
      res.status(404).send("Image not found");
    } else {
      next();
    }
  }
);

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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts",
});
app.use("/api/auth/login", authLimiter);

// Enable the Helmet middleware for added security
app.use(helmet());
app.use(
  helmet.hsts({
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  })
);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// Routes
app.use("/api/albums", albumsRouter);
app.use("/api/songs", songsRouter);
app.use("/api/auth", usersRouter);
app.use("/api/groups", authenticate, groupsRouter);
app.use("/api/reviews", authenticate, reviewRoutes);

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});
