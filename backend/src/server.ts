import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import expressMongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { createServer, Server } from "http";
import helmet from "helmet";
import { fileURLToPath } from "url";

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
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// Config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const directory = path.join(__dirname, "..");
dotenv.config();

const PORT = process.env.PORT || 3000;

export const app = express();
export const server = createServer(app);

function setupMiddleware() {
  console.log("Server initialization started...");

  // Cors and JSON parsing
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

  // Static file serving
  app.use(
    "/src/images",
    express.static(path.join(directory, "../src/images")),
    (err: any, req: Request, res: Response, next: NextFunction) => {
      if (err) {
        res.status(404).send("Image not found");
      } else {
        next();
      }
    }
  );

  // File upload
  const upload = multer({ dest: "uploads/" });
  app.post(
    "/api/upload",
    authenticate,
    upload.single("image"),
    asyncRouteHandler(async (req, res) => {
      res.json({ url: `/images/${req.file?.filename}` });
    })
  );

  // Authentication rate limiting
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts",
  });
  app.use("/api/auth/login", authLimiter);

  // Security headers
  app.use(helmet());
  app.use(
    helmet.hsts({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    })
  );
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    next();
  });
}

function setupRoutes() {
  // Routes
  app.use("/api/albums", albumsRouter);
  app.use("/api/songs", songsRouter);
  app.use("/api/auth", usersRouter);
  app.use("/api/groups", authenticate, groupsRouter);
  app.use("/api/reviews", authenticate, reviewRoutes);

  // Default route
  app.get("/", (req, res) => {
    res.json({
      message: "Server is running",
      timestamp: new Date().toISOString(),
    });
  });

  // Error handler (must be last)
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler(err, req, res, next);
  });
}

export const startServer = async () => {
  try {
    console.log("Starting server...");
    console.log("Environment variables:", process.env.NODE_ENV);
    console.log("Current directory:", directory);
    setupMiddleware();
    setupRoutes();

    return new Promise<Server>((resolve, reject) => {
      const instance = server
        .listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);
          resolve(instance);
        })
        .on("error", (error) => {
          console.error("Server startup failed:");
          console.error(error.stack);
          reject(error);
        });
    });
  } catch (error) {
    console.error("Server initialization error:");
    console.error(error instanceof Error ? error.stack : error);
    process.exit(1);
  }
};

// Check if this module is being run directly
if (import.meta.url === `file://${__filename}`) {
  startServer().catch(console.error);
}

export const stopServer = () => {
  return new Promise<boolean>((resolve) => {
    server.close(() => resolve(true));
  });
};
// Add to server.ts
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
async function main() {
  try {
    const instance = await startServer();

    // Handle shutdown signals
    const shutdown = async () => {
      await stopServer();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    // Keep process alive
    await new Promise(() => {});
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server whether imported or run directly
main();
