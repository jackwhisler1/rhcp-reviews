# .eslintrc.cjs

```cjs
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
  },
};

```

# .gitignore

```
node_modules
# Keep environment variables out of version control
.env
.env.test
coverage
```

# .npmrc

```
node-options=--no-warnings
experimental-loader=true
```

# babel.config.js

```js
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
};

```

# codebase_backend.md

```md
# controllers\album.controller.ts

\`\`\`ts
import { Request, Response } from "express";
import {
  createAlbumService,
  deleteAlbumService,
  getAlbumSongStatsService,
  getPaginatedAlbumsService,
  updateAlbumService,
} from "../services/album.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
import prisma from "../db/prisma.js";

export const createAlbumController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const album = await createAlbumService(req.body);
      res.status(201).json(album);
    } catch (error) {
      console.error("Album creation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export const getAlbumsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getPaginatedAlbumsService({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 25,
      search: req.query.search?.toString(),
    });
    res.json(result);
  }
);

export const updateAlbumController = asyncHandler(
  async (req: Request, res: Response) => {
    const album = await updateAlbumService(Number(req.params.id), req.body);
    res.json(album);
  }
);

export const deleteAlbumController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteAlbumService(Number(req.params.id));
    res.sendStatus(204);
  }
);

export const getAlbumSongStatsController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const albumId = Number(req.params.albumId);
      const groupId = req.query.groupId ? Number(req.query.groupId) : undefined;
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const selectedUserId = req.query.selectedUserId
        ? Number(req.query.selectedUserId)
        : undefined;

      console.log(
        `Fetching album stats - albumId: ${albumId}, groupId: ${groupId}, userId: ${userId}, authenticated: ${!!req.user}`
      );

      // Public stats don't need authentication
      if (!groupId) {
        console.log("Fetching public album stats");
        const stats = await getAlbumSongStatsService({
          albumId,
          groupId: undefined,
          userId,
          selectedUserId,
        });
        return res.json(stats); // Using return to prevent further execution
      }

      // Group stats require authentication
      if (groupId && !req.user) {
        console.log("Attempted to access group stats without authentication");
        return res
          .status(401)
          .json({ error: "Authentication required for group stats" });
      }

      // Authorization check for private groups
      if (groupId) {
        console.log(`Checking group access for groupId: ${groupId}`);
        const group = await prisma.group.findUnique({
          where: { id: groupId },
          select: { isPrivate: true },
        });

        if (!group) {
          console.log("Group not found");
          return res.status(404).json({ error: "Group not found" });
        }

        if (group.isPrivate) {
          console.log("Checking membership for private group");
          // Must be authenticated for private groups
          if (!req.user) {
            console.log("No user authenticated for private group access");
            return res
              .status(401)
              .json({ error: "Authentication required for private group" });
          }

          // Must be a member of private groups
          const membership = await prisma.userGroup.findUnique({
            where: {
              userId_groupId: {
                userId: req.user.id,
                groupId,
              },
            },
          });

          if (!membership) {
            console.log(
              `User ${req.user.id} is not a member of private group ${groupId}`
            );
            return res.status(403).json({ error: "Not a group member" });
          }

          console.log(
            `User ${req.user.id} has access to private group ${groupId}`
          );
        } else {
          console.log("Group is public, proceeding with request");
        }
      }
      console.log(
        `selectedUserId from query: ${selectedUserId}, type: ${typeof selectedUserId}`
      );

      // If we got here, the user has the necessary permissions
      console.log("Fetching album stats with permissions validated");
      const stats = await getAlbumSongStatsService({
        albumId,
        groupId,
        selectedUserId,
        userId: req.query.userFilter === "true" ? req.user?.id : userId,
      });

      return res.json(stats); // Using return to prevent further execution
    } catch (error) {
      console.error("Error in getAlbumSongStatsController:", error);

      // Check if headers have already been sent
      if (!res.headersSent) {
        return res
          .status(500)
          .json({ error: "Server error fetching album stats" });
      } else {
        console.error("Headers already sent, cannot send error response");
      }
    }
  }
);

\`\`\`

# controllers\group.controller.ts

\`\`\`ts
import { Request, Response } from "express";
import {
  createGroupService,
  deleteGroupService,
  updateGroupService,
  sendGroupInviteService,
  joinGroupService,
  getUserGroupsService,
  joinPublicGroupService,
  getGroupByIdService,
  getPublicGroupsService,
} from "../services/group.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";

export const createGroupController = asyncHandler(
  async (req: Request, res: Response) => {
    const group = await createGroupService({
      ...req.body,
      userId: req.user!.id,
    });
    res.status(201).json(group);
  }
);

export const deleteGroupController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteGroupService(Number(req.params.groupId), req.user!.id);
    res.sendStatus(204);
  }
);

export const updateGroupController = asyncHandler(
  async (req: Request, res: Response) => {
    const group = await updateGroupService(
      Number(req.params.groupId),
      req.body,
      req.user!.id
    );
    res.json(group);
  }
);

export const sendInviteController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await sendGroupInviteService(
      Number(req.params.groupId),
      req.body.email,
      req.user!.id
    );
    res.json(result);
  }
);

export const joinGroupController = asyncHandler(
  async (req: Request, res: Response) => {
    const membership = await joinGroupService(req.body.code, req.user!.id);
    res.json(membership);
  }
);

export const getUserGroupsController = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Request headers:", req.headers);
    console.log("User object from token:", req.user);
    const groups = await getUserGroupsService(req.user!.id);
    res.json(groups);
  }
);

export const getGroupByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;

    const group = await getGroupByIdService(groupId, userId);
    res.json(group);
  }
);

export const getPublicGroupsController = asyncHandler(
  async (req: Request, res: Response) => {
    const publicGroups = await getPublicGroupsService();
    res.json({ groups: publicGroups });
  }
);

export const joinPublicGroupController = asyncHandler(
  async (req: Request, res: Response) => {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;

    const membership = await joinPublicGroupService(groupId, userId);
    res.json(membership);
  }
);

\`\`\`

# controllers\review.controller.ts

\`\`\`ts
import { Request, Response } from "express";
import {
  createReviewService,
  deleteReviewService,
  getReviewsService,
  getSongReviewsService,
  getUserReviewForSongService,
  getUserSongReviewsService,
  updateReviewService,
} from "../services/review.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";

export const createReviewController = asyncHandler(
  async (req: Request, res: Response) => {
    const review = await createReviewService({
      ...req.body,
      userId: req.user!.id,
    });
    res.status(201).json(review);
  }
);

export const getReviewsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getReviewsService({
      ...req.query,
      userId: req.user?.id,
    });
    res.json(result);
  }
);

export const updateReviewController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const review = await updateReviewService(parseInt(id), req.user!.id, {
      ...req.body,
    });
    res.json(review);
  }
);

export const deleteReviewController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteReviewService(parseInt(id), req.user!.id);
    res.status(204).end();
  }
);

export const getSongReviewsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { songId, groupId } = req.query;

    if (!songId) {
      return res.status(400).json({ error: "Song ID is required" });
    }

    const result = await getSongReviewsService(
      parseInt(songId as string),
      req.user?.id
    );

    res.json(result);
  }
);

export const getUserSongReviewsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, songIds } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!songIds) {
      return res.status(400).json({ error: "Song IDs are required" });
    }

    // Parse the comma-separated list of song IDs
    const parsedSongIds = (songIds as string)
      .split(",")
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));

    const result = await getUserSongReviewsService(
      parseInt(userId as string),
      parsedSongIds
    );

    res.json(result);
  }
);

export const getUserReviewForSongController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, songId } = req.params;

    if (!userId || !songId) {
      return res
        .status(400)
        .json({ error: "User ID and Song ID are required" });
    }

    const result = await getUserReviewForSongService(
      parseInt(userId),
      parseInt(songId)
    );

    res.json(result);
  }
);

\`\`\`

# controllers\song.controller.ts

\`\`\`ts
import { Request, Response } from "express";
import {
  getSongsService,
  getSongService,
  createSongService,
  updateSongService,
  deleteSongService,
} from "../services/song.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";

export const getSongsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getSongsService({
      albumId: req.query.albumId?.toString(),
      search: req.query.search?.toString(),
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    res.json(result);
  },
);

export const getSongController = asyncHandler(
  async (req: Request, res: Response) => {
    const song = await getSongService(Number(req.params.songId));
    res.json(song);
  },
);

export const createSongController = asyncHandler(
  async (req: Request, res: Response) => {
    const song = await createSongService(req.body);
    res.status(201).json(song);
  },
);

export const updateSongController = asyncHandler(
  async (req: Request, res: Response) => {
    const song = await updateSongService(Number(req.params.songId), req.body);
    res.json(song);
  },
);

export const deleteSongController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteSongService(Number(req.params.songId));
    res.sendStatus(204);
  },
);

\`\`\`

# controllers\user.controller.ts

\`\`\`ts
import { Request, Response } from "express";
import {
  registerUserService,
  loginUserService,
  getCurrentUserService,
  deleteUserService,
  refreshTokenService,
  updateUserService,
  forgotPasswordService,
  resetPasswordService,
} from "../services/user.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
import { UpdateUserInput } from "../validators/user.validator.js";
import {
  AuthenticationError,
  ValidationError,
} from "../errors/customErrors.js";

export const registerUserController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Call the service to register the user
      const user = await registerUserService(req.body);

      // Generate tokens for the newly registered user
      const { token, refreshToken } = await loginUserService(
        req.body.email,
        req.body.password
      );

      // Return user info and tokens
      res.status(201).json({
        user,
        token,
        refreshToken,
      });
    } catch (error) {
      console.error("Validation Error:", error);
      const typedError = error as any;
      res.status(422).json({ error: typedError.errors ?? "Invalid request" });
    }
  }
);

export const loginUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, refreshToken, user } = await loginUserService(
      req.body.email,
      req.body.password
    );

    // Return tokens and user data for frontend storage
    res.json({
      token,
      refreshToken,
      user,
    });
  }
);

export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await getCurrentUserService(req.user!.id);
    res.json(user);
  }
);

export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError("Refresh token required", {
        refreshToken: "Missing refresh token",
      });
    }

    try {
      // Get new tokens from the service
      const tokens = await refreshTokenService(refreshToken);

      // Map the service response to what the frontend expects
      res.json({
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

export const updateUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const updateData: UpdateUserInput = req.body;

    const user = await updateUserService(req.user!.id, updateData);

    res.json(user);
  }
);

export const deleteUserController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteUserService(req.user!.id);
    res.sendStatus(204);
  }
);

export const forgotPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await forgotPasswordService(req.body.email);
      res.status(200).json({ message: "Email sent" });
    } catch (e) {
      console.error(e);
    }
  }
);

export const resetPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      await resetPasswordService(token, newPassword);
      res.status(200).json({ message: "Password reset" });
    } catch (e) {
      console.error(e);
    }
  }
);

\`\`\`

# db\prisma.ts

\`\`\`ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default prisma;

\`\`\`

# errors\customErrors.ts

\`\`\`ts
export class AuthenticationError extends Error {
  statusCode = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message = "Not Found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends Error {
  statusCode = 400;
  constructor(message = "Bad Request") {
    super(message);
    this.name = "BadRequestError";
  }
}

export class ValidationError extends Error {
  statusCode = 422;
  details: any;
  constructor(message = "Validation Error", details: any) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

\`\`\`

# images\blood_sugar.jpg

This is a binary file of the type: Image

# images\bsides.jpg

This is a binary file of the type: Image

# images\by_the_way.jpg

This is a binary file of the type: Image

# images\californication.jpg

This is a binary file of the type: Image

# images\freaky_styley.jpg

This is a binary file of the type: Image

# images\greatest.jpg

This is a binary file of the type: Image

# images\im_with_you.jpg

This is a binary file of the type: Image

# images\live_in_hyde_park.jpg

This is a binary file of the type: Image

# images\mothers_milk.jpg

This is a binary file of the type: Image

# images\one_hot_minute.jpg

This is a binary file of the type: Image

# images\return_dream_canteen.jpg

This is a binary file of the type: Image

# images\st.jpg

This is a binary file of the type: Image

# images\stadium_arcadium.jpg

This is a binary file of the type: Image

# images\the_getaway.jpg

This is a binary file of the type: Image

# images\unlimited_love.jpg

This is a binary file of the type: Image

# images\uplift_mofo.jpg

This is a binary file of the type: Image

# middleware\asyncRouteHandler.ts

\`\`\`ts
import { Request, Response, NextFunction } from "express";

// Async route handler wrapper function
const asyncRouteHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncRouteHandler;

\`\`\`

# middleware\auth.ts

\`\`\`ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
import { AuthenticationError } from "../errors/customErrors.js";
import nodemailer from "nodemailer";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email?: string;
        username?: string;
        image?: string | null;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) return next(new AuthenticationError("Authentication required"));

  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next(new AuthenticationError("Authentication required"));
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    console.log(
      "Auth middleware processing token:",
      token.substring(0, 15) + "..."
    );

    // Verify token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not defined");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as jwt.JwtPayload & { id: number };

    // Log the decoded user ID
    console.log("Decoded user ID:", decoded.id);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        image: true,
      },
    });

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError("Token expired"));
    }

    next(new AuthenticationError("Invalid authentication token"));
  }
};
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next();
  }

  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next(new AuthenticationError("Authentication required"));
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    console.log(
      "Auth middleware processing token:",
      token.substring(0, 15) + "..."
    );

    // Verify token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not defined");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as jwt.JwtPayload & { id: number };

    // Log the decoded user ID
    console.log("Decoded user ID:", decoded.id);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        image: true,
      },
    });

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError("Token expired"));
    }

    next(new AuthenticationError("Invalid authentication token"));
  }
};

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  await transporter.sendMail({
    from: `"Red Hot Takes" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

\`\`\`

# middleware\errorHandler.ts

\`\`\`ts
import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Request, Response, NextFunction } from "express";
import {
  AuthenticationError,
  ValidationError,
} from "../errors/customErrors.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  if (err instanceof AuthenticationError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Check if response is still writable
  if (res.headersSent || typeof res.status !== "function") {
    return next(err);
  }

  // Handle static file errors first
  if (req.path.startsWith("/images")) {
    return res.status(404).send("Image not found");
  }

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    return res?.status(400).json({
      error: "Validation Error",
      details: err.errors,
    });
  }
  console.error(err);
  // Handle Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    return res?.status(400).json({
      error: "Database Error",
      code: err.code,
    });
  }

  // Handle other errors
  res?.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
};

\`\`\`

# middleware\groupAdminGuard.ts

\`\`\`ts
import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma.js";
import { ForbiddenError } from "../errors/customErrors.js";

export const groupAdminGuard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const groupId = Number(req.params.groupId);

  const membership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId: req.user!.id,
        groupId,
      },
    },
  });

  if (!membership || membership.role !== "admin") {
    throw new ForbiddenError("Admin privileges required");
  }

  next();
};

\`\`\`

# middleware\validate.ts

\`\`\`ts
import { Request, Response, NextFunction } from "express";
import { AnyZodObject, z } from "zod";
import { ValidationError } from "../errors/customErrors.js";

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(
          new ValidationError(
            "Validation failed",
            error.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
            }))
          )
        );
      } else {
        next(error);
      }
    }
  };

\`\`\`

# routes\albums.ts

\`\`\`ts
import express from "express";
import {
  createAlbumController,
  deleteAlbumController,
  getAlbumSongStatsController,
  getAlbumsController,
  updateAlbumController,
} from "../controllers/album.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createAlbumSchema,
  updateAlbumSchema,
} from "../validators/album.validator.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  validate(createAlbumSchema),
  createAlbumController
);

router.get(
  "/:albumId/songs/stats",
  optionalAuthenticate,
  getAlbumSongStatsController
);

router.get("/", getAlbumsController);

router.put(
  "/:id",
  authenticate,
  validate(updateAlbumSchema),
  updateAlbumController
);

router.delete("/:id", authenticate, deleteAlbumController);

export default router;

\`\`\`

# routes\groups.ts

\`\`\`ts
import express from "express";
import {
  createGroupController,
  deleteGroupController,
  updateGroupController,
  sendInviteController,
  joinGroupController,
  getUserGroupsController,
  getPublicGroupsController,
  getGroupByIdController,
  joinPublicGroupController,
} from "../controllers/group.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { groupSchema } from "../validators/group.validator.js";
import { groupAdminGuard } from "../middleware/groupAdminGuard.js";
import asyncRouteHandler from "../middleware/asyncRouteHandler.js";
import prisma from "@/db/prisma.js";
import {
  NotFoundError,
  AuthenticationError,
  ValidationError,
} from "@/errors/customErrors.js";

const router = express.Router();

// Get user's groups
router.get("/", authenticate, getUserGroupsController);

// Get public groups
router.get("/public", getPublicGroupsController);

// Get specific group details
router.get("/:groupId", authenticate, getGroupByIdController);

// Create a new group
router.post("/", authenticate, validate(groupSchema), createGroupController);

// Update group details (admin only)
router.patch(
  "/:groupId",
  authenticate,
  validate(groupSchema),
  groupAdminGuard,
  updateGroupController
);

// Delete a group (admin only)
router.delete(
  "/:groupId",
  authenticate,
  groupAdminGuard,
  deleteGroupController
);

// Send invitation to join private group (admin only)
router.post(
  "/:groupId/invite",
  authenticate,
  groupAdminGuard,
  sendInviteController
);

// Join a group using invite code
router.post("/join", authenticate, joinGroupController);

// Join a public group
router.post("/:groupId/join", authenticate, joinPublicGroupController);

// Get members of a group
router.get(
  "/:groupId/members",
  authenticate,
  asyncRouteHandler(async (req, res) => {
    const groupId = parseInt(req.params.groupId);

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, isPrivate: true },
    });

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    // Check if the user is a member of this group if it's private
    if (group.isPrivate) {
      const userMembership = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: req.user?.id!,
            groupId: groupId,
          },
        },
      });

      if (!userMembership) {
        throw new AuthenticationError("You don't have access to this group");
      }
    }

    // Get all members of the group
    const groupMembers = await prisma.userGroup.findMany({
      where: { groupId: groupId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    // Format the response
    const members = groupMembers.map((member) => ({
      id: member.user.id,
      username: member.user.username,
      email: member.user.email,
      image: member.user.image,
      role: member.role,
      joinedAt: member.joinedAt,
    }));

    res.json({ members });
  })
);

// Leave a group
router.delete(
  "/:groupId/members",
  authenticate,
  asyncRouteHandler(async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user?.id!;

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    // Check if user is a member of the group
    const membership = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundError("You are not a member of this group");
    }

    // Count admins in the group
    const adminCount = await prisma.userGroup.count({
      where: {
        groupId,
        role: "admin",
      },
    });

    // Prevent the last admin from leaving
    if (adminCount === 1 && membership.role === "admin") {
      throw new ValidationError(
        "Cannot leave group as you are the last admin. Transfer admin rights or delete the group instead.",
        { adminCount, groupId }
      );
    }

    // Remove user from group
    await prisma.userGroup.delete({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    res.status(200).json({ message: "Successfully left group" });
  })
);

export default router;

\`\`\`

# routes\reviews.ts

\`\`\`ts
import express from "express";
import {
  createReviewController,
  deleteReviewController,
  getReviewsController,
  getSongReviewsController,
  getUserReviewForSongController,
  getUserSongReviewsController,
  updateReviewController,
} from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Create a new review (requires authentication)
router.post("/", authenticate, createReviewController);

// Get all reviews (with filtering)
router.get("/", getReviewsController);

// Get reviews for a specific song
router.get("/song", getSongReviewsController);

// Get reviews for specific songs by a user
router.get("/user/songs", getUserSongReviewsController);

// Get a specific user's review for a song
router.get("/user/:userId/song/:songId", getUserReviewForSongController);

// Update a review (requires authentication)
router.put("/:id", authenticate, updateReviewController);

// Delete a review (requires authentication)
router.delete("/:id", authenticate, deleteReviewController);

export default router;

\`\`\`

# routes\songs.ts

\`\`\`ts
import express from "express";
import {
  getSongsController,
  getSongController,
  createSongController,
  updateSongController,
  deleteSongController,
} from "../controllers/song.controller.js";
import { validate } from "../middleware/validate.js";
import { songSchema } from "../validators/song.validator.js";
import { authenticate } from "../middleware/auth.js";
import prisma from "@/db/prisma.js";
import { NotFoundError } from "@/errors/customErrors.js";
import { getUserGroupsService } from "@/services/group.service.js";
import asyncRouteHandler from "@/middleware/asyncRouteHandler.js";

const router = express.Router();

router.get("/", getSongsController);
router.get("/:songId", getSongController);
router.post("/", authenticate, validate(songSchema), createSongController);
router.patch(
  "/:songId",
  authenticate,
  validate(songSchema),
  updateSongController
);
router.delete("/:songId", authenticate, deleteSongController);
router.get(
  "/:userId/groups",
  authenticate,
  asyncRouteHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get the user's groups
    const groups = await getUserGroupsService(userId);

    res.json({ groups });
  })
);

export default router;

\`\`\`

# routes\userRoutes.ts

\`\`\`ts
import express from "express";
import { authenticate } from "../middleware/auth.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
import prisma from "../db/prisma.js";
import { NotFoundError } from "../errors/customErrors.js";

const router = express.Router();

// Get groups for a specific user
router.get(
  "/:userId/groups",
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get the user's groups
    const userGroups = await prisma.userGroup.findMany({
      where: { userId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            isPrivate: true,
            createdAt: true,
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    // Format the response
    const groups = userGroups.map((ug) => ({
      id: ug.group.id,
      name: ug.group.name,
      description: ug.group.description,
      image: ug.group.image,
      isPrivate: ug.group.isPrivate,
      memberCount: ug.group._count.members,
      role: ug.role,
      joinedAt: ug.joinedAt,
      createdAt: ug.group.createdAt,
    }));

    res.json({ groups });
  })
);

export default router;

\`\`\`

# routes\users.ts

\`\`\`ts
import express from "express";
import {
  registerUserController,
  loginUserController,
  getCurrentUserController,
  updateUserController,
  deleteUserController,
  refreshTokenController,
  forgotPasswordController,
  resetPasswordController,
} from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";
import {
  registrationSchema,
  loginSchema,
  updateUserSchema,
  refreshTokenSchema,
} from "../validators/user.validator.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", validate(registrationSchema), registerUserController);
router.post("/login", validate(loginSchema), loginUserController);
router.post("/refresh", validate(refreshTokenSchema), refreshTokenController);
router.get("/me", authenticate, getCurrentUserController);
router.patch(
  "/me",
  authenticate,
  validate(updateUserSchema._def.schema),
  updateUserController
);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

router.delete("/me", authenticate, deleteUserController);

export default router;

\`\`\`

# server.ts

\`\`\`ts
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
import userRoutes from "./routes/userRoutes.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { authenticate, optionalAuthenticate } from "./middleware/auth.js";
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
  const devApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 9999,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", devApiLimiter);

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(directory, "uploads");
  const fs = require("fs");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Static file serving for src/images
  app.use(
    "/src/images",
    express.static(path.join(__dirname, "images")),
    (err: any, req: Request, res: Response, next: NextFunction) => {
      if (err) {
        console.error("Image serving error:", err);
        res.status(404).send("Image not found");
      } else {
        next();
      }
    }
  );

  // Configure multer to store files in the uploads directory
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(directory, "uploads"));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
  });

  const upload = multer({ storage });

  // File upload endpoint
  app.post(
    "/api/upload",
    authenticate,
    upload.single("image"),
    asyncRouteHandler(async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      // Return URL that matches the static serving path
      res.json({ url: `/images/${req.file.filename}` });
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
  // Debug endpoint to list available images
  app.get("/api/debug/images", (req, res) => {
    const fs = require("fs");
    const uploadsDir = path.join(directory, "uploads");

    try {
      if (!fs.existsSync(uploadsDir)) {
        return res.json({
          error: "Uploads directory doesn't exist",
          path: uploadsDir,
        });
      }

      const files = fs.readdirSync(uploadsDir);
      const imageDetails = files.map((file) => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          url: `/images/${file}`,
        };
      });

      res.json({
        uploadsDir,
        imageCount: files.length,
        images: imageDetails,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Error listing images", message: error.message });
    }
  });

  // Routes
  app.use("/api/albums", albumsRouter);
  app.use("/api/songs", songsRouter);
  app.use("/api/auth", usersRouter);
  app.use("/api/groups", authenticate, groupsRouter);
  app.use("/api/reviews", optionalAuthenticate, reviewRoutes);
  app.use("/api/users", userRoutes);
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

\`\`\`

# server.ts.d.ts

\`\`\`ts
export * from "./server.js";

\`\`\`

# services\album.service.ts

\`\`\`ts
import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";

interface SongStatsParams {
  albumId: number;
  groupId?: number;
  userId?: number;
  selectedUserId?: number; // user being compared
}

export const createAlbumService = async (data: Prisma.AlbumCreateInput) => {
  return prisma.album.create({
    data: {
      ...data,
      releaseDate: new Date(data.releaseDate),
    },
  });
};

/**Returns averages for public, group, and user if ids are provided.  */
export const getAlbumSongStatsService = async ({
  albumId,
  groupId,
  userId,
  selectedUserId,
}: SongStatsParams) => {
  // Get all songs in the album
  const songs = await prisma.song.findMany({
    where: { albumId },
    select: { id: true, title: true, trackNumber: true, duration: true },
  });

  // Public stats (all reviews for songs in album)
  const publicStats = await prisma.review.groupBy({
    by: ["songId"],
    where: { song: { albumId } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  // Group-specific stats if groupId is provided
  let groupStats: any[] = [];
  if (groupId) {
    const groupMembers = await prisma.review.findMany({
      where: { groupId },
      select: { userId: true },
    } as any);

    const userIds = groupMembers.map((m) => m.userId);
    groupStats = (await prisma.review.groupBy({
      by: ["songId"],
      where: {
        song: { albumId },
        userId: { in: userIds },
      },
      _avg: { rating: true },
      _count: { rating: true },
    })) as any;
  }

  // Get user reviews if applicable
  let userReviews: any[] = [];
  if (userId) {
    userReviews = await prisma.review.findMany({
      where: { userId, song: { albumId } },
      select: { songId: true, rating: true, id: true },
      orderBy: { createdAt: "desc" },
      distinct: ["userId", "songId", "groupId"],
    });
  }

  // Get selected user reviews if applicable
  let selectedUserReviews: any[] = [];
  if (selectedUserId) {
    selectedUserReviews = await prisma.review.findMany({
      where: { userId: selectedUserId, song: { albumId } },
      select: { songId: true, rating: true, id: true },
      orderBy: { createdAt: "desc" },
    });
    console.log("selectedUserReviews:", selectedUserReviews);
  }

  // Merge data
  return songs.map((song) => {
    const all = publicStats.find((s) => s.songId === song.id);
    const group = groupStats.find((s) => s.songId === song.id);
    const userReview = userReviews.find((r) => r.songId === song.id);
    const selectedUserReview = selectedUserReviews.find(
      (r) => r.songId === song.id
    );

    return {
      id: song.id,
      title: song.title,
      trackNumber: song.trackNumber,
      duration: song.duration,
      publicAverage: all?._avg.rating || 0,
      publicReviewCount: all?._count.rating || 0,
      groupAverage: group?._avg.rating ?? null,
      groupReviewCount: group?._count.rating ?? null,
      currentUserRating: userReview?.rating ?? null,
      currentUserReviewId: userReview?.id ?? null,
      selectedUserRating: selectedUserReview?.rating ?? null,
    };
  });
};

export const getPaginatedAlbumsService = async (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  const where: Prisma.AlbumWhereInput = params.search
    ? { OR: [{ title: { contains: params.search, mode: "insensitive" } }] }
    : {};

  const [total, albums] = await prisma.$transaction([
    prisma.album.count({ where }),
    prisma.album.findMany({
      where,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { releaseDate: "desc" },
      include: {
        songs: {
          include: {
            reviews: true,
          },
        },
      },
    }),
  ]);

  return {
    data: albums,
    meta: {
      total,
      page: params.page,
      totalPages: Math.ceil(total / params.limit),
    },
  };
};

export const updateAlbumService = async (
  id: number,
  data: Prisma.AlbumUpdateInput
) => {
  if (data.releaseDate && typeof data.releaseDate === "string") {
    data.releaseDate = new Date(data.releaseDate);
  }

  return prisma.album.update({
    where: { id },
    data,
  });
};

export const deleteAlbumService = async (id: number) => {
  return prisma.album.delete({
    where: { id },
  });
};

\`\`\`

# services\email.service.ts

\`\`\`ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendInvitationEmail = async (
  email: string,
  groupName: string,
  inviteCode: string,
) => {
  const inviteLink = `${process.env.FRONTEND_URL}/join?code=${inviteCode}`;

  await transporter.sendMail({
    from: `"Red Hot Takes" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Join ${groupName}`,
    html: `
      <p>You've been invited to join the group <strong>${groupName}</strong>!</p>
      <p>Click below to join:</p>
      <a href="${inviteLink}" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #2563eb;
        color: white;
        text-decoration: none;
        border-radius: 5px;
      ">
        Join Group
      </a>
      <p>Or use this code: ${inviteCode}</p>
    `,
  });
};

\`\`\`

# services\group.service.ts

\`\`\`ts
import prisma from "../db/prisma.js";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../errors/customErrors.js";
import crypto from "crypto";
import { sendInvitationEmail } from "./email.service.js";

interface CreateGroupInput {
  name: string;
  description?: string;
  isPrivate: boolean;
  userId: number;
}

interface UpdateGroupInput {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

export const createGroupService = async (data: CreateGroupInput) => {
  if (!data.name || data.name.trim().length < 2) {
    throw new BadRequestError("Group name must be at least 2 characters");
  }

  return prisma.group.create({
    data: {
      name: data.name,
      description: data.description,
      isPrivate: data.isPrivate,
      inviteCode: data.isPrivate ? crypto.randomBytes(6).toString("hex") : null,
      members: {
        create: {
          userId: data.userId,
          role: "admin",
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { username: true, image: true },
          },
        },
      },
    },
  });
};

export const getGroupByIdService = async (groupId: number, userId: number) => {
  // Find the group
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      isPrivate: true,
      inviteCode: true,
      createdAt: true,
      members: {
        select: {
          userId: true,
          role: true,
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // For private groups, check if user is a member
  if (group.isPrivate) {
    const isMember = group.members.some((member) => member.userId === userId);

    if (!isMember) {
      throw new ForbiddenError("You don't have access to this group");
    }
  }

  // Get user's role in the group
  const userMembership = group.members.find(
    (member) => member.userId === userId
  );

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    image: group.image,
    isPrivate: group.isPrivate,
    inviteCode: group.inviteCode,
    createdAt: group.createdAt,
    memberCount: group._count.members,
    role: userMembership?.role || null,
  };
};

export const getPublicGroupsService = async () => {
  const publicGroups = await prisma.group.findMany({
    where: { isPrivate: false },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      isPrivate: true,
      createdAt: true,
      _count: {
        select: { members: true },
      },
    },
  });

  return publicGroups.map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    image: group.image,
    isPrivate: group.isPrivate,
    createdAt: group.createdAt,
    memberCount: group._count.members,
  }));
};

export const deleteGroupService = async (groupId: number, userId: number) => {
  const membership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!membership || membership.role !== "admin") {
    throw new ForbiddenError("Admin privileges required");
  }

  return prisma.group.delete({
    where: { id: groupId },
  });
};

export const updateGroupService = async (
  groupId: number,
  data: UpdateGroupInput,
  userId: number
) => {
  const membership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!membership || membership.role !== "admin") {
    throw new ForbiddenError("Admin privileges required");
  }

  return prisma.group.update({
    where: { id: groupId },
    data,
    include: {
      members: true,
    },
  });
};

export const sendGroupInviteService = async (
  groupId: number,
  email: string,
  userId: number
) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  if (!group) throw new NotFoundError("Group not found");
  if (!group.members[0] || group.members[0].role !== "admin") {
    throw new ForbiddenError("Admin privileges required");
  }
  if (!group.isPrivate) {
    throw new BadRequestError("Public groups don't require invitations");
  }

  await sendInvitationEmail(email, group.name, group.inviteCode!);
  return { message: "Invitation sent" };
};

export const joinGroupService = async (inviteCode: string, userId: number) => {
  const group = await prisma.group.findFirst({
    where: { inviteCode },
  });

  if (!group) throw new NotFoundError("Invalid invitation code");

  const existingMembership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId: group.id,
      },
    },
  });

  if (existingMembership) {
    throw new BadRequestError("Already a group member");
  }

  return prisma.userGroup.create({
    data: {
      userId,
      groupId: group.id,
      role: "member",
    },
    include: {
      group: true,
    },
  });
};

export const joinPublicGroupService = async (
  groupId: number,
  userId: number
) => {
  // Verify the group exists and is public
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) throw new NotFoundError("Group not found");

  if (group.isPrivate) {
    throw new ForbiddenError("Cannot directly join a private group");
  }

  // Check if already a member
  const existingMembership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (existingMembership) {
    throw new BadRequestError("Already a group member");
  }

  // Create membership
  return prisma.userGroup.create({
    data: {
      userId,
      groupId,
      role: "member",
    },
    include: {
      group: true,
    },
  });
};

export const getUserGroupsService = async (userId: number) => {
  const userGroups = await prisma.userGroup.findMany({
    where: { userId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          isPrivate: true,
          inviteCode: true,
          createdAt: true,
          _count: {
            select: { members: true },
          },
        },
      },
    },
  });

  return userGroups.map((membership) => ({
    id: membership.group.id,
    name: membership.group.name,
    description: membership.group.description,
    image: membership.group.image,
    isPrivate: membership.group.isPrivate,
    inviteCode: membership.group.inviteCode,
    memberCount: membership.group._count.members,
    role: membership.role,
    joinedAt: membership.joinedAt,
    createdAt: membership.group.createdAt,
  }));
};

export const getPaginatedGroupsService = async (
  userId: number,
  page: number,
  limit: number
) => {
  const [total, groups] = await prisma.$transaction([
    prisma.userGroup.count({ where: { userId } }),
    prisma.userGroup.findMany({
      where: { userId },
      include: { group: true },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data: groups, total, page, totalPages: Math.ceil(total / limit) };
};

\`\`\`

# services\review.service.ts

\`\`\`ts
import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../errors/customErrors.js";

// Type for review filters
interface ReviewFilters {
  groups?: string;
  minRating?: string;
  maxRating?: string;
  startDate?: string;
  endDate?: string;
  limit?: string;
  page?: string;
  userId?: number;
}

// Type for parsed filter values
interface ParsedFilters {
  groupIds?: number[];
  groupMemberIds?: number[];
  minRating?: number;
  maxRating?: number;
  startDate?: Date;
  endDate?: Date;
  limit: number;
  page: number;
  userId?: number;
}

export const createReviewService = async (data: {
  content?: string;
  rating: number;
  songId: number;
  userId: number;
}) => {
  // Validation
  if (data.rating < 0 || data.rating > 10) {
    throw new ValidationError("Rating must be between 0 and 10", {
      rating: "Invalid rating value",
    });
  }

  // Verify song exists
  const song = await prisma.song.findUnique({
    where: { id: data.songId },
  });
  if (!song) throw new NotFoundError("Song not found");

  // Create review
  return prisma.review.create({
    data: {
      content: data.content,
      rating: data.rating,
      songId: data.songId,
      userId: data.userId,
    },
  });
};

export const getReviewsService = async (filters: ReviewFilters) => {
  const parsed = await parseFilters(filters);

  const where: Prisma.ReviewWhereInput = buildWhereClause(parsed);

  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      include: {
        author: { select: { username: true, image: true } },
        song: true,
      },
      take: parsed.limit,
      skip: (parsed.page - 1) * parsed.limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    data: reviews,
    meta: {
      total,
      page: parsed.page,
      totalPages: Math.ceil(total / parsed.limit),
    },
  };
};

export const updateReviewService = async (
  reviewId: number,
  userId: number,
  data: {
    content?: string;
    rating: number;
  }
) => {
  // Validate rating
  if (data.rating < 0 || data.rating > 10) {
    throw new ValidationError("Rating must be between 0 and 10", {
      rating: "Invalid rating value",
    });
  }

  // Find the review
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  // Check if the user owns the review
  if (review.userId !== userId) {
    throw new ForbiddenError("Not authorized to update this review");
  }

  // Update the review
  return prisma.review.update({
    where: { id: reviewId },
    data: {
      content: data.content,
      rating: data.rating,
    },
  });
};

export const deleteReviewService = async (reviewId: number, userId: number) => {
  // Find the review
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  // Check if the user owns the review
  if (review.userId !== userId) {
    throw new ForbiddenError("Not authorized to delete this review");
  }

  // Delete the review
  return prisma.review.delete({
    where: { id: reviewId },
  });
};

export const getSongReviewsService = async (
  songId: number,
  userId?: number
) => {
  const where: Prisma.ReviewWhereInput = {
    songId,
  };

  const reviews = await prisma.review.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    reviews,
    total: reviews.length,
  };
};

// Helper function to parse filter parameters
const parseFilters = async (filters: ReviewFilters): Promise<ParsedFilters> => {
  const groupIds = filters.groups?.split(",").map(Number).filter(Boolean);

  // Get userIds for those groups
  let groupMemberIds: number[] = [];
  if (groupIds && groupIds.length > 0) {
    const memberships = await prisma.userGroup.findMany({
      where: { groupId: { in: groupIds } },
      select: { userId: true },
    });
    groupMemberIds = memberships.map((m) => m.userId);
  }

  return {
    minRating: filters.minRating ? Number(filters.minRating) : undefined,
    maxRating: filters.maxRating ? Number(filters.maxRating) : undefined,
    startDate: parseDate(filters.startDate),
    endDate: parseDate(filters.endDate),
    limit: Math.min(Number(filters.limit) || 20, 100),
    page: Math.max(Number(filters.page) || 1, 1),
    userId: filters.userId,
    groupIds,
    groupMemberIds,
  };
};

// Helper function to build Prisma where clause
const buildWhereClause = (parsed: ParsedFilters): Prisma.ReviewWhereInput => {
  const filters: Prisma.ReviewWhereInput[] = [];

  // Filter by group members if applicable
  if (parsed.groupMemberIds && parsed.groupMemberIds.length > 0) {
    filters.push({ userId: { in: parsed.groupMemberIds } });
  }

  if (parsed.minRating !== undefined) {
    filters.push({ rating: { gte: parsed.minRating } });
  }

  if (parsed.maxRating !== undefined) {
    filters.push({ rating: { lte: parsed.maxRating } });
  }

  if (parsed.startDate !== undefined) {
    filters.push({ createdAt: { gte: parsed.startDate } });
  }

  if (parsed.endDate !== undefined) {
    filters.push({ createdAt: { lte: parsed.endDate } });
  }

  return {
    AND: filters,
  };
};

// Date validation helper
const parseDate = (dateString?: string): Date | undefined => {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? undefined : date;
};

export const getUserSongReviewsService = async (
  userId: number,
  songIds: number[]
) => {
  if (!userId || !songIds.length) {
    return { reviews: [] };
  }

  const reviews = await prisma.review.findMany({
    where: {
      userId,
      songId: { in: songIds },
    },
    select: {
      id: true,
      songId: true,
      rating: true,
      content: true,
      createdAt: true,
    },
  });

  return {
    reviews,
    total: reviews.length,
  };
};

export const getUserReviewForSongService = async (
  userId: number,
  songId: number
) => {
  if (!userId || !songId) {
    return { review: null };
  }

  const review = await prisma.review.findFirst({
    where: {
      userId,
      songId,
    },
    select: {
      id: true,
      songId: true,
      rating: true,
      content: true,
      createdAt: true,
      userId: true,
    },
  });

  return {
    review,
  };
};

\`\`\`

# services\song.service.ts

\`\`\`ts
import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";
import { NotFoundError, ValidationError } from "../errors/customErrors.js";

export const getSongsService = async (filters: {
  albumId?: string;
  search?: string;
  limit?: number;
  page?: number;
}) => {
  const where: Prisma.SongWhereInput = {
    ...(filters.albumId && { albumId: Number(filters.albumId) }),
    ...(filters.search && {
      title: { contains: filters.search, mode: "insensitive" },
    }),
  };

  const [songs, total] = await prisma.$transaction([
    prisma.song.findMany({
      where,
      include: { album: { select: { title: true, artworkUrl: true } } },
    }),
    prisma.song.count({ where }),
  ]);

  return {
    data: songs,
    meta: {
      total,
      page: filters.page || 1,
      totalPages: Math.ceil(total / (filters.limit || 10)),
    },
  };
};

export const getSongService = async (songId: number) => {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: {
      album: true,
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { username: true, image: true } },
        },
      },
    },
  });

  if (!song) throw new NotFoundError("Song not found");
  return song;
};

export const createSongService = async (data: Prisma.SongCreateInput) => {
  if (!data.title || data.title.trim().length < 2) {
    throw new ValidationError("Song title must be at least 2 characters", {
      title: data.title,
    });
  }

  if (!data.album) {
    throw new ValidationError("Album ID is required", { albumId: data.album });
  }

  return prisma.song.create({
    data,
    include: { album: true },
  });
};

export const updateSongService = async (
  songId: number,
  data: Prisma.SongUpdateInput
) => {
  return prisma.song.update({
    where: { id: songId },
    data,
    include: { album: true },
  });
};

export const deleteSongService = async (songId: number) => {
  return prisma.song.delete({
    where: { id: songId },
  });
};

\`\`\`

# services\user.service.ts

\`\`\`ts
import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "../db/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
} from "../errors/customErrors.js";
import { sendEmail } from "../middleware/auth.js";
const saltRounds = 10;

export const registerUserService = async (data: {
  email: string;
  username: string;
  password: string;
  avatarColor?: string; // optional
}) => {
  if (data.password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters", {
      password: "Length validation failed",
    });
  }

  const hashedPassword = await bcrypt.hash(data.password, saltRounds);

  try {
    return await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        avatarColor: data.avatarColor ?? undefined,
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarColor: true,
      },
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const field = (error.meta?.target as string[])?.[0];
        throw new ValidationError(`${field} already exists`, {
          [field]: "Must be unique",
        });
      }
    }
    throw error;
  }
};

export const loginUserService = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      password: true,
      email: true,
      username: true,
      avatarColor: true,
    },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AuthenticationError("Invalid credentials");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable missing");
  }

  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });
  return {
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarColor: user.avatarColor,
    },
  };
};

export const getCurrentUserService = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      image: true,
      avatarColor: true,
      groups: {
        select: {
          group: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!user) throw new NotFoundError("User not found");
  return user;
};

export const updateUserService = async (
  userId: number,
  data: Partial<{
    username: string;
    email: string;
    password: string;
    newPassword: string;
    image: string;
    avatarColor: string;
  }>
) => {
  if (data.newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    const valid = await bcrypt.compare(data.password ?? "", user.password);
    if (!valid) throw new AuthenticationError("Incorrect current password");

    data.password = await bcrypt.hash(data.newPassword, saltRounds);
  }

  delete data.newPassword;

  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      username: true,
      image: true,
      avatarColor: true,
    },
  });
};

export const refreshTokenService = async (refreshToken: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable missing");
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET) as {
      id: number;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, refreshToken: true },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new AuthenticationError("Invalid refresh token");
    }

    // Generate new tokens with fresh expiration
    const newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "25m",
    });

    const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError("Refresh token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError("Invalid refresh token");
    }
    throw new AuthenticationError("Token refresh failed");
  }
};

export const forgotPasswordService = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable missing");
  }

  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "30m",
  });
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${accessToken}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    text: `Click here to reset your password: ${resetLink}`,
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 30 minutes.</p>`,
  });
};

export const resetPasswordService = async (
  token: string,
  newPassword: string
) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
  const hashed = await bcrypt.hash(newPassword, saltRounds);
  return prisma.user.update({
    where: { id: decoded.id },
    data: { password: hashed },
  });
};

export const deleteUserService = async (userId: number) => {
  return prisma.user.delete({
    where: { id: userId },
  });
};

\`\`\`

# types\express.d.ts

\`\`\`ts
import { User, Group, UserGroup } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email?: string;
        username?: string;
        image?: string | null;
      };
    }
  }
}

export {};

\`\`\`

# validators\album.validator.ts

\`\`\`ts
import { z } from "zod";

const baseAlbumSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title too long (max 100 characters)"),
  releaseDate: z.coerce
    .date({
      required_error: "Release date is required",
      invalid_type_error: "Invalid date format",
    })
    .max(new Date(), "Release date cannot be in the future")
    .refine((date) => date.getFullYear() >= 1900, "Invalid release year"),
  artworkUrl: z
    .string()
    .url("Invalid artwork URL")
    .regex(/\.(jpeg|jpg|png|webp)$/i, "Invalid image format"),
});

export const createAlbumSchema = z.object({
  body: baseAlbumSchema,
});
// For update operations - all fields optional
export const updateAlbumSchema = baseAlbumSchema.partial();

export type AlbumInput = z.infer<typeof baseAlbumSchema>;

\`\`\`

# validators\group.validator.ts

\`\`\`ts
import { z } from "zod";

export const groupSchema = z.object({
  name: z
    .string()
    .min(2, "Group name must be at least 2 characters")
    .max(100, "Group name too long (max 100 characters)"),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
});

export type GroupInput = z.infer<typeof groupSchema>;

\`\`\`

# validators\review.validator.ts

\`\`\`ts
import { z } from "zod";

export const reviewSchema = z.object({
  songId: z.number().int().positive(),
  rating: z.number().min(0.1).max(10),
  reviewText: z.string().max(500),
});

\`\`\`

# validators\song.validator.ts

\`\`\`ts
import { z } from "zod";

export const songSchema = z.object({
  title: z
    .string()
    .min(1, "Title must be at least 1 character")
    .max(100, "Title too long (max 100 characters)"),
  trackNumber: z.number().int().positive(),
  duration: z.string().regex(/^\d+:\d{2}$/, "Invalid duration format (MM:SS)"),
  albumId: z.number().int().positive(),
});

export type SongInput = z.infer<typeof songSchema>;

\`\`\`

# validators\user.validator.ts

\`\`\`ts
import { z } from "zod";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+]{8,}$/;

// src/validators/user.validator.ts
export const registrationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    username: z.string().min(3).max(20),
    password: z.string().min(8),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

// Update User Schema
export const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    username: z
      .string()
      .min(3, "Username too short")
      .max(20, "Username too long")
      .optional(),
    password: z.string().min(8).optional(),
    image: z.string().url("Invalid image URL").optional(),
  })
  .refine((data) => {
    // Ensure at least one field is provided
    return Object.keys(data).length > 0;
  }, "At least one field must be provided");

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

\`\`\`


```

# coverage\clover.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<coverage generated="1741389017089" clover="3.2.0">
  <project timestamp="1741389017089" name="All files">
    <metrics statements="521" coveredstatements="333" conditionals="136" coveredconditionals="16" methods="86" coveredmethods="27" elements="743" coveredelements="376" complexity="0" loc="521" ncloc="521" packages="9" files="30" classes="30"/>
    <package name="src">
      <metrics statements="57" coveredstatements="46" conditionals="2" coveredconditionals="0" methods="10" coveredmethods="2"/>
      <file name="server.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\server.ts">
        <metrics statements="57" coveredstatements="46" conditionals="2" coveredconditionals="0" methods="10" coveredmethods="2"/>
        <line num="1" count="3" type="stmt"/>
        <line num="2" count="3" type="stmt"/>
        <line num="3" count="3" type="stmt"/>
        <line num="4" count="3" type="stmt"/>
        <line num="5" count="3" type="stmt"/>
        <line num="6" count="3" type="stmt"/>
        <line num="7" count="3" type="stmt"/>
        <line num="9" count="3" type="stmt"/>
        <line num="10" count="3" type="stmt"/>
        <line num="11" count="3" type="stmt"/>
        <line num="12" count="3" type="stmt"/>
        <line num="13" count="3" type="stmt"/>
        <line num="16" count="3" type="stmt"/>
        <line num="17" count="3" type="stmt"/>
        <line num="18" count="3" type="stmt"/>
        <line num="19" count="3" type="stmt"/>
        <line num="20" count="3" type="stmt"/>
        <line num="23" count="3" type="stmt"/>
        <line num="24" count="3" type="stmt"/>
        <line num="27" count="3" type="stmt"/>
        <line num="28" count="3" type="stmt"/>
        <line num="31" count="3" type="stmt"/>
        <line num="32" count="0" type="stmt"/>
        <line num="33" count="0" type="stmt"/>
        <line num="35" count="0" type="stmt"/>
        <line num="36" count="0" type="stmt"/>
        <line num="37" count="0" type="stmt"/>
        <line num="42" count="3" type="stmt"/>
        <line num="43" count="0" type="stmt"/>
        <line num="44" count="0" type="stmt"/>
        <line num="49" count="3" type="stmt"/>
        <line num="50" count="3" type="stmt"/>
        <line num="51" count="3" type="stmt"/>
        <line num="54" count="3" type="stmt"/>
        <line num="60" count="3" type="stmt"/>
        <line num="63" count="3" type="stmt"/>
        <line num="67" count="0" type="cond" truecount="0" falsecount="2"/>
        <line num="68" count="0" type="stmt"/>
        <line num="70" count="0" type="stmt"/>
        <line num="75" count="3" type="stmt"/>
        <line num="76" count="3" type="stmt"/>
        <line num="82" count="0" type="stmt"/>
        <line num="86" count="3" type="stmt"/>
        <line num="91" count="3" type="stmt"/>
        <line num="94" count="3" type="stmt"/>
        <line num="95" count="3" type="stmt"/>
        <line num="102" count="3" type="stmt"/>
        <line num="103" count="14" type="stmt"/>
        <line num="104" count="14" type="stmt"/>
        <line num="105" count="14" type="stmt"/>
        <line num="109" count="3" type="stmt"/>
        <line num="110" count="3" type="stmt"/>
        <line num="111" count="3" type="stmt"/>
        <line num="112" count="3" type="stmt"/>
        <line num="113" count="3" type="stmt"/>
        <line num="116" count="3" type="stmt"/>
        <line num="117" count="3" type="stmt"/>
      </file>
    </package>
    <package name="src.controllers">
      <metrics statements="117" coveredstatements="63" conditionals="22" coveredconditionals="3" methods="24" coveredmethods="7"/>
      <file name="album.controller.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\controllers\album.controller.ts">
        <metrics statements="34" coveredstatements="22" conditionals="16" coveredconditionals="3" methods="5" coveredmethods="4"/>
        <line num="2" count="3" type="stmt"/>
        <line num="9" count="3" type="stmt"/>
        <line num="10" count="3" type="stmt"/>
        <line num="12" count="3" type="stmt"/>
        <line num="14" count="1" type="stmt"/>
        <line num="15" count="1" type="stmt"/>
        <line num="16" count="1" type="stmt"/>
        <line num="18" count="0" type="stmt"/>
        <line num="19" count="0" type="stmt"/>
        <line num="24" count="3" type="stmt"/>
        <line num="26" count="0" type="stmt"/>
        <line num="31" count="0" type="stmt"/>
        <line num="35" count="3" type="stmt"/>
        <line num="37" count="1" type="stmt"/>
        <line num="38" count="1" type="stmt"/>
        <line num="42" count="3" type="stmt"/>
        <line num="44" count="1" type="stmt"/>
        <line num="45" count="1" type="stmt"/>
        <line num="49" count="3" type="stmt"/>
        <line num="51" count="1" type="stmt"/>
        <line num="52" count="1" type="cond" truecount="1" falsecount="1"/>
        <line num="53" count="1" type="stmt"/>
        <line num="55" count="1" type="cond" truecount="1" falsecount="2"/>
        <line num="56" count="0" type="stmt"/>
        <line num="60" count="1" type="cond" truecount="0" falsecount="1"/>
        <line num="61" count="0" type="stmt"/>
        <line num="66" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="68" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="69" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="71" count="0" type="stmt"/>
        <line num="75" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="76" count="0" type="stmt"/>
        <line num="80" count="1" type="stmt"/>
        <line num="86" count="1" type="stmt"/>
      </file>
      <file name="group.controller.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\controllers\group.controller.ts">
        <metrics statements="20" coveredstatements="8" conditionals="0" coveredconditionals="0" methods="6" coveredmethods="0"/>
        <line num="2" count="3" type="stmt"/>
        <line num="10" count="3" type="stmt"/>
        <line num="12" count="3" type="stmt"/>
        <line num="14" count="0" type="stmt"/>
        <line num="18" count="0" type="stmt"/>
        <line num="22" count="3" type="stmt"/>
        <line num="24" count="0" type="stmt"/>
        <line num="25" count="0" type="stmt"/>
        <line num="29" count="3" type="stmt"/>
        <line num="31" count="0" type="stmt"/>
        <line num="36" count="0" type="stmt"/>
        <line num="40" count="3" type="stmt"/>
        <line num="42" count="0" type="stmt"/>
        <line num="47" count="0" type="stmt"/>
        <line num="51" count="3" type="stmt"/>
        <line num="53" count="0" type="stmt"/>
        <line num="54" count="0" type="stmt"/>
        <line num="58" count="3" type="stmt"/>
        <line num="60" count="0" type="stmt"/>
        <line num="61" count="0" type="stmt"/>
      </file>
      <file name="review.controller.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\controllers\review.controller.ts">
        <metrics statements="8" coveredstatements="4" conditionals="0" coveredconditionals="0" methods="2" coveredmethods="0"/>
        <line num="2" count="3" type="stmt"/>
        <line num="6" count="3" type="stmt"/>
        <line num="8" count="3" type="stmt"/>
        <line num="10" count="0" type="stmt"/>
        <line num="14" count="0" type="stmt"/>
        <line num="18" count="3" type="stmt"/>
        <line num="20" count="0" type="stmt"/>
        <line num="24" count="0" type="stmt"/>
      </file>
      <file name="song.controller.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\controllers\song.controller.ts">
        <metrics statements="17" coveredstatements="7" conditionals="0" coveredconditionals="0" methods="5" coveredmethods="0"/>
        <line num="2" count="3" type="stmt"/>
        <line num="9" count="3" type="stmt"/>
        <line num="11" count="3" type="stmt"/>
        <line num="13" count="0" type="stmt"/>
        <line num="19" count="0" type="stmt"/>
        <line num="23" count="3" type="stmt"/>
        <line num="25" count="0" type="stmt"/>
        <line num="26" count="0" type="stmt"/>
        <line num="30" count="3" type="stmt"/>
        <line num="32" count="0" type="stmt"/>
        <line num="33" count="0" type="stmt"/>
        <line num="37" count="3" type="stmt"/>
        <line num="39" count="0" type="stmt"/>
        <line num="40" count="0" type="stmt"/>
        <line num="44" count="3" type="stmt"/>
        <line num="46" count="0" type="stmt"/>
        <line num="47" count="0" type="stmt"/>
      </file>
      <file name="user.controller.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\controllers\user.controller.ts">
        <metrics statements="38" coveredstatements="22" conditionals="6" coveredconditionals="0" methods="6" coveredmethods="3"/>
        <line num="2" count="3" type="stmt"/>
        <line num="9" count="3" type="stmt"/>
        <line num="11" count="3" type="stmt"/>
        <line num="12" count="3" type="stmt"/>
        <line num="13" count="3" type="stmt"/>
        <line num="18" count="3" type="stmt"/>
        <line num="20" count="3" type="stmt"/>
        <line num="22" count="3" type="stmt"/>
        <line num="23" count="3" type="stmt"/>
        <line num="24" count="3" type="stmt"/>
        <line num="26" count="0" type="stmt"/>
        <line num="27" count="0" type="stmt"/>
        <line num="28" count="0" type="cond" truecount="0" falsecount="2"/>
        <line num="33" count="3" type="stmt"/>
        <line num="35" count="5" type="stmt"/>
        <line num="39" count="3" type="stmt"/>
        <line num="43" count="3" type="stmt"/>
        <line num="45" count="0" type="stmt"/>
        <line num="46" count="0" type="stmt"/>
        <line num="50" count="3" type="stmt"/>
        <line num="52" count="1" type="stmt"/>
        <line num="54" count="1" type="cond" truecount="0" falsecount="1"/>
        <line num="55" count="0" type="stmt"/>
        <line num="60" count="1" type="stmt"/>
        <line num="61" count="1" type="stmt"/>
        <line num="62" count="1" type="stmt"/>
        <line num="64" count="0" type="cond" truecount="0" falsecount="2"/>
        <line num="65" count="0" type="stmt"/>
        <line num="67" count="0" type="stmt"/>
        <line num="73" count="3" type="stmt"/>
        <line num="75" count="0" type="stmt"/>
        <line num="78" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="79" count="0" type="stmt"/>
        <line num="82" count="0" type="stmt"/>
        <line num="93" count="0" type="stmt"/>
        <line num="97" count="3" type="stmt"/>
        <line num="99" count="0" type="stmt"/>
        <line num="100" count="0" type="stmt"/>
      </file>
    </package>
    <package name="src.db">
      <metrics statements="3" coveredstatements="3" conditionals="0" coveredconditionals="0" methods="0" coveredmethods="0"/>
      <file name="prisma.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\db\prisma.ts">
        <metrics statements="3" coveredstatements="3" conditionals="0" coveredconditionals="0" methods="0" coveredmethods="0"/>
        <line num="1" count="3" type="stmt"/>
        <line num="2" count="3" type="stmt"/>
        <line num="3" count="3" type="stmt"/>
      </file>
    </package>
    <package name="src.errors">
      <metrics statements="21" coveredstatements="8" conditionals="5" coveredconditionals="0" methods="5" coveredmethods="1"/>
      <file name="customErrors.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\errors\customErrors.ts">
        <metrics statements="21" coveredstatements="8" conditionals="5" coveredconditionals="0" methods="5" coveredmethods="1"/>
        <line num="1" count="3" type="stmt"/>
        <line num="2" count="2" type="stmt"/>
        <line num="4" count="2" type="stmt"/>
        <line num="5" count="2" type="stmt"/>
        <line num="9" count="3" type="stmt"/>
        <line num="10" count="0" type="stmt"/>
        <line num="12" count="0" type="stmt"/>
        <line num="13" count="0" type="stmt"/>
        <line num="17" count="3" type="stmt"/>
        <line num="18" count="0" type="stmt"/>
        <line num="20" count="0" type="stmt"/>
        <line num="21" count="0" type="stmt"/>
        <line num="25" count="3" type="stmt"/>
        <line num="26" count="0" type="stmt"/>
        <line num="28" count="0" type="stmt"/>
        <line num="29" count="0" type="stmt"/>
        <line num="33" count="3" type="stmt"/>
        <line num="34" count="0" type="stmt"/>
        <line num="37" count="0" type="stmt"/>
        <line num="38" count="0" type="stmt"/>
        <line num="39" count="0" type="stmt"/>
      </file>
    </package>
    <package name="src.middleware">
      <metrics statements="47" coveredstatements="38" conditionals="14" coveredconditionals="4" methods="7" coveredmethods="6"/>
      <file name="asyncRouteHandler.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\middleware\asyncRouteHandler.ts">
        <metrics statements="4" coveredstatements="4" conditionals="0" coveredconditionals="0" methods="2" coveredmethods="2"/>
        <line num="4" count="3" type="stmt"/>
        <line num="7" count="75" type="stmt"/>
        <line num="8" count="13" type="stmt"/>
        <line num="12" count="3" type="stmt"/>
      </file>
      <file name="auth.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\middleware\auth.ts">
        <metrics statements="13" coveredstatements="13" conditionals="2" coveredconditionals="0" methods="1" coveredmethods="1"/>
        <line num="2" count="3" type="stmt"/>
        <line num="3" count="3" type="stmt"/>
        <line num="4" count="3" type="stmt"/>
        <line num="6" count="3" type="stmt"/>
        <line num="11" count="4" type="stmt"/>
        <line num="13" count="4" type="cond" truecount="0" falsecount="1"/>
        <line num="15" count="4" type="stmt"/>
        <line num="16" count="4" type="stmt"/>
        <line num="17" count="3" type="stmt"/>
        <line num="21" count="3" type="cond" truecount="0" falsecount="1"/>
        <line num="22" count="3" type="stmt"/>
        <line num="23" count="3" type="stmt"/>
        <line num="25" count="1" type="stmt"/>
      </file>
      <file name="errorHandler.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\middleware\errorHandler.ts">
        <metrics statements="18" coveredstatements="13" conditionals="10" coveredconditionals="4" methods="1" coveredmethods="1"/>
        <line num="1" count="3" type="stmt"/>
        <line num="2" count="3" type="stmt"/>
        <line num="4" count="3" type="stmt"/>
        <line num="9" count="3" type="stmt"/>
        <line num="15" count="3" type="cond" truecount="0" falsecount="1"/>
        <line num="16" count="0" type="stmt"/>
        <line num="22" count="3" type="cond" truecount="1" falsecount="0"/>
        <line num="23" count="2" type="stmt"/>
        <line num="27" count="1" type="cond" truecount="2" falsecount="1"/>
        <line num="28" count="0" type="stmt"/>
        <line num="32" count="1" type="cond" truecount="0" falsecount="1"/>
        <line num="33" count="0" type="stmt"/>
        <line num="37" count="1" type="cond" truecount="0" falsecount="1"/>
        <line num="38" count="0" type="stmt"/>
        <line num="43" count="1" type="stmt"/>
        <line num="45" count="1" type="cond" truecount="1" falsecount="0"/>
        <line num="46" count="1" type="stmt"/>
        <line num="53" count="0" type="stmt"/>
      </file>
      <file name="validate.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\middleware\validate.ts">
        <metrics statements="12" coveredstatements="8" conditionals="2" coveredconditionals="0" methods="3" coveredmethods="2"/>
        <line num="2" count="3" type="stmt"/>
        <line num="3" count="3" type="stmt"/>
        <line num="5" count="3" type="stmt"/>
        <line num="6" count="3" type="stmt"/>
        <line num="7" count="30" type="stmt"/>
        <line num="8" count="11" type="stmt"/>
        <line num="9" count="11" type="stmt"/>
        <line num="14" count="11" type="stmt"/>
        <line num="16" count="0" type="cond" truecount="0" falsecount="2"/>
        <line num="17" count="0" type="stmt"/>
        <line num="20" count="0" type="stmt"/>
        <line num="27" count="0" type="stmt"/>
      </file>
    </package>
    <package name="src.routes">
      <metrics statements="57" coveredstatements="57" conditionals="0" coveredconditionals="0" methods="0" coveredmethods="0"/>
      <file name="albums.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\routes\albums.ts">
        <metrics statements="12" coveredstatements="12" conditionals="0" coveredconditionals="0" methods="0" coveredmethods="0"/>
        <line num="1" count="3" type="stmt"/>
        <line num="2" count="3" type="stmt"/>
        <line num="9" count="3" type="stmt"/>
        <line num="10" count="3" type="stmt"/>
        <line num="11" count="3" type="stmt"/>
        <line num="16" count="3" type="stmt"/>
        <line num="18" count="3" type="stmt"/>
        <line num="25" count="3" type="stmt"/>
        <line num="27" count="3" type="stmt"/>
        <line num="29" count="3" type="stmt"/>
        <line num="36" count="3" type="stmt"/>
        <line num="38" count="3" type="stmt"/>
      </file>
      <file name="groups.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\routes\groups.ts">
        <metrics statements="13" coveredstatements="13" conditionals="0" coveredconditionals="0" methods="0" coveredmethods="0"/>
        <line num="1" count="3" type="stmt"/>
        <line num="2" count="3" type="stmt"/>
        <line num="10" count="3" type="stmt"/>
        <line num="11" count="3" type="stmt"/>
        <line num="12" count="3" type="stmt"/>
        <line num="14" count="3" type="stmt"/>
        <line num="16" count="3" type="stmt"/>
        <line num="17" count="3" type="stmt"/>
        <line num="18" count="3" type="stmt"/>
        <line num="19" count="3" type="stmt"/>
        <line num="25" count="3" type="stmt"/>
        <line num="26" count="3" type="stmt"/>
        <line num="28" count="3" type="stmt"/>
      </file>
      <file name="reviews.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\routes\reviews.ts">
        <metrics statements="7" coveredstatements="7" conditionals="0" coveredconditionals="0" methods="0" coveredmethods="0"/>
        <line num="1" count="3" type="stmt"/>
        <line num="2" count="3" type="stmt"/>
        <line num="6" count="3" type="stmt"/>
        <line num="8" count="3" type="stmt"/>
        <line num="10" count="3" type="stmt"/>
        <line num="11" count="3" type="stmt"/>
        <line num="13" count="3" type="stmt"/>
      </file>
      <file name="songs.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\routes\songs.ts">
        <metrics statements="12" coveredstatements="12" conditionals="0" coveredconditionals="0" methods="0" coveredmethods="0"/>
        <line num="1" count="3" type="stmt"/>
        <line num="2" count="3" type="stmt"/>
        <line num="9" count="3" type="stmt"/>
        <line num="10" count="3" type="stmt"/>
        <line num="11" count="3" type="stmt"/>
        <line num="13" count="3" type="stmt"/>
        <line num="15" count="3" type="stmt"/>
        <line num="16" count="3" type="stmt"/>
        <line num="17" count="3" type="stmt"/>
        <line num="18" count="3" type="stmt"/>
        <line num="24" count="3" type="stmt"/>
        <line num="26" count="3" type="stmt"/>
      </file>
      <file name="users.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\routes\users.ts">
        <metrics statements="13" coveredstatements="13" conditionals="0" coveredconditionals="0" methods="0" coveredmethods="0"/>
        <line num="1" count="3" type="stmt"/>
        <line num="2" count="3" type="stmt"/>
        <line num="10" count="3" type="stmt"/>
        <line num="11" count="3" type="stmt"/>
        <line num="17" count="3" type="stmt"/>
        <line num="19" count="3" type="stmt"/>
        <line num="21" count="3" type="stmt"/>
        <line num="22" count="3" type="stmt"/>
        <line num="23" count="3" type="stmt"/>
        <line num="24" count="3" type="stmt"/>
        <line num="25" count="3" type="stmt"/>
        <line num="32" count="3" type="stmt"/>
        <line num="34" count="3" type="stmt"/>
      </file>
    </package>
    <package name="src.services">
      <metrics statements="166" coveredstatements="77" conditionals="89" coveredconditionals="8" methods="32" coveredmethods="7"/>
      <file name="album.service.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\services\album.service.ts">
        <metrics statements="24" coveredstatements="16" conditionals="16" coveredconditionals="3" methods="8" coveredmethods="4"/>
        <line num="2" count="3" type="stmt"/>
        <line num="10" count="3" type="stmt"/>
        <line num="11" count="1" type="stmt"/>
        <line num="43" count="3" type="stmt"/>
        <line num="49" count="1" type="stmt"/>
        <line num="55" count="1" type="stmt"/>
        <line num="62" count="1" type="stmt"/>
        <line num="70" count="1" type="stmt"/>
        <line num="71" count="1" type="cond" truecount="0" falsecount="1"/>
        <line num="72" count="0" type="stmt"/>
        <line num="79" count="1" type="stmt"/>
        <line num="80" count="0" type="stmt"/>
        <line num="81" count="0" type="stmt"/>
        <line num="83" count="0" type="stmt"/>
        <line num="95" count="3" type="stmt"/>
        <line num="100" count="0" type="cond" truecount="0" falsecount="2"/>
        <line num="104" count="0" type="stmt"/>
        <line num="121" count="0" type="stmt"/>
        <line num="131" count="3" type="stmt"/>
        <line num="135" count="1" type="cond" truecount="1" falsecount="2"/>
        <line num="136" count="0" type="stmt"/>
        <line num="139" count="1" type="stmt"/>
        <line num="145" count="3" type="stmt"/>
        <line num="146" count="1" type="stmt"/>
      </file>
      <file name="email.service.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\services\email.service.ts">
        <metrics statements="5" coveredstatements="3" conditionals="0" coveredconditionals="0" methods="1" coveredmethods="0"/>
        <line num="1" count="3" type="stmt"/>
        <line num="3" count="3" type="stmt"/>
        <line num="11" count="3" type="stmt"/>
        <line num="16" count="0" type="stmt"/>
        <line num="18" count="0" type="stmt"/>
      </file>
      <file name="group.service.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\services\group.service.ts">
        <metrics statements="39" coveredstatements="11" conditionals="18" coveredconditionals="0" methods="7" coveredmethods="0"/>
        <line num="1" count="3" type="stmt"/>
        <line num="2" count="3" type="stmt"/>
        <line num="7" count="3" type="stmt"/>
        <line num="8" count="3" type="stmt"/>
        <line num="23" count="3" type="stmt"/>
        <line num="24" count="0" type="cond" truecount="0" falsecount="3"/>
        <line num="25" count="0" type="stmt"/>
        <line num="28" count="0" type="stmt"/>
        <line num="53" count="3" type="stmt"/>
        <line num="54" count="0" type="stmt"/>
        <line num="63" count="0" type="cond" truecount="0" falsecount="3"/>
        <line num="64" count="0" type="stmt"/>
        <line num="67" count="0" type="stmt"/>
        <line num="72" count="3" type="stmt"/>
        <line num="77" count="0" type="stmt"/>
        <line num="86" count="0" type="cond" truecount="0" falsecount="3"/>
        <line num="87" count="0" type="stmt"/>
        <line num="90" count="0" type="stmt"/>
        <line num="99" count="3" type="stmt"/>
        <line num="104" count="0" type="stmt"/>
        <line num="114" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="115" count="0" type="cond" truecount="0" falsecount="3"/>
        <line num="116" count="0" type="stmt"/>
        <line num="118" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="119" count="0" type="stmt"/>
        <line num="122" count="0" type="stmt"/>
        <line num="123" count="0" type="stmt"/>
        <line num="126" count="3" type="stmt"/>
        <line num="127" count="0" type="stmt"/>
        <line num="131" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="133" count="0" type="stmt"/>
        <line num="142" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="143" count="0" type="stmt"/>
        <line num="146" count="0" type="stmt"/>
        <line num="158" count="3" type="stmt"/>
        <line num="159" count="0" type="stmt"/>
        <line num="175" count="3" type="stmt"/>
        <line num="180" count="0" type="stmt"/>
        <line num="190" count="0" type="stmt"/>
      </file>
      <file name="review.service.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\services\review.service.ts">
        <metrics statements="24" coveredstatements="7" conditionals="27" coveredconditionals="0" methods="5" coveredmethods="0"/>
        <line num="2" count="3" type="stmt"/>
        <line num="3" count="3" type="stmt"/>
        <line num="33" count="3" type="stmt"/>
        <line num="41" count="0" type="cond" truecount="0" falsecount="3"/>
        <line num="42" count="0" type="stmt"/>
        <line num="48" count="0" type="stmt"/>
        <line num="51" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="54" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="55" count="0" type="stmt"/>
        <line num="63" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="67" count="0" type="stmt"/>
        <line num="78" count="3" type="stmt"/>
        <line num="79" count="0" type="stmt"/>
        <line num="81" count="0" type="stmt"/>
        <line num="83" count="0" type="stmt"/>
        <line num="98" count="0" type="stmt"/>
        <line num="109" count="3" type="stmt"/>
        <line num="110" count="0" type="stmt"/>
        <line num="123" count="3" type="stmt"/>
        <line num="124" count="0" type="stmt"/>
        <line num="150" count="3" type="stmt"/>
        <line num="151" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="152" count="0" type="stmt"/>
        <line num="153" count="0" type="cond" truecount="0" falsecount="2"/>
      </file>
      <file name="song.service.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\services\song.service.ts">
        <metrics statements="20" coveredstatements="7" conditionals="13" coveredconditionals="0" methods="5" coveredmethods="0"/>
        <line num="2" count="3" type="stmt"/>
        <line num="3" count="3" type="stmt"/>
        <line num="5" count="3" type="stmt"/>
        <line num="11" count="0" type="stmt"/>
        <line num="18" count="0" type="stmt"/>
        <line num="26" count="0" type="stmt"/>
        <line num="36" count="3" type="stmt"/>
        <line num="37" count="0" type="stmt"/>
        <line num="51" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="52" count="0" type="stmt"/>
        <line num="55" count="3" type="stmt"/>
        <line num="56" count="0" type="cond" truecount="0" falsecount="3"/>
        <line num="57" count="0" type="stmt"/>
        <line num="62" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="63" count="0" type="stmt"/>
        <line num="66" count="0" type="stmt"/>
        <line num="72" count="3" type="stmt"/>
        <line num="76" count="0" type="stmt"/>
        <line num="83" count="3" type="stmt"/>
        <line num="84" count="0" type="stmt"/>
      </file>
      <file name="user.service.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\services\user.service.ts">
        <metrics statements="54" coveredstatements="33" conditionals="15" coveredconditionals="5" methods="6" coveredmethods="3"/>
        <line num="1" count="3" type="stmt"/>
        <line num="2" count="3" type="stmt"/>
        <line num="3" count="3" type="stmt"/>
        <line num="4" count="3" type="stmt"/>
        <line num="5" count="3" type="stmt"/>
        <line num="11" count="3" type="stmt"/>
        <line num="13" count="3" type="stmt"/>
        <line num="18" count="3" type="cond" truecount="0" falsecount="1"/>
        <line num="19" count="0" type="stmt"/>
        <line num="24" count="3" type="stmt"/>
        <line num="26" count="3" type="stmt"/>
        <line num="27" count="3" type="stmt"/>
        <line num="41" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="42" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="43" count="0" type="stmt"/>
        <line num="44" count="0" type="stmt"/>
        <line num="49" count="0" type="stmt"/>
        <line num="53" count="3" type="stmt"/>
        <line num="54" count="5" type="stmt"/>
        <line num="65" count="5" type="cond" truecount="3" falsecount="0"/>
        <line num="66" count="1" type="stmt"/>
        <line num="69" count="4" type="cond" truecount="0" falsecount="1"/>
        <line num="70" count="0" type="stmt"/>
        <line num="73" count="4" type="stmt"/>
        <line num="76" count="4" type="stmt"/>
        <line num="80" count="4" type="stmt"/>
        <line num="84" count="3" type="stmt"/>
        <line num="96" count="3" type="stmt"/>
        <line num="97" count="0" type="stmt"/>
        <line num="118" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="119" count="0" type="stmt"/>
        <line num="122" count="3" type="stmt"/>
        <line num="131" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="132" count="0" type="stmt"/>
        <line num="135" count="0" type="stmt"/>
        <line num="147" count="3" type="stmt"/>
        <line num="148" count="1" type="cond" truecount="0" falsecount="1"/>
        <line num="149" count="0" type="stmt"/>
        <line num="152" count="1" type="stmt"/>
        <line num="153" count="1" type="stmt"/>
        <line num="157" count="1" type="stmt"/>
        <line num="162" count="1" type="cond" truecount="2" falsecount="1"/>
        <line num="163" count="0" type="stmt"/>
        <line num="167" count="1" type="stmt"/>
        <line num="171" count="1" type="stmt"/>
        <line num="176" count="1" type="stmt"/>
        <line num="181" count="1" type="stmt"/>
        <line num="186" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="187" count="0" type="stmt"/>
        <line num="189" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="190" count="0" type="stmt"/>
        <line num="192" count="0" type="stmt"/>
        <line num="195" count="3" type="stmt"/>
        <line num="196" count="0" type="stmt"/>
      </file>
    </package>
    <package name="src.validators">
      <metrics statements="16" coveredstatements="15" conditionals="0" coveredconditionals="0" methods="2" coveredmethods="1"/>
      <file name="album.validator.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\validators\album.validator.ts">
        <metrics statements="5" coveredstatements="5" conditionals="0" coveredconditionals="0" methods="1" coveredmethods="1"/>
        <line num="1" count="3" type="stmt"/>
        <line num="3" count="3" type="stmt"/>
        <line num="14" count="1" type="stmt"/>
        <line num="21" count="3" type="stmt"/>
        <line num="25" count="3" type="stmt"/>
      </file>
      <file name="group.validator.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\validators\group.validator.ts">
        <metrics statements="2" coveredstatements="2" conditionals="0" coveredconditionals="0" methods="0" coveredmethods="0"/>
        <line num="1" count="3" type="stmt"/>
        <line num="3" count="3" type="stmt"/>
      </file>
      <file name="song.validator.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\validators\song.validator.ts">
        <metrics statements="2" coveredstatements="2" conditionals="0" coveredconditionals="0" methods="0" coveredmethods="0"/>
        <line num="1" count="3" type="stmt"/>
        <line num="3" count="3" type="stmt"/>
      </file>
      <file name="user.validator.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\src\validators\user.validator.ts">
        <metrics statements="7" coveredstatements="6" conditionals="0" coveredconditionals="0" methods="1" coveredmethods="0"/>
        <line num="1" count="3" type="stmt"/>
        <line num="4" count="3" type="stmt"/>
        <line num="7" count="3" type="stmt"/>
        <line num="15" count="3" type="stmt"/>
        <line num="22" count="3" type="stmt"/>
        <line num="29" count="3" type="stmt"/>
        <line num="42" count="0" type="stmt"/>
      </file>
    </package>
    <package name="tests.helpers">
      <metrics statements="37" coveredstatements="26" conditionals="4" coveredconditionals="1" methods="6" coveredmethods="3"/>
      <file name="auth.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\tests\helpers\auth.ts">
        <metrics statements="11" coveredstatements="11" conditionals="1" coveredconditionals="1" methods="1" coveredmethods="1"/>
        <line num="1" count="2" type="stmt"/>
        <line num="2" count="2" type="stmt"/>
        <line num="3" count="2" type="stmt"/>
        <line num="4" count="2" type="stmt"/>
        <line num="6" count="2" type="stmt"/>
        <line num="7" count="2" type="stmt"/>
        <line num="9" count="2" type="stmt"/>
        <line num="19" count="2" type="stmt"/>
        <line num="24" count="2" type="cond" truecount="1" falsecount="0"/>
        <line num="25" count="1" type="stmt"/>
        <line num="28" count="1" type="stmt"/>
      </file>
      <file name="db.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\tests\helpers\db.ts">
        <metrics statements="7" coveredstatements="4" conditionals="0" coveredconditionals="0" methods="2" coveredmethods="0"/>
        <line num="1" count="3" type="stmt"/>
        <line num="3" count="3" type="stmt"/>
        <line num="5" count="3" type="stmt"/>
        <line num="6" count="0" type="stmt"/>
        <line num="7" count="0" type="stmt"/>
        <line num="10" count="3" type="stmt"/>
        <line num="11" count="0" type="stmt"/>
      </file>
      <file name="testHelpers.ts" path="C:\Users\Jack\Desktop\apps\rhcp-reviews\backend\tests\helpers\testHelpers.ts">
        <metrics statements="19" coveredstatements="11" conditionals="3" coveredconditionals="0" methods="3" coveredmethods="2"/>
        <line num="1" count="2" type="stmt"/>
        <line num="2" count="2" type="stmt"/>
        <line num="3" count="2" type="stmt"/>
        <line num="4" count="2" type="stmt"/>
        <line num="6" count="2" type="stmt"/>
        <line num="8" count="2" type="stmt"/>
        <line num="11" count="2" type="stmt"/>
        <line num="22" count="2" type="stmt"/>
        <line num="34" count="2" type="stmt"/>
        <line num="46" count="2" type="stmt"/>
        <line num="50" count="2" type="stmt"/>
        <line num="65" count="0" type="stmt"/>
        <line num="67" count="0" type="stmt"/>
        <line num="80" count="0" type="stmt"/>
        <line num="85" count="0" type="cond" truecount="0" falsecount="1"/>
        <line num="86" count="0" type="stmt"/>
        <line num="89" count="0" type="stmt"/>
        <line num="94" count="0" type="stmt"/>
        <line num="95" count="0" type="stmt"/>
      </file>
    </package>
  </project>
</coverage>

```

# coverage\coverage-final.json

```json
{"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\server.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\server.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":67}},"1":{"start":{"line":2,"column":0},"end":{"line":2,"column":24}},"2":{"start":{"line":3,"column":0},"end":{"line":3,"column":28}},"3":{"start":{"line":4,"column":0},"end":{"line":4,"column":24}},"4":{"start":{"line":5,"column":0},"end":{"line":5,"column":58}},"5":{"start":{"line":6,"column":0},"end":{"line":6,"column":43}},"6":{"start":{"line":7,"column":0},"end":{"line":7,"column":28}},"7":{"start":{"line":9,"column":0},"end":{"line":9,"column":46}},"8":{"start":{"line":10,"column":0},"end":{"line":10,"column":44}},"9":{"start":{"line":11,"column":0},"end":{"line":11,"column":44}},"10":{"start":{"line":12,"column":0},"end":{"line":12,"column":46}},"11":{"start":{"line":13,"column":0},"end":{"line":13,"column":47}},"12":{"start":{"line":16,"column":0},"end":{"line":16,"column":60}},"13":{"start":{"line":17,"column":0},"end":{"line":17,"column":52}},"14":{"start":{"line":18,"column":0},"end":{"line":18,"column":66}},"15":{"start":{"line":19,"column":0},"end":{"line":19,"column":44}},"16":{"start":{"line":20,"column":0},"end":{"line":20,"column":28}},"17":{"start":{"line":23,"column":18},"end":{"line":23,"column":31}},"18":{"start":{"line":24,"column":0},"end":{"line":24,"column":16}},"19":{"start":{"line":27,"column":13},"end":{"line":27,"column":29}},"20":{"start":{"line":28,"column":13},"end":{"line":28,"column":40}},"21":{"start":{"line":31,"column":27},"end":{"line":40,"column":1}},"22":{"start":{"line":32,"column":2},"end":{"line":39,"column":5}},"23":{"start":{"line":33,"column":21},"end":{"line":38,"column":6}},"24":{"start":{"line":35,"column":6},"end":{"line":35,"column":52}},"25":{"start":{"line":36,"column":6},"end":{"line":36,"column":58}},"26":{"start":{"line":37,"column":6},"end":{"line":37,"column":24}},"27":{"start":{"line":31,"column":13},"end":{"line":31,"column":27}},"28":{"start":{"line":42,"column":26},"end":{"line":46,"column":1}},"29":{"start":{"line":43,"column":2},"end":{"line":45,"column":5}},"30":{"start":{"line":44,"column":4},"end":{"line":44,"column":38}},"31":{"start":{"line":44,"column":23},"end":{"line":44,"column":36}},"32":{"start":{"line":42,"column":13},"end":{"line":42,"column":26}},"33":{"start":{"line":49,"column":0},"end":{"line":49,"column":16}},"34":{"start":{"line":50,"column":0},"end":{"line":50,"column":24}},"35":{"start":{"line":51,"column":0},"end":{"line":51,"column":32}},"36":{"start":{"line":54,"column":19},"end":{"line":59,"column":2}},"37":{"start":{"line":60,"column":0},"end":{"line":60,"column":29}},"38":{"start":{"line":63,"column":0},"end":{"line":73,"column":2}},"39":{"start":{"line":67,"column":4},"end":{"line":71,"column":5}},"40":{"start":{"line":68,"column":6},"end":{"line":68,"column":46}},"41":{"start":{"line":70,"column":6},"end":{"line":70,"column":13}},"42":{"start":{"line":75,"column":15},"end":{"line":75,"column":43}},"43":{"start":{"line":76,"column":0},"end":{"line":84,"column":2}},"44":{"start":{"line":82,"column":4},"end":{"line":82,"column":55}},"45":{"start":{"line":86,"column":20},"end":{"line":90,"column":2}},"46":{"start":{"line":91,"column":0},"end":{"line":91,"column":40}},"47":{"start":{"line":94,"column":0},"end":{"line":94,"column":18}},"48":{"start":{"line":95,"column":0},"end":{"line":101,"column":2}},"49":{"start":{"line":102,"column":0},"end":{"line":106,"column":3}},"50":{"start":{"line":103,"column":2},"end":{"line":103,"column":53}},"51":{"start":{"line":104,"column":2},"end":{"line":104,"column":43}},"52":{"start":{"line":105,"column":2},"end":{"line":105,"column":9}},"53":{"start":{"line":109,"column":0},"end":{"line":109,"column":37}},"54":{"start":{"line":110,"column":0},"end":{"line":110,"column":35}},"55":{"start":{"line":111,"column":0},"end":{"line":111,"column":34}},"56":{"start":{"line":112,"column":0},"end":{"line":112,"column":51}},"57":{"start":{"line":113,"column":0},"end":{"line":113,"column":52}},"58":{"start":{"line":116,"column":0},"end":{"line":118,"column":3}},"59":{"start":{"line":117,"column":2},"end":{"line":117,"column":36}}},"fnMap":{"0":{"name":"(anonymous_1)","decl":{"start":{"line":31,"column":27},"end":{"line":31,"column":30}},"loc":{"start":{"line":31,"column":32},"end":{"line":40,"column":1}}},"1":{"name":"(anonymous_2)","decl":{"start":{"line":32,"column":29},"end":{"line":32,"column":30}},"loc":{"start":{"line":32,"column":41},"end":{"line":39,"column":3}}},"2":{"name":"(anonymous_3)","decl":{"start":{"line":33,"column":38},"end":{"line":33,"column":41}},"loc":{"start":{"line":33,"column":43},"end":{"line":38,"column":5}}},"3":{"name":"(anonymous_4)","decl":{"start":{"line":42,"column":26},"end":{"line":42,"column":29}},"loc":{"start":{"line":42,"column":31},"end":{"line":46,"column":1}}},"4":{"name":"(anonymous_5)","decl":{"start":{"line":43,"column":21},"end":{"line":43,"column":22}},"loc":{"start":{"line":43,"column":33},"end":{"line":45,"column":3}}},"5":{"name":"(anonymous_6)","decl":{"start":{"line":44,"column":17},"end":{"line":44,"column":20}},"loc":{"start":{"line":44,"column":23},"end":{"line":44,"column":36}}},"6":{"name":"(anonymous_7)","decl":{"start":{"line":66,"column":2},"end":{"line":66,"column":3}},"loc":{"start":{"line":66,"column":64},"end":{"line":72,"column":3}}},"7":{"name":"(anonymous_8)","decl":{"start":{"line":80,"column":20},"end":{"line":80,"column":25}},"loc":{"start":{"line":80,"column":39},"end":{"line":83,"column":3}}},"8":{"name":"(anonymous_9)","decl":{"start":{"line":102,"column":8},"end":{"line":102,"column":9}},"loc":{"start":{"line":102,"column":27},"end":{"line":106,"column":1}}},"9":{"name":"(anonymous_10)","decl":{"start":{"line":116,"column":8},"end":{"line":116,"column":9}},"loc":{"start":{"line":116,"column":72},"end":{"line":118,"column":1}}}},"branchMap":{"0":{"loc":{"start":{"line":67,"column":4},"end":{"line":71,"column":5}},"type":"if","locations":[{"start":{"line":67,"column":4},"end":{"line":71,"column":5}},{"start":{"line":69,"column":11},"end":{"line":71,"column":5}}]}},"s":{"0":3,"1":3,"2":3,"3":3,"4":3,"5":3,"6":3,"7":3,"8":3,"9":3,"10":3,"11":3,"12":3,"13":3,"14":3,"15":3,"16":3,"17":3,"18":3,"19":3,"20":3,"21":3,"22":0,"23":0,"24":0,"25":0,"26":0,"27":3,"28":3,"29":0,"30":0,"31":0,"32":3,"33":3,"34":3,"35":3,"36":3,"37":3,"38":3,"39":0,"40":0,"41":0,"42":3,"43":3,"44":0,"45":3,"46":3,"47":3,"48":3,"49":3,"50":14,"51":14,"52":14,"53":3,"54":3,"55":3,"56":3,"57":3,"58":3,"59":3},"f":{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":14,"9":3},"b":{"0":[0,0]}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\controllers\\album.controller.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\controllers\\album.controller.ts","statementMap":{"0":{"start":{"line":2,"column":0},"end":{"line":2,"column":null}},"1":{"start":{"line":9,"column":0},"end":{"line":9,"column":62}},"2":{"start":{"line":10,"column":0},"end":{"line":10,"column":37}},"3":{"start":{"line":12,"column":13},"end":{"line":22,"column":2}},"4":{"start":{"line":14,"column":4},"end":{"line":20,"column":5}},"5":{"start":{"line":15,"column":20},"end":{"line":15,"column":54}},"6":{"start":{"line":16,"column":6},"end":{"line":16,"column":34}},"7":{"start":{"line":18,"column":6},"end":{"line":18,"column":52}},"8":{"start":{"line":19,"column":6},"end":{"line":19,"column":63}},"9":{"start":{"line":24,"column":13},"end":{"line":33,"column":2}},"10":{"start":{"line":26,"column":19},"end":{"line":30,"column":6}},"11":{"start":{"line":31,"column":4},"end":{"line":31,"column":21}},"12":{"start":{"line":35,"column":13},"end":{"line":40,"column":2}},"13":{"start":{"line":37,"column":18},"end":{"line":37,"column":75}},"14":{"start":{"line":38,"column":4},"end":{"line":38,"column":20}},"15":{"start":{"line":42,"column":13},"end":{"line":47,"column":2}},"16":{"start":{"line":44,"column":4},"end":{"line":44,"column":52}},"17":{"start":{"line":45,"column":4},"end":{"line":45,"column":24}},"18":{"start":{"line":49,"column":13},"end":{"line":88,"column":2}},"19":{"start":{"line":51,"column":20},"end":{"line":51,"column":46}},"20":{"start":{"line":52,"column":20},"end":{"line":52,"column":77}},"21":{"start":{"line":53,"column":23},"end":{"line":53,"column":54}},"22":{"start":{"line":55,"column":4},"end":{"line":57,"column":5}},"23":{"start":{"line":56,"column":6},"end":{"line":56,"column":72}},"24":{"start":{"line":60,"column":4},"end":{"line":78,"column":5}},"25":{"start":{"line":61,"column":20},"end":{"line":64,"column":8}},"26":{"start":{"line":66,"column":6},"end":{"line":66,"column":76}},"27":{"start":{"line":66,"column":18},"end":{"line":66,"column":76}},"28":{"start":{"line":68,"column":6},"end":{"line":77,"column":7}},"29":{"start":{"line":69,"column":8},"end":{"line":69,"column":79}},"30":{"start":{"line":69,"column":23},"end":{"line":69,"column":79}},"31":{"start":{"line":71,"column":27},"end":{"line":73,"column":10}},"32":{"start":{"line":75,"column":8},"end":{"line":76,"column":71}},"33":{"start":{"line":76,"column":10},"end":{"line":76,"column":71}},"34":{"start":{"line":80,"column":18},"end":{"line":84,"column":6}},"35":{"start":{"line":86,"column":4},"end":{"line":86,"column":20}}},"fnMap":{"0":{"name":"(anonymous_1)","decl":{"start":{"line":13,"column":2},"end":{"line":13,"column":7}},"loc":{"start":{"line":13,"column":40},"end":{"line":21,"column":3}}},"1":{"name":"(anonymous_2)","decl":{"start":{"line":25,"column":2},"end":{"line":25,"column":7}},"loc":{"start":{"line":25,"column":40},"end":{"line":32,"column":3}}},"2":{"name":"(anonymous_3)","decl":{"start":{"line":36,"column":2},"end":{"line":36,"column":7}},"loc":{"start":{"line":36,"column":40},"end":{"line":39,"column":3}}},"3":{"name":"(anonymous_4)","decl":{"start":{"line":43,"column":2},"end":{"line":43,"column":7}},"loc":{"start":{"line":43,"column":40},"end":{"line":46,"column":3}}},"4":{"name":"(anonymous_5)","decl":{"start":{"line":50,"column":2},"end":{"line":50,"column":7}},"loc":{"start":{"line":50,"column":40},"end":{"line":87,"column":3}}}},"branchMap":{"0":{"loc":{"start":{"line":27,"column":12},"end":{"line":27,"column":39}},"type":"binary-expr","locations":[{"start":{"line":27,"column":12},"end":{"line":27,"column":34}},{"start":{"line":27,"column":38},"end":{"line":27,"column":39}}]},"1":{"loc":{"start":{"line":28,"column":13},"end":{"line":28,"column":42}},"type":"binary-expr","locations":[{"start":{"line":28,"column":13},"end":{"line":28,"column":36}},{"start":{"line":28,"column":40},"end":{"line":28,"column":42}}]},"2":{"loc":{"start":{"line":52,"column":20},"end":{"line":52,"column":77}},"type":"cond-expr","locations":[{"start":{"line":52,"column":40},"end":{"line":52,"column":65}},{"start":{"line":52,"column":68},"end":{"line":52,"column":77}}]},"3":{"loc":{"start":{"line":55,"column":4},"end":{"line":57,"column":5}},"type":"if","locations":[{"start":{"line":55,"column":4},"end":{"line":57,"column":5}}]},"4":{"loc":{"start":{"line":55,"column":8},"end":{"line":55,"column":31}},"type":"binary-expr","locations":[{"start":{"line":55,"column":8},"end":{"line":55,"column":18}},{"start":{"line":55,"column":22},"end":{"line":55,"column":31}}]},"5":{"loc":{"start":{"line":60,"column":4},"end":{"line":78,"column":5}},"type":"if","locations":[{"start":{"line":60,"column":4},"end":{"line":78,"column":5}}]},"6":{"loc":{"start":{"line":66,"column":6},"end":{"line":66,"column":76}},"type":"if","locations":[{"start":{"line":66,"column":6},"end":{"line":66,"column":76}}]},"7":{"loc":{"start":{"line":68,"column":6},"end":{"line":77,"column":7}},"type":"if","locations":[{"start":{"line":68,"column":6},"end":{"line":77,"column":7}}]},"8":{"loc":{"start":{"line":69,"column":8},"end":{"line":69,"column":79}},"type":"if","locations":[{"start":{"line":69,"column":8},"end":{"line":69,"column":79}}]},"9":{"loc":{"start":{"line":75,"column":8},"end":{"line":76,"column":71}},"type":"if","locations":[{"start":{"line":75,"column":8},"end":{"line":76,"column":71}}]},"10":{"loc":{"start":{"line":83,"column":14},"end":{"line":83,"column":51}},"type":"cond-expr","locations":[{"start":{"line":83,"column":27},"end":{"line":83,"column":39}},{"start":{"line":83,"column":42},"end":{"line":83,"column":51}}]}},"s":{"0":3,"1":3,"2":3,"3":3,"4":1,"5":1,"6":1,"7":0,"8":0,"9":3,"10":0,"11":0,"12":3,"13":1,"14":1,"15":3,"16":1,"17":1,"18":3,"19":1,"20":1,"21":1,"22":1,"23":0,"24":1,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":0,"33":0,"34":1,"35":1},"f":{"0":1,"1":0,"2":1,"3":1,"4":1},"b":{"0":[0,0],"1":[0,0],"2":[0,1],"3":[0],"4":[1,0],"5":[0],"6":[0],"7":[0],"8":[0],"9":[0],"10":[0,1]}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\controllers\\group.controller.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\controllers\\group.controller.ts","statementMap":{"0":{"start":{"line":2,"column":0},"end":{"line":2,"column":null}},"1":{"start":{"line":10,"column":0},"end":{"line":10,"column":62}},"2":{"start":{"line":12,"column":13},"end":{"line":20,"column":2}},"3":{"start":{"line":14,"column":18},"end":{"line":17,"column":6}},"4":{"start":{"line":18,"column":4},"end":{"line":18,"column":32}},"5":{"start":{"line":22,"column":13},"end":{"line":27,"column":2}},"6":{"start":{"line":24,"column":4},"end":{"line":24,"column":71}},"7":{"start":{"line":25,"column":4},"end":{"line":25,"column":24}},"8":{"start":{"line":29,"column":13},"end":{"line":38,"column":2}},"9":{"start":{"line":31,"column":18},"end":{"line":34,"column":null}},"10":{"start":{"line":36,"column":4},"end":{"line":36,"column":20}},"11":{"start":{"line":40,"column":13},"end":{"line":49,"column":2}},"12":{"start":{"line":42,"column":19},"end":{"line":45,"column":null}},"13":{"start":{"line":47,"column":4},"end":{"line":47,"column":21}},"14":{"start":{"line":51,"column":13},"end":{"line":56,"column":2}},"15":{"start":{"line":53,"column":23},"end":{"line":53,"column":74}},"16":{"start":{"line":54,"column":4},"end":{"line":54,"column":25}},"17":{"start":{"line":58,"column":13},"end":{"line":63,"column":2}},"18":{"start":{"line":60,"column":19},"end":{"line":60,"column":59}},"19":{"start":{"line":61,"column":4},"end":{"line":61,"column":21}}},"fnMap":{"0":{"name":"(anonymous_1)","decl":{"start":{"line":13,"column":2},"end":{"line":13,"column":7}},"loc":{"start":{"line":13,"column":40},"end":{"line":19,"column":3}}},"1":{"name":"(anonymous_2)","decl":{"start":{"line":23,"column":2},"end":{"line":23,"column":7}},"loc":{"start":{"line":23,"column":40},"end":{"line":26,"column":3}}},"2":{"name":"(anonymous_3)","decl":{"start":{"line":30,"column":2},"end":{"line":30,"column":7}},"loc":{"start":{"line":30,"column":40},"end":{"line":37,"column":3}}},"3":{"name":"(anonymous_4)","decl":{"start":{"line":41,"column":2},"end":{"line":41,"column":7}},"loc":{"start":{"line":41,"column":40},"end":{"line":48,"column":3}}},"4":{"name":"(anonymous_5)","decl":{"start":{"line":52,"column":2},"end":{"line":52,"column":7}},"loc":{"start":{"line":52,"column":40},"end":{"line":55,"column":3}}},"5":{"name":"(anonymous_6)","decl":{"start":{"line":59,"column":2},"end":{"line":59,"column":7}},"loc":{"start":{"line":59,"column":40},"end":{"line":62,"column":3}}}},"branchMap":{},"s":{"0":3,"1":3,"2":3,"3":0,"4":0,"5":3,"6":0,"7":0,"8":3,"9":0,"10":0,"11":3,"12":0,"13":0,"14":3,"15":0,"16":0,"17":3,"18":0,"19":0},"f":{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\controllers\\review.controller.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\controllers\\review.controller.ts","statementMap":{"0":{"start":{"line":2,"column":0},"end":{"line":2,"column":null}},"1":{"start":{"line":6,"column":0},"end":{"line":6,"column":62}},"2":{"start":{"line":8,"column":13},"end":{"line":16,"column":2}},"3":{"start":{"line":10,"column":19},"end":{"line":13,"column":6}},"4":{"start":{"line":14,"column":4},"end":{"line":14,"column":33}},"5":{"start":{"line":18,"column":13},"end":{"line":26,"column":2}},"6":{"start":{"line":20,"column":19},"end":{"line":23,"column":6}},"7":{"start":{"line":24,"column":4},"end":{"line":24,"column":21}}},"fnMap":{"0":{"name":"(anonymous_1)","decl":{"start":{"line":9,"column":2},"end":{"line":9,"column":7}},"loc":{"start":{"line":9,"column":40},"end":{"line":15,"column":3}}},"1":{"name":"(anonymous_2)","decl":{"start":{"line":19,"column":2},"end":{"line":19,"column":7}},"loc":{"start":{"line":19,"column":40},"end":{"line":25,"column":3}}}},"branchMap":{},"s":{"0":3,"1":3,"2":3,"3":0,"4":0,"5":3,"6":0,"7":0},"f":{"0":0,"1":0},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\controllers\\song.controller.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\controllers\\song.controller.ts","statementMap":{"0":{"start":{"line":2,"column":0},"end":{"line":2,"column":null}},"1":{"start":{"line":9,"column":0},"end":{"line":9,"column":62}},"2":{"start":{"line":11,"column":13},"end":{"line":21,"column":2}},"3":{"start":{"line":13,"column":19},"end":{"line":18,"column":6}},"4":{"start":{"line":19,"column":4},"end":{"line":19,"column":21}},"5":{"start":{"line":23,"column":13},"end":{"line":28,"column":2}},"6":{"start":{"line":25,"column":17},"end":{"line":25,"column":64}},"7":{"start":{"line":26,"column":4},"end":{"line":26,"column":19}},"8":{"start":{"line":30,"column":13},"end":{"line":35,"column":2}},"9":{"start":{"line":32,"column":17},"end":{"line":32,"column":50}},"10":{"start":{"line":33,"column":4},"end":{"line":33,"column":31}},"11":{"start":{"line":37,"column":13},"end":{"line":42,"column":2}},"12":{"start":{"line":39,"column":17},"end":{"line":39,"column":77}},"13":{"start":{"line":40,"column":4},"end":{"line":40,"column":19}},"14":{"start":{"line":44,"column":13},"end":{"line":49,"column":2}},"15":{"start":{"line":46,"column":4},"end":{"line":46,"column":55}},"16":{"start":{"line":47,"column":4},"end":{"line":47,"column":24}}},"fnMap":{"0":{"name":"(anonymous_1)","decl":{"start":{"line":12,"column":2},"end":{"line":12,"column":7}},"loc":{"start":{"line":12,"column":40},"end":{"line":20,"column":3}}},"1":{"name":"(anonymous_2)","decl":{"start":{"line":24,"column":2},"end":{"line":24,"column":7}},"loc":{"start":{"line":24,"column":40},"end":{"line":27,"column":3}}},"2":{"name":"(anonymous_3)","decl":{"start":{"line":31,"column":2},"end":{"line":31,"column":7}},"loc":{"start":{"line":31,"column":40},"end":{"line":34,"column":3}}},"3":{"name":"(anonymous_4)","decl":{"start":{"line":38,"column":2},"end":{"line":38,"column":7}},"loc":{"start":{"line":38,"column":40},"end":{"line":41,"column":3}}},"4":{"name":"(anonymous_5)","decl":{"start":{"line":45,"column":2},"end":{"line":45,"column":7}},"loc":{"start":{"line":45,"column":40},"end":{"line":48,"column":3}}}},"branchMap":{},"s":{"0":3,"1":3,"2":3,"3":0,"4":0,"5":3,"6":0,"7":0,"8":3,"9":0,"10":0,"11":3,"12":0,"13":0,"14":3,"15":0,"16":0},"f":{"0":0,"1":0,"2":0,"3":0,"4":0},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\controllers\\user.controller.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\controllers\\user.controller.ts","statementMap":{"0":{"start":{"line":2,"column":0},"end":{"line":2,"column":null}},"1":{"start":{"line":9,"column":0},"end":{"line":9,"column":62}},"2":{"start":{"line":11,"column":0},"end":{"line":11,"column":37}},"3":{"start":{"line":12,"column":0},"end":{"line":12,"column":30}},"4":{"start":{"line":13,"column":0},"end":{"line":13,"column":null}},"5":{"start":{"line":18,"column":19},"end":{"line":18,"column":21}},"6":{"start":{"line":20,"column":13},"end":{"line":31,"column":2}},"7":{"start":{"line":22,"column":4},"end":{"line":29,"column":5}},"8":{"start":{"line":23,"column":19},"end":{"line":23,"column":54}},"9":{"start":{"line":24,"column":6},"end":{"line":24,"column":33}},"10":{"start":{"line":26,"column":6},"end":{"line":26,"column":48}},"11":{"start":{"line":27,"column":25},"end":{"line":27,"column":37}},"12":{"start":{"line":28,"column":6},"end":{"line":28,"column":78}},"13":{"start":{"line":33,"column":13},"end":{"line":41,"column":2}},"14":{"start":{"line":35,"column":42},"end":{"line":37,"column":null}},"15":{"start":{"line":39,"column":4},"end":{"line":39,"column":44}},"16":{"start":{"line":43,"column":13},"end":{"line":48,"column":2}},"17":{"start":{"line":45,"column":17},"end":{"line":45,"column":58}},"18":{"start":{"line":46,"column":4},"end":{"line":46,"column":19}},"19":{"start":{"line":50,"column":13},"end":{"line":71,"column":2}},"20":{"start":{"line":52,"column":29},"end":{"line":52,"column":37}},"21":{"start":{"line":54,"column":4},"end":{"line":58,"column":5}},"22":{"start":{"line":55,"column":6},"end":{"line":57,"column":9}},"23":{"start":{"line":60,"column":4},"end":{"line":69,"column":5}},"24":{"start":{"line":61,"column":21},"end":{"line":61,"column":60}},"25":{"start":{"line":62,"column":6},"end":{"line":62,"column":23}},"26":{"start":{"line":64,"column":6},"end":{"line":68,"column":7}},"27":{"start":{"line":65,"column":8},"end":{"line":65,"column":55}},"28":{"start":{"line":67,"column":8},"end":{"line":67,"column":65}},"29":{"start":{"line":73,"column":13},"end":{"line":95,"column":2}},"30":{"start":{"line":75,"column":40},"end":{"line":75,"column":48}},"31":{"start":{"line":78,"column":4},"end":{"line":80,"column":5}},"32":{"start":{"line":79,"column":6},"end":{"line":79,"column":79}},"33":{"start":{"line":82,"column":17},"end":{"line":91,"column":6}},"34":{"start":{"line":93,"column":4},"end":{"line":93,"column":19}},"35":{"start":{"line":97,"column":13},"end":{"line":102,"column":2}},"36":{"start":{"line":99,"column":4},"end":{"line":99,"column":42}},"37":{"start":{"line":100,"column":4},"end":{"line":100,"column":24}}},"fnMap":{"0":{"name":"(anonymous_1)","decl":{"start":{"line":21,"column":2},"end":{"line":21,"column":7}},"loc":{"start":{"line":21,"column":40},"end":{"line":30,"column":3}}},"1":{"name":"(anonymous_2)","decl":{"start":{"line":34,"column":2},"end":{"line":34,"column":7}},"loc":{"start":{"line":34,"column":40},"end":{"line":40,"column":3}}},"2":{"name":"(anonymous_3)","decl":{"start":{"line":44,"column":2},"end":{"line":44,"column":7}},"loc":{"start":{"line":44,"column":40},"end":{"line":47,"column":3}}},"3":{"name":"(anonymous_4)","decl":{"start":{"line":51,"column":2},"end":{"line":51,"column":7}},"loc":{"start":{"line":51,"column":40},"end":{"line":70,"column":3}}},"4":{"name":"(anonymous_5)","decl":{"start":{"line":74,"column":2},"end":{"line":74,"column":7}},"loc":{"start":{"line":74,"column":40},"end":{"line":94,"column":3}}},"5":{"name":"(anonymous_6)","decl":{"start":{"line":98,"column":2},"end":{"line":98,"column":7}},"loc":{"start":{"line":98,"column":40},"end":{"line":101,"column":3}}}},"branchMap":{"0":{"loc":{"start":{"line":28,"column":36},"end":{"line":28,"column":74}},"type":"binary-expr","locations":[{"start":{"line":28,"column":36},"end":{"line":28,"column":53}},{"start":{"line":28,"column":57},"end":{"line":28,"column":74}}]},"1":{"loc":{"start":{"line":54,"column":4},"end":{"line":58,"column":5}},"type":"if","locations":[{"start":{"line":54,"column":4},"end":{"line":58,"column":5}}]},"2":{"loc":{"start":{"line":64,"column":6},"end":{"line":68,"column":7}},"type":"if","locations":[{"start":{"line":64,"column":6},"end":{"line":68,"column":7}},{"start":{"line":66,"column":13},"end":{"line":68,"column":7}}]},"3":{"loc":{"start":{"line":78,"column":4},"end":{"line":80,"column":5}},"type":"if","locations":[{"start":{"line":78,"column":4},"end":{"line":80,"column":5}}]}},"s":{"0":3,"1":3,"2":3,"3":3,"4":3,"5":3,"6":3,"7":3,"8":3,"9":3,"10":0,"11":0,"12":0,"13":3,"14":5,"15":3,"16":3,"17":0,"18":0,"19":3,"20":1,"21":1,"22":0,"23":1,"24":1,"25":1,"26":0,"27":0,"28":0,"29":3,"30":0,"31":0,"32":0,"33":0,"34":0,"35":3,"36":0,"37":0},"f":{"0":3,"1":5,"2":0,"3":1,"4":0,"5":0},"b":{"0":[0,0],"1":[0],"2":[0,0],"3":[0]}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\db\\prisma.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\db\\prisma.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":46}},"1":{"start":{"line":2,"column":15},"end":{"line":2,"column":33}},"2":{"start":{"line":3,"column":0},"end":{"line":3,"column":22}}},"fnMap":{},"branchMap":{},"s":{"0":3,"1":3,"2":3},"f":{},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\errors\\customErrors.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\errors\\customErrors.ts","statementMap":{"0":{"start":{"line":2,"column":15},"end":{"line":2,"column":18}},"1":{"start":{"line":4,"column":4},"end":{"line":4,"column":19}},"2":{"start":{"line":5,"column":4},"end":{"line":5,"column":38}},"3":{"start":{"line":1,"column":0},"end":{"line":1,"column":13}},"4":{"start":{"line":10,"column":15},"end":{"line":10,"column":18}},"5":{"start":{"line":12,"column":4},"end":{"line":12,"column":19}},"6":{"start":{"line":13,"column":4},"end":{"line":13,"column":33}},"7":{"start":{"line":9,"column":0},"end":{"line":9,"column":13}},"8":{"start":{"line":18,"column":15},"end":{"line":18,"column":18}},"9":{"start":{"line":20,"column":4},"end":{"line":20,"column":19}},"10":{"start":{"line":21,"column":4},"end":{"line":21,"column":32}},"11":{"start":{"line":17,"column":0},"end":{"line":17,"column":13}},"12":{"start":{"line":26,"column":15},"end":{"line":26,"column":18}},"13":{"start":{"line":28,"column":4},"end":{"line":28,"column":19}},"14":{"start":{"line":29,"column":4},"end":{"line":29,"column":34}},"15":{"start":{"line":25,"column":0},"end":{"line":25,"column":13}},"16":{"start":{"line":34,"column":15},"end":{"line":34,"column":18}},"17":{"start":{"line":37,"column":4},"end":{"line":37,"column":19}},"18":{"start":{"line":38,"column":4},"end":{"line":38,"column":34}},"19":{"start":{"line":39,"column":4},"end":{"line":39,"column":27}},"20":{"start":{"line":33,"column":0},"end":{"line":33,"column":13}}},"fnMap":{"0":{"name":"(anonymous_0)","decl":{"start":{"line":3,"column":2},"end":{"line":3,"column":14}},"loc":{"start":{"line":3,"column":38},"end":{"line":6,"column":3}}},"1":{"name":"(anonymous_1)","decl":{"start":{"line":11,"column":2},"end":{"line":11,"column":14}},"loc":{"start":{"line":11,"column":35},"end":{"line":14,"column":3}}},"2":{"name":"(anonymous_2)","decl":{"start":{"line":19,"column":2},"end":{"line":19,"column":14}},"loc":{"start":{"line":19,"column":35},"end":{"line":22,"column":3}}},"3":{"name":"(anonymous_3)","decl":{"start":{"line":27,"column":2},"end":{"line":27,"column":14}},"loc":{"start":{"line":27,"column":37},"end":{"line":30,"column":3}}},"4":{"name":"(anonymous_4)","decl":{"start":{"line":36,"column":2},"end":{"line":36,"column":14}},"loc":{"start":{"line":36,"column":56},"end":{"line":40,"column":3}}}},"branchMap":{"0":{"loc":{"start":{"line":3,"column":14},"end":{"line":3,"column":38}},"type":"default-arg","locations":[{"start":{"line":3,"column":24},"end":{"line":3,"column":38}}]},"1":{"loc":{"start":{"line":11,"column":14},"end":{"line":11,"column":35}},"type":"default-arg","locations":[{"start":{"line":11,"column":24},"end":{"line":11,"column":35}}]},"2":{"loc":{"start":{"line":19,"column":14},"end":{"line":19,"column":35}},"type":"default-arg","locations":[{"start":{"line":19,"column":24},"end":{"line":19,"column":35}}]},"3":{"loc":{"start":{"line":27,"column":14},"end":{"line":27,"column":37}},"type":"default-arg","locations":[{"start":{"line":27,"column":24},"end":{"line":27,"column":37}}]},"4":{"loc":{"start":{"line":36,"column":14},"end":{"line":36,"column":42}},"type":"default-arg","locations":[{"start":{"line":36,"column":24},"end":{"line":36,"column":42}}]}},"s":{"0":2,"1":2,"2":2,"3":3,"4":0,"5":0,"6":0,"7":3,"8":0,"9":0,"10":0,"11":3,"12":0,"13":0,"14":0,"15":3,"16":0,"17":0,"18":0,"19":0,"20":3},"f":{"0":2,"1":0,"2":0,"3":0,"4":0},"b":{"0":[0],"1":[0],"2":[0],"3":[0],"4":[0]}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\middleware\\asyncRouteHandler.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\middleware\\asyncRouteHandler.ts","statementMap":{"0":{"start":{"line":4,"column":26},"end":{"line":10,"column":1}},"1":{"start":{"line":7,"column":2},"end":{"line":9,"column":4}},"2":{"start":{"line":8,"column":4},"end":{"line":8,"column":52}},"3":{"start":{"line":12,"column":0},"end":{"line":12,"column":33}}},"fnMap":{"0":{"name":"(anonymous_0)","decl":{"start":{"line":4,"column":26},"end":{"line":4,"column":null}},"loc":{"start":{"line":6,"column":4},"end":{"line":10,"column":1}}},"1":{"name":"(anonymous_1)","decl":{"start":{"line":7,"column":9},"end":{"line":7,"column":10}},"loc":{"start":{"line":7,"column":61},"end":{"line":9,"column":3}}}},"branchMap":{},"s":{"0":3,"1":75,"2":13,"3":3},"f":{"0":75,"1":13},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\middleware\\auth.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\middleware\\auth.ts","statementMap":{"0":{"start":{"line":2,"column":0},"end":{"line":2,"column":31}},"1":{"start":{"line":3,"column":0},"end":{"line":3,"column":37}},"2":{"start":{"line":4,"column":0},"end":{"line":4,"column":64}},"3":{"start":{"line":6,"column":28},"end":{"line":27,"column":1}},"4":{"start":{"line":11,"column":16},"end":{"line":11,"column":67}},"5":{"start":{"line":13,"column":2},"end":{"line":13,"column":68}},"6":{"start":{"line":13,"column":14},"end":{"line":13,"column":68}},"7":{"start":{"line":15,"column":2},"end":{"line":26,"column":3}},"8":{"start":{"line":16,"column":20},"end":{"line":16,"column":62}},"9":{"start":{"line":17,"column":17},"end":{"line":19,"column":6}},"10":{"start":{"line":21,"column":4},"end":{"line":21,"column":63}},"11":{"start":{"line":21,"column":15},"end":{"line":21,"column":63}},"12":{"start":{"line":22,"column":4},"end":{"line":22,"column":20}},"13":{"start":{"line":23,"column":4},"end":{"line":23,"column":11}},"14":{"start":{"line":25,"column":4},"end":{"line":25,"column":62}},"15":{"start":{"line":6,"column":13},"end":{"line":6,"column":28}}},"fnMap":{"0":{"name":"(anonymous_1)","decl":{"start":{"line":6,"column":28},"end":{"line":6,"column":33}},"loc":{"start":{"line":10,"column":4},"end":{"line":27,"column":1}}}},"branchMap":{"0":{"loc":{"start":{"line":13,"column":2},"end":{"line":13,"column":68}},"type":"if","locations":[{"start":{"line":13,"column":2},"end":{"line":13,"column":68}}]},"1":{"loc":{"start":{"line":21,"column":4},"end":{"line":21,"column":63}},"type":"if","locations":[{"start":{"line":21,"column":4},"end":{"line":21,"column":63}}]}},"s":{"0":3,"1":3,"2":3,"3":3,"4":4,"5":4,"6":0,"7":4,"8":4,"9":3,"10":3,"11":0,"12":3,"13":3,"14":1,"15":3},"f":{"0":4},"b":{"0":[0],"1":[0]}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\middleware\\errorHandler.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\middleware\\errorHandler.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":24}},"1":{"start":{"line":2,"column":0},"end":{"line":2,"column":79}},"2":{"start":{"line":4,"column":0},"end":{"line":4,"column":null}},"3":{"start":{"line":9,"column":28},"end":{"line":59,"column":1}},"4":{"start":{"line":15,"column":2},"end":{"line":20,"column":3}},"5":{"start":{"line":16,"column":4},"end":{"line":19,"column":7}},"6":{"start":{"line":22,"column":2},"end":{"line":24,"column":3}},"7":{"start":{"line":23,"column":4},"end":{"line":23,"column":67}},"8":{"start":{"line":27,"column":2},"end":{"line":29,"column":3}},"9":{"start":{"line":28,"column":4},"end":{"line":28,"column":21}},"10":{"start":{"line":32,"column":2},"end":{"line":34,"column":3}},"11":{"start":{"line":33,"column":4},"end":{"line":33,"column":51}},"12":{"start":{"line":37,"column":2},"end":{"line":42,"column":3}},"13":{"start":{"line":38,"column":4},"end":{"line":41,"column":7}},"14":{"start":{"line":43,"column":2},"end":{"line":43,"column":21}},"15":{"start":{"line":45,"column":2},"end":{"line":50,"column":3}},"16":{"start":{"line":46,"column":4},"end":{"line":49,"column":7}},"17":{"start":{"line":53,"column":2},"end":{"line":58,"column":5}},"18":{"start":{"line":9,"column":13},"end":{"line":9,"column":28}}},"fnMap":{"0":{"name":"(anonymous_0)","decl":{"start":{"line":9,"column":28},"end":{"line":9,"column":null}},"loc":{"start":{"line":14,"column":4},"end":{"line":59,"column":1}}}},"branchMap":{"0":{"loc":{"start":{"line":15,"column":2},"end":{"line":20,"column":3}},"type":"if","locations":[{"start":{"line":15,"column":2},"end":{"line":20,"column":3}}]},"1":{"loc":{"start":{"line":22,"column":2},"end":{"line":24,"column":3}},"type":"if","locations":[{"start":{"line":22,"column":2},"end":{"line":24,"column":3}}]},"2":{"loc":{"start":{"line":27,"column":2},"end":{"line":29,"column":3}},"type":"if","locations":[{"start":{"line":27,"column":2},"end":{"line":29,"column":3}}]},"3":{"loc":{"start":{"line":27,"column":6},"end":{"line":27,"column":57}},"type":"binary-expr","locations":[{"start":{"line":27,"column":6},"end":{"line":27,"column":21}},{"start":{"line":27,"column":25},"end":{"line":27,"column":57}}]},"4":{"loc":{"start":{"line":32,"column":2},"end":{"line":34,"column":3}},"type":"if","locations":[{"start":{"line":32,"column":2},"end":{"line":34,"column":3}}]},"5":{"loc":{"start":{"line":37,"column":2},"end":{"line":42,"column":3}},"type":"if","locations":[{"start":{"line":37,"column":2},"end":{"line":42,"column":3}}]},"6":{"loc":{"start":{"line":45,"column":2},"end":{"line":50,"column":3}},"type":"if","locations":[{"start":{"line":45,"column":2},"end":{"line":50,"column":3}}]},"7":{"loc":{"start":{"line":55,"column":6},"end":{"line":57,"column":21}},"type":"cond-expr","locations":[{"start":{"line":56,"column":10},"end":{"line":56,"column":33}},{"start":{"line":57,"column":10},"end":{"line":57,"column":21}}]}},"s":{"0":3,"1":3,"2":3,"3":3,"4":3,"5":0,"6":3,"7":2,"8":1,"9":0,"10":1,"11":0,"12":1,"13":0,"14":1,"15":1,"16":1,"17":0,"18":3},"f":{"0":3},"b":{"0":[0],"1":[2],"2":[0],"3":[1,1],"4":[0],"5":[0],"6":[1],"7":[0,0]}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\middleware\\validate.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\middleware\\validate.ts","statementMap":{"0":{"start":{"line":2,"column":0},"end":{"line":2,"column":38}},"1":{"start":{"line":3,"column":0},"end":{"line":3,"column":60}},"2":{"start":{"line":6,"column":2},"end":{"line":30,"column":3}},"3":{"start":{"line":7,"column":2},"end":{"line":30,"column":3}},"4":{"start":{"line":8,"column":4},"end":{"line":29,"column":5}},"5":{"start":{"line":9,"column":6},"end":{"line":13,"column":9}},"6":{"start":{"line":14,"column":6},"end":{"line":14,"column":13}},"7":{"start":{"line":16,"column":6},"end":{"line":28,"column":7}},"8":{"start":{"line":17,"column":8},"end":{"line":25,"column":10}},"9":{"start":{"line":20,"column":37},"end":{"line":23,"column":14}},"10":{"start":{"line":27,"column":8},"end":{"line":27,"column":20}},"11":{"start":{"line":5,"column":13},"end":{"line":5,"column":null}}},"fnMap":{"0":{"name":"(anonymous_0)","decl":{"start":{"line":6,"column":2},"end":{"line":6,"column":3}},"loc":{"start":{"line":7,"column":2},"end":{"line":30,"column":3}}},"1":{"name":"(anonymous_1)","decl":{"start":{"line":7,"column":2},"end":{"line":7,"column":7}},"loc":{"start":{"line":7,"column":60},"end":{"line":30,"column":3}}},"2":{"name":"(anonymous_2)","decl":{"start":{"line":20,"column":29},"end":{"line":20,"column":30}},"loc":{"start":{"line":20,"column":37},"end":{"line":23,"column":14}}}},"branchMap":{"0":{"loc":{"start":{"line":16,"column":6},"end":{"line":28,"column":7}},"type":"if","locations":[{"start":{"line":16,"column":6},"end":{"line":28,"column":7}},{"start":{"line":26,"column":13},"end":{"line":28,"column":7}}]}},"s":{"0":3,"1":3,"2":3,"3":30,"4":11,"5":11,"6":11,"7":0,"8":0,"9":0,"10":0,"11":3},"f":{"0":30,"1":11,"2":0},"b":{"0":[0,0]}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\routes\\albums.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\routes\\albums.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":30}},"1":{"start":{"line":2,"column":0},"end":{"line":2,"column":null}},"2":{"start":{"line":9,"column":0},"end":{"line":9,"column":53}},"3":{"start":{"line":10,"column":0},"end":{"line":10,"column":53}},"4":{"start":{"line":11,"column":0},"end":{"line":11,"column":null}},"5":{"start":{"line":16,"column":15},"end":{"line":16,"column":31}},"6":{"start":{"line":18,"column":0},"end":{"line":23,"column":2}},"7":{"start":{"line":25,"column":0},"end":{"line":25,"column":65}},"8":{"start":{"line":27,"column":0},"end":{"line":27,"column":37}},"9":{"start":{"line":29,"column":0},"end":{"line":34,"column":2}},"10":{"start":{"line":36,"column":0},"end":{"line":36,"column":59}},"11":{"start":{"line":38,"column":0},"end":{"line":38,"column":22}}},"fnMap":{},"branchMap":{},"s":{"0":3,"1":3,"2":3,"3":3,"4":3,"5":3,"6":3,"7":3,"8":3,"9":3,"10":3,"11":3},"f":{},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\routes\\groups.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\routes\\groups.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":30}},"1":{"start":{"line":2,"column":0},"end":{"line":2,"column":null}},"2":{"start":{"line":10,"column":0},"end":{"line":10,"column":53}},"3":{"start":{"line":11,"column":0},"end":{"line":11,"column":53}},"4":{"start":{"line":12,"column":0},"end":{"line":12,"column":63}},"5":{"start":{"line":14,"column":15},"end":{"line":14,"column":31}},"6":{"start":{"line":16,"column":0},"end":{"line":16,"column":55}},"7":{"start":{"line":17,"column":0},"end":{"line":17,"column":77}},"8":{"start":{"line":18,"column":0},"end":{"line":18,"column":64}},"9":{"start":{"line":19,"column":0},"end":{"line":24,"column":2}},"10":{"start":{"line":25,"column":0},"end":{"line":25,"column":68}},"11":{"start":{"line":26,"column":0},"end":{"line":26,"column":56}},"12":{"start":{"line":28,"column":0},"end":{"line":28,"column":22}}},"fnMap":{},"branchMap":{},"s":{"0":3,"1":3,"2":3,"3":3,"4":3,"5":3,"6":3,"7":3,"8":3,"9":3,"10":3,"11":3,"12":3},"f":{},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\routes\\reviews.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\routes\\reviews.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":30}},"1":{"start":{"line":2,"column":0},"end":{"line":2,"column":null}},"2":{"start":{"line":6,"column":0},"end":{"line":6,"column":53}},"3":{"start":{"line":8,"column":15},"end":{"line":8,"column":31}},"4":{"start":{"line":10,"column":0},"end":{"line":10,"column":55}},"5":{"start":{"line":11,"column":0},"end":{"line":11,"column":38}},"6":{"start":{"line":13,"column":0},"end":{"line":13,"column":22}}},"fnMap":{},"branchMap":{},"s":{"0":3,"1":3,"2":3,"3":3,"4":3,"5":3,"6":3},"f":{},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\routes\\songs.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\routes\\songs.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":30}},"1":{"start":{"line":2,"column":0},"end":{"line":2,"column":null}},"2":{"start":{"line":9,"column":0},"end":{"line":9,"column":53}},"3":{"start":{"line":10,"column":0},"end":{"line":10,"column":61}},"4":{"start":{"line":11,"column":0},"end":{"line":11,"column":53}},"5":{"start":{"line":13,"column":15},"end":{"line":13,"column":31}},"6":{"start":{"line":15,"column":0},"end":{"line":15,"column":36}},"7":{"start":{"line":16,"column":0},"end":{"line":16,"column":42}},"8":{"start":{"line":17,"column":0},"end":{"line":17,"column":75}},"9":{"start":{"line":18,"column":0},"end":{"line":23,"column":2}},"10":{"start":{"line":24,"column":0},"end":{"line":24,"column":62}},"11":{"start":{"line":26,"column":0},"end":{"line":26,"column":22}}},"fnMap":{},"branchMap":{},"s":{"0":3,"1":3,"2":3,"3":3,"4":3,"5":3,"6":3,"7":3,"8":3,"9":3,"10":3,"11":3},"f":{},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\routes\\users.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\routes\\users.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":30}},"1":{"start":{"line":2,"column":0},"end":{"line":2,"column":null}},"2":{"start":{"line":10,"column":0},"end":{"line":10,"column":53}},"3":{"start":{"line":11,"column":0},"end":{"line":11,"column":null}},"4":{"start":{"line":17,"column":0},"end":{"line":17,"column":53}},"5":{"start":{"line":19,"column":15},"end":{"line":19,"column":31}},"6":{"start":{"line":21,"column":0},"end":{"line":21,"column":79}},"7":{"start":{"line":22,"column":0},"end":{"line":22,"column":66}},"8":{"start":{"line":23,"column":0},"end":{"line":23,"column":78}},"9":{"start":{"line":24,"column":0},"end":{"line":24,"column":58}},"10":{"start":{"line":25,"column":0},"end":{"line":30,"column":2}},"11":{"start":{"line":32,"column":0},"end":{"line":32,"column":57}},"12":{"start":{"line":34,"column":0},"end":{"line":34,"column":22}}},"fnMap":{},"branchMap":{},"s":{"0":3,"1":3,"2":3,"3":3,"4":3,"5":3,"6":3,"7":3,"8":3,"9":3,"10":3,"11":3,"12":3},"f":{},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\services\\album.service.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\services\\album.service.ts","statementMap":{"0":{"start":{"line":2,"column":0},"end":{"line":2,"column":37}},"1":{"start":{"line":10,"column":34},"end":{"line":17,"column":1}},"2":{"start":{"line":11,"column":2},"end":{"line":16,"column":5}},"3":{"start":{"line":10,"column":13},"end":{"line":10,"column":34}},"4":{"start":{"line":43,"column":40},"end":{"line":93,"column":1}},"5":{"start":{"line":49,"column":16},"end":{"line":52,"column":4}},"6":{"start":{"line":55,"column":28},"end":{"line":59,"column":4}},"7":{"start":{"line":62,"column":26},"end":{"line":67,"column":4}},"8":{"start":{"line":70,"column":27},"end":{"line":70,"column":29}},"9":{"start":{"line":71,"column":2},"end":{"line":76,"column":3}},"10":{"start":{"line":72,"column":4},"end":{"line":75,"column":7}},"11":{"start":{"line":79,"column":2},"end":{"line":92,"column":5}},"12":{"start":{"line":80,"column":18},"end":{"line":80,"column":67}},"13":{"start":{"line":80,"column":46},"end":{"line":80,"column":66}},"14":{"start":{"line":81,"column":23},"end":{"line":81,"column":68}},"15":{"start":{"line":81,"column":47},"end":{"line":81,"column":67}},"16":{"start":{"line":83,"column":4},"end":{"line":91,"column":6}},"17":{"start":{"line":43,"column":13},"end":{"line":43,"column":40}},"18":{"start":{"line":95,"column":41},"end":{"line":129,"column":1}},"19":{"start":{"line":100,"column":40},"end":{"line":102,"column":8}},"20":{"start":{"line":104,"column":26},"end":{"line":119,"column":4}},"21":{"start":{"line":121,"column":2},"end":{"line":128,"column":4}},"22":{"start":{"line":95,"column":13},"end":{"line":95,"column":41}},"23":{"start":{"line":131,"column":34},"end":{"line":143,"column":1}},"24":{"start":{"line":135,"column":2},"end":{"line":137,"column":3}},"25":{"start":{"line":136,"column":4},"end":{"line":136,"column":50}},"26":{"start":{"line":139,"column":2},"end":{"line":142,"column":5}},"27":{"start":{"line":131,"column":13},"end":{"line":131,"column":34}},"28":{"start":{"line":145,"column":34},"end":{"line":149,"column":1}},"29":{"start":{"line":146,"column":2},"end":{"line":148,"column":5}},"30":{"start":{"line":145,"column":13},"end":{"line":145,"column":34}}},"fnMap":{"0":{"name":"(anonymous_1)","decl":{"start":{"line":10,"column":34},"end":{"line":10,"column":39}},"loc":{"start":{"line":10,"column":74},"end":{"line":17,"column":1}}},"1":{"name":"(anonymous_2)","decl":{"start":{"line":43,"column":40},"end":{"line":43,"column":45}},"loc":{"start":{"line":47,"column":22},"end":{"line":93,"column":1}}},"2":{"name":"(anonymous_3)","decl":{"start":{"line":79,"column":19},"end":{"line":79,"column":20}},"loc":{"start":{"line":79,"column":28},"end":{"line":92,"column":3}}},"3":{"name":"(anonymous_4)","decl":{"start":{"line":80,"column":39},"end":{"line":80,"column":40}},"loc":{"start":{"line":80,"column":46},"end":{"line":80,"column":66}}},"4":{"name":"(anonymous_5)","decl":{"start":{"line":81,"column":40},"end":{"line":81,"column":41}},"loc":{"start":{"line":81,"column":47},"end":{"line":81,"column":67}}},"5":{"name":"(anonymous_6)","decl":{"start":{"line":95,"column":41},"end":{"line":95,"column":46}},"loc":{"start":{"line":99,"column":5},"end":{"line":129,"column":1}}},"6":{"name":"(anonymous_7)","decl":{"start":{"line":131,"column":34},"end":{"line":131,"column":39}},"loc":{"start":{"line":134,"column":4},"end":{"line":143,"column":1}}},"7":{"name":"(anonymous_8)","decl":{"start":{"line":145,"column":34},"end":{"line":145,"column":39}},"loc":{"start":{"line":145,"column":55},"end":{"line":149,"column":1}}}},"branchMap":{"0":{"loc":{"start":{"line":57,"column":8},"end":{"line":57,"column":30}},"type":"binary-expr","locations":[{"start":{"line":57,"column":8},"end":{"line":57,"column":15}},{"start":{"line":57,"column":19},"end":{"line":57,"column":30}}]},"1":{"loc":{"start":{"line":58,"column":8},"end":{"line":58,"column":28}},"type":"binary-expr","locations":[{"start":{"line":58,"column":8},"end":{"line":58,"column":14}},{"start":{"line":58,"column":18},"end":{"line":58,"column":28}}]},"2":{"loc":{"start":{"line":71,"column":2},"end":{"line":76,"column":3}},"type":"if","locations":[{"start":{"line":71,"column":2},"end":{"line":76,"column":3}}]},"3":{"loc":{"start":{"line":88,"column":21},"end":{"line":88,"column":44}},"type":"binary-expr","locations":[{"start":{"line":88,"column":21},"end":{"line":88,"column":39}},{"start":{"line":88,"column":43},"end":{"line":88,"column":44}}]},"4":{"loc":{"start":{"line":89,"column":19},"end":{"line":89,"column":44}},"type":"binary-expr","locations":[{"start":{"line":89,"column":19},"end":{"line":89,"column":39}},{"start":{"line":89,"column":43},"end":{"line":89,"column":44}}]},"5":{"loc":{"start":{"line":90,"column":18},"end":{"line":90,"column":44}},"type":"binary-expr","locations":[{"start":{"line":90,"column":18},"end":{"line":90,"column":36}},{"start":{"line":90,"column":40},"end":{"line":90,"column":44}}]},"6":{"loc":{"start":{"line":100,"column":40},"end":{"line":102,"column":8}},"type":"cond-expr","locations":[{"start":{"line":101,"column":6},"end":{"line":101,"column":75}},{"start":{"line":102,"column":6},"end":{"line":102,"column":8}}]},"7":{"loc":{"start":{"line":135,"column":2},"end":{"line":137,"column":3}},"type":"if","locations":[{"start":{"line":135,"column":2},"end":{"line":137,"column":3}}]},"8":{"loc":{"start":{"line":135,"column":6},"end":{"line":135,"column":62}},"type":"binary-expr","locations":[{"start":{"line":135,"column":6},"end":{"line":135,"column":22}},{"start":{"line":135,"column":26},"end":{"line":135,"column":62}}]}},"s":{"0":3,"1":3,"2":1,"3":3,"4":3,"5":1,"6":1,"7":1,"8":1,"9":1,"10":0,"11":1,"12":0,"13":0,"14":0,"15":0,"16":0,"17":3,"18":3,"19":0,"20":0,"21":0,"22":3,"23":3,"24":1,"25":0,"26":1,"27":3,"28":3,"29":1,"30":3},"f":{"0":1,"1":1,"2":0,"3":0,"4":0,"5":0,"6":1,"7":1},"b":{"0":[1,0],"1":[1,0],"2":[0],"3":[0,0],"4":[0,0],"5":[0,0],"6":[0,0],"7":[0],"8":[1,0]}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\services\\email.service.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\services\\email.service.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":36}},"1":{"start":{"line":3,"column":20},"end":{"line":9,"column":2}},"2":{"start":{"line":11,"column":35},"end":{"line":38,"column":1}},"3":{"start":{"line":16,"column":21},"end":{"line":16,"column":74}},"4":{"start":{"line":18,"column":2},"end":{"line":37,"column":5}},"5":{"start":{"line":11,"column":13},"end":{"line":11,"column":35}}},"fnMap":{"0":{"name":"(anonymous_1)","decl":{"start":{"line":11,"column":35},"end":{"line":11,"column":40}},"loc":{"start":{"line":15,"column":4},"end":{"line":38,"column":1}}}},"branchMap":{},"s":{"0":3,"1":3,"2":3,"3":0,"4":0,"5":3},"f":{"0":0},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\services\\group.service.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\services\\group.service.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":37}},"1":{"start":{"line":2,"column":0},"end":{"line":2,"column":null}},"2":{"start":{"line":7,"column":0},"end":{"line":7,"column":28}},"3":{"start":{"line":8,"column":0},"end":{"line":8,"column":57}},"4":{"start":{"line":23,"column":34},"end":{"line":51,"column":1}},"5":{"start":{"line":24,"column":2},"end":{"line":26,"column":3}},"6":{"start":{"line":25,"column":4},"end":{"line":25,"column":74}},"7":{"start":{"line":28,"column":2},"end":{"line":50,"column":5}},"8":{"start":{"line":23,"column":13},"end":{"line":23,"column":34}},"9":{"start":{"line":53,"column":34},"end":{"line":70,"column":1}},"10":{"start":{"line":54,"column":21},"end":{"line":61,"column":4}},"11":{"start":{"line":63,"column":2},"end":{"line":65,"column":3}},"12":{"start":{"line":64,"column":4},"end":{"line":64,"column":58}},"13":{"start":{"line":67,"column":2},"end":{"line":69,"column":5}},"14":{"start":{"line":53,"column":13},"end":{"line":53,"column":34}},"15":{"start":{"line":72,"column":34},"end":{"line":97,"column":1}},"16":{"start":{"line":77,"column":21},"end":{"line":84,"column":4}},"17":{"start":{"line":86,"column":2},"end":{"line":88,"column":3}},"18":{"start":{"line":87,"column":4},"end":{"line":87,"column":58}},"19":{"start":{"line":90,"column":2},"end":{"line":96,"column":5}},"20":{"start":{"line":72,"column":13},"end":{"line":72,"column":34}},"21":{"start":{"line":99,"column":38},"end":{"line":124,"column":1}},"22":{"start":{"line":104,"column":16},"end":{"line":112,"column":4}},"23":{"start":{"line":114,"column":2},"end":{"line":114,"column":57}},"24":{"start":{"line":114,"column":14},"end":{"line":114,"column":57}},"25":{"start":{"line":115,"column":2},"end":{"line":117,"column":3}},"26":{"start":{"line":116,"column":4},"end":{"line":116,"column":58}},"27":{"start":{"line":118,"column":2},"end":{"line":120,"column":3}},"28":{"start":{"line":119,"column":4},"end":{"line":119,"column":73}},"29":{"start":{"line":122,"column":2},"end":{"line":122,"column":66}},"30":{"start":{"line":123,"column":2},"end":{"line":123,"column":40}},"31":{"start":{"line":99,"column":13},"end":{"line":99,"column":38}},"32":{"start":{"line":126,"column":32},"end":{"line":156,"column":1}},"33":{"start":{"line":127,"column":16},"end":{"line":129,"column":4}},"34":{"start":{"line":131,"column":2},"end":{"line":131,"column":65}},"35":{"start":{"line":131,"column":14},"end":{"line":131,"column":65}},"36":{"start":{"line":133,"column":29},"end":{"line":140,"column":4}},"37":{"start":{"line":142,"column":2},"end":{"line":144,"column":3}},"38":{"start":{"line":143,"column":4},"end":{"line":143,"column":56}},"39":{"start":{"line":146,"column":2},"end":{"line":155,"column":5}},"40":{"start":{"line":126,"column":13},"end":{"line":126,"column":32}},"41":{"start":{"line":158,"column":36},"end":{"line":173,"column":1}},"42":{"start":{"line":159,"column":2},"end":{"line":172,"column":5}},"43":{"start":{"line":158,"column":13},"end":{"line":158,"column":36}},"44":{"start":{"line":175,"column":41},"end":{"line":191,"column":1}},"45":{"start":{"line":180,"column":26},"end":{"line":188,"column":4}},"46":{"start":{"line":190,"column":2},"end":{"line":190,"column":77}},"47":{"start":{"line":175,"column":13},"end":{"line":175,"column":41}}},"fnMap":{"0":{"name":"(anonymous_1)","decl":{"start":{"line":23,"column":34},"end":{"line":23,"column":39}},"loc":{"start":{"line":23,"column":67},"end":{"line":51,"column":1}}},"1":{"name":"(anonymous_2)","decl":{"start":{"line":53,"column":34},"end":{"line":53,"column":39}},"loc":{"start":{"line":53,"column":76},"end":{"line":70,"column":1}}},"2":{"name":"(anonymous_3)","decl":{"start":{"line":72,"column":34},"end":{"line":72,"column":39}},"loc":{"start":{"line":76,"column":4},"end":{"line":97,"column":1}}},"3":{"name":"(anonymous_4)","decl":{"start":{"line":99,"column":38},"end":{"line":99,"column":43}},"loc":{"start":{"line":103,"column":4},"end":{"line":124,"column":1}}},"4":{"name":"(anonymous_5)","decl":{"start":{"line":126,"column":32},"end":{"line":126,"column":37}},"loc":{"start":{"line":126,"column":77},"end":{"line":156,"column":1}}},"5":{"name":"(anonymous_6)","decl":{"start":{"line":158,"column":36},"end":{"line":158,"column":41}},"loc":{"start":{"line":158,"column":61},"end":{"line":173,"column":1}}},"6":{"name":"(anonymous_7)","decl":{"start":{"line":175,"column":41},"end":{"line":175,"column":46}},"loc":{"start":{"line":179,"column":4},"end":{"line":191,"column":1}}}},"branchMap":{"0":{"loc":{"start":{"line":24,"column":2},"end":{"line":26,"column":3}},"type":"if","locations":[{"start":{"line":24,"column":2},"end":{"line":26,"column":3}}]},"1":{"loc":{"start":{"line":24,"column":6},"end":{"line":24,"column":47}},"type":"binary-expr","locations":[{"start":{"line":24,"column":6},"end":{"line":24,"column":16}},{"start":{"line":24,"column":20},"end":{"line":24,"column":47}}]},"2":{"loc":{"start":{"line":33,"column":18},"end":{"line":33,"column":79}},"type":"cond-expr","locations":[{"start":{"line":33,"column":35},"end":{"line":33,"column":72}},{"start":{"line":33,"column":75},"end":{"line":33,"column":79}}]},"3":{"loc":{"start":{"line":63,"column":2},"end":{"line":65,"column":3}},"type":"if","locations":[{"start":{"line":63,"column":2},"end":{"line":65,"column":3}}]},"4":{"loc":{"start":{"line":63,"column":6},"end":{"line":63,"column":48}},"type":"binary-expr","locations":[{"start":{"line":63,"column":6},"end":{"line":63,"column":17}},{"start":{"line":63,"column":21},"end":{"line":63,"column":48}}]},"5":{"loc":{"start":{"line":86,"column":2},"end":{"line":88,"column":3}},"type":"if","locations":[{"start":{"line":86,"column":2},"end":{"line":88,"column":3}}]},"6":{"loc":{"start":{"line":86,"column":6},"end":{"line":86,"column":48}},"type":"binary-expr","locations":[{"start":{"line":86,"column":6},"end":{"line":86,"column":17}},{"start":{"line":86,"column":21},"end":{"line":86,"column":48}}]},"7":{"loc":{"start":{"line":114,"column":2},"end":{"line":114,"column":57}},"type":"if","locations":[{"start":{"line":114,"column":2},"end":{"line":114,"column":57}}]},"8":{"loc":{"start":{"line":115,"column":2},"end":{"line":117,"column":3}},"type":"if","locations":[{"start":{"line":115,"column":2},"end":{"line":117,"column":3}}]},"9":{"loc":{"start":{"line":115,"column":6},"end":{"line":115,"column":60}},"type":"binary-expr","locations":[{"start":{"line":115,"column":6},"end":{"line":115,"column":23}},{"start":{"line":115,"column":27},"end":{"line":115,"column":60}}]},"10":{"loc":{"start":{"line":118,"column":2},"end":{"line":120,"column":3}},"type":"if","locations":[{"start":{"line":118,"column":2},"end":{"line":120,"column":3}}]},"11":{"loc":{"start":{"line":131,"column":2},"end":{"line":131,"column":65}},"type":"if","locations":[{"start":{"line":131,"column":2},"end":{"line":131,"column":65}}]},"12":{"loc":{"start":{"line":142,"column":2},"end":{"line":144,"column":3}},"type":"if","locations":[{"start":{"line":142,"column":2},"end":{"line":144,"column":3}}]}},"s":{"0":3,"1":3,"2":3,"3":3,"4":3,"5":0,"6":0,"7":0,"8":3,"9":3,"10":0,"11":0,"12":0,"13":0,"14":3,"15":3,"16":0,"17":0,"18":0,"19":0,"20":3,"21":3,"22":0,"23":0,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":3,"32":3,"33":0,"34":0,"35":0,"36":0,"37":0,"38":0,"39":0,"40":3,"41":3,"42":0,"43":3,"44":3,"45":0,"46":0,"47":3},"f":{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0},"b":{"0":[0],"1":[0,0],"2":[0,0],"3":[0],"4":[0,0],"5":[0],"6":[0,0],"7":[0],"8":[0],"9":[0,0],"10":[0],"11":[0],"12":[0]}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\services\\review.service.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\services\\review.service.ts","statementMap":{"0":{"start":{"line":2,"column":0},"end":{"line":2,"column":37}},"1":{"start":{"line":3,"column":0},"end":{"line":3,"column":null}},"2":{"start":{"line":33,"column":35},"end":{"line":76,"column":1}},"3":{"start":{"line":41,"column":2},"end":{"line":45,"column":3}},"4":{"start":{"line":42,"column":4},"end":{"line":44,"column":7}},"5":{"start":{"line":48,"column":15},"end":{"line":50,"column":4}},"6":{"start":{"line":51,"column":2},"end":{"line":51,"column":55}},"7":{"start":{"line":51,"column":13},"end":{"line":51,"column":55}},"8":{"start":{"line":54,"column":2},"end":{"line":64,"column":3}},"9":{"start":{"line":55,"column":23},"end":{"line":62,"column":6}},"10":{"start":{"line":63,"column":4},"end":{"line":63,"column":68}},"11":{"start":{"line":63,"column":21},"end":{"line":63,"column":68}},"12":{"start":{"line":67,"column":2},"end":{"line":75,"column":5}},"13":{"start":{"line":33,"column":13},"end":{"line":33,"column":35}},"14":{"start":{"line":78,"column":33},"end":{"line":106,"column":1}},"15":{"start":{"line":79,"column":17},"end":{"line":79,"column":38}},"16":{"start":{"line":81,"column":41},"end":{"line":81,"column":65}},"17":{"start":{"line":83,"column":27},"end":{"line":96,"column":4}},"18":{"start":{"line":98,"column":2},"end":{"line":105,"column":4}},"19":{"start":{"line":78,"column":13},"end":{"line":78,"column":33}},"20":{"start":{"line":109,"column":21},"end":{"line":120,"column":1}},"21":{"start":{"line":110,"column":2},"end":{"line":119,"column":4}},"22":{"start":{"line":123,"column":25},"end":{"line":147,"column":1}},"23":{"start":{"line":124,"column":2},"end":{"line":146,"column":4}},"24":{"start":{"line":150,"column":18},"end":{"line":154,"column":1}},"25":{"start":{"line":151,"column":2},"end":{"line":151,"column":36}},"26":{"start":{"line":151,"column":19},"end":{"line":151,"column":36}},"27":{"start":{"line":152,"column":15},"end":{"line":152,"column":35}},"28":{"start":{"line":153,"column":2},"end":{"line":153,"column":50}}},"fnMap":{"0":{"name":"(anonymous_1)","decl":{"start":{"line":33,"column":35},"end":{"line":33,"column":40}},"loc":{"start":{"line":39,"column":5},"end":{"line":76,"column":1}}},"1":{"name":"(anonymous_2)","decl":{"start":{"line":78,"column":33},"end":{"line":78,"column":38}},"loc":{"start":{"line":78,"column":66},"end":{"line":106,"column":1}}},"2":{"name":"(anonymous_3)","decl":{"start":{"line":109,"column":21},"end":{"line":109,"column":22}},"loc":{"start":{"line":109,"column":63},"end":{"line":120,"column":1}}},"3":{"name":"(anonymous_4)","decl":{"start":{"line":123,"column":25},"end":{"line":123,"column":26}},"loc":{"start":{"line":123,"column":76},"end":{"line":147,"column":1}}},"4":{"name":"(anonymous_5)","decl":{"start":{"line":150,"column":18},"end":{"line":150,"column":19}},"loc":{"start":{"line":150,"column":60},"end":{"line":154,"column":1}}}},"branchMap":{"0":{"loc":{"start":{"line":41,"column":2},"end":{"line":45,"column":3}},"type":"if","locations":[{"start":{"line":41,"column":2},"end":{"line":45,"column":3}}]},"1":{"loc":{"start":{"line":41,"column":6},"end":{"line":41,"column":41}},"type":"binary-expr","locations":[{"start":{"line":41,"column":6},"end":{"line":41,"column":21}},{"start":{"line":41,"column":25},"end":{"line":41,"column":41}}]},"2":{"loc":{"start":{"line":51,"column":2},"end":{"line":51,"column":55}},"type":"if","locations":[{"start":{"line":51,"column":2},"end":{"line":51,"column":55}}]},"3":{"loc":{"start":{"line":54,"column":2},"end":{"line":64,"column":3}},"type":"if","locations":[{"start":{"line":54,"column":2},"end":{"line":64,"column":3}}]},"4":{"loc":{"start":{"line":63,"column":4},"end":{"line":63,"column":68}},"type":"if","locations":[{"start":{"line":63,"column":4},"end":{"line":63,"column":68}}]},"5":{"loc":{"start":{"line":112,"column":15},"end":{"line":112,"column":72}},"type":"cond-expr","locations":[{"start":{"line":112,"column":35},"end":{"line":112,"column":60}},{"start":{"line":112,"column":63},"end":{"line":112,"column":72}}]},"6":{"loc":{"start":{"line":113,"column":15},"end":{"line":113,"column":72}},"type":"cond-expr","locations":[{"start":{"line":113,"column":35},"end":{"line":113,"column":60}},{"start":{"line":113,"column":63},"end":{"line":113,"column":72}}]},"7":{"loc":{"start":{"line":116,"column":20},"end":{"line":116,"column":47}},"type":"binary-expr","locations":[{"start":{"line":116,"column":20},"end":{"line":116,"column":41}},{"start":{"line":116,"column":45},"end":{"line":116,"column":47}}]},"8":{"loc":{"start":{"line":117,"column":19},"end":{"line":117,"column":44}},"type":"binary-expr","locations":[{"start":{"line":117,"column":19},"end":{"line":117,"column":39}},{"start":{"line":117,"column":43},"end":{"line":117,"column":44}}]},"9":{"loc":{"start":{"line":129,"column":14},"end":{"line":138,"column":16}},"type":"cond-expr","locations":[{"start":{"line":130,"column":14},"end":{"line":137,"column":null}},{"start":{"line":138,"column":14},"end":{"line":138,"column":16}}]},"10":{"loc":{"start":{"line":141,"column":10},"end":{"line":141,"column":73}},"type":"cond-expr","locations":[{"start":{"line":141,"column":29},"end":{"line":141,"column":68}},{"start":{"line":141,"column":71},"end":{"line":141,"column":73}}]},"11":{"loc":{"start":{"line":142,"column":10},"end":{"line":142,"column":73}},"type":"cond-expr","locations":[{"start":{"line":142,"column":29},"end":{"line":142,"column":68}},{"start":{"line":142,"column":71},"end":{"line":142,"column":73}}]},"12":{"loc":{"start":{"line":143,"column":10},"end":{"line":143,"column":76}},"type":"cond-expr","locations":[{"start":{"line":143,"column":29},"end":{"line":143,"column":71}},{"start":{"line":143,"column":74},"end":{"line":143,"column":76}}]},"13":{"loc":{"start":{"line":144,"column":10},"end":{"line":144,"column":72}},"type":"cond-expr","locations":[{"start":{"line":144,"column":27},"end":{"line":144,"column":67}},{"start":{"line":144,"column":70},"end":{"line":144,"column":72}}]},"14":{"loc":{"start":{"line":151,"column":2},"end":{"line":151,"column":36}},"type":"if","locations":[{"start":{"line":151,"column":2},"end":{"line":151,"column":36}}]},"15":{"loc":{"start":{"line":153,"column":9},"end":{"line":153,"column":49}},"type":"cond-expr","locations":[{"start":{"line":153,"column":33},"end":{"line":153,"column":42}},{"start":{"line":153,"column":45},"end":{"line":153,"column":49}}]}},"s":{"0":3,"1":3,"2":3,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":3,"14":3,"15":0,"16":0,"17":0,"18":0,"19":3,"20":3,"21":0,"22":3,"23":0,"24":3,"25":0,"26":0,"27":0,"28":0},"f":{"0":0,"1":0,"2":0,"3":0,"4":0},"b":{"0":[0],"1":[0,0],"2":[0],"3":[0],"4":[0],"5":[0,0],"6":[0,0],"7":[0,0],"8":[0,0],"9":[0,0],"10":[0,0],"11":[0,0],"12":[0,0],"13":[0,0],"14":[0],"15":[0,0]}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\services\\song.service.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\services\\song.service.ts","statementMap":{"0":{"start":{"line":2,"column":0},"end":{"line":2,"column":37}},"1":{"start":{"line":3,"column":0},"end":{"line":3,"column":75}},"2":{"start":{"line":5,"column":31},"end":{"line":34,"column":1}},"3":{"start":{"line":11,"column":39},"end":{"line":16,"column":4}},"4":{"start":{"line":18,"column":25},"end":{"line":24,"column":4}},"5":{"start":{"line":26,"column":2},"end":{"line":33,"column":4}},"6":{"start":{"line":5,"column":13},"end":{"line":5,"column":31}},"7":{"start":{"line":36,"column":30},"end":{"line":53,"column":1}},"8":{"start":{"line":37,"column":15},"end":{"line":49,"column":4}},"9":{"start":{"line":51,"column":2},"end":{"line":51,"column":55}},"10":{"start":{"line":51,"column":13},"end":{"line":51,"column":55}},"11":{"start":{"line":52,"column":2},"end":{"line":52,"column":14}},"12":{"start":{"line":36,"column":13},"end":{"line":36,"column":30}},"13":{"start":{"line":55,"column":33},"end":{"line":70,"column":1}},"14":{"start":{"line":56,"column":2},"end":{"line":60,"column":3}},"15":{"start":{"line":57,"column":4},"end":{"line":59,"column":7}},"16":{"start":{"line":62,"column":2},"end":{"line":64,"column":3}},"17":{"start":{"line":63,"column":4},"end":{"line":63,"column":79}},"18":{"start":{"line":66,"column":2},"end":{"line":69,"column":5}},"19":{"start":{"line":55,"column":13},"end":{"line":55,"column":33}},"20":{"start":{"line":72,"column":33},"end":{"line":81,"column":1}},"21":{"start":{"line":76,"column":2},"end":{"line":80,"column":5}},"22":{"start":{"line":72,"column":13},"end":{"line":72,"column":33}},"23":{"start":{"line":83,"column":33},"end":{"line":87,"column":1}},"24":{"start":{"line":84,"column":2},"end":{"line":86,"column":5}},"25":{"start":{"line":83,"column":13},"end":{"line":83,"column":33}}},"fnMap":{"0":{"name":"(anonymous_1)","decl":{"start":{"line":5,"column":31},"end":{"line":5,"column":36}},"loc":{"start":{"line":10,"column":5},"end":{"line":34,"column":1}}},"1":{"name":"(anonymous_2)","decl":{"start":{"line":36,"column":30},"end":{"line":36,"column":35}},"loc":{"start":{"line":36,"column":55},"end":{"line":53,"column":1}}},"2":{"name":"(anonymous_3)","decl":{"start":{"line":55,"column":33},"end":{"line":55,"column":38}},"loc":{"start":{"line":55,"column":72},"end":{"line":70,"column":1}}},"3":{"name":"(anonymous_4)","decl":{"start":{"line":72,"column":33},"end":{"line":72,"column":38}},"loc":{"start":{"line":75,"column":4},"end":{"line":81,"column":1}}},"4":{"name":"(anonymous_5)","decl":{"start":{"line":83,"column":33},"end":{"line":83,"column":38}},"loc":{"start":{"line":83,"column":58},"end":{"line":87,"column":1}}}},"branchMap":{"0":{"loc":{"start":{"line":12,"column":8},"end":{"line":12,"column":63}},"type":"binary-expr","locations":[{"start":{"line":12,"column":8},"end":{"line":12,"column":23}},{"start":{"line":12,"column":27},"end":{"line":12,"column":63}}]},"1":{"loc":{"start":{"line":13,"column":8},"end":{"line":15,"column":6}},"type":"binary-expr","locations":[{"start":{"line":13,"column":8},"end":{"line":13,"column":22}},{"start":{"line":13,"column":26},"end":{"line":15,"column":6}}]},"2":{"loc":{"start":{"line":30,"column":12},"end":{"line":30,"column":29}},"type":"binary-expr","locations":[{"start":{"line":30,"column":12},"end":{"line":30,"column":24}},{"start":{"line":30,"column":28},"end":{"line":30,"column":29}}]},"3":{"loc":{"start":{"line":31,"column":37},"end":{"line":31,"column":56}},"type":"binary-expr","locations":[{"start":{"line":31,"column":37},"end":{"line":31,"column":50}},{"start":{"line":31,"column":54},"end":{"line":31,"column":56}}]},"4":{"loc":{"start":{"line":51,"column":2},"end":{"line":51,"column":55}},"type":"if","locations":[{"start":{"line":51,"column":2},"end":{"line":51,"column":55}}]},"5":{"loc":{"start":{"line":56,"column":2},"end":{"line":60,"column":3}},"type":"if","locations":[{"start":{"line":56,"column":2},"end":{"line":60,"column":3}}]},"6":{"loc":{"start":{"line":56,"column":6},"end":{"line":56,"column":49}},"type":"binary-expr","locations":[{"start":{"line":56,"column":6},"end":{"line":56,"column":17}},{"start":{"line":56,"column":21},"end":{"line":56,"column":49}}]},"7":{"loc":{"start":{"line":62,"column":2},"end":{"line":64,"column":3}},"type":"if","locations":[{"start":{"line":62,"column":2},"end":{"line":64,"column":3}}]}},"s":{"0":3,"1":3,"2":3,"3":0,"4":0,"5":0,"6":3,"7":3,"8":0,"9":0,"10":0,"11":0,"12":3,"13":3,"14":0,"15":0,"16":0,"17":0,"18":0,"19":3,"20":3,"21":0,"22":3,"23":3,"24":0,"25":3},"f":{"0":0,"1":0,"2":0,"3":0,"4":0},"b":{"0":[0,0],"1":[0,0],"2":[0,0],"3":[0,0],"4":[0],"5":[0],"6":[0,0],"7":[0]}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\services\\user.service.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\services\\user.service.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":40}},"1":{"start":{"line":2,"column":0},"end":{"line":2,"column":37}},"2":{"start":{"line":3,"column":0},"end":{"line":3,"column":30}},"3":{"start":{"line":4,"column":0},"end":{"line":4,"column":31}},"4":{"start":{"line":5,"column":0},"end":{"line":5,"column":null}},"5":{"start":{"line":11,"column":19},"end":{"line":11,"column":21}},"6":{"start":{"line":13,"column":35},"end":{"line":51,"column":1}},"7":{"start":{"line":18,"column":2},"end":{"line":22,"column":3}},"8":{"start":{"line":19,"column":4},"end":{"line":21,"column":7}},"9":{"start":{"line":24,"column":25},"end":{"line":24,"column":69}},"10":{"start":{"line":26,"column":2},"end":{"line":50,"column":3}},"11":{"start":{"line":27,"column":4},"end":{"line":39,"column":7}},"12":{"start":{"line":41,"column":4},"end":{"line":48,"column":5}},"13":{"start":{"line":42,"column":6},"end":{"line":47,"column":7}},"14":{"start":{"line":43,"column":23},"end":{"line":43,"column":59}},"15":{"start":{"line":44,"column":8},"end":{"line":46,"column":11}},"16":{"start":{"line":49,"column":4},"end":{"line":49,"column":16}},"17":{"start":{"line":13,"column":13},"end":{"line":13,"column":35}},"18":{"start":{"line":53,"column":32},"end":{"line":94,"column":1}},"19":{"start":{"line":54,"column":15},"end":{"line":63,"column":4}},"20":{"start":{"line":65,"column":2},"end":{"line":67,"column":3}},"21":{"start":{"line":66,"column":4},"end":{"line":66,"column":57}},"22":{"start":{"line":69,"column":2},"end":{"line":71,"column":3}},"23":{"start":{"line":70,"column":4},"end":{"line":70,"column":63}},"24":{"start":{"line":73,"column":22},"end":{"line":75,"column":4}},"25":{"start":{"line":76,"column":23},"end":{"line":78,"column":4}},"26":{"start":{"line":80,"column":2},"end":{"line":83,"column":5}},"27":{"start":{"line":84,"column":2},"end":{"line":93,"column":4}},"28":{"start":{"line":53,"column":13},"end":{"line":53,"column":32}},"29":{"start":{"line":96,"column":37},"end":{"line":120,"column":1}},"30":{"start":{"line":97,"column":15},"end":{"line":116,"column":4}},"31":{"start":{"line":118,"column":2},"end":{"line":118,"column":55}},"32":{"start":{"line":118,"column":13},"end":{"line":118,"column":55}},"33":{"start":{"line":119,"column":2},"end":{"line":119,"column":14}},"34":{"start":{"line":96,"column":13},"end":{"line":96,"column":37}},"35":{"start":{"line":122,"column":33},"end":{"line":145,"column":1}},"36":{"start":{"line":131,"column":2},"end":{"line":133,"column":3}},"37":{"start":{"line":132,"column":4},"end":{"line":132,"column":65}},"38":{"start":{"line":135,"column":2},"end":{"line":144,"column":5}},"39":{"start":{"line":122,"column":13},"end":{"line":122,"column":33}},"40":{"start":{"line":147,"column":35},"end":{"line":194,"column":1}},"41":{"start":{"line":148,"column":2},"end":{"line":150,"column":3}},"42":{"start":{"line":149,"column":4},"end":{"line":149,"column":63}},"43":{"start":{"line":152,"column":2},"end":{"line":193,"column":3}},"44":{"start":{"line":153,"column":20},"end":{"line":153,"column":null}},"45":{"start":{"line":157,"column":17},"end":{"line":160,"column":6}},"46":{"start":{"line":162,"column":4},"end":{"line":164,"column":5}},"47":{"start":{"line":163,"column":6},"end":{"line":163,"column":61}},"48":{"start":{"line":167,"column":27},"end":{"line":169,"column":6}},"49":{"start":{"line":171,"column":28},"end":{"line":173,"column":6}},"50":{"start":{"line":176,"column":4},"end":{"line":179,"column":7}},"51":{"start":{"line":181,"column":4},"end":{"line":184,"column":6}},"52":{"start":{"line":186,"column":4},"end":{"line":188,"column":5}},"53":{"start":{"line":187,"column":6},"end":{"line":187,"column":61}},"54":{"start":{"line":189,"column":4},"end":{"line":191,"column":5}},"55":{"start":{"line":190,"column":6},"end":{"line":190,"column":61}},"56":{"start":{"line":192,"column":4},"end":{"line":192,"column":58}},"57":{"start":{"line":147,"column":13},"end":{"line":147,"column":35}},"58":{"start":{"line":195,"column":33},"end":{"line":199,"column":1}},"59":{"start":{"line":196,"column":2},"end":{"line":198,"column":5}},"60":{"start":{"line":195,"column":13},"end":{"line":195,"column":33}}},"fnMap":{"0":{"name":"(anonymous_1)","decl":{"start":{"line":13,"column":35},"end":{"line":13,"column":40}},"loc":{"start":{"line":17,"column":5},"end":{"line":51,"column":1}}},"1":{"name":"(anonymous_2)","decl":{"start":{"line":53,"column":32},"end":{"line":53,"column":37}},"loc":{"start":{"line":53,"column":74},"end":{"line":94,"column":1}}},"2":{"name":"(anonymous_3)","decl":{"start":{"line":96,"column":37},"end":{"line":96,"column":42}},"loc":{"start":{"line":96,"column":62},"end":{"line":120,"column":1}}},"3":{"name":"(anonymous_4)","decl":{"start":{"line":122,"column":33},"end":{"line":122,"column":38}},"loc":{"start":{"line":130,"column":4},"end":{"line":145,"column":1}}},"4":{"name":"(anonymous_5)","decl":{"start":{"line":147,"column":35},"end":{"line":147,"column":40}},"loc":{"start":{"line":147,"column":66},"end":{"line":194,"column":1}}},"5":{"name":"(anonymous_6)","decl":{"start":{"line":195,"column":33},"end":{"line":195,"column":38}},"loc":{"start":{"line":195,"column":58},"end":{"line":199,"column":1}}}},"branchMap":{"0":{"loc":{"start":{"line":18,"column":2},"end":{"line":22,"column":3}},"type":"if","locations":[{"start":{"line":18,"column":2},"end":{"line":22,"column":3}}]},"1":{"loc":{"start":{"line":41,"column":4},"end":{"line":48,"column":5}},"type":"if","locations":[{"start":{"line":41,"column":4},"end":{"line":48,"column":5}}]},"2":{"loc":{"start":{"line":42,"column":6},"end":{"line":47,"column":7}},"type":"if","locations":[{"start":{"line":42,"column":6},"end":{"line":47,"column":7}}]},"3":{"loc":{"start":{"line":65,"column":2},"end":{"line":67,"column":3}},"type":"if","locations":[{"start":{"line":65,"column":2},"end":{"line":67,"column":3}}]},"4":{"loc":{"start":{"line":65,"column":6},"end":{"line":65,"column":63}},"type":"binary-expr","locations":[{"start":{"line":65,"column":6},"end":{"line":65,"column":11}},{"start":{"line":65,"column":15},"end":{"line":65,"column":63}}]},"5":{"loc":{"start":{"line":69,"column":2},"end":{"line":71,"column":3}},"type":"if","locations":[{"start":{"line":69,"column":2},"end":{"line":71,"column":3}}]},"6":{"loc":{"start":{"line":118,"column":2},"end":{"line":118,"column":55}},"type":"if","locations":[{"start":{"line":118,"column":2},"end":{"line":118,"column":55}}]},"7":{"loc":{"start":{"line":131,"column":2},"end":{"line":133,"column":3}},"type":"if","locations":[{"start":{"line":131,"column":2},"end":{"line":133,"column":3}}]},"8":{"loc":{"start":{"line":148,"column":2},"end":{"line":150,"column":3}},"type":"if","locations":[{"start":{"line":148,"column":2},"end":{"line":150,"column":3}}]},"9":{"loc":{"start":{"line":162,"column":4},"end":{"line":164,"column":5}},"type":"if","locations":[{"start":{"line":162,"column":4},"end":{"line":164,"column":5}}]},"10":{"loc":{"start":{"line":162,"column":8},"end":{"line":162,"column":51}},"type":"binary-expr","locations":[{"start":{"line":162,"column":8},"end":{"line":162,"column":13}},{"start":{"line":162,"column":17},"end":{"line":162,"column":51}}]},"11":{"loc":{"start":{"line":186,"column":4},"end":{"line":188,"column":5}},"type":"if","locations":[{"start":{"line":186,"column":4},"end":{"line":188,"column":5}}]},"12":{"loc":{"start":{"line":189,"column":4},"end":{"line":191,"column":5}},"type":"if","locations":[{"start":{"line":189,"column":4},"end":{"line":191,"column":5}}]}},"s":{"0":3,"1":3,"2":3,"3":3,"4":3,"5":3,"6":3,"7":3,"8":0,"9":3,"10":3,"11":3,"12":0,"13":0,"14":0,"15":0,"16":0,"17":3,"18":3,"19":5,"20":5,"21":1,"22":4,"23":0,"24":4,"25":4,"26":4,"27":3,"28":3,"29":3,"30":0,"31":0,"32":0,"33":0,"34":3,"35":3,"36":0,"37":0,"38":0,"39":3,"40":3,"41":1,"42":0,"43":1,"44":1,"45":1,"46":1,"47":0,"48":1,"49":1,"50":1,"51":1,"52":0,"53":0,"54":0,"55":0,"56":0,"57":3,"58":3,"59":0,"60":3},"f":{"0":3,"1":5,"2":0,"3":0,"4":1,"5":0},"b":{"0":[0],"1":[0],"2":[0],"3":[1],"4":[5,4],"5":[0],"6":[0],"7":[0],"8":[0],"9":[0],"10":[1,1],"11":[0],"12":[0]}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\validators\\album.validator.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\validators\\album.validator.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":24}},"1":{"start":{"line":3,"column":24},"end":{"line":19,"column":2}},"2":{"start":{"line":14,"column":22},"end":{"line":14,"column":48}},"3":{"start":{"line":21,"column":13},"end":{"line":23,"column":3}},"4":{"start":{"line":25,"column":13},"end":{"line":25,"column":59}}},"fnMap":{"0":{"name":"(anonymous_0)","decl":{"start":{"line":14,"column":12},"end":{"line":14,"column":13}},"loc":{"start":{"line":14,"column":22},"end":{"line":14,"column":48}}}},"branchMap":{},"s":{"0":3,"1":3,"2":1,"3":3,"4":3},"f":{"0":1},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\validators\\group.validator.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\validators\\group.validator.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":24}},"1":{"start":{"line":3,"column":13},"end":{"line":10,"column":3}}},"fnMap":{},"branchMap":{},"s":{"0":3,"1":3},"f":{},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\validators\\song.validator.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\validators\\song.validator.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":24}},"1":{"start":{"line":3,"column":13},"end":{"line":11,"column":3}}},"fnMap":{},"branchMap":{},"s":{"0":3,"1":3},"f":{},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\validators\\user.validator.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\src\\validators\\user.validator.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":24}},"1":{"start":{"line":4,"column":2},"end":{"line":4,"column":62}},"2":{"start":{"line":7,"column":13},"end":{"line":13,"column":3}},"3":{"start":{"line":15,"column":13},"end":{"line":20,"column":3}},"4":{"start":{"line":22,"column":13},"end":{"line":26,"column":3}},"5":{"start":{"line":29,"column":13},"end":{"line":43,"column":44}},"6":{"start":{"line":42,"column":4},"end":{"line":42,"column":40}}},"fnMap":{"0":{"name":"(anonymous_0)","decl":{"start":{"line":40,"column":10},"end":{"line":40,"column":11}},"loc":{"start":{"line":40,"column":19},"end":{"line":43,"column":3}}}},"branchMap":{},"s":{"0":3,"1":3,"2":3,"3":3,"4":3,"5":3,"6":0},"f":{"0":0},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\tests\\helpers\\auth.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\tests\\helpers\\auth.ts","statementMap":{"0":{"start":{"line":6,"column":0},"end":{"line":6,"column":7}},"1":{"start":{"line":1,"column":0},"end":{"line":1,"column":39}},"2":{"start":{"line":2,"column":0},"end":{"line":2,"column":32}},"3":{"start":{"line":3,"column":0},"end":{"line":3,"column":30}},"4":{"start":{"line":4,"column":0},"end":{"line":4,"column":30}},"5":{"start":{"line":7,"column":25},"end":{"line":7,"column":58}},"6":{"start":{"line":9,"column":15},"end":{"line":17,"column":4}},"7":{"start":{"line":19,"column":19},"end":{"line":22,"column":4}},"8":{"start":{"line":24,"column":2},"end":{"line":26,"column":3}},"9":{"start":{"line":25,"column":4},"end":{"line":25,"column":70}},"10":{"start":{"line":28,"column":2},"end":{"line":31,"column":4}}},"fnMap":{"0":{"name":"getTestUserToken","decl":{"start":{"line":6,"column":22},"end":{"line":6,"column":38}},"loc":{"start":{"line":6,"column":38},"end":{"line":32,"column":1}}}},"branchMap":{"0":{"loc":{"start":{"line":24,"column":2},"end":{"line":26,"column":3}},"type":"if","locations":[{"start":{"line":24,"column":2},"end":{"line":26,"column":3}}]}},"s":{"0":2,"1":2,"2":2,"3":2,"4":2,"5":2,"6":2,"7":2,"8":2,"9":1,"10":1},"f":{"0":2},"b":{"0":[1]}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\tests\\helpers\\db.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\tests\\helpers\\db.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":46}},"1":{"start":{"line":3,"column":13},"end":{"line":3,"column":41}},"2":{"start":{"line":5,"column":25},"end":{"line":8,"column":1}},"3":{"start":{"line":6,"column":2},"end":{"line":6,"column":26}},"4":{"start":{"line":7,"column":2},"end":{"line":7,"column":16}},"5":{"start":{"line":5,"column":13},"end":{"line":5,"column":25}},"6":{"start":{"line":10,"column":28},"end":{"line":12,"column":1}},"7":{"start":{"line":11,"column":2},"end":{"line":11,"column":29}},"8":{"start":{"line":10,"column":13},"end":{"line":10,"column":28}}},"fnMap":{"0":{"name":"(anonymous_0)","decl":{"start":{"line":5,"column":25},"end":{"line":5,"column":30}},"loc":{"start":{"line":5,"column":36},"end":{"line":8,"column":1}}},"1":{"name":"(anonymous_1)","decl":{"start":{"line":10,"column":28},"end":{"line":10,"column":33}},"loc":{"start":{"line":10,"column":39},"end":{"line":12,"column":1}}}},"branchMap":{},"s":{"0":3,"1":3,"2":3,"3":0,"4":0,"5":3,"6":3,"7":0,"8":3},"f":{"0":0,"1":0},"b":{}}
,"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\tests\\helpers\\testHelpers.ts": {"path":"C:\\Users\\Jack\\Desktop\\apps\\rhcp-reviews\\backend\\tests\\helpers\\testHelpers.ts","statementMap":{"0":{"start":{"line":1,"column":0},"end":{"line":1,"column":46}},"1":{"start":{"line":2,"column":0},"end":{"line":2,"column":39}},"2":{"start":{"line":3,"column":0},"end":{"line":3,"column":32}},"3":{"start":{"line":4,"column":0},"end":{"line":4,"column":30}},"4":{"start":{"line":6,"column":15},"end":{"line":6,"column":33}},"5":{"start":{"line":8,"column":13},"end":{"line":98,"column":2}},"6":{"start":{"line":11,"column":17},"end":{"line":19,"column":6}},"7":{"start":{"line":22,"column":18},"end":{"line":31,"column":6}},"8":{"start":{"line":34,"column":17},"end":{"line":44,"column":6}},"9":{"start":{"line":46,"column":4},"end":{"line":46,"column":33}},"10":{"start":{"line":50,"column":4},"end":{"line":61,"column":7}},"11":{"start":{"line":65,"column":4},"end":{"line":96,"column":5}},"12":{"start":{"line":67,"column":19},"end":{"line":77,"column":8}},"13":{"start":{"line":80,"column":23},"end":{"line":83,"column":8}},"14":{"start":{"line":85,"column":6},"end":{"line":87,"column":7}},"15":{"start":{"line":86,"column":8},"end":{"line":86,"column":74}},"16":{"start":{"line":89,"column":6},"end":{"line":92,"column":8}},"17":{"start":{"line":94,"column":6},"end":{"line":94,"column":56}},"18":{"start":{"line":95,"column":6},"end":{"line":95,"column":18}}},"fnMap":{"0":{"name":"(anonymous_1)","decl":{"start":{"line":9,"column":17},"end":{"line":9,"column":22}},"loc":{"start":{"line":9,"column":28},"end":{"line":47,"column":3}}},"1":{"name":"(anonymous_2)","decl":{"start":{"line":49,"column":19},"end":{"line":49,"column":24}},"loc":{"start":{"line":49,"column":30},"end":{"line":62,"column":3}}},"2":{"name":"(anonymous_3)","decl":{"start":{"line":64,"column":20},"end":{"line":64,"column":25}},"loc":{"start":{"line":64,"column":31},"end":{"line":97,"column":3}}}},"branchMap":{"0":{"loc":{"start":{"line":85,"column":6},"end":{"line":87,"column":7}},"type":"if","locations":[{"start":{"line":85,"column":6},"end":{"line":87,"column":7}}]},"1":{"loc":{"start":{"line":91,"column":16},"end":{"line":91,"column":49}},"type":"binary-expr","locations":[{"start":{"line":91,"column":16},"end":{"line":91,"column":38}},{"start":{"line":91,"column":42},"end":{"line":91,"column":49}}]}},"s":{"0":2,"1":2,"2":2,"3":2,"4":2,"5":2,"6":2,"7":2,"8":2,"9":2,"10":2,"11":0,"12":0,"13":0,"14":0,"15":0,"16":0,"17":0,"18":0},"f":{"0":2,"1":2,"2":0},"b":{"0":[0],"1":[0,0]}}
}

```

# coverage\lcov-report\base.css

```css
body, html {
  margin:0; padding: 0;
  height: 100%;
}
body {
    font-family: Helvetica Neue, Helvetica, Arial;
    font-size: 14px;
    color:#333;
}
.small { font-size: 12px; }
*, *:after, *:before {
  -webkit-box-sizing:border-box;
     -moz-box-sizing:border-box;
          box-sizing:border-box;
  }
h1 { font-size: 20px; margin: 0;}
h2 { font-size: 14px; }
pre {
    font: 12px/1.4 Consolas, "Liberation Mono", Menlo, Courier, monospace;
    margin: 0;
    padding: 0;
    -moz-tab-size: 2;
    -o-tab-size:  2;
    tab-size: 2;
}
a { color:#0074D9; text-decoration:none; }
a:hover { text-decoration:underline; }
.strong { font-weight: bold; }
.space-top1 { padding: 10px 0 0 0; }
.pad2y { padding: 20px 0; }
.pad1y { padding: 10px 0; }
.pad2x { padding: 0 20px; }
.pad2 { padding: 20px; }
.pad1 { padding: 10px; }
.space-left2 { padding-left:55px; }
.space-right2 { padding-right:20px; }
.center { text-align:center; }
.clearfix { display:block; }
.clearfix:after {
  content:'';
  display:block;
  height:0;
  clear:both;
  visibility:hidden;
  }
.fl { float: left; }
@media only screen and (max-width:640px) {
  .col3 { width:100%; max-width:100%; }
  .hide-mobile { display:none!important; }
}

.quiet {
  color: #7f7f7f;
  color: rgba(0,0,0,0.5);
}
.quiet a { opacity: 0.7; }

.fraction {
  font-family: Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  font-size: 10px;
  color: #555;
  background: #E8E8E8;
  padding: 4px 5px;
  border-radius: 3px;
  vertical-align: middle;
}

div.path a:link, div.path a:visited { color: #333; }
table.coverage {
  border-collapse: collapse;
  margin: 10px 0 0 0;
  padding: 0;
}

table.coverage td {
  margin: 0;
  padding: 0;
  vertical-align: top;
}
table.coverage td.line-count {
    text-align: right;
    padding: 0 5px 0 20px;
}
table.coverage td.line-coverage {
    text-align: right;
    padding-right: 10px;
    min-width:20px;
}

table.coverage td span.cline-any {
    display: inline-block;
    padding: 0 5px;
    width: 100%;
}
.missing-if-branch {
    display: inline-block;
    margin-right: 5px;
    border-radius: 3px;
    position: relative;
    padding: 0 4px;
    background: #333;
    color: yellow;
}

.skip-if-branch {
    display: none;
    margin-right: 10px;
    position: relative;
    padding: 0 4px;
    background: #ccc;
    color: white;
}
.missing-if-branch .typ, .skip-if-branch .typ {
    color: inherit !important;
}
.coverage-summary {
  border-collapse: collapse;
  width: 100%;
}
.coverage-summary tr { border-bottom: 1px solid #bbb; }
.keyline-all { border: 1px solid #ddd; }
.coverage-summary td, .coverage-summary th { padding: 10px; }
.coverage-summary tbody { border: 1px solid #bbb; }
.coverage-summary td { border-right: 1px solid #bbb; }
.coverage-summary td:last-child { border-right: none; }
.coverage-summary th {
  text-align: left;
  font-weight: normal;
  white-space: nowrap;
}
.coverage-summary th.file { border-right: none !important; }
.coverage-summary th.pct { }
.coverage-summary th.pic,
.coverage-summary th.abs,
.coverage-summary td.pct,
.coverage-summary td.abs { text-align: right; }
.coverage-summary td.file { white-space: nowrap;  }
.coverage-summary td.pic { min-width: 120px !important;  }
.coverage-summary tfoot td { }

.coverage-summary .sorter {
    height: 10px;
    width: 7px;
    display: inline-block;
    margin-left: 0.5em;
    background: url(sort-arrow-sprite.png) no-repeat scroll 0 0 transparent;
}
.coverage-summary .sorted .sorter {
    background-position: 0 -20px;
}
.coverage-summary .sorted-desc .sorter {
    background-position: 0 -10px;
}
.status-line {  height: 10px; }
/* yellow */
.cbranch-no { background: yellow !important; color: #111; }
/* dark red */
.red.solid, .status-line.low, .low .cover-fill { background:#C21F39 }
.low .chart { border:1px solid #C21F39 }
.highlighted,
.highlighted .cstat-no, .highlighted .fstat-no, .highlighted .cbranch-no{
  background: #C21F39 !important;
}
/* medium red */
.cstat-no, .fstat-no, .cbranch-no, .cbranch-no { background:#F6C6CE }
/* light red */
.low, .cline-no { background:#FCE1E5 }
/* light green */
.high, .cline-yes { background:rgb(230,245,208) }
/* medium green */
.cstat-yes { background:rgb(161,215,106) }
/* dark green */
.status-line.high, .high .cover-fill { background:rgb(77,146,33) }
.high .chart { border:1px solid rgb(77,146,33) }
/* dark yellow (gold) */
.status-line.medium, .medium .cover-fill { background: #f9cd0b; }
.medium .chart { border:1px solid #f9cd0b; }
/* light yellow */
.medium { background: #fff4c2; }

.cstat-skip { background: #ddd; color: #111; }
.fstat-skip { background: #ddd; color: #111 !important; }
.cbranch-skip { background: #ddd !important; color: #111; }

span.cline-neutral { background: #eaeaea; }

.coverage-summary td.empty {
    opacity: .5;
    padding-top: 4px;
    padding-bottom: 4px;
    line-height: 1;
    color: #888;
}

.cover-fill, .cover-empty {
  display:inline-block;
  height: 12px;
}
.chart {
  line-height: 0;
}
.cover-empty {
    background: white;
}
.cover-full {
    border-right: none !important;
}
pre.prettyprint {
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
}
.com { color: #999 !important; }
.ignore-none { color: #999; font-weight: normal; }

.wrapper {
  min-height: 100%;
  height: auto !important;
  height: 100%;
  margin: 0 auto -48px;
}
.footer, .push {
  height: 48px;
}

```

# coverage\lcov-report\block-navigation.js

```js
/* eslint-disable */
var jumpToCode = (function init() {
    // Classes of code we would like to highlight in the file view
    var missingCoverageClasses = ['.cbranch-no', '.cstat-no', '.fstat-no'];

    // Elements to highlight in the file listing view
    var fileListingElements = ['td.pct.low'];

    // We don't want to select elements that are direct descendants of another match
    var notSelector = ':not(' + missingCoverageClasses.join('):not(') + ') > '; // becomes `:not(a):not(b) > `

    // Selecter that finds elements on the page to which we can jump
    var selector =
        fileListingElements.join(', ') +
        ', ' +
        notSelector +
        missingCoverageClasses.join(', ' + notSelector); // becomes `:not(a):not(b) > a, :not(a):not(b) > b`

    // The NodeList of matching elements
    var missingCoverageElements = document.querySelectorAll(selector);

    var currentIndex;

    function toggleClass(index) {
        missingCoverageElements
            .item(currentIndex)
            .classList.remove('highlighted');
        missingCoverageElements.item(index).classList.add('highlighted');
    }

    function makeCurrent(index) {
        toggleClass(index);
        currentIndex = index;
        missingCoverageElements.item(index).scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
    }

    function goToPrevious() {
        var nextIndex = 0;
        if (typeof currentIndex !== 'number' || currentIndex === 0) {
            nextIndex = missingCoverageElements.length - 1;
        } else if (missingCoverageElements.length > 1) {
            nextIndex = currentIndex - 1;
        }

        makeCurrent(nextIndex);
    }

    function goToNext() {
        var nextIndex = 0;

        if (
            typeof currentIndex === 'number' &&
            currentIndex < missingCoverageElements.length - 1
        ) {
            nextIndex = currentIndex + 1;
        }

        makeCurrent(nextIndex);
    }

    return function jump(event) {
        if (
            document.getElementById('fileSearch') === document.activeElement &&
            document.activeElement != null
        ) {
            // if we're currently focused on the search input, we don't want to navigate
            return;
        }

        switch (event.which) {
            case 78: // n
            case 74: // j
                goToNext();
                break;
            case 66: // b
            case 75: // k
            case 80: // p
                goToPrevious();
                break;
        }
    };
})();
window.addEventListener('keydown', jumpToCode);

```

# coverage\lcov-report\favicon.png

This is a binary file of the type: Image

# coverage\lcov-report\index.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for All files</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="prettify.css" />
    <link rel="stylesheet" href="base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1>All files</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">64.37% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>365/567</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">11.76% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>16/136</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">31.39% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>27/86</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">63.91% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>333/521</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line medium'></div>
    <div class="pad1">
<table class="coverage-summary">
<thead>
<tr>
   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>
   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
</tr>
</thead>
<tbody><tr>
	<td class="file high" data-value="src"><a href="src/index.html">src</a></td>
	<td data-value="80" class="pic high">
	<div class="chart"><div class="cover-fill" style="width: 80%"></div><div class="cover-empty" style="width: 20%"></div></div>
	</td>
	<td data-value="80" class="pct high">80%</td>
	<td data-value="60" class="abs high">48/60</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="2" class="abs low">0/2</td>
	<td data-value="20" class="pct low">20%</td>
	<td data-value="10" class="abs low">2/10</td>
	<td data-value="80.7" class="pct high">80.7%</td>
	<td data-value="57" class="abs high">46/57</td>
	</tr>

<tr>
	<td class="file medium" data-value="src/controllers"><a href="src/controllers/index.html">src/controllers</a></td>
	<td data-value="52.94" class="pic medium">
	<div class="chart"><div class="cover-fill" style="width: 52%"></div><div class="cover-empty" style="width: 48%"></div></div>
	</td>
	<td data-value="52.94" class="pct medium">52.94%</td>
	<td data-value="119" class="abs medium">63/119</td>
	<td data-value="13.63" class="pct low">13.63%</td>
	<td data-value="22" class="abs low">3/22</td>
	<td data-value="29.16" class="pct low">29.16%</td>
	<td data-value="24" class="abs low">7/24</td>
	<td data-value="53.84" class="pct medium">53.84%</td>
	<td data-value="117" class="abs medium">63/117</td>
	</tr>

<tr>
	<td class="file high" data-value="src/db"><a href="src/db/index.html">src/db</a></td>
	<td data-value="100" class="pic high">
	<div class="chart"><div class="cover-fill cover-full" style="width: 100%"></div><div class="cover-empty" style="width: 0%"></div></div>
	</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="3" class="abs high">3/3</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="3" class="abs high">3/3</td>
	</tr>

<tr>
	<td class="file low" data-value="src/errors"><a href="src/errors/index.html">src/errors</a></td>
	<td data-value="38.09" class="pic low">
	<div class="chart"><div class="cover-fill" style="width: 38%"></div><div class="cover-empty" style="width: 62%"></div></div>
	</td>
	<td data-value="38.09" class="pct low">38.09%</td>
	<td data-value="21" class="abs low">8/21</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="5" class="abs low">0/5</td>
	<td data-value="20" class="pct low">20%</td>
	<td data-value="5" class="abs low">1/5</td>
	<td data-value="38.09" class="pct low">38.09%</td>
	<td data-value="21" class="abs low">8/21</td>
	</tr>

<tr>
	<td class="file medium" data-value="src/middleware"><a href="src/middleware/index.html">src/middleware</a></td>
	<td data-value="78.43" class="pic medium">
	<div class="chart"><div class="cover-fill" style="width: 78%"></div><div class="cover-empty" style="width: 22%"></div></div>
	</td>
	<td data-value="78.43" class="pct medium">78.43%</td>
	<td data-value="51" class="abs medium">40/51</td>
	<td data-value="28.57" class="pct low">28.57%</td>
	<td data-value="14" class="abs low">4/14</td>
	<td data-value="85.71" class="pct high">85.71%</td>
	<td data-value="7" class="abs high">6/7</td>
	<td data-value="80.85" class="pct high">80.85%</td>
	<td data-value="47" class="abs high">38/47</td>
	</tr>

<tr>
	<td class="file high" data-value="src/routes"><a href="src/routes/index.html">src/routes</a></td>
	<td data-value="100" class="pic high">
	<div class="chart"><div class="cover-fill cover-full" style="width: 100%"></div><div class="cover-empty" style="width: 0%"></div></div>
	</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="57" class="abs high">57/57</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="57" class="abs high">57/57</td>
	</tr>

<tr>
	<td class="file medium" data-value="src/services"><a href="src/services/index.html">src/services</a></td>
	<td data-value="51.24" class="pic medium">
	<div class="chart"><div class="cover-fill" style="width: 51%"></div><div class="cover-empty" style="width: 49%"></div></div>
	</td>
	<td data-value="51.24" class="pct medium">51.24%</td>
	<td data-value="201" class="abs medium">103/201</td>
	<td data-value="8.98" class="pct low">8.98%</td>
	<td data-value="89" class="abs low">8/89</td>
	<td data-value="21.87" class="pct low">21.87%</td>
	<td data-value="32" class="abs low">7/32</td>
	<td data-value="46.38" class="pct low">46.38%</td>
	<td data-value="166" class="abs low">77/166</td>
	</tr>

<tr>
	<td class="file high" data-value="src/validators"><a href="src/validators/index.html">src/validators</a></td>
	<td data-value="93.75" class="pic high">
	<div class="chart"><div class="cover-fill" style="width: 93%"></div><div class="cover-empty" style="width: 7%"></div></div>
	</td>
	<td data-value="93.75" class="pct high">93.75%</td>
	<td data-value="16" class="abs high">15/16</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="50" class="pct medium">50%</td>
	<td data-value="2" class="abs medium">1/2</td>
	<td data-value="93.75" class="pct high">93.75%</td>
	<td data-value="16" class="abs high">15/16</td>
	</tr>

<tr>
	<td class="file medium" data-value="tests/helpers"><a href="tests/helpers/index.html">tests/helpers</a></td>
	<td data-value="71.79" class="pic medium">
	<div class="chart"><div class="cover-fill" style="width: 71%"></div><div class="cover-empty" style="width: 29%"></div></div>
	</td>
	<td data-value="71.79" class="pct medium">71.79%</td>
	<td data-value="39" class="abs medium">28/39</td>
	<td data-value="25" class="pct low">25%</td>
	<td data-value="4" class="abs low">1/4</td>
	<td data-value="50" class="pct medium">50%</td>
	<td data-value="6" class="abs medium">3/6</td>
	<td data-value="70.27" class="pct medium">70.27%</td>
	<td data-value="37" class="abs medium">26/37</td>
	</tr>

</tbody>
</table>
</div>
                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="sorter.js"></script>
        <script src="block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\prettify.css

```css
.pln{color:#000}@media screen{.str{color:#080}.kwd{color:#008}.com{color:#800}.typ{color:#606}.lit{color:#066}.pun,.opn,.clo{color:#660}.tag{color:#008}.atn{color:#606}.atv{color:#080}.dec,.var{color:#606}.fun{color:red}}@media print,projection{.str{color:#060}.kwd{color:#006;font-weight:bold}.com{color:#600;font-style:italic}.typ{color:#404;font-weight:bold}.lit{color:#044}.pun,.opn,.clo{color:#440}.tag{color:#006;font-weight:bold}.atn{color:#404}.atv{color:#060}}pre.prettyprint{padding:2px;border:1px solid #888}ol.linenums{margin-top:0;margin-bottom:0}li.L0,li.L1,li.L2,li.L3,li.L5,li.L6,li.L7,li.L8{list-style-type:none}li.L1,li.L3,li.L5,li.L7,li.L9{background:#eee}

```

# coverage\lcov-report\prettify.js

```js
/* eslint-disable */
window.PR_SHOULD_USE_CONTINUATION=true;(function(){var h=["break,continue,do,else,for,if,return,while"];var u=[h,"auto,case,char,const,default,double,enum,extern,float,goto,int,long,register,short,signed,sizeof,static,struct,switch,typedef,union,unsigned,void,volatile"];var p=[u,"catch,class,delete,false,import,new,operator,private,protected,public,this,throw,true,try,typeof"];var l=[p,"alignof,align_union,asm,axiom,bool,concept,concept_map,const_cast,constexpr,decltype,dynamic_cast,explicit,export,friend,inline,late_check,mutable,namespace,nullptr,reinterpret_cast,static_assert,static_cast,template,typeid,typename,using,virtual,where"];var x=[p,"abstract,boolean,byte,extends,final,finally,implements,import,instanceof,null,native,package,strictfp,super,synchronized,throws,transient"];var R=[x,"as,base,by,checked,decimal,delegate,descending,dynamic,event,fixed,foreach,from,group,implicit,in,interface,internal,into,is,lock,object,out,override,orderby,params,partial,readonly,ref,sbyte,sealed,stackalloc,string,select,uint,ulong,unchecked,unsafe,ushort,var"];var r="all,and,by,catch,class,else,extends,false,finally,for,if,in,is,isnt,loop,new,no,not,null,of,off,on,or,return,super,then,true,try,unless,until,when,while,yes";var w=[p,"debugger,eval,export,function,get,null,set,undefined,var,with,Infinity,NaN"];var s="caller,delete,die,do,dump,elsif,eval,exit,foreach,for,goto,if,import,last,local,my,next,no,our,print,package,redo,require,sub,undef,unless,until,use,wantarray,while,BEGIN,END";var I=[h,"and,as,assert,class,def,del,elif,except,exec,finally,from,global,import,in,is,lambda,nonlocal,not,or,pass,print,raise,try,with,yield,False,True,None"];var f=[h,"alias,and,begin,case,class,def,defined,elsif,end,ensure,false,in,module,next,nil,not,or,redo,rescue,retry,self,super,then,true,undef,unless,until,when,yield,BEGIN,END"];var H=[h,"case,done,elif,esac,eval,fi,function,in,local,set,then,until"];var A=[l,R,w,s+I,f,H];var e=/^(DIR|FILE|vector|(de|priority_)?queue|list|stack|(const_)?iterator|(multi)?(set|map)|bitset|u?(int|float)\d*)/;var C="str";var z="kwd";var j="com";var O="typ";var G="lit";var L="pun";var F="pln";var m="tag";var E="dec";var J="src";var P="atn";var n="atv";var N="nocode";var M="(?:^^\\.?|[+-]|\\!|\\!=|\\!==|\\#|\\%|\\%=|&|&&|&&=|&=|\\(|\\*|\\*=|\\+=|\\,|\\-=|\\->|\\/|\\/=|:|::|\\;|<|<<|<<=|<=|=|==|===|>|>=|>>|>>=|>>>|>>>=|\\?|\\@|\\[|\\^|\\^=|\\^\\^|\\^\\^=|\\{|\\||\\|=|\\|\\||\\|\\|=|\\~|break|case|continue|delete|do|else|finally|instanceof|return|throw|try|typeof)\\s*";function k(Z){var ad=0;var S=false;var ac=false;for(var V=0,U=Z.length;V<U;++V){var ae=Z[V];if(ae.ignoreCase){ac=true}else{if(/[a-z]/i.test(ae.source.replace(/\\u[0-9a-f]{4}|\\x[0-9a-f]{2}|\\[^ux]/gi,""))){S=true;ac=false;break}}}var Y={b:8,t:9,n:10,v:11,f:12,r:13};function ab(ah){var ag=ah.charCodeAt(0);if(ag!==92){return ag}var af=ah.charAt(1);ag=Y[af];if(ag){return ag}else{if("0"<=af&&af<="7"){return parseInt(ah.substring(1),8)}else{if(af==="u"||af==="x"){return parseInt(ah.substring(2),16)}else{return ah.charCodeAt(1)}}}}function T(af){if(af<32){return(af<16?"\\x0":"\\x")+af.toString(16)}var ag=String.fromCharCode(af);if(ag==="\\"||ag==="-"||ag==="["||ag==="]"){ag="\\"+ag}return ag}function X(am){var aq=am.substring(1,am.length-1).match(new RegExp("\\\\u[0-9A-Fa-f]{4}|\\\\x[0-9A-Fa-f]{2}|\\\\[0-3][0-7]{0,2}|\\\\[0-7]{1,2}|\\\\[\\s\\S]|-|[^-\\\\]","g"));var ak=[];var af=[];var ao=aq[0]==="^";for(var ar=ao?1:0,aj=aq.length;ar<aj;++ar){var ah=aq[ar];if(/\\[bdsw]/i.test(ah)){ak.push(ah)}else{var ag=ab(ah);var al;if(ar+2<aj&&"-"===aq[ar+1]){al=ab(aq[ar+2]);ar+=2}else{al=ag}af.push([ag,al]);if(!(al<65||ag>122)){if(!(al<65||ag>90)){af.push([Math.max(65,ag)|32,Math.min(al,90)|32])}if(!(al<97||ag>122)){af.push([Math.max(97,ag)&~32,Math.min(al,122)&~32])}}}}af.sort(function(av,au){return(av[0]-au[0])||(au[1]-av[1])});var ai=[];var ap=[NaN,NaN];for(var ar=0;ar<af.length;++ar){var at=af[ar];if(at[0]<=ap[1]+1){ap[1]=Math.max(ap[1],at[1])}else{ai.push(ap=at)}}var an=["["];if(ao){an.push("^")}an.push.apply(an,ak);for(var ar=0;ar<ai.length;++ar){var at=ai[ar];an.push(T(at[0]));if(at[1]>at[0]){if(at[1]+1>at[0]){an.push("-")}an.push(T(at[1]))}}an.push("]");return an.join("")}function W(al){var aj=al.source.match(new RegExp("(?:\\[(?:[^\\x5C\\x5D]|\\\\[\\s\\S])*\\]|\\\\u[A-Fa-f0-9]{4}|\\\\x[A-Fa-f0-9]{2}|\\\\[0-9]+|\\\\[^ux0-9]|\\(\\?[:!=]|[\\(\\)\\^]|[^\\x5B\\x5C\\(\\)\\^]+)","g"));var ah=aj.length;var an=[];for(var ak=0,am=0;ak<ah;++ak){var ag=aj[ak];if(ag==="("){++am}else{if("\\"===ag.charAt(0)){var af=+ag.substring(1);if(af&&af<=am){an[af]=-1}}}}for(var ak=1;ak<an.length;++ak){if(-1===an[ak]){an[ak]=++ad}}for(var ak=0,am=0;ak<ah;++ak){var ag=aj[ak];if(ag==="("){++am;if(an[am]===undefined){aj[ak]="(?:"}}else{if("\\"===ag.charAt(0)){var af=+ag.substring(1);if(af&&af<=am){aj[ak]="\\"+an[am]}}}}for(var ak=0,am=0;ak<ah;++ak){if("^"===aj[ak]&&"^"!==aj[ak+1]){aj[ak]=""}}if(al.ignoreCase&&S){for(var ak=0;ak<ah;++ak){var ag=aj[ak];var ai=ag.charAt(0);if(ag.length>=2&&ai==="["){aj[ak]=X(ag)}else{if(ai!=="\\"){aj[ak]=ag.replace(/[a-zA-Z]/g,function(ao){var ap=ao.charCodeAt(0);return"["+String.fromCharCode(ap&~32,ap|32)+"]"})}}}}return aj.join("")}var aa=[];for(var V=0,U=Z.length;V<U;++V){var ae=Z[V];if(ae.global||ae.multiline){throw new Error(""+ae)}aa.push("(?:"+W(ae)+")")}return new RegExp(aa.join("|"),ac?"gi":"g")}function a(V){var U=/(?:^|\s)nocode(?:\s|$)/;var X=[];var T=0;var Z=[];var W=0;var S;if(V.currentStyle){S=V.currentStyle.whiteSpace}else{if(window.getComputedStyle){S=document.defaultView.getComputedStyle(V,null).getPropertyValue("white-space")}}var Y=S&&"pre"===S.substring(0,3);function aa(ab){switch(ab.nodeType){case 1:if(U.test(ab.className)){return}for(var ae=ab.firstChild;ae;ae=ae.nextSibling){aa(ae)}var ad=ab.nodeName;if("BR"===ad||"LI"===ad){X[W]="\n";Z[W<<1]=T++;Z[(W++<<1)|1]=ab}break;case 3:case 4:var ac=ab.nodeValue;if(ac.length){if(!Y){ac=ac.replace(/[ \t\r\n]+/g," ")}else{ac=ac.replace(/\r\n?/g,"\n")}X[W]=ac;Z[W<<1]=T;T+=ac.length;Z[(W++<<1)|1]=ab}break}}aa(V);return{sourceCode:X.join("").replace(/\n$/,""),spans:Z}}function B(S,U,W,T){if(!U){return}var V={sourceCode:U,basePos:S};W(V);T.push.apply(T,V.decorations)}var v=/\S/;function o(S){var V=undefined;for(var U=S.firstChild;U;U=U.nextSibling){var T=U.nodeType;V=(T===1)?(V?S:U):(T===3)?(v.test(U.nodeValue)?S:V):V}return V===S?undefined:V}function g(U,T){var S={};var V;(function(){var ad=U.concat(T);var ah=[];var ag={};for(var ab=0,Z=ad.length;ab<Z;++ab){var Y=ad[ab];var ac=Y[3];if(ac){for(var ae=ac.length;--ae>=0;){S[ac.charAt(ae)]=Y}}var af=Y[1];var aa=""+af;if(!ag.hasOwnProperty(aa)){ah.push(af);ag[aa]=null}}ah.push(/[\0-\uffff]/);V=k(ah)})();var X=T.length;var W=function(ah){var Z=ah.sourceCode,Y=ah.basePos;var ad=[Y,F];var af=0;var an=Z.match(V)||[];var aj={};for(var ae=0,aq=an.length;ae<aq;++ae){var ag=an[ae];var ap=aj[ag];var ai=void 0;var am;if(typeof ap==="string"){am=false}else{var aa=S[ag.charAt(0)];if(aa){ai=ag.match(aa[1]);ap=aa[0]}else{for(var ao=0;ao<X;++ao){aa=T[ao];ai=ag.match(aa[1]);if(ai){ap=aa[0];break}}if(!ai){ap=F}}am=ap.length>=5&&"lang-"===ap.substring(0,5);if(am&&!(ai&&typeof ai[1]==="string")){am=false;ap=J}if(!am){aj[ag]=ap}}var ab=af;af+=ag.length;if(!am){ad.push(Y+ab,ap)}else{var al=ai[1];var ak=ag.indexOf(al);var ac=ak+al.length;if(ai[2]){ac=ag.length-ai[2].length;ak=ac-al.length}var ar=ap.substring(5);B(Y+ab,ag.substring(0,ak),W,ad);B(Y+ab+ak,al,q(ar,al),ad);B(Y+ab+ac,ag.substring(ac),W,ad)}}ah.decorations=ad};return W}function i(T){var W=[],S=[];if(T.tripleQuotedStrings){W.push([C,/^(?:\'\'\'(?:[^\'\\]|\\[\s\S]|\'{1,2}(?=[^\']))*(?:\'\'\'|$)|\"\"\"(?:[^\"\\]|\\[\s\S]|\"{1,2}(?=[^\"]))*(?:\"\"\"|$)|\'(?:[^\\\']|\\[\s\S])*(?:\'|$)|\"(?:[^\\\"]|\\[\s\S])*(?:\"|$))/,null,"'\""])}else{if(T.multiLineStrings){W.push([C,/^(?:\'(?:[^\\\']|\\[\s\S])*(?:\'|$)|\"(?:[^\\\"]|\\[\s\S])*(?:\"|$)|\`(?:[^\\\`]|\\[\s\S])*(?:\`|$))/,null,"'\"`"])}else{W.push([C,/^(?:\'(?:[^\\\'\r\n]|\\.)*(?:\'|$)|\"(?:[^\\\"\r\n]|\\.)*(?:\"|$))/,null,"\"'"])}}if(T.verbatimStrings){S.push([C,/^@\"(?:[^\"]|\"\")*(?:\"|$)/,null])}var Y=T.hashComments;if(Y){if(T.cStyleComments){if(Y>1){W.push([j,/^#(?:##(?:[^#]|#(?!##))*(?:###|$)|.*)/,null,"#"])}else{W.push([j,/^#(?:(?:define|elif|else|endif|error|ifdef|include|ifndef|line|pragma|undef|warning)\b|[^\r\n]*)/,null,"#"])}S.push([C,/^<(?:(?:(?:\.\.\/)*|\/?)(?:[\w-]+(?:\/[\w-]+)+)?[\w-]+\.h|[a-z]\w*)>/,null])}else{W.push([j,/^#[^\r\n]*/,null,"#"])}}if(T.cStyleComments){S.push([j,/^\/\/[^\r\n]*/,null]);S.push([j,/^\/\*[\s\S]*?(?:\*\/|$)/,null])}if(T.regexLiterals){var X=("/(?=[^/*])(?:[^/\\x5B\\x5C]|\\x5C[\\s\\S]|\\x5B(?:[^\\x5C\\x5D]|\\x5C[\\s\\S])*(?:\\x5D|$))+/");S.push(["lang-regex",new RegExp("^"+M+"("+X+")")])}var V=T.types;if(V){S.push([O,V])}var U=(""+T.keywords).replace(/^ | $/g,"");if(U.length){S.push([z,new RegExp("^(?:"+U.replace(/[\s,]+/g,"|")+")\\b"),null])}W.push([F,/^\s+/,null," \r\n\t\xA0"]);S.push([G,/^@[a-z_$][a-z_$@0-9]*/i,null],[O,/^(?:[@_]?[A-Z]+[a-z][A-Za-z_$@0-9]*|\w+_t\b)/,null],[F,/^[a-z_$][a-z_$@0-9]*/i,null],[G,new RegExp("^(?:0x[a-f0-9]+|(?:\\d(?:_\\d+)*\\d*(?:\\.\\d*)?|\\.\\d\\+)(?:e[+\\-]?\\d+)?)[a-z]*","i"),null,"0123456789"],[F,/^\\[\s\S]?/,null],[L,/^.[^\s\w\.$@\'\"\`\/\#\\]*/,null]);return g(W,S)}var K=i({keywords:A,hashComments:true,cStyleComments:true,multiLineStrings:true,regexLiterals:true});function Q(V,ag){var U=/(?:^|\s)nocode(?:\s|$)/;var ab=/\r\n?|\n/;var ac=V.ownerDocument;var S;if(V.currentStyle){S=V.currentStyle.whiteSpace}else{if(window.getComputedStyle){S=ac.defaultView.getComputedStyle(V,null).getPropertyValue("white-space")}}var Z=S&&"pre"===S.substring(0,3);var af=ac.createElement("LI");while(V.firstChild){af.appendChild(V.firstChild)}var W=[af];function ae(al){switch(al.nodeType){case 1:if(U.test(al.className)){break}if("BR"===al.nodeName){ad(al);if(al.parentNode){al.parentNode.removeChild(al)}}else{for(var an=al.firstChild;an;an=an.nextSibling){ae(an)}}break;case 3:case 4:if(Z){var am=al.nodeValue;var aj=am.match(ab);if(aj){var ai=am.substring(0,aj.index);al.nodeValue=ai;var ah=am.substring(aj.index+aj[0].length);if(ah){var ak=al.parentNode;ak.insertBefore(ac.createTextNode(ah),al.nextSibling)}ad(al);if(!ai){al.parentNode.removeChild(al)}}}break}}function ad(ak){while(!ak.nextSibling){ak=ak.parentNode;if(!ak){return}}function ai(al,ar){var aq=ar?al.cloneNode(false):al;var ao=al.parentNode;if(ao){var ap=ai(ao,1);var an=al.nextSibling;ap.appendChild(aq);for(var am=an;am;am=an){an=am.nextSibling;ap.appendChild(am)}}return aq}var ah=ai(ak.nextSibling,0);for(var aj;(aj=ah.parentNode)&&aj.nodeType===1;){ah=aj}W.push(ah)}for(var Y=0;Y<W.length;++Y){ae(W[Y])}if(ag===(ag|0)){W[0].setAttribute("value",ag)}var aa=ac.createElement("OL");aa.className="linenums";var X=Math.max(0,((ag-1))|0)||0;for(var Y=0,T=W.length;Y<T;++Y){af=W[Y];af.className="L"+((Y+X)%10);if(!af.firstChild){af.appendChild(ac.createTextNode("\xA0"))}aa.appendChild(af)}V.appendChild(aa)}function D(ac){var aj=/\bMSIE\b/.test(navigator.userAgent);var am=/\n/g;var al=ac.sourceCode;var an=al.length;var V=0;var aa=ac.spans;var T=aa.length;var ah=0;var X=ac.decorations;var Y=X.length;var Z=0;X[Y]=an;var ar,aq;for(aq=ar=0;aq<Y;){if(X[aq]!==X[aq+2]){X[ar++]=X[aq++];X[ar++]=X[aq++]}else{aq+=2}}Y=ar;for(aq=ar=0;aq<Y;){var at=X[aq];var ab=X[aq+1];var W=aq+2;while(W+2<=Y&&X[W+1]===ab){W+=2}X[ar++]=at;X[ar++]=ab;aq=W}Y=X.length=ar;var ae=null;while(ah<T){var af=aa[ah];var S=aa[ah+2]||an;var ag=X[Z];var ap=X[Z+2]||an;var W=Math.min(S,ap);var ak=aa[ah+1];var U;if(ak.nodeType!==1&&(U=al.substring(V,W))){if(aj){U=U.replace(am,"\r")}ak.nodeValue=U;var ai=ak.ownerDocument;var ao=ai.createElement("SPAN");ao.className=X[Z+1];var ad=ak.parentNode;ad.replaceChild(ao,ak);ao.appendChild(ak);if(V<S){aa[ah+1]=ak=ai.createTextNode(al.substring(W,S));ad.insertBefore(ak,ao.nextSibling)}}V=W;if(V>=S){ah+=2}if(V>=ap){Z+=2}}}var t={};function c(U,V){for(var S=V.length;--S>=0;){var T=V[S];if(!t.hasOwnProperty(T)){t[T]=U}else{if(window.console){console.warn("cannot override language handler %s",T)}}}}function q(T,S){if(!(T&&t.hasOwnProperty(T))){T=/^\s*</.test(S)?"default-markup":"default-code"}return t[T]}c(K,["default-code"]);c(g([],[[F,/^[^<?]+/],[E,/^<!\w[^>]*(?:>|$)/],[j,/^<\!--[\s\S]*?(?:-\->|$)/],["lang-",/^<\?([\s\S]+?)(?:\?>|$)/],["lang-",/^<%([\s\S]+?)(?:%>|$)/],[L,/^(?:<[%?]|[%?]>)/],["lang-",/^<xmp\b[^>]*>([\s\S]+?)<\/xmp\b[^>]*>/i],["lang-js",/^<script\b[^>]*>([\s\S]*?)(<\/script\b[^>]*>)/i],["lang-css",/^<style\b[^>]*>([\s\S]*?)(<\/style\b[^>]*>)/i],["lang-in.tag",/^(<\/?[a-z][^<>]*>)/i]]),["default-markup","htm","html","mxml","xhtml","xml","xsl"]);c(g([[F,/^[\s]+/,null," \t\r\n"],[n,/^(?:\"[^\"]*\"?|\'[^\']*\'?)/,null,"\"'"]],[[m,/^^<\/?[a-z](?:[\w.:-]*\w)?|\/?>$/i],[P,/^(?!style[\s=]|on)[a-z](?:[\w:-]*\w)?/i],["lang-uq.val",/^=\s*([^>\'\"\s]*(?:[^>\'\"\s\/]|\/(?=\s)))/],[L,/^[=<>\/]+/],["lang-js",/^on\w+\s*=\s*\"([^\"]+)\"/i],["lang-js",/^on\w+\s*=\s*\'([^\']+)\'/i],["lang-js",/^on\w+\s*=\s*([^\"\'>\s]+)/i],["lang-css",/^style\s*=\s*\"([^\"]+)\"/i],["lang-css",/^style\s*=\s*\'([^\']+)\'/i],["lang-css",/^style\s*=\s*([^\"\'>\s]+)/i]]),["in.tag"]);c(g([],[[n,/^[\s\S]+/]]),["uq.val"]);c(i({keywords:l,hashComments:true,cStyleComments:true,types:e}),["c","cc","cpp","cxx","cyc","m"]);c(i({keywords:"null,true,false"}),["json"]);c(i({keywords:R,hashComments:true,cStyleComments:true,verbatimStrings:true,types:e}),["cs"]);c(i({keywords:x,cStyleComments:true}),["java"]);c(i({keywords:H,hashComments:true,multiLineStrings:true}),["bsh","csh","sh"]);c(i({keywords:I,hashComments:true,multiLineStrings:true,tripleQuotedStrings:true}),["cv","py"]);c(i({keywords:s,hashComments:true,multiLineStrings:true,regexLiterals:true}),["perl","pl","pm"]);c(i({keywords:f,hashComments:true,multiLineStrings:true,regexLiterals:true}),["rb"]);c(i({keywords:w,cStyleComments:true,regexLiterals:true}),["js"]);c(i({keywords:r,hashComments:3,cStyleComments:true,multilineStrings:true,tripleQuotedStrings:true,regexLiterals:true}),["coffee"]);c(g([],[[C,/^[\s\S]+/]]),["regex"]);function d(V){var U=V.langExtension;try{var S=a(V.sourceNode);var T=S.sourceCode;V.sourceCode=T;V.spans=S.spans;V.basePos=0;q(U,T)(V);D(V)}catch(W){if("console" in window){console.log(W&&W.stack?W.stack:W)}}}function y(W,V,U){var S=document.createElement("PRE");S.innerHTML=W;if(U){Q(S,U)}var T={langExtension:V,numberLines:U,sourceNode:S};d(T);return S.innerHTML}function b(ad){function Y(af){return document.getElementsByTagName(af)}var ac=[Y("pre"),Y("code"),Y("xmp")];var T=[];for(var aa=0;aa<ac.length;++aa){for(var Z=0,V=ac[aa].length;Z<V;++Z){T.push(ac[aa][Z])}}ac=null;var W=Date;if(!W.now){W={now:function(){return +(new Date)}}}var X=0;var S;var ab=/\blang(?:uage)?-([\w.]+)(?!\S)/;var ae=/\bprettyprint\b/;function U(){var ag=(window.PR_SHOULD_USE_CONTINUATION?W.now()+250:Infinity);for(;X<T.length&&W.now()<ag;X++){var aj=T[X];var ai=aj.className;if(ai.indexOf("prettyprint")>=0){var ah=ai.match(ab);var am;if(!ah&&(am=o(aj))&&"CODE"===am.tagName){ah=am.className.match(ab)}if(ah){ah=ah[1]}var al=false;for(var ak=aj.parentNode;ak;ak=ak.parentNode){if((ak.tagName==="pre"||ak.tagName==="code"||ak.tagName==="xmp")&&ak.className&&ak.className.indexOf("prettyprint")>=0){al=true;break}}if(!al){var af=aj.className.match(/\blinenums\b(?::(\d+))?/);af=af?af[1]&&af[1].length?+af[1]:true:false;if(af){Q(aj,af)}S={langExtension:ah,sourceNode:aj,numberLines:af};d(S)}}}if(X<T.length){setTimeout(U,250)}else{if(ad){ad()}}}U()}window.prettyPrintOne=y;window.prettyPrint=b;window.PR={createSimpleLexer:g,registerLangHandler:c,sourceDecorator:i,PR_ATTRIB_NAME:P,PR_ATTRIB_VALUE:n,PR_COMMENT:j,PR_DECLARATION:E,PR_KEYWORD:z,PR_LITERAL:G,PR_NOCODE:N,PR_PLAIN:F,PR_PUNCTUATION:L,PR_SOURCE:J,PR_STRING:C,PR_TAG:m,PR_TYPE:O}})();PR.registerLangHandler(PR.createSimpleLexer([],[[PR.PR_DECLARATION,/^<!\w[^>]*(?:>|$)/],[PR.PR_COMMENT,/^<\!--[\s\S]*?(?:-\->|$)/],[PR.PR_PUNCTUATION,/^(?:<[%?]|[%?]>)/],["lang-",/^<\?([\s\S]+?)(?:\?>|$)/],["lang-",/^<%([\s\S]+?)(?:%>|$)/],["lang-",/^<xmp\b[^>]*>([\s\S]+?)<\/xmp\b[^>]*>/i],["lang-handlebars",/^<script\b[^>]*type\s*=\s*['"]?text\/x-handlebars-template['"]?\b[^>]*>([\s\S]*?)(<\/script\b[^>]*>)/i],["lang-js",/^<script\b[^>]*>([\s\S]*?)(<\/script\b[^>]*>)/i],["lang-css",/^<style\b[^>]*>([\s\S]*?)(<\/style\b[^>]*>)/i],["lang-in.tag",/^(<\/?[a-z][^<>]*>)/i],[PR.PR_DECLARATION,/^{{[#^>/]?\s*[\w.][^}]*}}/],[PR.PR_DECLARATION,/^{{&?\s*[\w.][^}]*}}/],[PR.PR_DECLARATION,/^{{{>?\s*[\w.][^}]*}}}/],[PR.PR_COMMENT,/^{{![^}]*}}/]]),["handlebars","hbs"]);PR.registerLangHandler(PR.createSimpleLexer([[PR.PR_PLAIN,/^[ \t\r\n\f]+/,null," \t\r\n\f"]],[[PR.PR_STRING,/^\"(?:[^\n\r\f\\\"]|\\(?:\r\n?|\n|\f)|\\[\s\S])*\"/,null],[PR.PR_STRING,/^\'(?:[^\n\r\f\\\']|\\(?:\r\n?|\n|\f)|\\[\s\S])*\'/,null],["lang-css-str",/^url\(([^\)\"\']*)\)/i],[PR.PR_KEYWORD,/^(?:url|rgb|\!important|@import|@page|@media|@charset|inherit)(?=[^\-\w]|$)/i,null],["lang-css-kw",/^(-?(?:[_a-z]|(?:\\[0-9a-f]+ ?))(?:[_a-z0-9\-]|\\(?:\\[0-9a-f]+ ?))*)\s*:/i],[PR.PR_COMMENT,/^\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\//],[PR.PR_COMMENT,/^(?:<!--|-->)/],[PR.PR_LITERAL,/^(?:\d+|\d*\.\d+)(?:%|[a-z]+)?/i],[PR.PR_LITERAL,/^#(?:[0-9a-f]{3}){1,2}/i],[PR.PR_PLAIN,/^-?(?:[_a-z]|(?:\\[\da-f]+ ?))(?:[_a-z\d\-]|\\(?:\\[\da-f]+ ?))*/i],[PR.PR_PUNCTUATION,/^[^\s\w\'\"]+/]]),["css"]);PR.registerLangHandler(PR.createSimpleLexer([],[[PR.PR_KEYWORD,/^-?(?:[_a-z]|(?:\\[\da-f]+ ?))(?:[_a-z\d\-]|\\(?:\\[\da-f]+ ?))*/i]]),["css-kw"]);PR.registerLangHandler(PR.createSimpleLexer([],[[PR.PR_STRING,/^[^\)\"\']+/]]),["css-str"]);

```

# coverage\lcov-report\sort-arrow-sprite.png

This is a binary file of the type: Image

# coverage\lcov-report\sorter.js

```js
/* eslint-disable */
var addSorting = (function() {
    'use strict';
    var cols,
        currentSort = {
            index: 0,
            desc: false
        };

    // returns the summary table element
    function getTable() {
        return document.querySelector('.coverage-summary');
    }
    // returns the thead element of the summary table
    function getTableHeader() {
        return getTable().querySelector('thead tr');
    }
    // returns the tbody element of the summary table
    function getTableBody() {
        return getTable().querySelector('tbody');
    }
    // returns the th element for nth column
    function getNthColumn(n) {
        return getTableHeader().querySelectorAll('th')[n];
    }

    function onFilterInput() {
        const searchValue = document.getElementById('fileSearch').value;
        const rows = document.getElementsByTagName('tbody')[0].children;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (
                row.textContent
                    .toLowerCase()
                    .includes(searchValue.toLowerCase())
            ) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    }

    // loads the search box
    function addSearchBox() {
        var template = document.getElementById('filterTemplate');
        var templateClone = template.content.cloneNode(true);
        templateClone.getElementById('fileSearch').oninput = onFilterInput;
        template.parentElement.appendChild(templateClone);
    }

    // loads all columns
    function loadColumns() {
        var colNodes = getTableHeader().querySelectorAll('th'),
            colNode,
            cols = [],
            col,
            i;

        for (i = 0; i < colNodes.length; i += 1) {
            colNode = colNodes[i];
            col = {
                key: colNode.getAttribute('data-col'),
                sortable: !colNode.getAttribute('data-nosort'),
                type: colNode.getAttribute('data-type') || 'string'
            };
            cols.push(col);
            if (col.sortable) {
                col.defaultDescSort = col.type === 'number';
                colNode.innerHTML =
                    colNode.innerHTML + '<span class="sorter"></span>';
            }
        }
        return cols;
    }
    // attaches a data attribute to every tr element with an object
    // of data values keyed by column name
    function loadRowData(tableRow) {
        var tableCols = tableRow.querySelectorAll('td'),
            colNode,
            col,
            data = {},
            i,
            val;
        for (i = 0; i < tableCols.length; i += 1) {
            colNode = tableCols[i];
            col = cols[i];
            val = colNode.getAttribute('data-value');
            if (col.type === 'number') {
                val = Number(val);
            }
            data[col.key] = val;
        }
        return data;
    }
    // loads all row data
    function loadData() {
        var rows = getTableBody().querySelectorAll('tr'),
            i;

        for (i = 0; i < rows.length; i += 1) {
            rows[i].data = loadRowData(rows[i]);
        }
    }
    // sorts the table using the data for the ith column
    function sortByIndex(index, desc) {
        var key = cols[index].key,
            sorter = function(a, b) {
                a = a.data[key];
                b = b.data[key];
                return a < b ? -1 : a > b ? 1 : 0;
            },
            finalSorter = sorter,
            tableBody = document.querySelector('.coverage-summary tbody'),
            rowNodes = tableBody.querySelectorAll('tr'),
            rows = [],
            i;

        if (desc) {
            finalSorter = function(a, b) {
                return -1 * sorter(a, b);
            };
        }

        for (i = 0; i < rowNodes.length; i += 1) {
            rows.push(rowNodes[i]);
            tableBody.removeChild(rowNodes[i]);
        }

        rows.sort(finalSorter);

        for (i = 0; i < rows.length; i += 1) {
            tableBody.appendChild(rows[i]);
        }
    }
    // removes sort indicators for current column being sorted
    function removeSortIndicators() {
        var col = getNthColumn(currentSort.index),
            cls = col.className;

        cls = cls.replace(/ sorted$/, '').replace(/ sorted-desc$/, '');
        col.className = cls;
    }
    // adds sort indicators for current column being sorted
    function addSortIndicators() {
        getNthColumn(currentSort.index).className += currentSort.desc
            ? ' sorted-desc'
            : ' sorted';
    }
    // adds event listeners for all sorter widgets
    function enableUI() {
        var i,
            el,
            ithSorter = function ithSorter(i) {
                var col = cols[i];

                return function() {
                    var desc = col.defaultDescSort;

                    if (currentSort.index === i) {
                        desc = !currentSort.desc;
                    }
                    sortByIndex(i, desc);
                    removeSortIndicators();
                    currentSort.index = i;
                    currentSort.desc = desc;
                    addSortIndicators();
                };
            };
        for (i = 0; i < cols.length; i += 1) {
            if (cols[i].sortable) {
                // add the click event handler on the th so users
                // dont have to click on those tiny arrows
                el = getNthColumn(i).querySelector('.sorter').parentElement;
                if (el.addEventListener) {
                    el.addEventListener('click', ithSorter(i));
                } else {
                    el.attachEvent('onclick', ithSorter(i));
                }
            }
        }
    }
    // adds sorting functionality to the UI
    return function() {
        if (!getTable()) {
            return;
        }
        cols = loadColumns();
        loadData();
        addSearchBox();
        addSortIndicators();
        enableUI();
    };
})();

window.addEventListener('load', addSorting);

```

# coverage\lcov-report\src\controllers\album.controller.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/controllers/album.controller.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/controllers</a> album.controller.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">61.11% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>22/36</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">18.75% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>3/16</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">80% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>4/5</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">64.7% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>22/34</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line medium'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a>
<a name='L49'></a><a href='#L49'>49</a>
<a name='L50'></a><a href='#L50'>50</a>
<a name='L51'></a><a href='#L51'>51</a>
<a name='L52'></a><a href='#L52'>52</a>
<a name='L53'></a><a href='#L53'>53</a>
<a name='L54'></a><a href='#L54'>54</a>
<a name='L55'></a><a href='#L55'>55</a>
<a name='L56'></a><a href='#L56'>56</a>
<a name='L57'></a><a href='#L57'>57</a>
<a name='L58'></a><a href='#L58'>58</a>
<a name='L59'></a><a href='#L59'>59</a>
<a name='L60'></a><a href='#L60'>60</a>
<a name='L61'></a><a href='#L61'>61</a>
<a name='L62'></a><a href='#L62'>62</a>
<a name='L63'></a><a href='#L63'>63</a>
<a name='L64'></a><a href='#L64'>64</a>
<a name='L65'></a><a href='#L65'>65</a>
<a name='L66'></a><a href='#L66'>66</a>
<a name='L67'></a><a href='#L67'>67</a>
<a name='L68'></a><a href='#L68'>68</a>
<a name='L69'></a><a href='#L69'>69</a>
<a name='L70'></a><a href='#L70'>70</a>
<a name='L71'></a><a href='#L71'>71</a>
<a name='L72'></a><a href='#L72'>72</a>
<a name='L73'></a><a href='#L73'>73</a>
<a name='L74'></a><a href='#L74'>74</a>
<a name='L75'></a><a href='#L75'>75</a>
<a name='L76'></a><a href='#L76'>76</a>
<a name='L77'></a><a href='#L77'>77</a>
<a name='L78'></a><a href='#L78'>78</a>
<a name='L79'></a><a href='#L79'>79</a>
<a name='L80'></a><a href='#L80'>80</a>
<a name='L81'></a><a href='#L81'>81</a>
<a name='L82'></a><a href='#L82'>82</a>
<a name='L83'></a><a href='#L83'>83</a>
<a name='L84'></a><a href='#L84'>84</a>
<a name='L85'></a><a href='#L85'>85</a>
<a name='L86'></a><a href='#L86'>86</a>
<a name='L87'></a><a href='#L87'>87</a>
<a name='L88'></a><a href='#L88'>88</a>
<a name='L89'></a><a href='#L89'>89</a></td><td class="line-coverage quiet"><span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { Request, Response } from "express";
import {
  createAlbumService,
  deleteAlbumService,
  getAlbumSongStatsService,
  getPaginatedAlbumsService,
  updateAlbumService,
} from "../services/album.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
import prisma from "../db/prisma.js";
&nbsp;
export const createAlbumController = asyncHandler(
  async (req: Request, res: Response) =&gt; {
    try {
      const album = await createAlbumService(req.body);
      res.status(201).json(album);
    } catch (error) {
<span class="cstat-no" title="statement not covered" >      console.error("Album creation error:", error);</span>
<span class="cstat-no" title="statement not covered" >      res.status(500).json({ error: "Internal server error" });</span>
    }
  }
);
&nbsp;
export const getAlbumsController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
    const result = <span class="cstat-no" title="statement not covered" >await getPaginatedAlbumsService({</span>
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 25,
      search: req.query.search?.toString(),
    });
<span class="cstat-no" title="statement not covered" >    res.json(result);</span>
  }
);
&nbsp;
export const updateAlbumController = asyncHandler(
  async (req: Request, res: Response) =&gt; {
    const album = await updateAlbumService(Number(req.params.id), req.body);
    res.json(album);
  }
);
&nbsp;
export const deleteAlbumController = asyncHandler(
  async (req: Request, res: Response) =&gt; {
    await deleteAlbumService(Number(req.params.id));
    res.sendStatus(204);
  }
);
&nbsp;
export const getAlbumSongStatsController = asyncHandler(
  async (req: Request, res: Response) =&gt; {
    const albumId = Number(req.params.albumId);
    const groupId = req.query.groupId ? <span class="branch-0 cbranch-no" title="branch not covered" >Number(req.query.groupId) </span>: undefined;
    const userFilter = req.query.userFilter === "true";
&nbsp;
    <span class="missing-if-branch" title="if path not taken" >I</span>if (userFilter &amp;&amp; <span class="branch-1 cbranch-no" title="branch not covered" >!req.user)</span> {
<span class="cstat-no" title="statement not covered" >      return res.status(401).json({ error: "Authentication required" });</span>
    }
&nbsp;
    // Authorization check for private groups
    <span class="missing-if-branch" title="if path not taken" >I</span>if (groupId) {
      const group = <span class="cstat-no" title="statement not covered" >await prisma.group.findUnique({</span>
        where: { id: groupId },
        select: { isPrivate: true },
      });
&nbsp;
<span class="cstat-no" title="statement not covered" >      <span class="missing-if-branch" title="if path not taken" >I</span>if (!group) <span class="cstat-no" title="statement not covered" >return res.status(404).json({ error: "Group not found" });</span></span>
&nbsp;
<span class="cstat-no" title="statement not covered" >      <span class="missing-if-branch" title="if path not taken" >I</span>if (group.isPrivate) {</span>
<span class="cstat-no" title="statement not covered" >        <span class="missing-if-branch" title="if path not taken" >I</span>if (!req.user) <span class="cstat-no" title="statement not covered" >return res.status(403).json({ error: "Access denied" });</span></span>
&nbsp;
        const membership = <span class="cstat-no" title="statement not covered" >await prisma.userGroup.findUnique({</span>
          where: { userId_groupId: { userId: req.user.id, groupId } },
        });
&nbsp;
<span class="cstat-no" title="statement not covered" >        <span class="missing-if-branch" title="if path not taken" >I</span>if (!membership)</span>
<span class="cstat-no" title="statement not covered" >          return res.status(403).json({ error: "Not a group member" });</span>
      }
    }
&nbsp;
    const stats = await getAlbumSongStatsService({
      albumId,
      groupId,
      userId: userFilter ? <span class="branch-0 cbranch-no" title="branch not covered" >req.user?.id </span>: undefined,
    });
&nbsp;
    res.json(stats);
  }
);
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\controllers\group.controller.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/controllers/group.controller.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/controllers</a> group.controller.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">40% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>8/20</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/6</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">40% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>8/20</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line low'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a>
<a name='L49'></a><a href='#L49'>49</a>
<a name='L50'></a><a href='#L50'>50</a>
<a name='L51'></a><a href='#L51'>51</a>
<a name='L52'></a><a href='#L52'>52</a>
<a name='L53'></a><a href='#L53'>53</a>
<a name='L54'></a><a href='#L54'>54</a>
<a name='L55'></a><a href='#L55'>55</a>
<a name='L56'></a><a href='#L56'>56</a>
<a name='L57'></a><a href='#L57'>57</a>
<a name='L58'></a><a href='#L58'>58</a>
<a name='L59'></a><a href='#L59'>59</a>
<a name='L60'></a><a href='#L60'>60</a>
<a name='L61'></a><a href='#L61'>61</a>
<a name='L62'></a><a href='#L62'>62</a>
<a name='L63'></a><a href='#L63'>63</a>
<a name='L64'></a><a href='#L64'>64</a></td><td class="line-coverage quiet"><span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { Request, Response } from "express";
import {
  createGroupService,
  deleteGroupService,
  updateGroupService,
  sendGroupInviteService,
  joinGroupService,
  getUserGroupsService,
} from "../services/group.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
&nbsp;
export const createGroupController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
    const group = <span class="cstat-no" title="statement not covered" >await createGroupService({</span>
      ...req.body,
      userId: req.user!.id,
    });
<span class="cstat-no" title="statement not covered" >    res.status(201).json(group);</span>
  },
);
&nbsp;
export const deleteGroupController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
<span class="cstat-no" title="statement not covered" >    await deleteGroupService(Number(req.params.groupId), req.user!.id);</span>
<span class="cstat-no" title="statement not covered" >    res.sendStatus(204);</span>
  },
);
&nbsp;
export const updateGroupController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
    const group = <span class="cstat-no" title="statement not covered" >await updateGroupService(</span>
      Number(req.params.groupId),
      req.body,
      req.user!.id,
    );
<span class="cstat-no" title="statement not covered" >    res.json(group);</span>
  },
);
&nbsp;
export const sendInviteController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
    const result = <span class="cstat-no" title="statement not covered" >await sendGroupInviteService(</span>
      Number(req.params.groupId),
      req.body.email,
      req.user!.id,
    );
<span class="cstat-no" title="statement not covered" >    res.json(result);</span>
  },
);
&nbsp;
export const joinGroupController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
    const membership = <span class="cstat-no" title="statement not covered" >await joinGroupService(req.body.code, req.user!.id);</span>
<span class="cstat-no" title="statement not covered" >    res.json(membership);</span>
  },
);
&nbsp;
export const getUserGroupsController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
    const groups = <span class="cstat-no" title="statement not covered" >await getUserGroupsService(req.user!.id);</span>
<span class="cstat-no" title="statement not covered" >    res.json(groups);</span>
  },
);
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\controllers\index.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/controllers</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> src/controllers</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">52.94% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>63/119</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">13.63% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>3/22</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">29.16% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>7/24</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">53.84% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>63/117</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line medium'></div>
    <div class="pad1">
<table class="coverage-summary">
<thead>
<tr>
   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>
   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
</tr>
</thead>
<tbody><tr>
	<td class="file medium" data-value="album.controller.ts"><a href="album.controller.ts.html">album.controller.ts</a></td>
	<td data-value="61.11" class="pic medium">
	<div class="chart"><div class="cover-fill" style="width: 61%"></div><div class="cover-empty" style="width: 39%"></div></div>
	</td>
	<td data-value="61.11" class="pct medium">61.11%</td>
	<td data-value="36" class="abs medium">22/36</td>
	<td data-value="18.75" class="pct low">18.75%</td>
	<td data-value="16" class="abs low">3/16</td>
	<td data-value="80" class="pct high">80%</td>
	<td data-value="5" class="abs high">4/5</td>
	<td data-value="64.7" class="pct medium">64.7%</td>
	<td data-value="34" class="abs medium">22/34</td>
	</tr>

<tr>
	<td class="file low" data-value="group.controller.ts"><a href="group.controller.ts.html">group.controller.ts</a></td>
	<td data-value="40" class="pic low">
	<div class="chart"><div class="cover-fill" style="width: 40%"></div><div class="cover-empty" style="width: 60%"></div></div>
	</td>
	<td data-value="40" class="pct low">40%</td>
	<td data-value="20" class="abs low">8/20</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="6" class="abs low">0/6</td>
	<td data-value="40" class="pct low">40%</td>
	<td data-value="20" class="abs low">8/20</td>
	</tr>

<tr>
	<td class="file medium" data-value="review.controller.ts"><a href="review.controller.ts.html">review.controller.ts</a></td>
	<td data-value="50" class="pic medium">
	<div class="chart"><div class="cover-fill" style="width: 50%"></div><div class="cover-empty" style="width: 50%"></div></div>
	</td>
	<td data-value="50" class="pct medium">50%</td>
	<td data-value="8" class="abs medium">4/8</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="2" class="abs low">0/2</td>
	<td data-value="50" class="pct medium">50%</td>
	<td data-value="8" class="abs medium">4/8</td>
	</tr>

<tr>
	<td class="file low" data-value="song.controller.ts"><a href="song.controller.ts.html">song.controller.ts</a></td>
	<td data-value="41.17" class="pic low">
	<div class="chart"><div class="cover-fill" style="width: 41%"></div><div class="cover-empty" style="width: 59%"></div></div>
	</td>
	<td data-value="41.17" class="pct low">41.17%</td>
	<td data-value="17" class="abs low">7/17</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="5" class="abs low">0/5</td>
	<td data-value="41.17" class="pct low">41.17%</td>
	<td data-value="17" class="abs low">7/17</td>
	</tr>

<tr>
	<td class="file medium" data-value="user.controller.ts"><a href="user.controller.ts.html">user.controller.ts</a></td>
	<td data-value="57.89" class="pic medium">
	<div class="chart"><div class="cover-fill" style="width: 57%"></div><div class="cover-empty" style="width: 43%"></div></div>
	</td>
	<td data-value="57.89" class="pct medium">57.89%</td>
	<td data-value="38" class="abs medium">22/38</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="6" class="abs low">0/6</td>
	<td data-value="50" class="pct medium">50%</td>
	<td data-value="6" class="abs medium">3/6</td>
	<td data-value="57.89" class="pct medium">57.89%</td>
	<td data-value="38" class="abs medium">22/38</td>
	</tr>

</tbody>
</table>
</div>
                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\controllers\review.controller.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/controllers/review.controller.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/controllers</a> review.controller.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">50% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>4/8</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/2</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">50% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>4/8</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line medium'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a></td><td class="line-coverage quiet"><span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { Request, Response } from "express";
import {
  createReviewService,
  getReviewsService,
} from "../services/review.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
&nbsp;
export const createReviewController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
    const review = <span class="cstat-no" title="statement not covered" >await createReviewService({</span>
      ...req.body,
      userId: req.user!.id,
    });
<span class="cstat-no" title="statement not covered" >    res.status(201).json(review);</span>
  },
);
&nbsp;
export const getReviewsController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
    const result = <span class="cstat-no" title="statement not covered" >await getReviewsService({</span>
      ...req.query,
      userId: req.user?.id,
    });
<span class="cstat-no" title="statement not covered" >    res.json(result);</span>
  },
);
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\controllers\song.controller.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/controllers/song.controller.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/controllers</a> song.controller.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">41.17% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>7/17</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/5</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">41.17% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>7/17</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line low'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a>
<a name='L49'></a><a href='#L49'>49</a>
<a name='L50'></a><a href='#L50'>50</a></td><td class="line-coverage quiet"><span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { Request, Response } from "express";
import {
  getSongsService,
  getSongService,
  createSongService,
  updateSongService,
  deleteSongService,
} from "../services/song.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
&nbsp;
export const getSongsController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
    const result = <span class="cstat-no" title="statement not covered" >await getSongsService({</span>
      albumId: req.query.albumId?.toString(),
      search: req.query.search?.toString(),
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
<span class="cstat-no" title="statement not covered" >    res.json(result);</span>
  },
);
&nbsp;
export const getSongController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
    const song = <span class="cstat-no" title="statement not covered" >await getSongService(Number(req.params.songId));</span>
<span class="cstat-no" title="statement not covered" >    res.json(song);</span>
  },
);
&nbsp;
export const createSongController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
    const song = <span class="cstat-no" title="statement not covered" >await createSongService(req.body);</span>
<span class="cstat-no" title="statement not covered" >    res.status(201).json(song);</span>
  },
);
&nbsp;
export const updateSongController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
    const song = <span class="cstat-no" title="statement not covered" >await updateSongService(Number(req.params.songId), req.body);</span>
<span class="cstat-no" title="statement not covered" >    res.json(song);</span>
  },
);
&nbsp;
export const deleteSongController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
<span class="cstat-no" title="statement not covered" >    await deleteSongService(Number(req.params.songId));</span>
<span class="cstat-no" title="statement not covered" >    res.sendStatus(204);</span>
  },
);
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\controllers\user.controller.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/controllers/user.controller.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/controllers</a> user.controller.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">57.89% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>22/38</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/6</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">50% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>3/6</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">57.89% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>22/38</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line medium'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a>
<a name='L49'></a><a href='#L49'>49</a>
<a name='L50'></a><a href='#L50'>50</a>
<a name='L51'></a><a href='#L51'>51</a>
<a name='L52'></a><a href='#L52'>52</a>
<a name='L53'></a><a href='#L53'>53</a>
<a name='L54'></a><a href='#L54'>54</a>
<a name='L55'></a><a href='#L55'>55</a>
<a name='L56'></a><a href='#L56'>56</a>
<a name='L57'></a><a href='#L57'>57</a>
<a name='L58'></a><a href='#L58'>58</a>
<a name='L59'></a><a href='#L59'>59</a>
<a name='L60'></a><a href='#L60'>60</a>
<a name='L61'></a><a href='#L61'>61</a>
<a name='L62'></a><a href='#L62'>62</a>
<a name='L63'></a><a href='#L63'>63</a>
<a name='L64'></a><a href='#L64'>64</a>
<a name='L65'></a><a href='#L65'>65</a>
<a name='L66'></a><a href='#L66'>66</a>
<a name='L67'></a><a href='#L67'>67</a>
<a name='L68'></a><a href='#L68'>68</a>
<a name='L69'></a><a href='#L69'>69</a>
<a name='L70'></a><a href='#L70'>70</a>
<a name='L71'></a><a href='#L71'>71</a>
<a name='L72'></a><a href='#L72'>72</a>
<a name='L73'></a><a href='#L73'>73</a>
<a name='L74'></a><a href='#L74'>74</a>
<a name='L75'></a><a href='#L75'>75</a>
<a name='L76'></a><a href='#L76'>76</a>
<a name='L77'></a><a href='#L77'>77</a>
<a name='L78'></a><a href='#L78'>78</a>
<a name='L79'></a><a href='#L79'>79</a>
<a name='L80'></a><a href='#L80'>80</a>
<a name='L81'></a><a href='#L81'>81</a>
<a name='L82'></a><a href='#L82'>82</a>
<a name='L83'></a><a href='#L83'>83</a>
<a name='L84'></a><a href='#L84'>84</a>
<a name='L85'></a><a href='#L85'>85</a>
<a name='L86'></a><a href='#L86'>86</a>
<a name='L87'></a><a href='#L87'>87</a>
<a name='L88'></a><a href='#L88'>88</a>
<a name='L89'></a><a href='#L89'>89</a>
<a name='L90'></a><a href='#L90'>90</a>
<a name='L91'></a><a href='#L91'>91</a>
<a name='L92'></a><a href='#L92'>92</a>
<a name='L93'></a><a href='#L93'>93</a>
<a name='L94'></a><a href='#L94'>94</a>
<a name='L95'></a><a href='#L95'>95</a>
<a name='L96'></a><a href='#L96'>96</a>
<a name='L97'></a><a href='#L97'>97</a>
<a name='L98'></a><a href='#L98'>98</a>
<a name='L99'></a><a href='#L99'>99</a>
<a name='L100'></a><a href='#L100'>100</a>
<a name='L101'></a><a href='#L101'>101</a>
<a name='L102'></a><a href='#L102'>102</a>
<a name='L103'></a><a href='#L103'>103</a></td><td class="line-coverage quiet"><span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">5x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { Request, Response } from "express";
import {
  registerUserService,
  loginUserService,
  getCurrentUserService,
  deleteUserService,
  refreshTokenService,
} from "../services/user.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
import { UpdateUserInput } from "../validators/user.validator.js";
import prisma from "../db/prisma.js";
import bcrypt from "bcryptjs";
import {
  AuthenticationError,
  ValidationError,
} from "../errors/customErrors.js";
&nbsp;
const saltRounds = 10;
&nbsp;
export const registerUserController = asyncHandler(
  async (req: Request, res: Response) =&gt; {
    try {
      const user = await registerUserService(req.body);
      res.status(201).json(user);
    } catch (error) {
<span class="cstat-no" title="statement not covered" >      console.error("Validation Error:", error);</span>
      const typedError = <span class="cstat-no" title="statement not covered" >error as any;</span>
<span class="cstat-no" title="statement not covered" >      res.status(422).json({ error: typedError.errors ?? "Invalid request" });</span>
    }
  }
);
&nbsp;
export const loginUserController = asyncHandler(
  async (req: Request, res: Response) =&gt; {
    const { token, refreshToken, user } = await loginUserService(
      req.body.email,
      req.body.password
    );
    res.json({ token, refreshToken, user });
  }
);
&nbsp;
export const getCurrentUserController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
    const user = <span class="cstat-no" title="statement not covered" >await getCurrentUserService(req.user!.id);</span>
<span class="cstat-no" title="statement not covered" >    res.json(user);</span>
  }
);
&nbsp;
export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response) =&gt; {
    const { refreshToken } = req.body;
&nbsp;
    <span class="missing-if-branch" title="if path not taken" >I</span>if (!refreshToken) {
<span class="cstat-no" title="statement not covered" >      throw new ValidationError("Refresh token required", {</span>
        refreshToken: "Missing refresh token",
      });
    }
&nbsp;
    try {
      const tokens = await refreshTokenService(refreshToken);
      res.json(tokens);
    } catch (error) {
<span class="cstat-no" title="statement not covered" >      if (error instanceof AuthenticationError) {</span>
<span class="cstat-no" title="statement not covered" >        res.status(401).json({ error: error.message });</span>
      } else {
<span class="cstat-no" title="statement not covered" >        res.status(500).json({ error: "Internal server error" });</span>
      }
    }
  }
);
&nbsp;
export const updateUserController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
    const updateData: UpdateUserInput = <span class="cstat-no" title="statement not covered" >req.body;</span>
&nbsp;
    // If password is being updated, hash it first
<span class="cstat-no" title="statement not covered" >    <span class="missing-if-branch" title="if path not taken" >I</span>if (updateData.password) {</span>
<span class="cstat-no" title="statement not covered" >      updateData.password = await bcrypt.hash(updateData.password, saltRounds);</span>
    }
&nbsp;
    const user = <span class="cstat-no" title="statement not covered" >await prisma.user.update({</span>
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        image: true,
      },
    });
&nbsp;
<span class="cstat-no" title="statement not covered" >    res.json(user);</span>
  }
);
&nbsp;
export const deleteUserController = asyncHandler(
<span class="fstat-no" title="function not covered" >  async </span>(req: Request, res: Response) =&gt; {
<span class="cstat-no" title="statement not covered" >    await deleteUserService(req.user!.id);</span>
<span class="cstat-no" title="statement not covered" >    res.sendStatus(204);</span>
  }
);
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\db\index.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/db</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> src/db</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>3/3</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>3/3</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <div class="pad1">
<table class="coverage-summary">
<thead>
<tr>
   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>
   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
</tr>
</thead>
<tbody><tr>
	<td class="file high" data-value="prisma.ts"><a href="prisma.ts.html">prisma.ts</a></td>
	<td data-value="100" class="pic high">
	<div class="chart"><div class="cover-fill cover-full" style="width: 100%"></div><div class="cover-empty" style="width: 0%"></div></div>
	</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="3" class="abs high">3/3</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="3" class="abs high">3/3</td>
	</tr>

</tbody>
</table>
</div>
                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\db\prisma.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/db/prisma.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/db</a> prisma.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>3/3</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>3/3</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default prisma;
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\errors\customErrors.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/errors/customErrors.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/errors</a> customErrors.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">38.09% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>8/21</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/5</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">20% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>1/5</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">38.09% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>8/21</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line low'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">export class AuthenticationError extends Error {
  statusCode = 401;
  constructor(message = <span class="branch-0 cbranch-no" title="branch not covered" >"Unauthorized")</span> {
    super(message);
    this.name = "AuthenticationError";
  }
}
&nbsp;
export class ForbiddenError extends Error {
  statusCode = <span class="cstat-no" title="statement not covered" >403;</span>
<span class="fstat-no" title="function not covered" >  constructor(m</span>essage = <span class="branch-0 cbranch-no" title="branch not covered" >"Forbidden")</span> {
<span class="cstat-no" title="statement not covered" >    super(message);</span>
<span class="cstat-no" title="statement not covered" >    this.name = "ForbiddenError";</span>
  }
}
&nbsp;
export class NotFoundError extends Error {
  statusCode = <span class="cstat-no" title="statement not covered" >404;</span>
<span class="fstat-no" title="function not covered" >  constructor(m</span>essage = <span class="branch-0 cbranch-no" title="branch not covered" >"Not Found")</span> {
<span class="cstat-no" title="statement not covered" >    super(message);</span>
<span class="cstat-no" title="statement not covered" >    this.name = "NotFoundError";</span>
  }
}
&nbsp;
export class BadRequestError extends Error {
  statusCode = <span class="cstat-no" title="statement not covered" >400;</span>
<span class="fstat-no" title="function not covered" >  constructor(m</span>essage = <span class="branch-0 cbranch-no" title="branch not covered" >"Bad Request")</span> {
<span class="cstat-no" title="statement not covered" >    super(message);</span>
<span class="cstat-no" title="statement not covered" >    this.name = "BadRequestError";</span>
  }
}
&nbsp;
export class ValidationError extends Error {
  statusCode = <span class="cstat-no" title="statement not covered" >422;</span>
  details: any;
<span class="fstat-no" title="function not covered" >  constructor(m</span>essage = <span class="branch-0 cbranch-no" title="branch not covered" >"Validation Error",</span> details: any) {
<span class="cstat-no" title="statement not covered" >    super(message);</span>
<span class="cstat-no" title="statement not covered" >    this.name = "ValidationError";</span>
<span class="cstat-no" title="statement not covered" >    this.details = details;</span>
  }
}
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\errors\index.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/errors</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> src/errors</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">38.09% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>8/21</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/5</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">20% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>1/5</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">38.09% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>8/21</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line low'></div>
    <div class="pad1">
<table class="coverage-summary">
<thead>
<tr>
   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>
   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
</tr>
</thead>
<tbody><tr>
	<td class="file low" data-value="customErrors.ts"><a href="customErrors.ts.html">customErrors.ts</a></td>
	<td data-value="38.09" class="pic low">
	<div class="chart"><div class="cover-fill" style="width: 38%"></div><div class="cover-empty" style="width: 62%"></div></div>
	</td>
	<td data-value="38.09" class="pct low">38.09%</td>
	<td data-value="21" class="abs low">8/21</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="5" class="abs low">0/5</td>
	<td data-value="20" class="pct low">20%</td>
	<td data-value="5" class="abs low">1/5</td>
	<td data-value="38.09" class="pct low">38.09%</td>
	<td data-value="21" class="abs low">8/21</td>
	</tr>

</tbody>
</table>
</div>
                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\index.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../prettify.css" />
    <link rel="stylesheet" href="../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../index.html">All files</a> src</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">80% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>48/60</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/2</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">20% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>2/10</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">80.7% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>46/57</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <div class="pad1">
<table class="coverage-summary">
<thead>
<tr>
   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>
   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
</tr>
</thead>
<tbody><tr>
	<td class="file high" data-value="server.ts"><a href="server.ts.html">server.ts</a></td>
	<td data-value="80" class="pic high">
	<div class="chart"><div class="cover-fill" style="width: 80%"></div><div class="cover-empty" style="width: 20%"></div></div>
	</td>
	<td data-value="80" class="pct high">80%</td>
	<td data-value="60" class="abs high">48/60</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="2" class="abs low">0/2</td>
	<td data-value="20" class="pct low">20%</td>
	<td data-value="10" class="abs low">2/10</td>
	<td data-value="80.7" class="pct high">80.7%</td>
	<td data-value="57" class="abs high">46/57</td>
	</tr>

</tbody>
</table>
</div>
                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../sorter.js"></script>
        <script src="../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\middleware\asyncRouteHandler.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/middleware/asyncRouteHandler.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/middleware</a> asyncRouteHandler.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>4/4</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>2/2</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>4/4</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a></td><td class="line-coverage quiet"><span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">75x</span>
<span class="cline-any cline-yes">13x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { Request, Response, NextFunction } from "express";
&nbsp;
// Async route handler wrapper function
const asyncRouteHandler = (
  fn: (req: Request, res: Response, next: NextFunction) =&gt; Promise&lt;any&gt;,
) =&gt; {
  return (req: Request, res: Response, next: NextFunction) =&gt; {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
&nbsp;
export default asyncRouteHandler;
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\middleware\auth.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/middleware/auth.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/middleware</a> auth.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">87.5% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>14/16</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/2</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>1/1</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>13/13</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a></td><td class="line-coverage quiet"><span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">4x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">4x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">4x</span>
<span class="cline-any cline-yes">4x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
import { AuthenticationError } from "../errors/customErrors.js";
&nbsp;
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) =&gt; {
  const token = req.header("Authorization")?.replace("Bearer ", "");
&nbsp;
  <span class="missing-if-branch" title="if path not taken" >I</span>if (!token) <span class="cstat-no" title="statement not covered" >return next(new AuthenticationError("Missing token"));</span>
&nbsp;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await prisma.user.findUnique({
      where: { id: (decoded as any).id },
    });
&nbsp;
    <span class="missing-if-branch" title="if path not taken" >I</span>if (!user) <span class="cstat-no" title="statement not covered" >throw new AuthenticationError("User not found");</span>
    req.user = user;
    next();
  } catch (err) {
    next(new AuthenticationError("Invalid or expired token"));
  }
};
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\middleware\errorHandler.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/middleware/errorHandler.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/middleware</a> errorHandler.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">73.68% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>14/19</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">40% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>4/10</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>1/1</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">72.22% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>13/18</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line medium'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a>
<a name='L49'></a><a href='#L49'>49</a>
<a name='L50'></a><a href='#L50'>50</a>
<a name='L51'></a><a href='#L51'>51</a>
<a name='L52'></a><a href='#L52'>52</a>
<a name='L53'></a><a href='#L53'>53</a>
<a name='L54'></a><a href='#L54'>54</a>
<a name='L55'></a><a href='#L55'>55</a>
<a name='L56'></a><a href='#L56'>56</a>
<a name='L57'></a><a href='#L57'>57</a>
<a name='L58'></a><a href='#L58'>58</a>
<a name='L59'></a><a href='#L59'>59</a>
<a name='L60'></a><a href='#L60'>60</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Request, Response, NextFunction } from "express";
import {
  AuthenticationError,
  ValidationError,
} from "../errors/customErrors.js";
&nbsp;
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) =&gt; {
  <span class="missing-if-branch" title="if path not taken" >I</span>if (err instanceof ValidationError) {
<span class="cstat-no" title="statement not covered" >    return res.status(err.statusCode).json({</span>
      error: err.message,
      details: err.details,
    });
  }
&nbsp;
  if (err instanceof AuthenticationError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
&nbsp;
  // Check if response is still writable
  <span class="missing-if-branch" title="if path not taken" >I</span>if (res.headersSent || typeof res.status !== "function") {
<span class="cstat-no" title="statement not covered" >    return next(err);</span>
  }
&nbsp;
  // Handle static file errors first
  <span class="missing-if-branch" title="if path not taken" >I</span>if (req.path.startsWith("/images")) {
<span class="cstat-no" title="statement not covered" >    return res.status(404).send("Image not found");</span>
  }
&nbsp;
  // Handle Zod validation errors
  <span class="missing-if-branch" title="if path not taken" >I</span>if (err instanceof z.ZodError) {
<span class="cstat-no" title="statement not covered" >    return res?.status(400).json({</span>
      error: "Validation Error",
      details: err.errors,
    });
  }
  console.error(err);
  // Handle Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    return res?.status(400).json({
      error: "Database Error",
      code: err.code,
    });
  }
&nbsp;
  // Handle other errors
<span class="cstat-no" title="statement not covered" >  res?.status(500).json({</span>
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
};
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\middleware\index.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/middleware</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> src/middleware</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">78.43% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>40/51</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">28.57% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>4/14</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">85.71% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>6/7</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">80.85% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>38/47</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line medium'></div>
    <div class="pad1">
<table class="coverage-summary">
<thead>
<tr>
   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>
   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
</tr>
</thead>
<tbody><tr>
	<td class="file high" data-value="asyncRouteHandler.ts"><a href="asyncRouteHandler.ts.html">asyncRouteHandler.ts</a></td>
	<td data-value="100" class="pic high">
	<div class="chart"><div class="cover-fill cover-full" style="width: 100%"></div><div class="cover-empty" style="width: 0%"></div></div>
	</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="4" class="abs high">4/4</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="2" class="abs high">2/2</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="4" class="abs high">4/4</td>
	</tr>

<tr>
	<td class="file high" data-value="auth.ts"><a href="auth.ts.html">auth.ts</a></td>
	<td data-value="87.5" class="pic high">
	<div class="chart"><div class="cover-fill" style="width: 87%"></div><div class="cover-empty" style="width: 13%"></div></div>
	</td>
	<td data-value="87.5" class="pct high">87.5%</td>
	<td data-value="16" class="abs high">14/16</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="2" class="abs low">0/2</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="1" class="abs high">1/1</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="13" class="abs high">13/13</td>
	</tr>

<tr>
	<td class="file medium" data-value="errorHandler.ts"><a href="errorHandler.ts.html">errorHandler.ts</a></td>
	<td data-value="73.68" class="pic medium">
	<div class="chart"><div class="cover-fill" style="width: 73%"></div><div class="cover-empty" style="width: 27%"></div></div>
	</td>
	<td data-value="73.68" class="pct medium">73.68%</td>
	<td data-value="19" class="abs medium">14/19</td>
	<td data-value="40" class="pct low">40%</td>
	<td data-value="10" class="abs low">4/10</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="1" class="abs high">1/1</td>
	<td data-value="72.22" class="pct medium">72.22%</td>
	<td data-value="18" class="abs medium">13/18</td>
	</tr>

<tr>
	<td class="file medium" data-value="validate.ts"><a href="validate.ts.html">validate.ts</a></td>
	<td data-value="66.66" class="pic medium">
	<div class="chart"><div class="cover-fill" style="width: 66%"></div><div class="cover-empty" style="width: 34%"></div></div>
	</td>
	<td data-value="66.66" class="pct medium">66.66%</td>
	<td data-value="12" class="abs medium">8/12</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="2" class="abs low">0/2</td>
	<td data-value="66.66" class="pct medium">66.66%</td>
	<td data-value="3" class="abs medium">2/3</td>
	<td data-value="66.66" class="pct medium">66.66%</td>
	<td data-value="12" class="abs medium">8/12</td>
	</tr>

</tbody>
</table>
</div>
                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\middleware\validate.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/middleware/validate.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/middleware</a> validate.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">66.66% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>8/12</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/2</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">66.66% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>2/3</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">66.66% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>8/12</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line medium'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a></td><td class="line-coverage quiet"><span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">30x</span>
<span class="cline-any cline-yes">11x</span>
<span class="cline-any cline-yes">11x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">11x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { Request, Response, NextFunction } from "express";
import { AnyZodObject, z } from "zod";
import { ValidationError } from "../errors/customErrors.js";
&nbsp;
export const validate =
  (schema: AnyZodObject) =&gt;
  async (req: Request, res: Response, next: NextFunction) =&gt; {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
<span class="cstat-no" title="statement not covered" >      if (error instanceof z.ZodError) {</span>
<span class="cstat-no" title="statement not covered" >        next(</span>
          new ValidationError(
            "Validation failed",
            error.errors.map(<span class="fstat-no" title="function not covered" >(e</span>) =&gt; (<span class="cstat-no" title="statement not covered" >{</span>
              path: e.path.join("."),
              message: e.message,
            }))
          )
        );
      } else {
<span class="cstat-no" title="statement not covered" >        next(error);</span>
      }
    }
  };
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\routes\albums.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/routes/albums.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/routes</a> albums.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>12/12</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>12/12</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import express from "express";
import {
  createAlbumController,
  deleteAlbumController,
  getAlbumSongStatsController,
  getAlbumsController,
  updateAlbumController,
} from "../controllers/album.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createAlbumSchema,
  updateAlbumSchema,
} from "../validators/album.validator.js";
&nbsp;
const router = express.Router();
&nbsp;
router.post(
  "/",
  authenticate,
  validate(createAlbumSchema),
  createAlbumController
);
&nbsp;
router.get("/:albumId/songs/stats", getAlbumSongStatsController);
&nbsp;
router.get("/", getAlbumsController);
&nbsp;
router.put(
  "/:id",
  authenticate,
  validate(updateAlbumSchema),
  updateAlbumController
);
&nbsp;
router.delete("/:id", authenticate, deleteAlbumController);
&nbsp;
export default router;
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\routes\groups.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/routes/groups.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/routes</a> groups.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>13/13</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>13/13</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import express from "express";
import {
  createGroupController,
  deleteGroupController,
  updateGroupController,
  sendInviteController,
  joinGroupController,
  getUserGroupsController,
} from "../controllers/group.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { groupSchema } from "../validators/group.validator.js";
&nbsp;
const router = express.Router();
&nbsp;
router.get("/", authenticate, getUserGroupsController);
router.post("/", authenticate, validate(groupSchema), createGroupController);
router.delete("/:groupId", authenticate, deleteGroupController);
router.patch(
  "/:groupId",
  authenticate,
  validate(groupSchema),
  updateGroupController,
);
router.post("/:groupId/invite", authenticate, sendInviteController);
router.post("/join", authenticate, joinGroupController);
&nbsp;
export default router;
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\routes\index.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/routes</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> src/routes</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>57/57</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>57/57</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <div class="pad1">
<table class="coverage-summary">
<thead>
<tr>
   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>
   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
</tr>
</thead>
<tbody><tr>
	<td class="file high" data-value="albums.ts"><a href="albums.ts.html">albums.ts</a></td>
	<td data-value="100" class="pic high">
	<div class="chart"><div class="cover-fill cover-full" style="width: 100%"></div><div class="cover-empty" style="width: 0%"></div></div>
	</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="12" class="abs high">12/12</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="12" class="abs high">12/12</td>
	</tr>

<tr>
	<td class="file high" data-value="groups.ts"><a href="groups.ts.html">groups.ts</a></td>
	<td data-value="100" class="pic high">
	<div class="chart"><div class="cover-fill cover-full" style="width: 100%"></div><div class="cover-empty" style="width: 0%"></div></div>
	</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="13" class="abs high">13/13</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="13" class="abs high">13/13</td>
	</tr>

<tr>
	<td class="file high" data-value="reviews.ts"><a href="reviews.ts.html">reviews.ts</a></td>
	<td data-value="100" class="pic high">
	<div class="chart"><div class="cover-fill cover-full" style="width: 100%"></div><div class="cover-empty" style="width: 0%"></div></div>
	</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="7" class="abs high">7/7</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="7" class="abs high">7/7</td>
	</tr>

<tr>
	<td class="file high" data-value="songs.ts"><a href="songs.ts.html">songs.ts</a></td>
	<td data-value="100" class="pic high">
	<div class="chart"><div class="cover-fill cover-full" style="width: 100%"></div><div class="cover-empty" style="width: 0%"></div></div>
	</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="12" class="abs high">12/12</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="12" class="abs high">12/12</td>
	</tr>

<tr>
	<td class="file high" data-value="users.ts"><a href="users.ts.html">users.ts</a></td>
	<td data-value="100" class="pic high">
	<div class="chart"><div class="cover-fill cover-full" style="width: 100%"></div><div class="cover-empty" style="width: 0%"></div></div>
	</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="13" class="abs high">13/13</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="13" class="abs high">13/13</td>
	</tr>

</tbody>
</table>
</div>
                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\routes\reviews.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/routes/reviews.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/routes</a> reviews.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>7/7</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>7/7</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import express from "express";
import {
  createReviewController,
  getReviewsController,
} from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.js";
&nbsp;
const router = express.Router();
&nbsp;
router.post("/", authenticate, createReviewController);
router.get("/", getReviewsController);
&nbsp;
export default router;
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\routes\songs.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/routes/songs.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/routes</a> songs.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>12/12</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>12/12</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import express from "express";
import {
  getSongsController,
  getSongController,
  createSongController,
  updateSongController,
  deleteSongController,
} from "../controllers/song.controller.js";
import { validate } from "../middleware/validate.js";
import { songSchema } from "../validators/song.validator.js";
import { authenticate } from "../middleware/auth.js";
&nbsp;
const router = express.Router();
&nbsp;
router.get("/", getSongsController);
router.get("/:songId", getSongController);
router.post("/", authenticate, validate(songSchema), createSongController);
router.patch(
  "/:songId",
  authenticate,
  validate(songSchema),
  updateSongController,
);
router.delete("/:songId", authenticate, deleteSongController);
&nbsp;
export default router;
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\routes\users.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/routes/users.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/routes</a> users.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>13/13</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>13/13</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import express from "express";
import {
  registerUserController,
  loginUserController,
  getCurrentUserController,
  updateUserController,
  deleteUserController,
  refreshTokenController,
} from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";
import {
  registrationSchema,
  loginSchema,
  updateUserSchema,
  refreshTokenSchema,
} from "../validators/user.validator.js";
import { authenticate } from "../middleware/auth.js";
&nbsp;
const router = express.Router();
&nbsp;
router.post("/register", validate(registrationSchema), registerUserController);
router.post("/login", validate(loginSchema), loginUserController);
router.post("/refresh", validate(refreshTokenSchema), refreshTokenController);
router.get("/me", authenticate, getCurrentUserController);
router.patch(
  "/me",
  authenticate,
  validate(updateUserSchema._def.schema),
  updateUserController
);
&nbsp;
router.delete("/me", authenticate, deleteUserController);
&nbsp;
export default router;
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\server.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/server.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../prettify.css" />
    <link rel="stylesheet" href="../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../index.html">All files</a> / <a href="index.html">src</a> server.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">80% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>48/60</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/2</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">20% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>2/10</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">80.7% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>46/57</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a>
<a name='L49'></a><a href='#L49'>49</a>
<a name='L50'></a><a href='#L50'>50</a>
<a name='L51'></a><a href='#L51'>51</a>
<a name='L52'></a><a href='#L52'>52</a>
<a name='L53'></a><a href='#L53'>53</a>
<a name='L54'></a><a href='#L54'>54</a>
<a name='L55'></a><a href='#L55'>55</a>
<a name='L56'></a><a href='#L56'>56</a>
<a name='L57'></a><a href='#L57'>57</a>
<a name='L58'></a><a href='#L58'>58</a>
<a name='L59'></a><a href='#L59'>59</a>
<a name='L60'></a><a href='#L60'>60</a>
<a name='L61'></a><a href='#L61'>61</a>
<a name='L62'></a><a href='#L62'>62</a>
<a name='L63'></a><a href='#L63'>63</a>
<a name='L64'></a><a href='#L64'>64</a>
<a name='L65'></a><a href='#L65'>65</a>
<a name='L66'></a><a href='#L66'>66</a>
<a name='L67'></a><a href='#L67'>67</a>
<a name='L68'></a><a href='#L68'>68</a>
<a name='L69'></a><a href='#L69'>69</a>
<a name='L70'></a><a href='#L70'>70</a>
<a name='L71'></a><a href='#L71'>71</a>
<a name='L72'></a><a href='#L72'>72</a>
<a name='L73'></a><a href='#L73'>73</a>
<a name='L74'></a><a href='#L74'>74</a>
<a name='L75'></a><a href='#L75'>75</a>
<a name='L76'></a><a href='#L76'>76</a>
<a name='L77'></a><a href='#L77'>77</a>
<a name='L78'></a><a href='#L78'>78</a>
<a name='L79'></a><a href='#L79'>79</a>
<a name='L80'></a><a href='#L80'>80</a>
<a name='L81'></a><a href='#L81'>81</a>
<a name='L82'></a><a href='#L82'>82</a>
<a name='L83'></a><a href='#L83'>83</a>
<a name='L84'></a><a href='#L84'>84</a>
<a name='L85'></a><a href='#L85'>85</a>
<a name='L86'></a><a href='#L86'>86</a>
<a name='L87'></a><a href='#L87'>87</a>
<a name='L88'></a><a href='#L88'>88</a>
<a name='L89'></a><a href='#L89'>89</a>
<a name='L90'></a><a href='#L90'>90</a>
<a name='L91'></a><a href='#L91'>91</a>
<a name='L92'></a><a href='#L92'>92</a>
<a name='L93'></a><a href='#L93'>93</a>
<a name='L94'></a><a href='#L94'>94</a>
<a name='L95'></a><a href='#L95'>95</a>
<a name='L96'></a><a href='#L96'>96</a>
<a name='L97'></a><a href='#L97'>97</a>
<a name='L98'></a><a href='#L98'>98</a>
<a name='L99'></a><a href='#L99'>99</a>
<a name='L100'></a><a href='#L100'>100</a>
<a name='L101'></a><a href='#L101'>101</a>
<a name='L102'></a><a href='#L102'>102</a>
<a name='L103'></a><a href='#L103'>103</a>
<a name='L104'></a><a href='#L104'>104</a>
<a name='L105'></a><a href='#L105'>105</a>
<a name='L106'></a><a href='#L106'>106</a>
<a name='L107'></a><a href='#L107'>107</a>
<a name='L108'></a><a href='#L108'>108</a>
<a name='L109'></a><a href='#L109'>109</a>
<a name='L110'></a><a href='#L110'>110</a>
<a name='L111'></a><a href='#L111'>111</a>
<a name='L112'></a><a href='#L112'>112</a>
<a name='L113'></a><a href='#L113'>113</a>
<a name='L114'></a><a href='#L114'>114</a>
<a name='L115'></a><a href='#L115'>115</a>
<a name='L116'></a><a href='#L116'>116</a>
<a name='L117'></a><a href='#L117'>117</a>
<a name='L118'></a><a href='#L118'>118</a>
<a name='L119'></a><a href='#L119'>119</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">14x</span>
<span class="cline-any cline-yes">14x</span>
<span class="cline-any cline-yes">14x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import express, { Request, Response, NextFunction } from "express";
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
&nbsp;
// Middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { authenticate } from "./middleware/auth.js";
import asyncRouteHandler from "./middleware/asyncRouteHandler.js";
import { createServer, Server } from "http";
import helmet from "helmet";
&nbsp;
// Config
const directory = process.cwd();
dotenv.config();
&nbsp;
// Express setup
export const app = express();
export const server = createServer(app);
export let activePort: number;
&nbsp;
export const startServer = <span class="fstat-no" title="function not covered" >() =</span>&gt; {
<span class="cstat-no" title="statement not covered" >  return new Promise&lt;Server&gt;(<span class="fstat-no" title="function not covered" >(r</span>esolve) =&gt; {</span>
    const instance = <span class="cstat-no" title="statement not covered" >server.listen(0, <span class="fstat-no" title="function not covered" >() =</span>&gt; {</span>
      // Use 0 for random port
<span class="cstat-no" title="statement not covered" >      activePort = (instance.address() as any).port;</span>
<span class="cstat-no" title="statement not covered" >      console.log(`Server running on port ${activePort}`);</span>
<span class="cstat-no" title="statement not covered" >      resolve(instance);</span>
    });
  });
};
&nbsp;
export const stopServer = <span class="fstat-no" title="function not covered" >() =</span>&gt; {
<span class="cstat-no" title="statement not covered" >  return new Promise(<span class="fstat-no" title="function not covered" >(r</span>esolve) =&gt; {</span>
<span class="cstat-no" title="statement not covered" >    server.close(<span class="fstat-no" title="function not covered" >() =</span>&gt; <span class="cstat-no" title="statement not covered" >resolve(true))</span>;</span>
  });
};
&nbsp;
// Middleware chain
app.use(cors());
app.use(express.json());
app.use(expressMongoSanitize());
&nbsp;
// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);
&nbsp;
// Static files
app.use(
  "/src/images", // Match the URL path you're using
  express.static(path.join(directory, "../src/images")),
<span class="fstat-no" title="function not covered" >  (e</span>rr: any, req: Request, res: Response, next: NextFunction) =&gt; {
<span class="cstat-no" title="statement not covered" >    if (err) {</span>
<span class="cstat-no" title="statement not covered" >      res.status(404).send("Image not found");</span>
    } else {
<span class="cstat-no" title="statement not covered" >      next();</span>
    }
  }
);
&nbsp;
const upload = multer({ dest: "uploads/" });
app.post(
  "/api/upload",
  authenticate,
  upload.single("image"),
  asyncRouteHandler(<span class="fstat-no" title="function not covered" >async </span>(req, res) =&gt; {
    // Handle file storage (S3/local)
<span class="cstat-no" title="statement not covered" >    res.json({ url: `/images/${req.file?.filename}` });</span>
  })
);
&nbsp;
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts",
});
app.use("/api/auth/login", authLimiter);
&nbsp;
// Enable the Helmet middleware for added security
app.use(helmet());
app.use(
  helmet.hsts({
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  })
);
app.use((req, res, next) =&gt; {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
&nbsp;
// Routes
app.use("/api/albums", albumsRouter);
app.use("/api/songs", songsRouter);
app.use("/api/auth", usersRouter);
app.use("/api/groups", authenticate, groupsRouter);
app.use("/api/reviews", authenticate, reviewRoutes);
&nbsp;
// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) =&gt; {
  errorHandler(err, req, res, next);
});
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../sorter.js"></script>
        <script src="../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\services\album.service.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/services/album.service.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/services</a> album.service.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">67.74% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>21/31</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">18.75% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>3/16</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">50% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>4/8</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">66.66% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>16/24</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line medium'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a>
<a name='L49'></a><a href='#L49'>49</a>
<a name='L50'></a><a href='#L50'>50</a>
<a name='L51'></a><a href='#L51'>51</a>
<a name='L52'></a><a href='#L52'>52</a>
<a name='L53'></a><a href='#L53'>53</a>
<a name='L54'></a><a href='#L54'>54</a>
<a name='L55'></a><a href='#L55'>55</a>
<a name='L56'></a><a href='#L56'>56</a>
<a name='L57'></a><a href='#L57'>57</a>
<a name='L58'></a><a href='#L58'>58</a>
<a name='L59'></a><a href='#L59'>59</a>
<a name='L60'></a><a href='#L60'>60</a>
<a name='L61'></a><a href='#L61'>61</a>
<a name='L62'></a><a href='#L62'>62</a>
<a name='L63'></a><a href='#L63'>63</a>
<a name='L64'></a><a href='#L64'>64</a>
<a name='L65'></a><a href='#L65'>65</a>
<a name='L66'></a><a href='#L66'>66</a>
<a name='L67'></a><a href='#L67'>67</a>
<a name='L68'></a><a href='#L68'>68</a>
<a name='L69'></a><a href='#L69'>69</a>
<a name='L70'></a><a href='#L70'>70</a>
<a name='L71'></a><a href='#L71'>71</a>
<a name='L72'></a><a href='#L72'>72</a>
<a name='L73'></a><a href='#L73'>73</a>
<a name='L74'></a><a href='#L74'>74</a>
<a name='L75'></a><a href='#L75'>75</a>
<a name='L76'></a><a href='#L76'>76</a>
<a name='L77'></a><a href='#L77'>77</a>
<a name='L78'></a><a href='#L78'>78</a>
<a name='L79'></a><a href='#L79'>79</a>
<a name='L80'></a><a href='#L80'>80</a>
<a name='L81'></a><a href='#L81'>81</a>
<a name='L82'></a><a href='#L82'>82</a>
<a name='L83'></a><a href='#L83'>83</a>
<a name='L84'></a><a href='#L84'>84</a>
<a name='L85'></a><a href='#L85'>85</a>
<a name='L86'></a><a href='#L86'>86</a>
<a name='L87'></a><a href='#L87'>87</a>
<a name='L88'></a><a href='#L88'>88</a>
<a name='L89'></a><a href='#L89'>89</a>
<a name='L90'></a><a href='#L90'>90</a>
<a name='L91'></a><a href='#L91'>91</a>
<a name='L92'></a><a href='#L92'>92</a>
<a name='L93'></a><a href='#L93'>93</a>
<a name='L94'></a><a href='#L94'>94</a>
<a name='L95'></a><a href='#L95'>95</a>
<a name='L96'></a><a href='#L96'>96</a>
<a name='L97'></a><a href='#L97'>97</a>
<a name='L98'></a><a href='#L98'>98</a>
<a name='L99'></a><a href='#L99'>99</a>
<a name='L100'></a><a href='#L100'>100</a>
<a name='L101'></a><a href='#L101'>101</a>
<a name='L102'></a><a href='#L102'>102</a>
<a name='L103'></a><a href='#L103'>103</a>
<a name='L104'></a><a href='#L104'>104</a>
<a name='L105'></a><a href='#L105'>105</a>
<a name='L106'></a><a href='#L106'>106</a>
<a name='L107'></a><a href='#L107'>107</a>
<a name='L108'></a><a href='#L108'>108</a>
<a name='L109'></a><a href='#L109'>109</a>
<a name='L110'></a><a href='#L110'>110</a>
<a name='L111'></a><a href='#L111'>111</a>
<a name='L112'></a><a href='#L112'>112</a>
<a name='L113'></a><a href='#L113'>113</a>
<a name='L114'></a><a href='#L114'>114</a>
<a name='L115'></a><a href='#L115'>115</a>
<a name='L116'></a><a href='#L116'>116</a>
<a name='L117'></a><a href='#L117'>117</a>
<a name='L118'></a><a href='#L118'>118</a>
<a name='L119'></a><a href='#L119'>119</a>
<a name='L120'></a><a href='#L120'>120</a>
<a name='L121'></a><a href='#L121'>121</a>
<a name='L122'></a><a href='#L122'>122</a>
<a name='L123'></a><a href='#L123'>123</a>
<a name='L124'></a><a href='#L124'>124</a>
<a name='L125'></a><a href='#L125'>125</a>
<a name='L126'></a><a href='#L126'>126</a>
<a name='L127'></a><a href='#L127'>127</a>
<a name='L128'></a><a href='#L128'>128</a>
<a name='L129'></a><a href='#L129'>129</a>
<a name='L130'></a><a href='#L130'>130</a>
<a name='L131'></a><a href='#L131'>131</a>
<a name='L132'></a><a href='#L132'>132</a>
<a name='L133'></a><a href='#L133'>133</a>
<a name='L134'></a><a href='#L134'>134</a>
<a name='L135'></a><a href='#L135'>135</a>
<a name='L136'></a><a href='#L136'>136</a>
<a name='L137'></a><a href='#L137'>137</a>
<a name='L138'></a><a href='#L138'>138</a>
<a name='L139'></a><a href='#L139'>139</a>
<a name='L140'></a><a href='#L140'>140</a>
<a name='L141'></a><a href='#L141'>141</a>
<a name='L142'></a><a href='#L142'>142</a>
<a name='L143'></a><a href='#L143'>143</a>
<a name='L144'></a><a href='#L144'>144</a>
<a name='L145'></a><a href='#L145'>145</a>
<a name='L146'></a><a href='#L146'>146</a>
<a name='L147'></a><a href='#L147'>147</a>
<a name='L148'></a><a href='#L148'>148</a>
<a name='L149'></a><a href='#L149'>149</a>
<a name='L150'></a><a href='#L150'>150</a></td><td class="line-coverage quiet"><span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";
&nbsp;
interface SongStatsParams {
  albumId: number;
  groupId?: number;
  userId?: number;
}
&nbsp;
export const createAlbumService = async (data: Prisma.AlbumCreateInput) =&gt; {
  return prisma.album.create({
    data: {
      ...data,
      releaseDate: new Date(data.releaseDate),
    },
  });
};
&nbsp;
// export const getAlbumStatsService = async (albumId: number) =&gt; {
//   const [reviews, averageRating, songs] = await prisma.$transaction([
//     prisma.review.findMany({
//       where: { song: { albumId } },
//       select: { id: true, rating: true },
//     }),
//     prisma.review.aggregate({
//       _avg: { rating: true },
//       where: { song: { albumId } },
//     }),
//     prisma.song.findMany({
//       where: { albumId },
//       select: { id: true, title: true },
//     }),
//   ]);
&nbsp;
//   return {
//     reviewCount: reviews.length,
//     averageRating: averageRating._avg.rating || 0,
//     songCount: songs.length,
//     songs,
//   };
// };
&nbsp;
export const getAlbumSongStatsService = async ({
  albumId,
  groupId,
  userId,
}: SongStatsParams) =&gt; {
  // Get all songs in the album
  const songs = await prisma.song.findMany({
    where: { albumId },
    select: { id: true, title: true, trackNumber: true, duration: true },
  });
&nbsp;
  // Build review filter
  const reviewFilter: any = {
    song: { albumId },
    ...(groupId &amp;&amp; <span class="branch-1 cbranch-no" title="branch not covered" >{ groupId })</span>,
    ...(userId &amp;&amp; <span class="branch-1 cbranch-no" title="branch not covered" >{ userId })</span>,
  };
&nbsp;
  // Get aggregated stats
  const aggregatedStats = await prisma.review.groupBy({
    by: ["songId"],
    where: reviewFilter,
    _avg: { rating: true },
    _count: { rating: true },
  });
&nbsp;
  // Get user reviews if applicable
  let userReviews: any[] = [];
  <span class="missing-if-branch" title="if path not taken" >I</span>if (userId) {
<span class="cstat-no" title="statement not covered" >    userReviews = await prisma.review.findMany({</span>
      where: { userId, song: { albumId } },
      select: { songId: true, rating: true },
    });
  }
&nbsp;
  // Merge data
  return songs.map(<span class="fstat-no" title="function not covered" >(s</span>ong) =&gt; {
    const stats = <span class="cstat-no" title="statement not covered" >aggregatedStats.find(<span class="fstat-no" title="function not covered" >(s</span>) =&gt; <span class="cstat-no" title="statement not covered" >s.songId === song.id)</span>;</span>
    const userReview = <span class="cstat-no" title="statement not covered" >userReviews.find(<span class="fstat-no" title="function not covered" >(r</span>) =&gt; <span class="cstat-no" title="statement not covered" >r.songId === song.id)</span>;</span>
&nbsp;
<span class="cstat-no" title="statement not covered" >    return {</span>
      id: song.id,
      title: song.title,
      trackNumber: song.trackNumber,
      duration: song.duration,
      averageRating: stats?._avg.rating || 0,
      reviewCount: stats?._count.rating || 0,
      userRating: userReview?.rating || null,
    };
  });
};
&nbsp;
export const getPaginatedAlbumsService = <span class="fstat-no" title="function not covered" >async </span>(params: {
  page: number;
  limit: number;
  search?: string;
}) =&gt; {
  const where: Prisma.AlbumWhereInput = <span class="cstat-no" title="statement not covered" >params.search</span>
    ? { OR: [{ title: { contains: params.search, mode: "insensitive" } }] }
    : {};
&nbsp;
  const [total, albums] = <span class="cstat-no" title="statement not covered" >await prisma.$transaction([</span>
    prisma.album.count({ where }),
    prisma.album.findMany({
      where,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { releaseDate: "desc" },
      include: {
        songs: {
          include: {
            reviews: true,
          },
        },
      },
    }),
  ]);
&nbsp;
<span class="cstat-no" title="statement not covered" >  return {</span>
    data: albums,
    meta: {
      total,
      page: params.page,
      totalPages: Math.ceil(total / params.limit),
    },
  };
};
&nbsp;
export const updateAlbumService = async (
  id: number,
  data: Prisma.AlbumUpdateInput
) =&gt; {
  <span class="missing-if-branch" title="if path not taken" >I</span>if (data.releaseDate &amp;&amp; <span class="branch-1 cbranch-no" title="branch not covered" >typeof data.releaseDate === "string")</span> {
<span class="cstat-no" title="statement not covered" >    data.releaseDate = new Date(data.releaseDate);</span>
  }
&nbsp;
  return prisma.album.update({
    where: { id },
    data,
  });
};
&nbsp;
export const deleteAlbumService = async (id: number) =&gt; {
  return prisma.album.delete({
    where: { id },
  });
};
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\services\email.service.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/services/email.service.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/services</a> email.service.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">66.66% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>4/6</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/1</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">60% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>3/5</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line medium'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import nodemailer from "nodemailer";
&nbsp;
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
&nbsp;
export const sendInvitationEmail = <span class="fstat-no" title="function not covered" >async </span>(
  email: string,
  groupName: string,
  inviteCode: string,
) =&gt; {
  const inviteLink = <span class="cstat-no" title="statement not covered" >`${process.env.FRONTEND_URL}/join?code=${inviteCode}`;</span>
&nbsp;
<span class="cstat-no" title="statement not covered" >  await transporter.sendMail({</span>
    from: `"Red Hot Takes" &lt;${process.env.EMAIL_FROM}&gt;`,
    to: email,
    subject: `Join ${groupName}`,
    html: `
      &lt;p&gt;You've been invited to join the group &lt;strong&gt;${groupName}&lt;/strong&gt;!&lt;/p&gt;
      &lt;p&gt;Click below to join:&lt;/p&gt;
      &lt;a href="${inviteLink}" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #2563eb;
        color: white;
        text-decoration: none;
        border-radius: 5px;
      "&gt;
        Join Group
      &lt;/a&gt;
      &lt;p&gt;Or use this code: ${inviteCode}&lt;/p&gt;
    `,
  });
};
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\services\group.service.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/services/group.service.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/services</a> group.service.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">37.5% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>18/48</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/18</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/7</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">28.2% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>11/39</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line low'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a>
<a name='L49'></a><a href='#L49'>49</a>
<a name='L50'></a><a href='#L50'>50</a>
<a name='L51'></a><a href='#L51'>51</a>
<a name='L52'></a><a href='#L52'>52</a>
<a name='L53'></a><a href='#L53'>53</a>
<a name='L54'></a><a href='#L54'>54</a>
<a name='L55'></a><a href='#L55'>55</a>
<a name='L56'></a><a href='#L56'>56</a>
<a name='L57'></a><a href='#L57'>57</a>
<a name='L58'></a><a href='#L58'>58</a>
<a name='L59'></a><a href='#L59'>59</a>
<a name='L60'></a><a href='#L60'>60</a>
<a name='L61'></a><a href='#L61'>61</a>
<a name='L62'></a><a href='#L62'>62</a>
<a name='L63'></a><a href='#L63'>63</a>
<a name='L64'></a><a href='#L64'>64</a>
<a name='L65'></a><a href='#L65'>65</a>
<a name='L66'></a><a href='#L66'>66</a>
<a name='L67'></a><a href='#L67'>67</a>
<a name='L68'></a><a href='#L68'>68</a>
<a name='L69'></a><a href='#L69'>69</a>
<a name='L70'></a><a href='#L70'>70</a>
<a name='L71'></a><a href='#L71'>71</a>
<a name='L72'></a><a href='#L72'>72</a>
<a name='L73'></a><a href='#L73'>73</a>
<a name='L74'></a><a href='#L74'>74</a>
<a name='L75'></a><a href='#L75'>75</a>
<a name='L76'></a><a href='#L76'>76</a>
<a name='L77'></a><a href='#L77'>77</a>
<a name='L78'></a><a href='#L78'>78</a>
<a name='L79'></a><a href='#L79'>79</a>
<a name='L80'></a><a href='#L80'>80</a>
<a name='L81'></a><a href='#L81'>81</a>
<a name='L82'></a><a href='#L82'>82</a>
<a name='L83'></a><a href='#L83'>83</a>
<a name='L84'></a><a href='#L84'>84</a>
<a name='L85'></a><a href='#L85'>85</a>
<a name='L86'></a><a href='#L86'>86</a>
<a name='L87'></a><a href='#L87'>87</a>
<a name='L88'></a><a href='#L88'>88</a>
<a name='L89'></a><a href='#L89'>89</a>
<a name='L90'></a><a href='#L90'>90</a>
<a name='L91'></a><a href='#L91'>91</a>
<a name='L92'></a><a href='#L92'>92</a>
<a name='L93'></a><a href='#L93'>93</a>
<a name='L94'></a><a href='#L94'>94</a>
<a name='L95'></a><a href='#L95'>95</a>
<a name='L96'></a><a href='#L96'>96</a>
<a name='L97'></a><a href='#L97'>97</a>
<a name='L98'></a><a href='#L98'>98</a>
<a name='L99'></a><a href='#L99'>99</a>
<a name='L100'></a><a href='#L100'>100</a>
<a name='L101'></a><a href='#L101'>101</a>
<a name='L102'></a><a href='#L102'>102</a>
<a name='L103'></a><a href='#L103'>103</a>
<a name='L104'></a><a href='#L104'>104</a>
<a name='L105'></a><a href='#L105'>105</a>
<a name='L106'></a><a href='#L106'>106</a>
<a name='L107'></a><a href='#L107'>107</a>
<a name='L108'></a><a href='#L108'>108</a>
<a name='L109'></a><a href='#L109'>109</a>
<a name='L110'></a><a href='#L110'>110</a>
<a name='L111'></a><a href='#L111'>111</a>
<a name='L112'></a><a href='#L112'>112</a>
<a name='L113'></a><a href='#L113'>113</a>
<a name='L114'></a><a href='#L114'>114</a>
<a name='L115'></a><a href='#L115'>115</a>
<a name='L116'></a><a href='#L116'>116</a>
<a name='L117'></a><a href='#L117'>117</a>
<a name='L118'></a><a href='#L118'>118</a>
<a name='L119'></a><a href='#L119'>119</a>
<a name='L120'></a><a href='#L120'>120</a>
<a name='L121'></a><a href='#L121'>121</a>
<a name='L122'></a><a href='#L122'>122</a>
<a name='L123'></a><a href='#L123'>123</a>
<a name='L124'></a><a href='#L124'>124</a>
<a name='L125'></a><a href='#L125'>125</a>
<a name='L126'></a><a href='#L126'>126</a>
<a name='L127'></a><a href='#L127'>127</a>
<a name='L128'></a><a href='#L128'>128</a>
<a name='L129'></a><a href='#L129'>129</a>
<a name='L130'></a><a href='#L130'>130</a>
<a name='L131'></a><a href='#L131'>131</a>
<a name='L132'></a><a href='#L132'>132</a>
<a name='L133'></a><a href='#L133'>133</a>
<a name='L134'></a><a href='#L134'>134</a>
<a name='L135'></a><a href='#L135'>135</a>
<a name='L136'></a><a href='#L136'>136</a>
<a name='L137'></a><a href='#L137'>137</a>
<a name='L138'></a><a href='#L138'>138</a>
<a name='L139'></a><a href='#L139'>139</a>
<a name='L140'></a><a href='#L140'>140</a>
<a name='L141'></a><a href='#L141'>141</a>
<a name='L142'></a><a href='#L142'>142</a>
<a name='L143'></a><a href='#L143'>143</a>
<a name='L144'></a><a href='#L144'>144</a>
<a name='L145'></a><a href='#L145'>145</a>
<a name='L146'></a><a href='#L146'>146</a>
<a name='L147'></a><a href='#L147'>147</a>
<a name='L148'></a><a href='#L148'>148</a>
<a name='L149'></a><a href='#L149'>149</a>
<a name='L150'></a><a href='#L150'>150</a>
<a name='L151'></a><a href='#L151'>151</a>
<a name='L152'></a><a href='#L152'>152</a>
<a name='L153'></a><a href='#L153'>153</a>
<a name='L154'></a><a href='#L154'>154</a>
<a name='L155'></a><a href='#L155'>155</a>
<a name='L156'></a><a href='#L156'>156</a>
<a name='L157'></a><a href='#L157'>157</a>
<a name='L158'></a><a href='#L158'>158</a>
<a name='L159'></a><a href='#L159'>159</a>
<a name='L160'></a><a href='#L160'>160</a>
<a name='L161'></a><a href='#L161'>161</a>
<a name='L162'></a><a href='#L162'>162</a>
<a name='L163'></a><a href='#L163'>163</a>
<a name='L164'></a><a href='#L164'>164</a>
<a name='L165'></a><a href='#L165'>165</a>
<a name='L166'></a><a href='#L166'>166</a>
<a name='L167'></a><a href='#L167'>167</a>
<a name='L168'></a><a href='#L168'>168</a>
<a name='L169'></a><a href='#L169'>169</a>
<a name='L170'></a><a href='#L170'>170</a>
<a name='L171'></a><a href='#L171'>171</a>
<a name='L172'></a><a href='#L172'>172</a>
<a name='L173'></a><a href='#L173'>173</a>
<a name='L174'></a><a href='#L174'>174</a>
<a name='L175'></a><a href='#L175'>175</a>
<a name='L176'></a><a href='#L176'>176</a>
<a name='L177'></a><a href='#L177'>177</a>
<a name='L178'></a><a href='#L178'>178</a>
<a name='L179'></a><a href='#L179'>179</a>
<a name='L180'></a><a href='#L180'>180</a>
<a name='L181'></a><a href='#L181'>181</a>
<a name='L182'></a><a href='#L182'>182</a>
<a name='L183'></a><a href='#L183'>183</a>
<a name='L184'></a><a href='#L184'>184</a>
<a name='L185'></a><a href='#L185'>185</a>
<a name='L186'></a><a href='#L186'>186</a>
<a name='L187'></a><a href='#L187'>187</a>
<a name='L188'></a><a href='#L188'>188</a>
<a name='L189'></a><a href='#L189'>189</a>
<a name='L190'></a><a href='#L190'>190</a>
<a name='L191'></a><a href='#L191'>191</a>
<a name='L192'></a><a href='#L192'>192</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import prisma from "../db/prisma.js";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../errors/customErrors.js";
import crypto from "crypto";
import { sendInvitationEmail } from "./email.service.js";
&nbsp;
interface CreateGroupInput {
  name: string;
  description?: string;
  isPrivate: boolean;
  userId: number;
}
&nbsp;
interface UpdateGroupInput {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}
&nbsp;
export const createGroupService = <span class="fstat-no" title="function not covered" >async </span>(data: CreateGroupInput) =&gt; {
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (!data.name || data.name.trim().length &lt; 2) {</span>
<span class="cstat-no" title="statement not covered" >    throw new BadRequestError("Group name must be at least 2 characters");</span>
  }
&nbsp;
<span class="cstat-no" title="statement not covered" >  return prisma.group.create({</span>
    data: {
      name: data.name,
      description: data.description,
      isPrivate: data.isPrivate,
      inviteCode: data.isPrivate ? crypto.randomBytes(6).toString("hex") : null,
      members: {
        create: {
          userId: data.userId,
          role: "admin",
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { username: true, image: true },
          },
        },
      },
    },
  });
};
&nbsp;
export const deleteGroupService = <span class="fstat-no" title="function not covered" >async </span>(groupId: number, userId: number) =&gt; {
  const membership = <span class="cstat-no" title="statement not covered" >await prisma.userGroup.findUnique({</span>
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });
&nbsp;
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (!membership || membership.role !== "admin") {</span>
<span class="cstat-no" title="statement not covered" >    throw new ForbiddenError("Admin privileges required");</span>
  }
&nbsp;
<span class="cstat-no" title="statement not covered" >  return prisma.group.delete({</span>
    where: { id: groupId },
  });
};
&nbsp;
export const updateGroupService = <span class="fstat-no" title="function not covered" >async </span>(
  groupId: number,
  data: UpdateGroupInput,
  userId: number,
) =&gt; {
  const membership = <span class="cstat-no" title="statement not covered" >await prisma.userGroup.findUnique({</span>
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });
&nbsp;
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (!membership || membership.role !== "admin") {</span>
<span class="cstat-no" title="statement not covered" >    throw new ForbiddenError("Admin privileges required");</span>
  }
&nbsp;
<span class="cstat-no" title="statement not covered" >  return prisma.group.update({</span>
    where: { id: groupId },
    data,
    include: {
      members: true,
    },
  });
};
&nbsp;
export const sendGroupInviteService = <span class="fstat-no" title="function not covered" >async </span>(
  groupId: number,
  email: string,
  userId: number,
) =&gt; {
  const group = <span class="cstat-no" title="statement not covered" >await prisma.group.findUnique({</span>
    where: { id: groupId },
    include: {
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });
&nbsp;
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (!group) <span class="cstat-no" title="statement not covered" >throw new NotFoundError("Group not found");</span></span>
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (!group.members[0] || group.members[0].role !== "admin") {</span>
<span class="cstat-no" title="statement not covered" >    throw new ForbiddenError("Admin privileges required");</span>
  }
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (!group.isPrivate) {</span>
<span class="cstat-no" title="statement not covered" >    throw new BadRequestError("Public groups don't require invitations");</span>
  }
&nbsp;
<span class="cstat-no" title="statement not covered" >  await sendInvitationEmail(email, group.name, group.inviteCode!);</span>
<span class="cstat-no" title="statement not covered" >  return { message: "Invitation sent" };</span>
};
&nbsp;
export const joinGroupService = <span class="fstat-no" title="function not covered" >async </span>(inviteCode: string, userId: number) =&gt; {
  const group = <span class="cstat-no" title="statement not covered" >await prisma.group.findFirst({</span>
    where: { inviteCode },
  });
&nbsp;
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (!group) <span class="cstat-no" title="statement not covered" >throw new NotFoundError("Invalid invitation code");</span></span>
&nbsp;
  const existingMembership = <span class="cstat-no" title="statement not covered" >await prisma.userGroup.findUnique({</span>
    where: {
      userId_groupId: {
        userId,
        groupId: group.id,
      },
    },
  });
&nbsp;
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (existingMembership) {</span>
<span class="cstat-no" title="statement not covered" >    throw new BadRequestError("Already a group member");</span>
  }
&nbsp;
<span class="cstat-no" title="statement not covered" >  return prisma.userGroup.create({</span>
    data: {
      userId,
      groupId: group.id,
      role: "member",
    },
    include: {
      group: true,
    },
  });
};
&nbsp;
export const getUserGroupsService = <span class="fstat-no" title="function not covered" >async </span>(userId: number) =&gt; {
<span class="cstat-no" title="statement not covered" >  return prisma.userGroup.findMany({</span>
    where: { userId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          isPrivate: true,
        },
      },
    },
  });
};
&nbsp;
export const getPaginatedGroupsService = <span class="fstat-no" title="function not covered" >async </span>(
  userId: number,
  page: number,
  limit: number,
) =&gt; {
  const [total, groups] = <span class="cstat-no" title="statement not covered" >await prisma.$transaction([</span>
    prisma.userGroup.count({ where: { userId } }),
    prisma.userGroup.findMany({
      where: { userId },
      include: { group: true },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
&nbsp;
<span class="cstat-no" title="statement not covered" >  return { data: groups, total, page, totalPages: Math.ceil(total / limit) };</span>
};
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\services\index.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/services</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> src/services</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">51.24% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>103/201</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">8.98% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>8/89</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">21.87% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>7/32</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">46.38% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>77/166</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line medium'></div>
    <div class="pad1">
<table class="coverage-summary">
<thead>
<tr>
   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>
   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
</tr>
</thead>
<tbody><tr>
	<td class="file medium" data-value="album.service.ts"><a href="album.service.ts.html">album.service.ts</a></td>
	<td data-value="67.74" class="pic medium">
	<div class="chart"><div class="cover-fill" style="width: 67%"></div><div class="cover-empty" style="width: 33%"></div></div>
	</td>
	<td data-value="67.74" class="pct medium">67.74%</td>
	<td data-value="31" class="abs medium">21/31</td>
	<td data-value="18.75" class="pct low">18.75%</td>
	<td data-value="16" class="abs low">3/16</td>
	<td data-value="50" class="pct medium">50%</td>
	<td data-value="8" class="abs medium">4/8</td>
	<td data-value="66.66" class="pct medium">66.66%</td>
	<td data-value="24" class="abs medium">16/24</td>
	</tr>

<tr>
	<td class="file medium" data-value="email.service.ts"><a href="email.service.ts.html">email.service.ts</a></td>
	<td data-value="66.66" class="pic medium">
	<div class="chart"><div class="cover-fill" style="width: 66%"></div><div class="cover-empty" style="width: 34%"></div></div>
	</td>
	<td data-value="66.66" class="pct medium">66.66%</td>
	<td data-value="6" class="abs medium">4/6</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="1" class="abs low">0/1</td>
	<td data-value="60" class="pct medium">60%</td>
	<td data-value="5" class="abs medium">3/5</td>
	</tr>

<tr>
	<td class="file low" data-value="group.service.ts"><a href="group.service.ts.html">group.service.ts</a></td>
	<td data-value="37.5" class="pic low">
	<div class="chart"><div class="cover-fill" style="width: 37%"></div><div class="cover-empty" style="width: 63%"></div></div>
	</td>
	<td data-value="37.5" class="pct low">37.5%</td>
	<td data-value="48" class="abs low">18/48</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="18" class="abs low">0/18</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="7" class="abs low">0/7</td>
	<td data-value="28.2" class="pct low">28.2%</td>
	<td data-value="39" class="abs low">11/39</td>
	</tr>

<tr>
	<td class="file low" data-value="review.service.ts"><a href="review.service.ts.html">review.service.ts</a></td>
	<td data-value="31.03" class="pic low">
	<div class="chart"><div class="cover-fill" style="width: 31%"></div><div class="cover-empty" style="width: 69%"></div></div>
	</td>
	<td data-value="31.03" class="pct low">31.03%</td>
	<td data-value="29" class="abs low">9/29</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="27" class="abs low">0/27</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="5" class="abs low">0/5</td>
	<td data-value="29.16" class="pct low">29.16%</td>
	<td data-value="24" class="abs low">7/24</td>
	</tr>

<tr>
	<td class="file low" data-value="song.service.ts"><a href="song.service.ts.html">song.service.ts</a></td>
	<td data-value="46.15" class="pic low">
	<div class="chart"><div class="cover-fill" style="width: 46%"></div><div class="cover-empty" style="width: 54%"></div></div>
	</td>
	<td data-value="46.15" class="pct low">46.15%</td>
	<td data-value="26" class="abs low">12/26</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="13" class="abs low">0/13</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="5" class="abs low">0/5</td>
	<td data-value="35" class="pct low">35%</td>
	<td data-value="20" class="abs low">7/20</td>
	</tr>

<tr>
	<td class="file medium" data-value="user.service.ts"><a href="user.service.ts.html">user.service.ts</a></td>
	<td data-value="63.93" class="pic medium">
	<div class="chart"><div class="cover-fill" style="width: 63%"></div><div class="cover-empty" style="width: 37%"></div></div>
	</td>
	<td data-value="63.93" class="pct medium">63.93%</td>
	<td data-value="61" class="abs medium">39/61</td>
	<td data-value="33.33" class="pct low">33.33%</td>
	<td data-value="15" class="abs low">5/15</td>
	<td data-value="50" class="pct medium">50%</td>
	<td data-value="6" class="abs medium">3/6</td>
	<td data-value="61.11" class="pct medium">61.11%</td>
	<td data-value="54" class="abs medium">33/54</td>
	</tr>

</tbody>
</table>
</div>
                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\services\review.service.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/services/review.service.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/services</a> review.service.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">31.03% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>9/29</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/27</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/5</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">29.16% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>7/24</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line low'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a>
<a name='L49'></a><a href='#L49'>49</a>
<a name='L50'></a><a href='#L50'>50</a>
<a name='L51'></a><a href='#L51'>51</a>
<a name='L52'></a><a href='#L52'>52</a>
<a name='L53'></a><a href='#L53'>53</a>
<a name='L54'></a><a href='#L54'>54</a>
<a name='L55'></a><a href='#L55'>55</a>
<a name='L56'></a><a href='#L56'>56</a>
<a name='L57'></a><a href='#L57'>57</a>
<a name='L58'></a><a href='#L58'>58</a>
<a name='L59'></a><a href='#L59'>59</a>
<a name='L60'></a><a href='#L60'>60</a>
<a name='L61'></a><a href='#L61'>61</a>
<a name='L62'></a><a href='#L62'>62</a>
<a name='L63'></a><a href='#L63'>63</a>
<a name='L64'></a><a href='#L64'>64</a>
<a name='L65'></a><a href='#L65'>65</a>
<a name='L66'></a><a href='#L66'>66</a>
<a name='L67'></a><a href='#L67'>67</a>
<a name='L68'></a><a href='#L68'>68</a>
<a name='L69'></a><a href='#L69'>69</a>
<a name='L70'></a><a href='#L70'>70</a>
<a name='L71'></a><a href='#L71'>71</a>
<a name='L72'></a><a href='#L72'>72</a>
<a name='L73'></a><a href='#L73'>73</a>
<a name='L74'></a><a href='#L74'>74</a>
<a name='L75'></a><a href='#L75'>75</a>
<a name='L76'></a><a href='#L76'>76</a>
<a name='L77'></a><a href='#L77'>77</a>
<a name='L78'></a><a href='#L78'>78</a>
<a name='L79'></a><a href='#L79'>79</a>
<a name='L80'></a><a href='#L80'>80</a>
<a name='L81'></a><a href='#L81'>81</a>
<a name='L82'></a><a href='#L82'>82</a>
<a name='L83'></a><a href='#L83'>83</a>
<a name='L84'></a><a href='#L84'>84</a>
<a name='L85'></a><a href='#L85'>85</a>
<a name='L86'></a><a href='#L86'>86</a>
<a name='L87'></a><a href='#L87'>87</a>
<a name='L88'></a><a href='#L88'>88</a>
<a name='L89'></a><a href='#L89'>89</a>
<a name='L90'></a><a href='#L90'>90</a>
<a name='L91'></a><a href='#L91'>91</a>
<a name='L92'></a><a href='#L92'>92</a>
<a name='L93'></a><a href='#L93'>93</a>
<a name='L94'></a><a href='#L94'>94</a>
<a name='L95'></a><a href='#L95'>95</a>
<a name='L96'></a><a href='#L96'>96</a>
<a name='L97'></a><a href='#L97'>97</a>
<a name='L98'></a><a href='#L98'>98</a>
<a name='L99'></a><a href='#L99'>99</a>
<a name='L100'></a><a href='#L100'>100</a>
<a name='L101'></a><a href='#L101'>101</a>
<a name='L102'></a><a href='#L102'>102</a>
<a name='L103'></a><a href='#L103'>103</a>
<a name='L104'></a><a href='#L104'>104</a>
<a name='L105'></a><a href='#L105'>105</a>
<a name='L106'></a><a href='#L106'>106</a>
<a name='L107'></a><a href='#L107'>107</a>
<a name='L108'></a><a href='#L108'>108</a>
<a name='L109'></a><a href='#L109'>109</a>
<a name='L110'></a><a href='#L110'>110</a>
<a name='L111'></a><a href='#L111'>111</a>
<a name='L112'></a><a href='#L112'>112</a>
<a name='L113'></a><a href='#L113'>113</a>
<a name='L114'></a><a href='#L114'>114</a>
<a name='L115'></a><a href='#L115'>115</a>
<a name='L116'></a><a href='#L116'>116</a>
<a name='L117'></a><a href='#L117'>117</a>
<a name='L118'></a><a href='#L118'>118</a>
<a name='L119'></a><a href='#L119'>119</a>
<a name='L120'></a><a href='#L120'>120</a>
<a name='L121'></a><a href='#L121'>121</a>
<a name='L122'></a><a href='#L122'>122</a>
<a name='L123'></a><a href='#L123'>123</a>
<a name='L124'></a><a href='#L124'>124</a>
<a name='L125'></a><a href='#L125'>125</a>
<a name='L126'></a><a href='#L126'>126</a>
<a name='L127'></a><a href='#L127'>127</a>
<a name='L128'></a><a href='#L128'>128</a>
<a name='L129'></a><a href='#L129'>129</a>
<a name='L130'></a><a href='#L130'>130</a>
<a name='L131'></a><a href='#L131'>131</a>
<a name='L132'></a><a href='#L132'>132</a>
<a name='L133'></a><a href='#L133'>133</a>
<a name='L134'></a><a href='#L134'>134</a>
<a name='L135'></a><a href='#L135'>135</a>
<a name='L136'></a><a href='#L136'>136</a>
<a name='L137'></a><a href='#L137'>137</a>
<a name='L138'></a><a href='#L138'>138</a>
<a name='L139'></a><a href='#L139'>139</a>
<a name='L140'></a><a href='#L140'>140</a>
<a name='L141'></a><a href='#L141'>141</a>
<a name='L142'></a><a href='#L142'>142</a>
<a name='L143'></a><a href='#L143'>143</a>
<a name='L144'></a><a href='#L144'>144</a>
<a name='L145'></a><a href='#L145'>145</a>
<a name='L146'></a><a href='#L146'>146</a>
<a name='L147'></a><a href='#L147'>147</a>
<a name='L148'></a><a href='#L148'>148</a>
<a name='L149'></a><a href='#L149'>149</a>
<a name='L150'></a><a href='#L150'>150</a>
<a name='L151'></a><a href='#L151'>151</a>
<a name='L152'></a><a href='#L152'>152</a>
<a name='L153'></a><a href='#L153'>153</a>
<a name='L154'></a><a href='#L154'>154</a>
<a name='L155'></a><a href='#L155'>155</a></td><td class="line-coverage quiet"><span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../errors/customErrors.js";
&nbsp;
// Type for review filters
interface ReviewFilters {
  groups?: string;
  minRating?: string;
  maxRating?: string;
  startDate?: string;
  endDate?: string;
  limit?: string;
  page?: string;
  userId?: number;
}
&nbsp;
// Type for parsed filter values
interface ParsedFilters {
  groupIds?: number[];
  minRating?: number;
  maxRating?: number;
  startDate?: Date;
  endDate?: Date;
  limit: number;
  page: number;
  userId?: number;
}
&nbsp;
export const createReviewService = <span class="fstat-no" title="function not covered" >async </span>(data: {
  content?: string;
  rating: number;
  songId: number;
  groupId?: number;
  userId: number;
}) =&gt; {
  // Validation
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (data.rating &lt; 0 || data.rating &gt; 10) {</span>
<span class="cstat-no" title="statement not covered" >    throw new ValidationError("Rating must be between 0 and 10", {</span>
      rating: "Invalid rating value",
    });
  }
&nbsp;
  // Verify song exists
  const song = <span class="cstat-no" title="statement not covered" >await prisma.song.findUnique({</span>
    where: { id: data.songId },
  });
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (!song) <span class="cstat-no" title="statement not covered" >throw new NotFoundError("Song not found");</span></span>
&nbsp;
  // Verify group membership if provided
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (data.groupId) {</span>
    const membership = <span class="cstat-no" title="statement not covered" >await prisma.userGroup.findUnique({</span>
      where: {
        userId_groupId: {
          userId: data.userId,
          groupId: data.groupId,
        },
      },
    });
<span class="cstat-no" title="statement not covered" >    <span class="missing-if-branch" title="if path not taken" >I</span>if (!membership) <span class="cstat-no" title="statement not covered" >throw new ForbiddenError("Not a group member");</span></span>
  }
&nbsp;
  // Create review
<span class="cstat-no" title="statement not covered" >  return prisma.review.create({</span>
    data: {
      content: data.content,
      rating: data.rating,
      songId: data.songId,
      userId: data.userId,
      groupId: data.groupId,
    },
  });
};
&nbsp;
export const getReviewsService = <span class="fstat-no" title="function not covered" >async </span>(filters: ReviewFilters) =&gt; {
  const parsed = <span class="cstat-no" title="statement not covered" >parseFilters(filters);</span>
&nbsp;
  const where: Prisma.ReviewWhereInput = <span class="cstat-no" title="statement not covered" >buildWhereClause(parsed);</span>
&nbsp;
  const [reviews, total] = <span class="cstat-no" title="statement not covered" >await prisma.$transaction([</span>
    prisma.review.findMany({
      where,
      include: {
        author: { select: { username: true, image: true } },
        song: true,
        group: { select: { name: true, id: true } },
      },
      take: parsed.limit,
      skip: (parsed.page - 1) * parsed.limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({ where }),
  ]);
&nbsp;
<span class="cstat-no" title="statement not covered" >  return {</span>
    data: reviews,
    meta: {
      total,
      page: parsed.page,
      totalPages: Math.ceil(total / parsed.limit),
    },
  };
};
&nbsp;
// Helper function to parse filter parameters
const parseFilters = <span class="fstat-no" title="function not covered" >(f</span>ilters: ReviewFilters): ParsedFilters =&gt; {
<span class="cstat-no" title="statement not covered" >  return {</span>
    groupIds: filters.groups?.split(",").map(Number).filter(Boolean),
    minRating: filters.minRating ? Number(filters.minRating) : undefined,
    maxRating: filters.maxRating ? Number(filters.maxRating) : undefined,
    startDate: parseDate(filters.startDate),
    endDate: parseDate(filters.endDate),
    limit: Math.min(Number(filters.limit) || 20, 100), // Max 100 per page
    page: Math.max(Number(filters.page) || 1, 1),
    userId: filters.userId,
  };
};
&nbsp;
// Helper function to build Prisma where clause
const buildWhereClause = <span class="fstat-no" title="function not covered" >(p</span>arsed: ParsedFilters): Prisma.ReviewWhereInput =&gt; {
<span class="cstat-no" title="statement not covered" >  return {</span>
    AND: [
      {
        OR: [
          { groupId: null }, // Public reviews
          ...(parsed.groupIds?.length
            ? [
                {
                  group: {
                    id: { in: parsed.groupIds },
                    members: { some: { userId: parsed.userId } },
                  },
                },
              ]
            : []),
        ],
      },
      ...(parsed.minRating ? [{ rating: { gte: parsed.minRating } }] : []),
      ...(parsed.maxRating ? [{ rating: { lte: parsed.maxRating } }] : []),
      ...(parsed.startDate ? [{ createdAt: { gte: parsed.startDate } }] : []),
      ...(parsed.endDate ? [{ createdAt: { lte: parsed.endDate } }] : []),
    ].filter(Boolean),
  };
};
&nbsp;
// Date validation helper
const parseDate = <span class="fstat-no" title="function not covered" >(d</span>ateString?: string): Date | undefined =&gt; {
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (!dateString) <span class="cstat-no" title="statement not covered" >return undefined;</span></span>
  const date = <span class="cstat-no" title="statement not covered" >new Date(dateString);</span>
<span class="cstat-no" title="statement not covered" >  return isNaN(date.getTime()) ? undefined : date;</span>
};
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\services\song.service.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/services/song.service.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/services</a> song.service.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">46.15% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>12/26</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/13</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/5</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">35% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>7/20</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line low'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a>
<a name='L49'></a><a href='#L49'>49</a>
<a name='L50'></a><a href='#L50'>50</a>
<a name='L51'></a><a href='#L51'>51</a>
<a name='L52'></a><a href='#L52'>52</a>
<a name='L53'></a><a href='#L53'>53</a>
<a name='L54'></a><a href='#L54'>54</a>
<a name='L55'></a><a href='#L55'>55</a>
<a name='L56'></a><a href='#L56'>56</a>
<a name='L57'></a><a href='#L57'>57</a>
<a name='L58'></a><a href='#L58'>58</a>
<a name='L59'></a><a href='#L59'>59</a>
<a name='L60'></a><a href='#L60'>60</a>
<a name='L61'></a><a href='#L61'>61</a>
<a name='L62'></a><a href='#L62'>62</a>
<a name='L63'></a><a href='#L63'>63</a>
<a name='L64'></a><a href='#L64'>64</a>
<a name='L65'></a><a href='#L65'>65</a>
<a name='L66'></a><a href='#L66'>66</a>
<a name='L67'></a><a href='#L67'>67</a>
<a name='L68'></a><a href='#L68'>68</a>
<a name='L69'></a><a href='#L69'>69</a>
<a name='L70'></a><a href='#L70'>70</a>
<a name='L71'></a><a href='#L71'>71</a>
<a name='L72'></a><a href='#L72'>72</a>
<a name='L73'></a><a href='#L73'>73</a>
<a name='L74'></a><a href='#L74'>74</a>
<a name='L75'></a><a href='#L75'>75</a>
<a name='L76'></a><a href='#L76'>76</a>
<a name='L77'></a><a href='#L77'>77</a>
<a name='L78'></a><a href='#L78'>78</a>
<a name='L79'></a><a href='#L79'>79</a>
<a name='L80'></a><a href='#L80'>80</a>
<a name='L81'></a><a href='#L81'>81</a>
<a name='L82'></a><a href='#L82'>82</a>
<a name='L83'></a><a href='#L83'>83</a>
<a name='L84'></a><a href='#L84'>84</a>
<a name='L85'></a><a href='#L85'>85</a>
<a name='L86'></a><a href='#L86'>86</a>
<a name='L87'></a><a href='#L87'>87</a>
<a name='L88'></a><a href='#L88'>88</a></td><td class="line-coverage quiet"><span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";
import { NotFoundError, ValidationError } from "../errors/customErrors.js";
&nbsp;
export const getSongsService = <span class="fstat-no" title="function not covered" >async </span>(filters: {
  albumId?: string;
  search?: string;
  limit?: number;
  page?: number;
}) =&gt; {
  const where: Prisma.SongWhereInput = <span class="cstat-no" title="statement not covered" >{</span>
    ...(filters.albumId &amp;&amp; { albumId: Number(filters.albumId) }),
    ...(filters.search &amp;&amp; {
      title: { contains: filters.search, mode: "insensitive" },
    }),
  };
&nbsp;
  const [songs, total] = <span class="cstat-no" title="statement not covered" >await prisma.$transaction([</span>
    prisma.song.findMany({
      where,
      include: { album: { select: { title: true, artworkUrl: true } } },
    }),
    prisma.song.count({ where }),
  ]);
&nbsp;
<span class="cstat-no" title="statement not covered" >  return {</span>
    data: songs,
    meta: {
      total,
      page: filters.page || 1,
      totalPages: Math.ceil(total / (filters.limit || 10)),
    },
  };
};
&nbsp;
export const getSongService = <span class="fstat-no" title="function not covered" >async </span>(songId: number) =&gt; {
  const song = <span class="cstat-no" title="statement not covered" >await prisma.song.findUnique({</span>
    where: { id: songId },
    include: {
      album: true,
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { username: true, image: true } },
        },
      },
    },
  });
&nbsp;
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (!song) <span class="cstat-no" title="statement not covered" >throw new NotFoundError("Song not found");</span></span>
<span class="cstat-no" title="statement not covered" >  return song;</span>
};
&nbsp;
export const createSongService = <span class="fstat-no" title="function not covered" >async </span>(data: Prisma.SongCreateInput) =&gt; {
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (!data.title || data.title.trim().length &lt; 2) {</span>
<span class="cstat-no" title="statement not covered" >    throw new ValidationError("Song title must be at least 2 characters", {</span>
      title: data.title,
    });
  }
&nbsp;
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (!data.album) {</span>
<span class="cstat-no" title="statement not covered" >    throw new ValidationError("Album ID is required", { albumId: data.album });</span>
  }
&nbsp;
<span class="cstat-no" title="statement not covered" >  return prisma.song.create({</span>
    data,
    include: { album: true },
  });
};
&nbsp;
export const updateSongService = <span class="fstat-no" title="function not covered" >async </span>(
  songId: number,
  data: Prisma.SongUpdateInput,
) =&gt; {
<span class="cstat-no" title="statement not covered" >  return prisma.song.update({</span>
    where: { id: songId },
    data,
    include: { album: true },
  });
};
&nbsp;
export const deleteSongService = <span class="fstat-no" title="function not covered" >async </span>(songId: number) =&gt; {
<span class="cstat-no" title="statement not covered" >  return prisma.song.delete({</span>
    where: { id: songId },
  });
};
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\services\user.service.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/services/user.service.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/services</a> user.service.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">63.93% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>39/61</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">33.33% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>5/15</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">50% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>3/6</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">61.11% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>33/54</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line medium'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a>
<a name='L49'></a><a href='#L49'>49</a>
<a name='L50'></a><a href='#L50'>50</a>
<a name='L51'></a><a href='#L51'>51</a>
<a name='L52'></a><a href='#L52'>52</a>
<a name='L53'></a><a href='#L53'>53</a>
<a name='L54'></a><a href='#L54'>54</a>
<a name='L55'></a><a href='#L55'>55</a>
<a name='L56'></a><a href='#L56'>56</a>
<a name='L57'></a><a href='#L57'>57</a>
<a name='L58'></a><a href='#L58'>58</a>
<a name='L59'></a><a href='#L59'>59</a>
<a name='L60'></a><a href='#L60'>60</a>
<a name='L61'></a><a href='#L61'>61</a>
<a name='L62'></a><a href='#L62'>62</a>
<a name='L63'></a><a href='#L63'>63</a>
<a name='L64'></a><a href='#L64'>64</a>
<a name='L65'></a><a href='#L65'>65</a>
<a name='L66'></a><a href='#L66'>66</a>
<a name='L67'></a><a href='#L67'>67</a>
<a name='L68'></a><a href='#L68'>68</a>
<a name='L69'></a><a href='#L69'>69</a>
<a name='L70'></a><a href='#L70'>70</a>
<a name='L71'></a><a href='#L71'>71</a>
<a name='L72'></a><a href='#L72'>72</a>
<a name='L73'></a><a href='#L73'>73</a>
<a name='L74'></a><a href='#L74'>74</a>
<a name='L75'></a><a href='#L75'>75</a>
<a name='L76'></a><a href='#L76'>76</a>
<a name='L77'></a><a href='#L77'>77</a>
<a name='L78'></a><a href='#L78'>78</a>
<a name='L79'></a><a href='#L79'>79</a>
<a name='L80'></a><a href='#L80'>80</a>
<a name='L81'></a><a href='#L81'>81</a>
<a name='L82'></a><a href='#L82'>82</a>
<a name='L83'></a><a href='#L83'>83</a>
<a name='L84'></a><a href='#L84'>84</a>
<a name='L85'></a><a href='#L85'>85</a>
<a name='L86'></a><a href='#L86'>86</a>
<a name='L87'></a><a href='#L87'>87</a>
<a name='L88'></a><a href='#L88'>88</a>
<a name='L89'></a><a href='#L89'>89</a>
<a name='L90'></a><a href='#L90'>90</a>
<a name='L91'></a><a href='#L91'>91</a>
<a name='L92'></a><a href='#L92'>92</a>
<a name='L93'></a><a href='#L93'>93</a>
<a name='L94'></a><a href='#L94'>94</a>
<a name='L95'></a><a href='#L95'>95</a>
<a name='L96'></a><a href='#L96'>96</a>
<a name='L97'></a><a href='#L97'>97</a>
<a name='L98'></a><a href='#L98'>98</a>
<a name='L99'></a><a href='#L99'>99</a>
<a name='L100'></a><a href='#L100'>100</a>
<a name='L101'></a><a href='#L101'>101</a>
<a name='L102'></a><a href='#L102'>102</a>
<a name='L103'></a><a href='#L103'>103</a>
<a name='L104'></a><a href='#L104'>104</a>
<a name='L105'></a><a href='#L105'>105</a>
<a name='L106'></a><a href='#L106'>106</a>
<a name='L107'></a><a href='#L107'>107</a>
<a name='L108'></a><a href='#L108'>108</a>
<a name='L109'></a><a href='#L109'>109</a>
<a name='L110'></a><a href='#L110'>110</a>
<a name='L111'></a><a href='#L111'>111</a>
<a name='L112'></a><a href='#L112'>112</a>
<a name='L113'></a><a href='#L113'>113</a>
<a name='L114'></a><a href='#L114'>114</a>
<a name='L115'></a><a href='#L115'>115</a>
<a name='L116'></a><a href='#L116'>116</a>
<a name='L117'></a><a href='#L117'>117</a>
<a name='L118'></a><a href='#L118'>118</a>
<a name='L119'></a><a href='#L119'>119</a>
<a name='L120'></a><a href='#L120'>120</a>
<a name='L121'></a><a href='#L121'>121</a>
<a name='L122'></a><a href='#L122'>122</a>
<a name='L123'></a><a href='#L123'>123</a>
<a name='L124'></a><a href='#L124'>124</a>
<a name='L125'></a><a href='#L125'>125</a>
<a name='L126'></a><a href='#L126'>126</a>
<a name='L127'></a><a href='#L127'>127</a>
<a name='L128'></a><a href='#L128'>128</a>
<a name='L129'></a><a href='#L129'>129</a>
<a name='L130'></a><a href='#L130'>130</a>
<a name='L131'></a><a href='#L131'>131</a>
<a name='L132'></a><a href='#L132'>132</a>
<a name='L133'></a><a href='#L133'>133</a>
<a name='L134'></a><a href='#L134'>134</a>
<a name='L135'></a><a href='#L135'>135</a>
<a name='L136'></a><a href='#L136'>136</a>
<a name='L137'></a><a href='#L137'>137</a>
<a name='L138'></a><a href='#L138'>138</a>
<a name='L139'></a><a href='#L139'>139</a>
<a name='L140'></a><a href='#L140'>140</a>
<a name='L141'></a><a href='#L141'>141</a>
<a name='L142'></a><a href='#L142'>142</a>
<a name='L143'></a><a href='#L143'>143</a>
<a name='L144'></a><a href='#L144'>144</a>
<a name='L145'></a><a href='#L145'>145</a>
<a name='L146'></a><a href='#L146'>146</a>
<a name='L147'></a><a href='#L147'>147</a>
<a name='L148'></a><a href='#L148'>148</a>
<a name='L149'></a><a href='#L149'>149</a>
<a name='L150'></a><a href='#L150'>150</a>
<a name='L151'></a><a href='#L151'>151</a>
<a name='L152'></a><a href='#L152'>152</a>
<a name='L153'></a><a href='#L153'>153</a>
<a name='L154'></a><a href='#L154'>154</a>
<a name='L155'></a><a href='#L155'>155</a>
<a name='L156'></a><a href='#L156'>156</a>
<a name='L157'></a><a href='#L157'>157</a>
<a name='L158'></a><a href='#L158'>158</a>
<a name='L159'></a><a href='#L159'>159</a>
<a name='L160'></a><a href='#L160'>160</a>
<a name='L161'></a><a href='#L161'>161</a>
<a name='L162'></a><a href='#L162'>162</a>
<a name='L163'></a><a href='#L163'>163</a>
<a name='L164'></a><a href='#L164'>164</a>
<a name='L165'></a><a href='#L165'>165</a>
<a name='L166'></a><a href='#L166'>166</a>
<a name='L167'></a><a href='#L167'>167</a>
<a name='L168'></a><a href='#L168'>168</a>
<a name='L169'></a><a href='#L169'>169</a>
<a name='L170'></a><a href='#L170'>170</a>
<a name='L171'></a><a href='#L171'>171</a>
<a name='L172'></a><a href='#L172'>172</a>
<a name='L173'></a><a href='#L173'>173</a>
<a name='L174'></a><a href='#L174'>174</a>
<a name='L175'></a><a href='#L175'>175</a>
<a name='L176'></a><a href='#L176'>176</a>
<a name='L177'></a><a href='#L177'>177</a>
<a name='L178'></a><a href='#L178'>178</a>
<a name='L179'></a><a href='#L179'>179</a>
<a name='L180'></a><a href='#L180'>180</a>
<a name='L181'></a><a href='#L181'>181</a>
<a name='L182'></a><a href='#L182'>182</a>
<a name='L183'></a><a href='#L183'>183</a>
<a name='L184'></a><a href='#L184'>184</a>
<a name='L185'></a><a href='#L185'>185</a>
<a name='L186'></a><a href='#L186'>186</a>
<a name='L187'></a><a href='#L187'>187</a>
<a name='L188'></a><a href='#L188'>188</a>
<a name='L189'></a><a href='#L189'>189</a>
<a name='L190'></a><a href='#L190'>190</a>
<a name='L191'></a><a href='#L191'>191</a>
<a name='L192'></a><a href='#L192'>192</a>
<a name='L193'></a><a href='#L193'>193</a>
<a name='L194'></a><a href='#L194'>194</a>
<a name='L195'></a><a href='#L195'>195</a>
<a name='L196'></a><a href='#L196'>196</a>
<a name='L197'></a><a href='#L197'>197</a>
<a name='L198'></a><a href='#L198'>198</a>
<a name='L199'></a><a href='#L199'>199</a>
<a name='L200'></a><a href='#L200'>200</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">5x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">5x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">4x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">4x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">4x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">4x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
} from "../errors/customErrors.js";
&nbsp;
const saltRounds = 10;
&nbsp;
export const registerUserService = async (data: {
  email: string;
  username: string;
  password: string;
}) =&gt; {
  <span class="missing-if-branch" title="if path not taken" >I</span>if (data.password.length &lt; 8) {
<span class="cstat-no" title="statement not covered" >    throw new ValidationError("Password must be at least 8 characters", {</span>
      password: "Length validation failed",
    });
  }
&nbsp;
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);
&nbsp;
  try {
    return await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        image: true,
      },
    });
  } catch (error) {
<span class="cstat-no" title="statement not covered" >    <span class="missing-if-branch" title="if path not taken" >I</span>if (error instanceof Prisma.PrismaClientKnownRequestError) {</span>
<span class="cstat-no" title="statement not covered" >      <span class="missing-if-branch" title="if path not taken" >I</span>if (error.code === "P2002") {</span>
        const field = (<span class="cstat-no" title="statement not covered" >error.meta?.target as string[])?.[0];</span>
<span class="cstat-no" title="statement not covered" >        throw new ValidationError(`${field} already exists`, {</span>
          [field]: "Must be unique",
        });
      }
    }
<span class="cstat-no" title="statement not covered" >    throw error;</span>
  }
};
&nbsp;
export const loginUserService = async (email: string, password: string) =&gt; {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      password: true,
      email: true,
      username: true,
      image: true,
    },
  });
&nbsp;
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AuthenticationError("Invalid credentials");
  }
&nbsp;
  <span class="missing-if-branch" title="if path not taken" >I</span>if (!process.env.JWT_SECRET) {
<span class="cstat-no" title="statement not covered" >    throw new Error("JWT_SECRET environment variable missing");</span>
  }
&nbsp;
  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
&nbsp;
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });
  return {
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      image: user.image,
    },
  };
};
&nbsp;
export const getCurrentUserService = <span class="fstat-no" title="function not covered" >async </span>(userId: number) =&gt; {
  const user = <span class="cstat-no" title="statement not covered" >await prisma.user.findUnique({</span>
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      image: true,
      groups: {
        select: {
          group: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });
&nbsp;
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (!user) <span class="cstat-no" title="statement not covered" >throw new NotFoundError("User not found");</span></span>
<span class="cstat-no" title="statement not covered" >  return user;</span>
};
&nbsp;
export const updateUserService = <span class="fstat-no" title="function not covered" >async </span>(
  userId: number,
  data: Partial&lt;{
    username: string;
    email: string;
    password: string;
    image: string;
  }&gt;
) =&gt; {
<span class="cstat-no" title="statement not covered" >  <span class="missing-if-branch" title="if path not taken" >I</span>if (data.password) {</span>
<span class="cstat-no" title="statement not covered" >    data.password = await bcrypt.hash(data.password, saltRounds);</span>
  }
&nbsp;
<span class="cstat-no" title="statement not covered" >  return prisma.user.update({</span>
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      username: true,
      image: true,
    },
  });
};
&nbsp;
export const refreshTokenService = async (refreshToken: string) =&gt; {
  <span class="missing-if-branch" title="if path not taken" >I</span>if (!process.env.JWT_SECRET) {
<span class="cstat-no" title="statement not covered" >    throw new Error("JWT_SECRET environment variable missing");</span>
  }
&nbsp;
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET) as {
      id: number;
    };
&nbsp;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, refreshToken: true },
    });
&nbsp;
    <span class="missing-if-branch" title="if path not taken" >I</span>if (!user || user.refreshToken !== refreshToken) {
<span class="cstat-no" title="statement not covered" >      throw new AuthenticationError("Invalid refresh token");</span>
    }
&nbsp;
    // Generate new tokens with fresh expiration
    const newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
&nbsp;
    const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
&nbsp;
    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });
&nbsp;
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
<span class="cstat-no" title="statement not covered" >    <span class="missing-if-branch" title="if path not taken" >I</span>if (error instanceof jwt.TokenExpiredError) {</span>
<span class="cstat-no" title="statement not covered" >      throw new AuthenticationError("Refresh token expired");</span>
    }
<span class="cstat-no" title="statement not covered" >    <span class="missing-if-branch" title="if path not taken" >I</span>if (error instanceof jwt.JsonWebTokenError) {</span>
<span class="cstat-no" title="statement not covered" >      throw new AuthenticationError("Invalid refresh token");</span>
    }
<span class="cstat-no" title="statement not covered" >    throw new AuthenticationError("Token refresh failed");</span>
  }
};
export const deleteUserService = <span class="fstat-no" title="function not covered" >async </span>(userId: number) =&gt; {
<span class="cstat-no" title="statement not covered" >  return prisma.user.delete({</span>
    where: { id: userId },
  });
};
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\validators\album.validator.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/validators/album.validator.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/validators</a> album.validator.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>5/5</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>1/1</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>5/5</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { z } from "zod";
&nbsp;
const baseAlbumSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title too long (max 100 characters)"),
  releaseDate: z.coerce
    .date({
      required_error: "Release date is required",
      invalid_type_error: "Invalid date format",
    })
    .max(new Date(), "Release date cannot be in the future")
    .refine((date) =&gt; date.getFullYear() &gt;= 1900, "Invalid release year"),
  artworkUrl: z
    .string()
    .url("Invalid artwork URL")
    .regex(/\.(jpeg|jpg|png|webp)$/i, "Invalid image format"),
});
&nbsp;
export const createAlbumSchema = z.object({
  body: baseAlbumSchema,
});
// For update operations - all fields optional
export const updateAlbumSchema = baseAlbumSchema.partial();
&nbsp;
export type AlbumInput = z.infer&lt;typeof baseAlbumSchema&gt;;
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\validators\group.validator.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/validators/group.validator.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/validators</a> group.validator.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>2/2</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>2/2</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { z } from "zod";
&nbsp;
export const groupSchema = z.object({
  name: z
    .string()
    .min(2, "Group name must be at least 2 characters")
    .max(100, "Group name too long (max 100 characters)"),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
});
&nbsp;
export type GroupInput = z.infer&lt;typeof groupSchema&gt;;
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\validators\index.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/validators</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> src/validators</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">93.75% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>15/16</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">50% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>1/2</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">93.75% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>15/16</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <div class="pad1">
<table class="coverage-summary">
<thead>
<tr>
   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>
   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
</tr>
</thead>
<tbody><tr>
	<td class="file high" data-value="album.validator.ts"><a href="album.validator.ts.html">album.validator.ts</a></td>
	<td data-value="100" class="pic high">
	<div class="chart"><div class="cover-fill cover-full" style="width: 100%"></div><div class="cover-empty" style="width: 0%"></div></div>
	</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="5" class="abs high">5/5</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="1" class="abs high">1/1</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="5" class="abs high">5/5</td>
	</tr>

<tr>
	<td class="file high" data-value="group.validator.ts"><a href="group.validator.ts.html">group.validator.ts</a></td>
	<td data-value="100" class="pic high">
	<div class="chart"><div class="cover-fill cover-full" style="width: 100%"></div><div class="cover-empty" style="width: 0%"></div></div>
	</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="2" class="abs high">2/2</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="2" class="abs high">2/2</td>
	</tr>

<tr>
	<td class="file high" data-value="song.validator.ts"><a href="song.validator.ts.html">song.validator.ts</a></td>
	<td data-value="100" class="pic high">
	<div class="chart"><div class="cover-fill cover-full" style="width: 100%"></div><div class="cover-empty" style="width: 0%"></div></div>
	</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="2" class="abs high">2/2</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="2" class="abs high">2/2</td>
	</tr>

<tr>
	<td class="file high" data-value="user.validator.ts"><a href="user.validator.ts.html">user.validator.ts</a></td>
	<td data-value="85.71" class="pic high">
	<div class="chart"><div class="cover-fill" style="width: 85%"></div><div class="cover-empty" style="width: 15%"></div></div>
	</td>
	<td data-value="85.71" class="pct high">85.71%</td>
	<td data-value="7" class="abs high">6/7</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="1" class="abs low">0/1</td>
	<td data-value="85.71" class="pct high">85.71%</td>
	<td data-value="7" class="abs high">6/7</td>
	</tr>

</tbody>
</table>
</div>
                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\validators\song.validator.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/validators/song.validator.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/validators</a> song.validator.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>2/2</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>2/2</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { z } from "zod";
&nbsp;
export const songSchema = z.object({
  title: z
    .string()
    .min(1, "Title must be at least 1 character")
    .max(100, "Title too long (max 100 characters)"),
  trackNumber: z.number().int().positive(),
  duration: z.string().regex(/^\d+:\d{2}$/, "Invalid duration format (MM:SS)"),
  albumId: z.number().int().positive(),
});
&nbsp;
export type SongInput = z.infer&lt;typeof songSchema&gt;;
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\src\validators\user.validator.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for src/validators/user.validator.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">src/validators</a> user.validator.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">85.71% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>6/7</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/1</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">85.71% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>6/7</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { z } from "zod";
&nbsp;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&amp;*()_+]{8,}$/;
&nbsp;
// src/validators/user.validator.ts
export const registrationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    username: z.string().min(3).max(20),
    password: z.string().min(8),
  }),
});
&nbsp;
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
  }),
});
&nbsp;
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});
&nbsp;
// Update User Schema
export const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    username: z
      .string()
      .min(3, "Username too short")
      .max(20, "Username too long")
      .optional(),
    password: z.string().min(8).optional(),
    image: z.string().url("Invalid image URL").optional(),
  })
  .refine(<span class="fstat-no" title="function not covered" >(d</span>ata) =&gt; {
    // Ensure at least one field is provided
<span class="cstat-no" title="statement not covered" >    return Object.keys(data).length &gt; 0;</span>
  }, "At least one field must be provided");
&nbsp;
export type RegistrationInput = z.infer&lt;typeof registrationSchema&gt;;
export type LoginInput = z.infer&lt;typeof loginSchema&gt;;
export type UpdateUserInput = z.infer&lt;typeof updateUserSchema&gt;;
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\tests\helpers\auth.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for tests/helpers/auth.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">tests/helpers</a> auth.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>11/11</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>1/1</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>1/1</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>11/11</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { app } from "../../src/server";
import request from "supertest";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
&nbsp;
export async function getTestUserToken() {
  const hashedPassword = await bcrypt.hash("Test123!", 10); // Hash the test password
&nbsp;
  const user = await prisma.user.upsert({
    where: { email: "test1@example.com" },
    update: { password: hashedPassword },
    create: {
      username: "testuser",
      email: "test1@example.com",
      password: hashedPassword,
    },
  });
&nbsp;
  const loginRes = await request(app).post(`/api/auth/login`).send({
    email: "test1@example.com",
    password: "Test123!",
  });
&nbsp;
  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
  }
&nbsp;
  return {
    token: loginRes.body.token,
    userId: loginRes.body.user.id,
  };
}
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\tests\helpers\data.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for tests/helpers/data.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">tests/helpers</a> data.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>10/10</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>2/2</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>9/9</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a>
<a name='L49'></a><a href='#L49'>49</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { prisma } from "./db";
import bcrypt from "bcryptjs";
&nbsp;
export const setupTestData = async () =&gt; {
  const user = await prisma.user.upsert({
    where: { email: "test1@example.com" },
    update: {},
    create: {
      email: "test1@example.com",
      username: "testuser",
      password: await bcrypt.hash("Test123!", 10),
    },
  });
&nbsp;
  const album = await prisma.album.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: "Test Album",
      releaseDate: "2004-04-14T00:00:00Z",
      artworkUrl: "test.jpg",
    },
  });
&nbsp;
  const song = await prisma.song.upsert({
    where: { id: 519 },
    update: {},
    create: {
      id: 519,
      title: "Test Song",
      albumId: album.id,
      trackNumber: 1,
      duration: "4:56",
    },
  });
&nbsp;
  return { user, album, song };
};
&nbsp;
export async function cleanupTestData() {
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.song.deleteMany(),
    prisma.album.deleteMany(),
    prisma.user.deleteMany({ where: { email: "test1@example.com" } }),
  ]);
}
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T19:08:24.009Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\tests\helpers\db.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for tests/helpers/db.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">tests/helpers</a> db.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">66.66% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>6/9</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>0/2</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">57.14% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>4/7</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line medium'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">3x</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { PrismaClient } from "@prisma/client";
&nbsp;
export const prisma = new PrismaClient();
&nbsp;
export const connectDB = <span class="fstat-no" title="function not covered" >async </span>() =&gt; {
<span class="cstat-no" title="statement not covered" >  await prisma.$connect();</span>
<span class="cstat-no" title="statement not covered" >  return prisma;</span>
};
&nbsp;
export const disconnectDB = <span class="fstat-no" title="function not covered" >async </span>() =&gt; {
<span class="cstat-no" title="statement not covered" >  await prisma.$disconnect();</span>
};
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\tests\helpers\index.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for tests/helpers</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> tests/helpers</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">71.79% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>28/39</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">25% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>1/4</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">50% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>3/6</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">70.27% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>26/37</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line medium'></div>
    <div class="pad1">
<table class="coverage-summary">
<thead>
<tr>
   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>
   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
</tr>
</thead>
<tbody><tr>
	<td class="file high" data-value="auth.ts"><a href="auth.ts.html">auth.ts</a></td>
	<td data-value="100" class="pic high">
	<div class="chart"><div class="cover-fill cover-full" style="width: 100%"></div><div class="cover-empty" style="width: 0%"></div></div>
	</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="11" class="abs high">11/11</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="1" class="abs high">1/1</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="1" class="abs high">1/1</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="11" class="abs high">11/11</td>
	</tr>

<tr>
	<td class="file medium" data-value="db.ts"><a href="db.ts.html">db.ts</a></td>
	<td data-value="66.66" class="pic medium">
	<div class="chart"><div class="cover-fill" style="width: 66%"></div><div class="cover-empty" style="width: 34%"></div></div>
	</td>
	<td data-value="66.66" class="pct medium">66.66%</td>
	<td data-value="9" class="abs medium">6/9</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="2" class="abs low">0/2</td>
	<td data-value="57.14" class="pct medium">57.14%</td>
	<td data-value="7" class="abs medium">4/7</td>
	</tr>

<tr>
	<td class="file medium" data-value="testHelpers.ts"><a href="testHelpers.ts.html">testHelpers.ts</a></td>
	<td data-value="57.89" class="pic medium">
	<div class="chart"><div class="cover-fill" style="width: 57%"></div><div class="cover-empty" style="width: 43%"></div></div>
	</td>
	<td data-value="57.89" class="pct medium">57.89%</td>
	<td data-value="19" class="abs medium">11/19</td>
	<td data-value="0" class="pct low">0%</td>
	<td data-value="3" class="abs low">0/3</td>
	<td data-value="66.66" class="pct medium">66.66%</td>
	<td data-value="3" class="abs medium">2/3</td>
	<td data-value="57.89" class="pct medium">57.89%</td>
	<td data-value="19" class="abs medium">11/19</td>
	</tr>

</tbody>
</table>
</div>
                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov-report\tests\helpers\testHelpers.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for tests/helpers/testHelpers.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">tests/helpers</a> testHelpers.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">57.89% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>11/19</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">0% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/3</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">66.66% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>2/3</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">57.89% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>11/19</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line medium'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a>
<a name='L49'></a><a href='#L49'>49</a>
<a name='L50'></a><a href='#L50'>50</a>
<a name='L51'></a><a href='#L51'>51</a>
<a name='L52'></a><a href='#L52'>52</a>
<a name='L53'></a><a href='#L53'>53</a>
<a name='L54'></a><a href='#L54'>54</a>
<a name='L55'></a><a href='#L55'>55</a>
<a name='L56'></a><a href='#L56'>56</a>
<a name='L57'></a><a href='#L57'>57</a>
<a name='L58'></a><a href='#L58'>58</a>
<a name='L59'></a><a href='#L59'>59</a>
<a name='L60'></a><a href='#L60'>60</a>
<a name='L61'></a><a href='#L61'>61</a>
<a name='L62'></a><a href='#L62'>62</a>
<a name='L63'></a><a href='#L63'>63</a>
<a name='L64'></a><a href='#L64'>64</a>
<a name='L65'></a><a href='#L65'>65</a>
<a name='L66'></a><a href='#L66'>66</a>
<a name='L67'></a><a href='#L67'>67</a>
<a name='L68'></a><a href='#L68'>68</a>
<a name='L69'></a><a href='#L69'>69</a>
<a name='L70'></a><a href='#L70'>70</a>
<a name='L71'></a><a href='#L71'>71</a>
<a name='L72'></a><a href='#L72'>72</a>
<a name='L73'></a><a href='#L73'>73</a>
<a name='L74'></a><a href='#L74'>74</a>
<a name='L75'></a><a href='#L75'>75</a>
<a name='L76'></a><a href='#L76'>76</a>
<a name='L77'></a><a href='#L77'>77</a>
<a name='L78'></a><a href='#L78'>78</a>
<a name='L79'></a><a href='#L79'>79</a>
<a name='L80'></a><a href='#L80'>80</a>
<a name='L81'></a><a href='#L81'>81</a>
<a name='L82'></a><a href='#L82'>82</a>
<a name='L83'></a><a href='#L83'>83</a>
<a name='L84'></a><a href='#L84'>84</a>
<a name='L85'></a><a href='#L85'>85</a>
<a name='L86'></a><a href='#L86'>86</a>
<a name='L87'></a><a href='#L87'>87</a>
<a name='L88'></a><a href='#L88'>88</a>
<a name='L89'></a><a href='#L89'>89</a>
<a name='L90'></a><a href='#L90'>90</a>
<a name='L91'></a><a href='#L91'>91</a>
<a name='L92'></a><a href='#L92'>92</a>
<a name='L93'></a><a href='#L93'>93</a>
<a name='L94'></a><a href='#L94'>94</a>
<a name='L95'></a><a href='#L95'>95</a>
<a name='L96'></a><a href='#L96'>96</a>
<a name='L97'></a><a href='#L97'>97</a>
<a name='L98'></a><a href='#L98'>98</a>
<a name='L99'></a><a href='#L99'>99</a></td><td class="line-coverage quiet"><span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">2x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { PrismaClient } from "@prisma/client";
import { app } from "../../src/server";
import request from "supertest";
import bcrypt from "bcryptjs";
&nbsp;
const prisma = new PrismaClient();
&nbsp;
export const TestHelpers = {
  setupTestData: async () =&gt; {
    // Create or update test user
    const user = await prisma.user.upsert({
      where: { email: "test1@example.com" },
      update: {},
      create: {
        email: "test1@example.com",
        username: "testuser",
        password: await bcrypt.hash("Test123!", 10),
      },
    });
&nbsp;
    // Create or update test album
    const album = await prisma.album.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        title: "Test Album",
        releaseDate: "2004-04-14T00:00:00Z",
        artworkUrl: "test.jpg",
      },
    });
&nbsp;
    // Create or update test song
    const song = await prisma.song.upsert({
      where: { id: 519 },
      update: {},
      create: {
        id: 519,
        title: "Test Song",
        albumId: album.id,
        trackNumber: 1,
        duration: "4:56",
      },
    });
&nbsp;
    return { user, album, song };
  },
&nbsp;
  cleanupTestData: async () =&gt; {
    await prisma.$transaction([
      prisma.review.deleteMany({
        where: { songId: 519 },
      }),
      prisma.song.deleteMany({
        where: { id: 519 },
      }),
      prisma.album.deleteMany({
        where: { id: 1 },
      }),
      prisma.user.deleteMany({ where: { email: "test1@example.com" } }),
    ]);
  },
&nbsp;
  getTestUserToken: <span class="fstat-no" title="function not covered" >async </span>() =&gt; {
<span class="cstat-no" title="statement not covered" >    try {</span>
      // Create or update test user with hashed password
      const user = <span class="cstat-no" title="statement not covered" >await prisma.user.upsert({</span>
        where: { email: "test1@example.com" },
        update: {
          password: await bcrypt.hash("Test123!", 10),
        },
        create: {
          username: "testuser",
          email: "test1@example.com",
          password: await bcrypt.hash("Test123!", 10),
        },
      });
&nbsp;
      // Login to get token
      const loginRes = <span class="cstat-no" title="statement not covered" >await request(app).post(`/api/auth/login`).send({</span>
        email: "test1@example.com",
        password: "Test123!",
      });
&nbsp;
<span class="cstat-no" title="statement not covered" >      <span class="missing-if-branch" title="if path not taken" >I</span>if (loginRes.status !== 200) {</span>
<span class="cstat-no" title="statement not covered" >        throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);</span>
      }
&nbsp;
<span class="cstat-no" title="statement not covered" >      return {</span>
        token: loginRes.body.token,
        userId: loginRes.body.user?.id || user.id,
      };
    } catch (error) {
<span class="cstat-no" title="statement not covered" >      console.error("Failed to get test token:", error);</span>
<span class="cstat-no" title="statement not covered" >      throw error;</span>
    }
  },
};
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2025-03-07T23:10:17.025Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

# coverage\lcov.info

```info
TN:
SF:src\server.ts
FN:31,(anonymous_1)
FN:32,(anonymous_2)
FN:33,(anonymous_3)
FN:42,(anonymous_4)
FN:43,(anonymous_5)
FN:44,(anonymous_6)
FN:66,(anonymous_7)
FN:80,(anonymous_8)
FN:102,(anonymous_9)
FN:116,(anonymous_10)
FNF:10
FNH:2
FNDA:0,(anonymous_1)
FNDA:0,(anonymous_2)
FNDA:0,(anonymous_3)
FNDA:0,(anonymous_4)
FNDA:0,(anonymous_5)
FNDA:0,(anonymous_6)
FNDA:0,(anonymous_7)
FNDA:0,(anonymous_8)
FNDA:14,(anonymous_9)
FNDA:3,(anonymous_10)
DA:1,3
DA:2,3
DA:3,3
DA:4,3
DA:5,3
DA:6,3
DA:7,3
DA:9,3
DA:10,3
DA:11,3
DA:12,3
DA:13,3
DA:16,3
DA:17,3
DA:18,3
DA:19,3
DA:20,3
DA:23,3
DA:24,3
DA:27,3
DA:28,3
DA:31,3
DA:32,0
DA:33,0
DA:35,0
DA:36,0
DA:37,0
DA:42,3
DA:43,0
DA:44,0
DA:49,3
DA:50,3
DA:51,3
DA:54,3
DA:60,3
DA:63,3
DA:67,0
DA:68,0
DA:70,0
DA:75,3
DA:76,3
DA:82,0
DA:86,3
DA:91,3
DA:94,3
DA:95,3
DA:102,3
DA:103,14
DA:104,14
DA:105,14
DA:109,3
DA:110,3
DA:111,3
DA:112,3
DA:113,3
DA:116,3
DA:117,3
LF:57
LH:46
BRDA:67,0,0,0
BRDA:67,0,1,0
BRF:2
BRH:0
end_of_record
TN:
SF:src\controllers\album.controller.ts
FN:13,(anonymous_1)
FN:25,(anonymous_2)
FN:36,(anonymous_3)
FN:43,(anonymous_4)
FN:50,(anonymous_5)
FNF:5
FNH:4
FNDA:1,(anonymous_1)
FNDA:0,(anonymous_2)
FNDA:1,(anonymous_3)
FNDA:1,(anonymous_4)
FNDA:1,(anonymous_5)
DA:2,3
DA:9,3
DA:10,3
DA:12,3
DA:14,1
DA:15,1
DA:16,1
DA:18,0
DA:19,0
DA:24,3
DA:26,0
DA:31,0
DA:35,3
DA:37,1
DA:38,1
DA:42,3
DA:44,1
DA:45,1
DA:49,3
DA:51,1
DA:52,1
DA:53,1
DA:55,1
DA:56,0
DA:60,1
DA:61,0
DA:66,0
DA:68,0
DA:69,0
DA:71,0
DA:75,0
DA:76,0
DA:80,1
DA:86,1
LF:34
LH:22
BRDA:27,0,0,0
BRDA:27,0,1,0
BRDA:28,1,0,0
BRDA:28,1,1,0
BRDA:52,2,0,0
BRDA:52,2,1,1
BRDA:55,3,0,0
BRDA:55,4,0,1
BRDA:55,4,1,0
BRDA:60,5,0,0
BRDA:66,6,0,0
BRDA:68,7,0,0
BRDA:69,8,0,0
BRDA:75,9,0,0
BRDA:83,10,0,0
BRDA:83,10,1,1
BRF:16
BRH:3
end_of_record
TN:
SF:src\controllers\group.controller.ts
FN:13,(anonymous_1)
FN:23,(anonymous_2)
FN:30,(anonymous_3)
FN:41,(anonymous_4)
FN:52,(anonymous_5)
FN:59,(anonymous_6)
FNF:6
FNH:0
FNDA:0,(anonymous_1)
FNDA:0,(anonymous_2)
FNDA:0,(anonymous_3)
FNDA:0,(anonymous_4)
FNDA:0,(anonymous_5)
FNDA:0,(anonymous_6)
DA:2,3
DA:10,3
DA:12,3
DA:14,0
DA:18,0
DA:22,3
DA:24,0
DA:25,0
DA:29,3
DA:31,0
DA:36,0
DA:40,3
DA:42,0
DA:47,0
DA:51,3
DA:53,0
DA:54,0
DA:58,3
DA:60,0
DA:61,0
LF:20
LH:8
BRF:0
BRH:0
end_of_record
TN:
SF:src\controllers\review.controller.ts
FN:9,(anonymous_1)
FN:19,(anonymous_2)
FNF:2
FNH:0
FNDA:0,(anonymous_1)
FNDA:0,(anonymous_2)
DA:2,3
DA:6,3
DA:8,3
DA:10,0
DA:14,0
DA:18,3
DA:20,0
DA:24,0
LF:8
LH:4
BRF:0
BRH:0
end_of_record
TN:
SF:src\controllers\song.controller.ts
FN:12,(anonymous_1)
FN:24,(anonymous_2)
FN:31,(anonymous_3)
FN:38,(anonymous_4)
FN:45,(anonymous_5)
FNF:5
FNH:0
FNDA:0,(anonymous_1)
FNDA:0,(anonymous_2)
FNDA:0,(anonymous_3)
FNDA:0,(anonymous_4)
FNDA:0,(anonymous_5)
DA:2,3
DA:9,3
DA:11,3
DA:13,0
DA:19,0
DA:23,3
DA:25,0
DA:26,0
DA:30,3
DA:32,0
DA:33,0
DA:37,3
DA:39,0
DA:40,0
DA:44,3
DA:46,0
DA:47,0
LF:17
LH:7
BRF:0
BRH:0
end_of_record
TN:
SF:src\controllers\user.controller.ts
FN:21,(anonymous_1)
FN:34,(anonymous_2)
FN:44,(anonymous_3)
FN:51,(anonymous_4)
FN:74,(anonymous_5)
FN:98,(anonymous_6)
FNF:6
FNH:3
FNDA:3,(anonymous_1)
FNDA:5,(anonymous_2)
FNDA:0,(anonymous_3)
FNDA:1,(anonymous_4)
FNDA:0,(anonymous_5)
FNDA:0,(anonymous_6)
DA:2,3
DA:9,3
DA:11,3
DA:12,3
DA:13,3
DA:18,3
DA:20,3
DA:22,3
DA:23,3
DA:24,3
DA:26,0
DA:27,0
DA:28,0
DA:33,3
DA:35,5
DA:39,3
DA:43,3
DA:45,0
DA:46,0
DA:50,3
DA:52,1
DA:54,1
DA:55,0
DA:60,1
DA:61,1
DA:62,1
DA:64,0
DA:65,0
DA:67,0
DA:73,3
DA:75,0
DA:78,0
DA:79,0
DA:82,0
DA:93,0
DA:97,3
DA:99,0
DA:100,0
LF:38
LH:22
BRDA:28,0,0,0
BRDA:28,0,1,0
BRDA:54,1,0,0
BRDA:64,2,0,0
BRDA:64,2,1,0
BRDA:78,3,0,0
BRF:6
BRH:0
end_of_record
TN:
SF:src\db\prisma.ts
FNF:0
FNH:0
DA:1,3
DA:2,3
DA:3,3
LF:3
LH:3
BRF:0
BRH:0
end_of_record
TN:
SF:src\errors\customErrors.ts
FN:3,(anonymous_0)
FN:11,(anonymous_1)
FN:19,(anonymous_2)
FN:27,(anonymous_3)
FN:36,(anonymous_4)
FNF:5
FNH:1
FNDA:2,(anonymous_0)
FNDA:0,(anonymous_1)
FNDA:0,(anonymous_2)
FNDA:0,(anonymous_3)
FNDA:0,(anonymous_4)
DA:1,3
DA:2,2
DA:4,2
DA:5,2
DA:9,3
DA:10,0
DA:12,0
DA:13,0
DA:17,3
DA:18,0
DA:20,0
DA:21,0
DA:25,3
DA:26,0
DA:28,0
DA:29,0
DA:33,3
DA:34,0
DA:37,0
DA:38,0
DA:39,0
LF:21
LH:8
BRDA:3,0,0,0
BRDA:11,1,0,0
BRDA:19,2,0,0
BRDA:27,3,0,0
BRDA:36,4,0,0
BRF:5
BRH:0
end_of_record
TN:
SF:src\middleware\asyncRouteHandler.ts
FN:4,(anonymous_0)
FN:7,(anonymous_1)
FNF:2
FNH:2
FNDA:75,(anonymous_0)
FNDA:13,(anonymous_1)
DA:4,3
DA:7,75
DA:8,13
DA:12,3
LF:4
LH:4
BRF:0
BRH:0
end_of_record
TN:
SF:src\middleware\auth.ts
FN:6,(anonymous_1)
FNF:1
FNH:1
FNDA:4,(anonymous_1)
DA:2,3
DA:3,3
DA:4,3
DA:6,3
DA:11,4
DA:13,4
DA:15,4
DA:16,4
DA:17,3
DA:21,3
DA:22,3
DA:23,3
DA:25,1
LF:13
LH:13
BRDA:13,0,0,0
BRDA:21,1,0,0
BRF:2
BRH:0
end_of_record
TN:
SF:src\middleware\errorHandler.ts
FN:9,(anonymous_0)
FNF:1
FNH:1
FNDA:3,(anonymous_0)
DA:1,3
DA:2,3
DA:4,3
DA:9,3
DA:15,3
DA:16,0
DA:22,3
DA:23,2
DA:27,1
DA:28,0
DA:32,1
DA:33,0
DA:37,1
DA:38,0
DA:43,1
DA:45,1
DA:46,1
DA:53,0
LF:18
LH:13
BRDA:15,0,0,0
BRDA:22,1,0,2
BRDA:27,2,0,0
BRDA:27,3,0,1
BRDA:27,3,1,1
BRDA:32,4,0,0
BRDA:37,5,0,0
BRDA:45,6,0,1
BRDA:55,7,0,0
BRDA:55,7,1,0
BRF:10
BRH:4
end_of_record
TN:
SF:src\middleware\validate.ts
FN:6,(anonymous_0)
FN:7,(anonymous_1)
FN:20,(anonymous_2)
FNF:3
FNH:2
FNDA:30,(anonymous_0)
FNDA:11,(anonymous_1)
FNDA:0,(anonymous_2)
DA:2,3
DA:3,3
DA:5,3
DA:6,3
DA:7,30
DA:8,11
DA:9,11
DA:14,11
DA:16,0
DA:17,0
DA:20,0
DA:27,0
LF:12
LH:8
BRDA:16,0,0,0
BRDA:16,0,1,0
BRF:2
BRH:0
end_of_record
TN:
SF:src\routes\albums.ts
FNF:0
FNH:0
DA:1,3
DA:2,3
DA:9,3
DA:10,3
DA:11,3
DA:16,3
DA:18,3
DA:25,3
DA:27,3
DA:29,3
DA:36,3
DA:38,3
LF:12
LH:12
BRF:0
BRH:0
end_of_record
TN:
SF:src\routes\groups.ts
FNF:0
FNH:0
DA:1,3
DA:2,3
DA:10,3
DA:11,3
DA:12,3
DA:14,3
DA:16,3
DA:17,3
DA:18,3
DA:19,3
DA:25,3
DA:26,3
DA:28,3
LF:13
LH:13
BRF:0
BRH:0
end_of_record
TN:
SF:src\routes\reviews.ts
FNF:0
FNH:0
DA:1,3
DA:2,3
DA:6,3
DA:8,3
DA:10,3
DA:11,3
DA:13,3
LF:7
LH:7
BRF:0
BRH:0
end_of_record
TN:
SF:src\routes\songs.ts
FNF:0
FNH:0
DA:1,3
DA:2,3
DA:9,3
DA:10,3
DA:11,3
DA:13,3
DA:15,3
DA:16,3
DA:17,3
DA:18,3
DA:24,3
DA:26,3
LF:12
LH:12
BRF:0
BRH:0
end_of_record
TN:
SF:src\routes\users.ts
FNF:0
FNH:0
DA:1,3
DA:2,3
DA:10,3
DA:11,3
DA:17,3
DA:19,3
DA:21,3
DA:22,3
DA:23,3
DA:24,3
DA:25,3
DA:32,3
DA:34,3
LF:13
LH:13
BRF:0
BRH:0
end_of_record
TN:
SF:src\services\album.service.ts
FN:10,(anonymous_1)
FN:43,(anonymous_2)
FN:79,(anonymous_3)
FN:80,(anonymous_4)
FN:81,(anonymous_5)
FN:95,(anonymous_6)
FN:131,(anonymous_7)
FN:145,(anonymous_8)
FNF:8
FNH:4
FNDA:1,(anonymous_1)
FNDA:1,(anonymous_2)
FNDA:0,(anonymous_3)
FNDA:0,(anonymous_4)
FNDA:0,(anonymous_5)
FNDA:0,(anonymous_6)
FNDA:1,(anonymous_7)
FNDA:1,(anonymous_8)
DA:2,3
DA:10,3
DA:11,1
DA:43,3
DA:49,1
DA:55,1
DA:62,1
DA:70,1
DA:71,1
DA:72,0
DA:79,1
DA:80,0
DA:81,0
DA:83,0
DA:95,3
DA:100,0
DA:104,0
DA:121,0
DA:131,3
DA:135,1
DA:136,0
DA:139,1
DA:145,3
DA:146,1
LF:24
LH:16
BRDA:57,0,0,1
BRDA:57,0,1,0
BRDA:58,1,0,1
BRDA:58,1,1,0
BRDA:71,2,0,0
BRDA:88,3,0,0
BRDA:88,3,1,0
BRDA:89,4,0,0
BRDA:89,4,1,0
BRDA:90,5,0,0
BRDA:90,5,1,0
BRDA:100,6,0,0
BRDA:100,6,1,0
BRDA:135,7,0,0
BRDA:135,8,0,1
BRDA:135,8,1,0
BRF:16
BRH:3
end_of_record
TN:
SF:src\services\email.service.ts
FN:11,(anonymous_1)
FNF:1
FNH:0
FNDA:0,(anonymous_1)
DA:1,3
DA:3,3
DA:11,3
DA:16,0
DA:18,0
LF:5
LH:3
BRF:0
BRH:0
end_of_record
TN:
SF:src\services\group.service.ts
FN:23,(anonymous_1)
FN:53,(anonymous_2)
FN:72,(anonymous_3)
FN:99,(anonymous_4)
FN:126,(anonymous_5)
FN:158,(anonymous_6)
FN:175,(anonymous_7)
FNF:7
FNH:0
FNDA:0,(anonymous_1)
FNDA:0,(anonymous_2)
FNDA:0,(anonymous_3)
FNDA:0,(anonymous_4)
FNDA:0,(anonymous_5)
FNDA:0,(anonymous_6)
FNDA:0,(anonymous_7)
DA:1,3
DA:2,3
DA:7,3
DA:8,3
DA:23,3
DA:24,0
DA:25,0
DA:28,0
DA:53,3
DA:54,0
DA:63,0
DA:64,0
DA:67,0
DA:72,3
DA:77,0
DA:86,0
DA:87,0
DA:90,0
DA:99,3
DA:104,0
DA:114,0
DA:115,0
DA:116,0
DA:118,0
DA:119,0
DA:122,0
DA:123,0
DA:126,3
DA:127,0
DA:131,0
DA:133,0
DA:142,0
DA:143,0
DA:146,0
DA:158,3
DA:159,0
DA:175,3
DA:180,0
DA:190,0
LF:39
LH:11
BRDA:24,0,0,0
BRDA:24,1,0,0
BRDA:24,1,1,0
BRDA:33,2,0,0
BRDA:33,2,1,0
BRDA:63,3,0,0
BRDA:63,4,0,0
BRDA:63,4,1,0
BRDA:86,5,0,0
BRDA:86,6,0,0
BRDA:86,6,1,0
BRDA:114,7,0,0
BRDA:115,8,0,0
BRDA:115,9,0,0
BRDA:115,9,1,0
BRDA:118,10,0,0
BRDA:131,11,0,0
BRDA:142,12,0,0
BRF:18
BRH:0
end_of_record
TN:
SF:src\services\review.service.ts
FN:33,(anonymous_1)
FN:78,(anonymous_2)
FN:109,(anonymous_3)
FN:123,(anonymous_4)
FN:150,(anonymous_5)
FNF:5
FNH:0
FNDA:0,(anonymous_1)
FNDA:0,(anonymous_2)
FNDA:0,(anonymous_3)
FNDA:0,(anonymous_4)
FNDA:0,(anonymous_5)
DA:2,3
DA:3,3
DA:33,3
DA:41,0
DA:42,0
DA:48,0
DA:51,0
DA:54,0
DA:55,0
DA:63,0
DA:67,0
DA:78,3
DA:79,0
DA:81,0
DA:83,0
DA:98,0
DA:109,3
DA:110,0
DA:123,3
DA:124,0
DA:150,3
DA:151,0
DA:152,0
DA:153,0
LF:24
LH:7
BRDA:41,0,0,0
BRDA:41,1,0,0
BRDA:41,1,1,0
BRDA:51,2,0,0
BRDA:54,3,0,0
BRDA:63,4,0,0
BRDA:112,5,0,0
BRDA:112,5,1,0
BRDA:113,6,0,0
BRDA:113,6,1,0
BRDA:116,7,0,0
BRDA:116,7,1,0
BRDA:117,8,0,0
BRDA:117,8,1,0
BRDA:129,9,0,0
BRDA:129,9,1,0
BRDA:141,10,0,0
BRDA:141,10,1,0
BRDA:142,11,0,0
BRDA:142,11,1,0
BRDA:143,12,0,0
BRDA:143,12,1,0
BRDA:144,13,0,0
BRDA:144,13,1,0
BRDA:151,14,0,0
BRDA:153,15,0,0
BRDA:153,15,1,0
BRF:27
BRH:0
end_of_record
TN:
SF:src\services\song.service.ts
FN:5,(anonymous_1)
FN:36,(anonymous_2)
FN:55,(anonymous_3)
FN:72,(anonymous_4)
FN:83,(anonymous_5)
FNF:5
FNH:0
FNDA:0,(anonymous_1)
FNDA:0,(anonymous_2)
FNDA:0,(anonymous_3)
FNDA:0,(anonymous_4)
FNDA:0,(anonymous_5)
DA:2,3
DA:3,3
DA:5,3
DA:11,0
DA:18,0
DA:26,0
DA:36,3
DA:37,0
DA:51,0
DA:52,0
DA:55,3
DA:56,0
DA:57,0
DA:62,0
DA:63,0
DA:66,0
DA:72,3
DA:76,0
DA:83,3
DA:84,0
LF:20
LH:7
BRDA:12,0,0,0
BRDA:12,0,1,0
BRDA:13,1,0,0
BRDA:13,1,1,0
BRDA:30,2,0,0
BRDA:30,2,1,0
BRDA:31,3,0,0
BRDA:31,3,1,0
BRDA:51,4,0,0
BRDA:56,5,0,0
BRDA:56,6,0,0
BRDA:56,6,1,0
BRDA:62,7,0,0
BRF:13
BRH:0
end_of_record
TN:
SF:src\services\user.service.ts
FN:13,(anonymous_1)
FN:53,(anonymous_2)
FN:96,(anonymous_3)
FN:122,(anonymous_4)
FN:147,(anonymous_5)
FN:195,(anonymous_6)
FNF:6
FNH:3
FNDA:3,(anonymous_1)
FNDA:5,(anonymous_2)
FNDA:0,(anonymous_3)
FNDA:0,(anonymous_4)
FNDA:1,(anonymous_5)
FNDA:0,(anonymous_6)
DA:1,3
DA:2,3
DA:3,3
DA:4,3
DA:5,3
DA:11,3
DA:13,3
DA:18,3
DA:19,0
DA:24,3
DA:26,3
DA:27,3
DA:41,0
DA:42,0
DA:43,0
DA:44,0
DA:49,0
DA:53,3
DA:54,5
DA:65,5
DA:66,1
DA:69,4
DA:70,0
DA:73,4
DA:76,4
DA:80,4
DA:84,3
DA:96,3
DA:97,0
DA:118,0
DA:119,0
DA:122,3
DA:131,0
DA:132,0
DA:135,0
DA:147,3
DA:148,1
DA:149,0
DA:152,1
DA:153,1
DA:157,1
DA:162,1
DA:163,0
DA:167,1
DA:171,1
DA:176,1
DA:181,1
DA:186,0
DA:187,0
DA:189,0
DA:190,0
DA:192,0
DA:195,3
DA:196,0
LF:54
LH:33
BRDA:18,0,0,0
BRDA:41,1,0,0
BRDA:42,2,0,0
BRDA:65,3,0,1
BRDA:65,4,0,5
BRDA:65,4,1,4
BRDA:69,5,0,0
BRDA:118,6,0,0
BRDA:131,7,0,0
BRDA:148,8,0,0
BRDA:162,9,0,0
BRDA:162,10,0,1
BRDA:162,10,1,1
BRDA:186,11,0,0
BRDA:189,12,0,0
BRF:15
BRH:5
end_of_record
TN:
SF:src\validators\album.validator.ts
FN:14,(anonymous_0)
FNF:1
FNH:1
FNDA:1,(anonymous_0)
DA:1,3
DA:3,3
DA:14,1
DA:21,3
DA:25,3
LF:5
LH:5
BRF:0
BRH:0
end_of_record
TN:
SF:src\validators\group.validator.ts
FNF:0
FNH:0
DA:1,3
DA:3,3
LF:2
LH:2
BRF:0
BRH:0
end_of_record
TN:
SF:src\validators\song.validator.ts
FNF:0
FNH:0
DA:1,3
DA:3,3
LF:2
LH:2
BRF:0
BRH:0
end_of_record
TN:
SF:src\validators\user.validator.ts
FN:40,(anonymous_0)
FNF:1
FNH:0
FNDA:0,(anonymous_0)
DA:1,3
DA:4,3
DA:7,3
DA:15,3
DA:22,3
DA:29,3
DA:42,0
LF:7
LH:6
BRF:0
BRH:0
end_of_record
TN:
SF:tests\helpers\auth.ts
FN:6,getTestUserToken
FNF:1
FNH:1
FNDA:2,getTestUserToken
DA:1,2
DA:2,2
DA:3,2
DA:4,2
DA:6,2
DA:7,2
DA:9,2
DA:19,2
DA:24,2
DA:25,1
DA:28,1
LF:11
LH:11
BRDA:24,0,0,1
BRF:1
BRH:1
end_of_record
TN:
SF:tests\helpers\db.ts
FN:5,(anonymous_0)
FN:10,(anonymous_1)
FNF:2
FNH:0
FNDA:0,(anonymous_0)
FNDA:0,(anonymous_1)
DA:1,3
DA:3,3
DA:5,3
DA:6,0
DA:7,0
DA:10,3
DA:11,0
LF:7
LH:4
BRF:0
BRH:0
end_of_record
TN:
SF:tests\helpers\testHelpers.ts
FN:9,(anonymous_1)
FN:49,(anonymous_2)
FN:64,(anonymous_3)
FNF:3
FNH:2
FNDA:2,(anonymous_1)
FNDA:2,(anonymous_2)
FNDA:0,(anonymous_3)
DA:1,2
DA:2,2
DA:3,2
DA:4,2
DA:6,2
DA:8,2
DA:11,2
DA:22,2
DA:34,2
DA:46,2
DA:50,2
DA:65,0
DA:67,0
DA:80,0
DA:85,0
DA:86,0
DA:89,0
DA:94,0
DA:95,0
LF:19
LH:11
BRDA:85,0,0,0
BRDA:91,1,0,0
BRDA:91,1,1,0
BRF:3
BRH:0
end_of_record

```

# jest.config.ts

```ts
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^(\\.{1,2}/.*)\\.(js|ts)$": "$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        useESM: false,
      },
    ],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: ["**/tests/**/*.test.ts"],
};

```

# nodemon.json

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.spec.ts", "src/**/*.test.ts"],
  "exec": "node --no-warnings --loader ts-node/esm ./src/server.ts"
}
```

# package.json

```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "nodemon -e ts,json --exec node --no-warnings --import tsx src/server.ts",
    "build": "rimraf dist && tsc && cpx .env dist/ && cpx \"src/images/**/*\" dist/src/images",
    "start": "node dist/server.js",
    "prestart": "npm run build",
    "seed": "ts-node prisma/seed.js",
    "test:ci": "cross-env NODE_ENV=test jest --ci --runInBand --forceExit",
    "test:cov": "cross-env NODE_ENV=test jest --coverage",
    "prepare": "husky",
    "test": "cross-env NODE_ENV=test jest --forceExit --runInBand",
    "pretest": "npm run build",
    "posttest": "npm run test:cov",
    "lint": "eslint . --fix",
    "clean": "rimraf dist node_modules"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "module",
  "dependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/nodemailer": "^6.4.17",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^7.5.0",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.10.1",
    "pg": "^8.13.3",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@babel/core": "^7.26.9",
    "@babel/preset-env": "^7.26.9",
    "@babel/preset-typescript": "^7.26.0",
    "@jest/globals": "^29.7.0",
    "@prisma/client": "^6.3.1",
    "@types/babel__core": "^7.20.5",
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jest": "29.5.14",
    "@types/jsonwebtoken": "^9.0.8",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.13.13",
    "@types/supertest": "^6.0.2",
    "@typescript-eslint/eslint-plugin": "^8.24.1",
    "@typescript-eslint/parser": "^8.24.1",
    "babel-jest": "^29.7.0",
    "cross-env": "^7.0.3",
    "eslint": "^9.20.1",
    "eslint-config-prettier": "^10.0.1",
    "eslint-plugin-prettier": "^5.2.3",
    "husky": "^9.1.7",
    "jest": "^29.7.0",
    "nodemon": "^3.1.9",
    "prisma": "^6.3.1",
    "rimraf": "^6.0.1",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.6",
    "tsx": "^4.19.3",
    "typescript": "^5.8.2"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}

```

# prisma\migrations\20250213193258_init\migration.sql

```sql
-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "artworkUrl" TEXT NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "albumId" INTEGER NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "reviewText" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "songId" INTEGER NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

```

# prisma\migrations\20250214221649_song_updates\migration.sql

```sql
/*
  Warnings:

  - Added the required column `duration` to the `Song` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trackNumber` to the `Song` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "duration" TEXT NOT NULL,
ADD COLUMN     "trackNumber" INTEGER NOT NULL;

```

# prisma\migrations\20250218174515_add_user_group_relations\migration.sql

```sql
/*
  Warnings:

  - You are about to drop the column `reviewText` on the `Review` table. All the data in the column will be lost.
  - Added the required column `content` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Review" DROP COLUMN "reviewText",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "inviteCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGroup" (
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGroup_pkey" PRIMARY KEY ("userId","groupId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_inviteCode_key" ON "Group"("inviteCode");

-- CreateIndex
CREATE INDEX "UserGroup_groupId_idx" ON "UserGroup"("groupId");

-- AddForeignKey
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

```

# prisma\migrations\20250218175539_add_group_roles\migration.sql

```sql
-- AlterTable
ALTER TABLE "UserGroup" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'member';

```

# prisma\migrations\20250220202501_add_indexes_for_reviews\migration.sql

```sql
-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "groupId" INTEGER;

-- CreateIndex
CREATE INDEX "Review_songId_idx" ON "Review"("songId");

-- CreateIndex
CREATE INDEX "Review_groupId_idx" ON "Review"("groupId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

```

# prisma\migrations\20250305205515_add_refresh_token\migration.sql

```sql
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "refreshToken" TEXT;

```

# prisma\migrations\20250306211720_review_content_optional\migration.sql

```sql
-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "content" DROP NOT NULL;

```

# prisma\migrations\20250430180708_add_unique_constraint_to_reviews\migration.sql

```sql
/*
  Warnings:

  - A unique constraint covering the columns `[userId,songId,groupId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_songId_groupId_key" ON "Review"("userId", "songId", "groupId");

```

# prisma\migrations\20250710182326_remove_review_group\migration.sql

```sql
/*
  Warnings:

  - A unique constraint covering the columns `[userId,songId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Review_groupId_idx";

-- DropIndex
DROP INDEX "Review_userId_songId_groupId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_songId_key" ON "Review"("userId", "songId");

```

# prisma\migrations\20250722210446_add_avatar_color\migration.sql

```sql
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarColor" TEXT;

```

# prisma\migrations\migration_lock.toml

```toml
# Please do not edit this file manually
# It should be added in your version-control system (e.g., Git)
provider = "postgresql"
```

# prisma\schema.prisma

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Album {
  id          Int      @id @default(autoincrement())
  title       String
  releaseDate DateTime
  artworkUrl  String
  songs       Song[]
}

model Song {
  id          Int      @id @default(autoincrement())
  title       String
  trackNumber Int
  albumId     Int
  duration    String
  album       Album    @relation(fields: [albumId], references: [id])
  reviews     Review[]
}

model User {
  id           Int         @id @default(autoincrement())
  username     String      @unique
  email        String      @unique
  password     String
  image        String?
  avatarColor  String? //HEX color code as string
  refreshToken String?     @db.Text
  groups       UserGroup[]
  reviews      Review[]
}

model Group {
  id          Int         @id @default(autoincrement())
  name        String
  description String?
  image       String?
  isPrivate   Boolean     @default(false)
  inviteCode  String?     @unique
  members     UserGroup[]
  createdAt   DateTime    @default(now())
  reviews     Review[]
}

model UserGroup {
  user     User     @relation(fields: [userId], references: [id])
  userId   Int
  group    Group    @relation(fields: [groupId], references: [id])
  groupId  Int
  role     String   @default("member") // 'admin' or 'member'
  joinedAt DateTime @default(now())

  @@id([userId, groupId])
  @@index([groupId])
}

model Review {
  id        Int      @id @default(autoincrement())
  content   String?
  rating    Float
  song      Song     @relation(fields: [songId], references: [id])
  songId    Int
  author    User     @relation(fields: [userId], references: [id])
  userId    Int
  createdAt DateTime @default(now())
  Group     Group?   @relation(fields: [groupId], references: [id])
  groupId   Int?

  @@unique([userId, songId])
  @@index([songId])
  @@index([userId])
}

```

# prisma\seed.js

```js
import { PrismaClient } from "@prisma/client";
import albums from "../seeds-data/albumsWithSongs.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  // Wipe current database
  await prisma.review.deleteMany({});
  await prisma.song.deleteMany({});
  await prisma.album.deleteMany({});

  // Seed albums and songs
  for (const album of albums) {
    const createdAlbum = await prisma.album.create({
      data: {
        title: album.title,
        releaseDate: new Date(album.release_date),
        artworkUrl: `http://localhost:5000/${album.image_url}`,
      },
    });

    console.log({ createdAlbum });

    // Seed corresponding songs
    for (const song of album.songs) {
      const createdSong = await prisma.song.create({
        data: {
          title: song.title,
          trackNumber: song.trackNumber,
          albumId: createdAlbum.id, // Use the ID of the created album
          duration: song.duration,
        },
      });
      console.log({ createdSong });
    }
  }

  // Create users
  const users = await Promise.all(
    [
      {
        username: "aidan",
        email: "aidan@example.com",
        password: await bcrypt.hash("Password123!", 10),
      },
      {
        username: "alex",
        email: "alex@example.com",
        password: await bcrypt.hash("Password123!", 10),
      },
      {
        username: "andrew",
        email: "andrew@example.com",
        password: await bcrypt.hash("Password123!", 10),
      },
      {
        username: "jack",
        email: "jack@example.com",
        password: await bcrypt.hash("Password123!", 10),
      },
    ].map((user) =>
      prisma.user.create({
        data: user,
      })
    )
  );

  // Create a group
  const group = await prisma.group.create({
    data: {
      name: "RHCP Superfans",
      description: "Die-hard Red Hot Chili Peppers fans group",
      isPrivate: true,
      inviteCode: crypto.randomBytes(6).toString("hex"),
    },
  });

  // Add all users to the group
  await Promise.all(
    users.map((user, index) =>
      prisma.userGroup.create({
        data: {
          userId: user.id,
          groupId: group.id,
          role: index === 0 ? "admin" : "member", // First user is admin
        },
      })
    )
  );

  const albumsToSeed = ["Blood Sugar Sex Magik", "Return of the Dream Canteen"];
  const songs = await prisma.song.findMany({
    where: {
      album: {
        title: {
          in: albumsToSeed,
        },
      },
    },
    include: {
      album: true,
    },
  });
  // Create reviews for each user (34 songs per user × 4 users = 136 reviews)
  const reviewData = Array.from({ length: songs.length * users.length }).map(
    (_, index) => {
      const userIndex = Math.floor(index / songs.length);
      const songIndex = index % songs.length;

      // Generate unique ratings based on user
      const baseRatings = {
        aidan: 1.5 + Math.random() * 7.5, // 8.5-10
        alex: 3.5 + Math.random() * 4.5, // 7.5-9.5
        andrew: 1.0 + Math.random() * 8.0, // 9.0-10
        jack: 0.5 + Math.random() * 9.5, // 6.5-9.0
      };

      const user = users[userIndex];
      const rating = baseRatings[user.username];
      const roundedRating = Math.round(rating * 10) / 10; // Round to 1 decimal

      return {
        content: `${user.username}'s review of ${songs[songIndex].title} from ${songs[songIndex].album.title}`,
        rating: roundedRating,
        songId: songs[songIndex].id,
        userId: user.id,
        groupId: group.id,
      };
    }
  );

  // Create reviews in batches of 50
  const batchSize = 50;
  for (let i = 0; i < reviewData.length; i += batchSize) {
    const batch = reviewData.slice(i, i + batchSize);
    await prisma.review.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(
      `Created batch ${i / batchSize + 1} of ${Math.ceil(reviewData.length / batchSize)}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

```

# seeds-data\albumsWithSongs.js

```js
const albumImages = {
  the_red_hot_chili_peppers: "src/images/st.jpg",
  freaky_styley: "src/images/freaky_styley.jpg",
  uplift: "src/images/uplift_mofo.jpg",
  mothers_milk: "src/images/mothers_milk.jpg",
  blood_sugar_sex_magik: "src/images/blood_sugar.jpg",
  one_hot_minute: "src/images/one_hot_minute.jpg",
  californication: "src/images/californication.jpg",
  by_the_way: "src/images/by_the_way.jpg",
  stadium_arcadium: "src/images/stadium_arcadium.jpg",
  im_with_you: "src/images/im_with_you.jpg",
  the_getaway: "src/images/the_getaway.jpg",
  unlimited_love: "src/images/unlimited_love.jpg",
  return_of_the_dream_canteen: "src/images/return_dream_canteen.jpg",
  im_beside_you: "src/images/bsides.jpg",
  greatest_hits: "src/images/greatest.jpg",
  live_in_hyde_park: "src/images/live_in_hyde_park.jpg",
};

const albums = [
  {
    title: "The Red Hot Chili Peppers",
    release_date: "1984-08-10",
    image_url: albumImages.the_red_hot_chili_peppers,
    songs: [
      {
        title: "True Men Don't Kill Coyotes",
        trackNumber: 1,
        duration: "3:40",
      },
      { title: "Baby Appeal", trackNumber: 2, duration: "3:40" },
      { title: "Buckle Down", trackNumber: 3, duration: "3:24" },
      { title: "Get Up and Jump", trackNumber: 4, duration: "2:53" },
      { title: "Why Don't You Love Me", trackNumber: 5, duration: "3:25" },
      { title: "Green Heaven", trackNumber: 6, duration: "3:59" },
      { title: "Mommy, Where's Daddy?", trackNumber: 7, duration: "3:31" },
      { title: "Out in L.A.", trackNumber: 8, duration: "2:00" },
      { title: "Police Helicopter", trackNumber: 9, duration: "1:16" },
      { title: "You Always Sing the Same", trackNumber: 10, duration: "0:19" },
      { title: "Grand Pappy du Plenty", trackNumber: 11, duration: "4:04" },
    ],
  },
  {
    title: "Freaky Styley",
    release_date: "1985-08-16",
    image_url: albumImages.freaky_styley,
    songs: [
      { title: "Jungle Man", trackNumber: 1, duration: "4:09" },
      { title: "Hollywood (Africa)", trackNumber: 2, duration: "5:03" },
      { title: "American Ghost Dance", trackNumber: 3, duration: "3:44" },
      { title: "If You Want Me to Stay", trackNumber: 4, duration: "4:07" },
      { title: "Nevermind", trackNumber: 5, duration: "2:48" },
      { title: "Freaky Styley", trackNumber: 6, duration: "3:39" },
      { title: "Blackeyed Blonde", trackNumber: 7, duration: "2:39" },
      { title: "The Brothers Cup", trackNumber: 8, duration: "3:27" },
      { title: "Battleship", trackNumber: 9, duration: "1:53" },
      { title: "Lovin' and Touchin'", trackNumber: 10, duration: "0:36" },
      {
        title: "Catholic School Girls Rule",
        trackNumber: 11,
        duration: "1:55",
      },
      { title: "Sex Rap", trackNumber: 12, duration: "1:54" },
      { title: "Thirty Dirty Birds", trackNumber: 13, duration: "0:14" },
      { title: "Yertle the Turtle", trackNumber: 14, duration: "3:38" },
    ],
  },
  {
    title: "Uplift Mofo Party Plan",
    release_date: "1987-09-29",
    image_url: albumImages.uplift,
    songs: [
      { title: "Fight Like a Brave", trackNumber: 1, duration: "3:52" },
      { title: "Funky Crime", trackNumber: 2, duration: "2:59" },
      { title: "Me and My Friends", trackNumber: 3, duration: "3:07" },
      { title: "Backwoods", trackNumber: 4, duration: "3:06" },
      { title: "Skinny Sweaty Man", trackNumber: 5, duration: "1:15" },
      { title: "Behind the Sun", trackNumber: 6, duration: "4:39" },
      {
        title: "Subterranean Homesick Blues",
        trackNumber: 7,
        duration: "2:32",
      },
      {
        title: "Party on Your Pussy (a.k.a Special Secret Song Inside)",
        trackNumber: 8,
        duration: "3:14",
      },
      { title: "No Chump Love Sucker", trackNumber: 9, duration: "2:40" },
      { title: "Walkin' on Down the Road", trackNumber: 10, duration: "3:48" },
      { title: "Love Trilogy", trackNumber: 11, duration: "2:39" },
      {
        title: "Organic Anti-Beat Box Band",
        trackNumber: 12,
        duration: "4:03",
      },
    ],
  },
  {
    title: "Mother's Milk",
    release_date: "1989-08-16",
    image_url: albumImages.mothers_milk,
    songs: [
      { title: "Good Time Boys", trackNumber: 1, duration: "5:02" },
      { title: "Higher Ground", trackNumber: 2, duration: "3:23" },
      { title: "Subway to Venus", trackNumber: 3, duration: "4:25" },
      { title: "Magic Johnson", trackNumber: 4, duration: "2:57" },
      { title: "Nobody Weird Like Me", trackNumber: 5, duration: "3:50" },
      { title: "Knock Me Down", trackNumber: 6, duration: "3:45" },
      { title: "Taste the Pain", trackNumber: 7, duration: "4:32" },
      { title: "Stone Cold Bush", trackNumber: 8, duration: "3:06" },
      { title: "Fire", trackNumber: 9, duration: "2:03" },
      { title: "Pretty Little Ditty", trackNumber: 10, duration: "3:07" },
      { title: "Punk Rock Classic", trackNumber: 11, duration: "1:47" },
      { title: "Sexy Mexican Maid", trackNumber: 12, duration: "3:23" },
      {
        title: "Johnny, Kick a Hole in the Sky",
        trackNumber: 13,
        duration: "5:12",
      },
    ],
  },
  {
    title: "Blood Sugar Sex Magik",
    release_date: "1991-09-24",
    image_url: albumImages.blood_sugar_sex_magik,
    songs: [
      { title: "The Power of Equality", trackNumber: 1, duration: "4:03" },
      { title: "If You Have to Ask", trackNumber: 2, duration: "3:37" },
      { title: "Breaking the Girl", trackNumber: 3, duration: "4:55" },
      { title: "Funky Monks", trackNumber: 4, duration: "5:23" },
      { title: "Suck My Kiss", trackNumber: 5, duration: "3:37" },
      { title: "I Could Have Lied", trackNumber: 6, duration: "4:04" },
      {
        title: "Mellowship Slinky in B Major",
        trackNumber: 7,
        duration: "4:00",
      },
      { title: "The Righteous & the Wicked", trackNumber: 8, duration: "4:08" },
      { title: "Give It Away", trackNumber: 9, duration: "4:43" },
      { title: "Blood Sugar Sex Magik", trackNumber: 10, duration: "4:31" },
      { title: "Under the Bridge", trackNumber: 11, duration: "4:24" },
      { title: "Naked in the Rain", trackNumber: 12, duration: "4:26" },
      { title: "Apache Rose Peacock", trackNumber: 13, duration: "4:42" },
      { title: "The Greeting Song", trackNumber: 14, duration: "3:13" },
      { title: "My Lovely Man", trackNumber: 15, duration: "4:39" },
      { title: "Sir Psycho Sexy", trackNumber: 16, duration: "8:17" },
      { title: "They're Red Hot", trackNumber: 17, duration: "1:12" },
    ],
  },
  {
    title: "One Hot Minute",
    release_date: "1995-09-12",
    image_url: albumImages.one_hot_minute,
    songs: [
      { title: "Warped", trackNumber: 1, duration: "5:04" },
      { title: "Aeroplane", trackNumber: 2, duration: "4:45" },
      { title: "Deep Kick", trackNumber: 3, duration: "6:33" },
      { title: "My Friends", trackNumber: 4, duration: "4:02" },
      { title: "Coffee Shop", trackNumber: 5, duration: "3:08" },
      { title: "Pea", trackNumber: 6, duration: "1:47" },
      { title: "One Big Mob", trackNumber: 7, duration: "6:02" },
      { title: "Walkabout", trackNumber: 8, duration: "5:07" },
      { title: "Tearjerker", trackNumber: 9, duration: "4:20" },
      { title: "One Hot Minute", trackNumber: 10, duration: "6:23" },
      { title: "Falling Into Grace", trackNumber: 11, duration: "3:48" },
      { title: "Shallow Be Thy Game", trackNumber: 12, duration: "4:33" },
      { title: "Transcending", trackNumber: 13, duration: "5:46" },
    ],
  },
  {
    title: "Californication",
    release_date: "1999-06-08",
    image_url: albumImages.californication,
    songs: [
      { title: "Around the World", trackNumber: 1, duration: "3:58" },
      { title: "Parallel Universe", trackNumber: 2, duration: "4:30" },
      { title: "Scar Tissue", trackNumber: 3, duration: "3:37" },
      { title: "Otherside", trackNumber: 4, duration: "4:15" },
      { title: "Get on Top", trackNumber: 5, duration: "3:18" },
      { title: "Californication", trackNumber: 6, duration: "5:21" },
      { title: "Easily", trackNumber: 7, duration: "3:51" },
      { title: "Porcelain", trackNumber: 8, duration: "2:43" },
      { title: "Emit Remmus", trackNumber: 9, duration: "4:00" },
      { title: "I Like Dirt", trackNumber: 10, duration: "2:37" },
      { title: "This Velvet Glove", trackNumber: 11, duration: "3:45" },
      { title: "Savior", trackNumber: 12, duration: "4:52" },
      { title: "Purple Stain", trackNumber: 13, duration: "4:13" },
      { title: "Right on Time", trackNumber: 14, duration: "1:52" },
      { title: "Road Trippin'", trackNumber: 15, duration: "3:25" },
    ],
  },
  {
    title: "By the Way",
    release_date: "2002-07-09",
    image_url: albumImages.by_the_way,
    songs: [
      { title: "By the Way", trackNumber: 1, duration: "3:37" },
      { title: "Universally Speaking", trackNumber: 2, duration: "4:19" },
      { title: "This Is the Place", trackNumber: 3, duration: "4:17" },
      { title: "Dosed", trackNumber: 4, duration: "5:12" },
      { title: "Don't Forget Me", trackNumber: 5, duration: "4:37" },
      { title: "The Zephyr Song", trackNumber: 6, duration: "3:52" },
      { title: "Can't Stop", trackNumber: 7, duration: "4:29" },
      { title: "I Could Die for You", trackNumber: 8, duration: "3:13" },
      { title: "Midnight", trackNumber: 9, duration: "4:55" },
      {
        title: "Throw Away Your Television",
        trackNumber: 10,
        duration: "3:44",
      },
      { title: "Cabron", trackNumber: 11, duration: "3:38" },
      { title: "Tear", trackNumber: 12, duration: "5:17" },
      { title: "On Mercury", trackNumber: 13, duration: "3:28" },
      { title: "Minor Thing", trackNumber: 14, duration: "3:37" },
      { title: "Warm Tape", trackNumber: 15, duration: "4:16" },
      { title: "Venice Queen", trackNumber: 16, duration: "6:07" },
    ],
  },
  {
    title: "Stadium Arcadium",
    release_date: "2006-05-09",
    image_url: albumImages.stadium_arcadium,
    songs: [
      { title: "Dani California", trackNumber: 1, duration: "4:42" },
      { title: "Snow ((Hey Oh))", trackNumber: 2, duration: "5:37" },
      { title: "Charlie", trackNumber: 3, duration: "4:37" },
      { title: "Stadium Arcadium", trackNumber: 4, duration: "5:15" },
      { title: "Hump de Bump", trackNumber: 5, duration: "3:33" },
      { title: "She's Only 18", trackNumber: 6, duration: "3:25" },
      { title: "Slow Cheetah", trackNumber: 7, duration: "5:19" },
      { title: "Torture Me", trackNumber: 8, duration: "3:44" },
      { title: "Strip My Mind", trackNumber: 9, duration: "4:19" },
      { title: "Especially in Michigan", trackNumber: 10, duration: "4:00" },
      { title: "Warlocks", trackNumber: 11, duration: "3:25" },
      { title: "C'mon Girl", trackNumber: 12, duration: "3:48" },
      { title: "Wet Sand", trackNumber: 13, duration: "5:09" },
      { title: "Hey", trackNumber: 14, duration: "5:39" },
      { title: "Desecration Smile", trackNumber: 15, duration: "5:02" },
      { title: "Tell Me Baby", trackNumber: 16, duration: "4:07" },
      { title: "Hard to Concentrate", trackNumber: 17, duration: "4:02" },
      { title: "21st Century", trackNumber: 18, duration: "4:22" },
      { title: "She Looks to Me", trackNumber: 19, duration: "4:06" },
      { title: "Readymade", trackNumber: 20, duration: "4:30" },
      { title: "If", trackNumber: 21, duration: "2:53" },
      { title: "Make You Feel Better", trackNumber: 22, duration: "3:52" },
      { title: "Animal Bar", trackNumber: 23, duration: "5:26" },
      { title: "So Much I", trackNumber: 24, duration: "3:44" },
      { title: "Storm in a Teacup", trackNumber: 25, duration: "3:45" },
      { title: "We Believe", trackNumber: 26, duration: "3:36" },
      { title: "Turn It Again", trackNumber: 27, duration: "6:06" },
      { title: "Death of a Martian", trackNumber: 28, duration: "4:24" },
    ],
  },
  {
    title: "I'm With You",
    release_date: "2011-08-29",
    image_url: albumImages.im_with_you,
    songs: [
      { title: "Monarchy of Roses", trackNumber: 1, duration: "4:12" },
      { title: "Factory of Faith", trackNumber: 2, duration: "4:21" },
      { title: "Brendan's Death Song", trackNumber: 3, duration: "5:39" },
      { title: "Ethiopia", trackNumber: 4, duration: "3:50" },
      { title: "Annie Wants a Baby", trackNumber: 5, duration: "3:40" },
      { title: "Look Around", trackNumber: 6, duration: "3:27" },
      {
        title: "The Adventures of Rain Dance Maggie",
        trackNumber: 7,
        duration: "4:43",
      },
      { title: "Did I Let You Know", trackNumber: 8, duration: "4:21" },
      { title: "Goodbye Hooray", trackNumber: 9, duration: "3:52" },
      { title: "Happiness Loves Company", trackNumber: 10, duration: "3:33" },
      { title: "Police Station", trackNumber: 11, duration: "5:35" },
      { title: "Even You Brutus?", trackNumber: 12, duration: "4:01" },
      { title: "Meet Me at the Corner", trackNumber: 13, duration: "4:22" },
      { title: "Dance, Dance, Dance", trackNumber: 14, duration: "3:45" },
    ],
  },
  {
    title: "The Getaway",
    release_date: "2016-06-17",
    image_url: albumImages.the_getaway,
    songs: [
      { title: "The Getaway", trackNumber: 1, duration: "4:10" },
      { title: "Dark Necessities", trackNumber: 2, duration: "5:02" },
      { title: "We Turn Red", trackNumber: 3, duration: "3:20" },
      { title: "The Longest Wave", trackNumber: 4, duration: "3:32" },
      { title: "Goodbye Angels", trackNumber: 5, duration: "4:29" },
      { title: "Sick Love", trackNumber: 6, duration: "3:41" },
      { title: "Go Robot", trackNumber: 7, duration: "4:24" },
      { title: "Feasting on the Flowers", trackNumber: 8, duration: "3:43" },
      { title: "Detroit", trackNumber: 9, duration: "3:47" },
      { title: "This Ticonderoga", trackNumber: 10, duration: "3:35" },
      { title: "Encore", trackNumber: 11, duration: "4:15" },
      { title: "The Hunter", trackNumber: 12, duration: "4:00" },
      { title: "Dreams of a Samurai", trackNumber: 13, duration: "6:09" },
    ],
  },
  {
    title: "Unlimited Love",
    release_date: "2022-04-01",
    image_url: albumImages.unlimited_love,
    songs: [
      { title: "Black Summer", trackNumber: 1, duration: "3:52" },
      { title: "Here Ever After", trackNumber: 2, duration: "3:50" },
      { title: "Aquatic Mouth Dance", trackNumber: 3, duration: "4:20" },
      { title: "Not the One", trackNumber: 4, duration: "4:26" },
      { title: "Poster Child", trackNumber: 5, duration: "5:16" },
      { title: "The Great Apes", trackNumber: 6, duration: "5:03" },
      { title: "It's Only Natural", trackNumber: 7, duration: "5:34" },
      { title: "She's a Lover", trackNumber: 8, duration: "3:41" },
      { title: "These Are the Ways", trackNumber: 9, duration: "3:56" },
      { title: "Whatchu Thinkin'", trackNumber: 10, duration: "3:40" },
      { title: "Bastards of Light", trackNumber: 11, duration: "3:38" },
      {
        title: "White Braids & Pillow Chair",
        trackNumber: 12,
        duration: "3:40",
      },
      { title: "One Way Traffic", trackNumber: 13, duration: "4:10" },
      { title: "Veronica", trackNumber: 14, duration: "4:28" },
      { title: "Let 'Em Cry", trackNumber: 15, duration: "4:23" },
      { title: "The Heavy Wing", trackNumber: 16, duration: "5:31" },
      { title: "Tangelo", trackNumber: 17, duration: "3:27" },
    ],
  },
  {
    title: "Return of the Dream Canteen",
    release_date: "2022-10-14",
    image_url: albumImages.return_of_the_dream_canteen,
    songs: [
      { title: "Tippa My Tongue", trackNumber: 1, duration: "4:20" },
      { title: "Peace and Love", trackNumber: 2, duration: "4:03" },
      { title: "Reach Out", trackNumber: 3, duration: "4:11" },
      { title: "Eddie", trackNumber: 4, duration: "5:41" },
      { title: "Fake as Fu@k", trackNumber: 5, duration: "4:22" },
      { title: "Bella", trackNumber: 6, duration: "4:51" },
      { title: "Roulette", trackNumber: 7, duration: "4:57" },
      { title: "My Cigarette", trackNumber: 8, duration: "4:24" },
      { title: "Afterlife", trackNumber: 9, duration: "4:13" },
      { title: "Shoot Me a Smile", trackNumber: 10, duration: "3:43" },
      { title: "Handful", trackNumber: 11, duration: "4:01" },
      { title: "The Drummer", trackNumber: 12, duration: "3:24" },
      { title: "Bag of Grins", trackNumber: 13, duration: "5:05" },
      { title: "La La La La La La La La", trackNumber: 14, duration: "3:57" },
      { title: "Copperbelly", trackNumber: 15, duration: "3:44" },
      { title: "Carry Me Home", trackNumber: 16, duration: "4:13" },
      { title: "In the Snow", trackNumber: 17, duration: "5:55" },
    ],
  },
  {
    title: "I'm Beside You",
    release_date: "2013-11-29",
    image_url: albumImages.im_beside_you,
    songs: [
      {
        title: "Strange Man",
        trackNumber: 1,
        duration: "3:36",
        release_date: "2012-08-14",
      },
      {
        title: "Long Progression",
        trackNumber: 2,
        duration: "3:58",
        release_date: "2012-08-14",
      },
      {
        title: "Magpies on Fire",
        trackNumber: 3,
        duration: "3:44",
        release_date: "2012-09-11",
      },
      {
        title: "Victorian Machinery",
        trackNumber: 4,
        duration: "4:06",
        release_date: "2012-09-11",
      },
      {
        title: "Never Is a Long Time",
        trackNumber: 5,
        duration: "2:46",
        release_date: "2012-10-02",
      },
      {
        title: "Love of Your Life",
        trackNumber: 6,
        duration: "4:06",
        release_date: "2012-10-02",
      },
      {
        title: "The Sunset Sleeps",
        trackNumber: 7,
        duration: "3:58",
        release_date: "2012-11-06",
      },
      {
        title: "Hometown Gypsy",
        trackNumber: 8,
        duration: "4:02",
        release_date: "2012-11-06",
      },
      {
        title: "Pink as Floyd",
        trackNumber: 9,
        duration: "4:54",
        release_date: "2013-01-04",
      },
      {
        title: "Your Eyes Girl",
        trackNumber: 10,
        duration: "5:08",
        release_date: "2013-01-04",
      },
      {
        title: "In Love Dying",
        trackNumber: 11,
        duration: "8:04",
        release_date: "2013-02-01",
      },
      {
        title: "Catch My Death",
        trackNumber: 12,
        duration: "4:19",
        release_date: "2013-07-23",
      },
      {
        title: "How It Ends",
        trackNumber: 13,
        duration: "3:43",
        release_date: "2013-07-23",
      },
      {
        title: "Brave From Afar",
        trackNumber: 14,
        duration: "3:44",
        release_date: "2013-07-23",
      },
      {
        title: "This Is the Kitt",
        trackNumber: 15,
        duration: "4:23",
        release_date: "2013-07-23",
      },
      {
        title: "Hanalei",
        trackNumber: 16,
        duration: "4:17",
        release_date: "2013-07-23",
      },
      {
        title: "Open/Close",
        trackNumber: 17,
        duration: "4:30",
        release_date: "2013-07-23",
      },
    ],
  },
  {
    title: "Greatest Hits",
    release_date: "2003-11-18",
    image_url: albumImages.greatest_hits,
    songs: [
      { title: "Under The Bridge", trackNumber: 1, duration: "4:33" },
      { title: "Give It Away", trackNumber: 2, duration: "4:45" },
      { title: "Californication", trackNumber: 3, duration: "5:30" },
      { title: "Scar Tissue", trackNumber: 4, duration: "3:36" },
      { title: "Soul To Squeeze", trackNumber: 5, duration: "4:50" },
      { title: "Otherside", trackNumber: 6, duration: "4:15" },
      { title: "Suck My Kiss", trackNumber: 7, duration: "3:36" },
      { title: "By The Way", trackNumber: 8, duration: "3:36" },
      { title: "Parallel Universe", trackNumber: 9, duration: "4:29" },
      { title: "Breaking The Girl", trackNumber: 10, duration: "4:55" },
      { title: "My Friends", trackNumber: 11, duration: "4:09" },
      { title: "Higher Ground", trackNumber: 12, duration: "3:22" },
      { title: "Universally Speaking", trackNumber: 13, duration: "4:17" },
      { title: "Road Trippin'", trackNumber: 14, duration: "3:25" },
      { title: "Fortune Faded", trackNumber: 15, duration: "3:21" },
      { title: "Save The Population", trackNumber: 16, duration: "4:06" },
    ],
  },
  {
    title: "Live in Hyde Park",
    release_date: "2004-08-03",
    image_url: albumImages.live_in_hyde_park,
    songs: [
      { title: "Intro", trackNumber: 1, duration: "3:57" },
      { title: "Can't Stop", trackNumber: 2, duration: "5:13" },
      { title: "Around the World", trackNumber: 3, duration: "4:12" },
      { title: "Scar Tissue", trackNumber: 4, duration: "4:08" },
      { title: "By the Way", trackNumber: 5, duration: "5:20" },
      { title: "Fortune Faded", trackNumber: 6, duration: "3:28" },
      {
        title: "I Feel Love",
        trackNumber: 7,
        duration: "1:28",
        artist: "Donna Summer",
      },
      { title: "Otherside", trackNumber: 8, duration: "4:34" },
      { title: "Easily", trackNumber: 9, duration: "5:00" },
      { title: "Universally Speaking", trackNumber: 10, duration: "4:16" },
      { title: "Get on Top", trackNumber: 11, duration: "4:06" },
      {
        title: "Brandy",
        trackNumber: 12,
        duration: "3:34",
        artist: "Looking Glass",
      },
      { title: "Don't Forget Me", trackNumber: 13, duration: "5:22" },
      { title: "Rolling Sly Stone", trackNumber: 14, duration: "5:06" },
      {
        title: "Throw Away Your Television",
        trackNumber: 15,
        duration: "7:30",
      },
      { title: "Leverage of Space", trackNumber: 16, duration: "3:29" },
      { title: "Purple Stain", trackNumber: 17, duration: "4:16" },
      { title: "The Zephyr Song", trackNumber: 18, duration: "7:04" },
      { title: "Californication", trackNumber: 19, duration: "5:26" },
      { title: "Right on Time", trackNumber: 20, duration: "3:54" },
      { title: "Parallel Universe", trackNumber: 21, duration: "5:37" },
      { title: "Drum Homage Medley", trackNumber: 22, duration: "1:29" },

      { title: "Under the Bridge", trackNumber: 23, duration: "4:54" },
      {
        title: "Black Cross",
        trackNumber: 24,
        duration: "3:30",
      },
      {
        title: "Flea's Trumpet Treated by John",
        trackNumber: 25,
        duration: "3:28",
      },
      { title: "Give It Away", trackNumber: 26, duration: "13:17" },
    ],
  },
];

export default albums;

```

# src\controllers\album.controller.ts

```ts
import { Request, Response } from "express";
import {
  createAlbumService,
  deleteAlbumService,
  getAlbumSongStatsService,
  getPaginatedAlbumsService,
  updateAlbumService,
} from "../services/album.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
import prisma from "../db/prisma.js";

export const createAlbumController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const album = await createAlbumService(req.body);
      res.status(201).json(album);
    } catch (error) {
      console.error("Album creation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export const getAlbumsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getPaginatedAlbumsService({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 25,
      search: req.query.search?.toString(),
    });
    res.json(result);
  }
);

export const updateAlbumController = asyncHandler(
  async (req: Request, res: Response) => {
    const album = await updateAlbumService(Number(req.params.id), req.body);
    res.json(album);
  }
);

export const deleteAlbumController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteAlbumService(Number(req.params.id));
    res.sendStatus(204);
  }
);

export const getAlbumSongStatsController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const albumId = Number(req.params.albumId);
      const groupId = req.query.groupId ? Number(req.query.groupId) : undefined;
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const selectedUserId = req.query.selectedUserId
        ? Number(req.query.selectedUserId)
        : undefined;

      console.log(
        `Fetching album stats - albumId: ${albumId}, groupId: ${groupId}, userId: ${userId}, authenticated: ${!!req.user}`
      );

      // Public stats don't need authentication
      if (!groupId) {
        console.log("Fetching public album stats");
        const stats = await getAlbumSongStatsService({
          albumId,
          groupId: undefined,
          userId,
          selectedUserId,
        });
        return res.json(stats); // Using return to prevent further execution
      }

      // Group stats require authentication
      if (groupId && !req.user) {
        console.log("Attempted to access group stats without authentication");
        return res
          .status(401)
          .json({ error: "Authentication required for group stats" });
      }

      // Authorization check for private groups
      if (groupId) {
        console.log(`Checking group access for groupId: ${groupId}`);
        const group = await prisma.group.findUnique({
          where: { id: groupId },
          select: { isPrivate: true },
        });

        if (!group) {
          console.log("Group not found");
          return res.status(404).json({ error: "Group not found" });
        }

        if (group.isPrivate) {
          console.log("Checking membership for private group");
          // Must be authenticated for private groups
          if (!req.user) {
            console.log("No user authenticated for private group access");
            return res
              .status(401)
              .json({ error: "Authentication required for private group" });
          }

          // Must be a member of private groups
          const membership = await prisma.userGroup.findUnique({
            where: {
              userId_groupId: {
                userId: req.user.id,
                groupId,
              },
            },
          });

          if (!membership) {
            console.log(
              `User ${req.user.id} is not a member of private group ${groupId}`
            );
            return res.status(403).json({ error: "Not a group member" });
          }

          console.log(
            `User ${req.user.id} has access to private group ${groupId}`
          );
        } else {
          console.log("Group is public, proceeding with request");
        }
      }
      console.log(
        `selectedUserId from query: ${selectedUserId}, type: ${typeof selectedUserId}`
      );

      // If we got here, the user has the necessary permissions
      console.log("Fetching album stats with permissions validated");
      const stats = await getAlbumSongStatsService({
        albumId,
        groupId,
        selectedUserId,
        userId: req.query.userFilter === "true" ? req.user?.id : userId,
      });

      return res.json(stats); // Using return to prevent further execution
    } catch (error) {
      console.error("Error in getAlbumSongStatsController:", error);

      // Check if headers have already been sent
      if (!res.headersSent) {
        return res
          .status(500)
          .json({ error: "Server error fetching album stats" });
      } else {
        console.error("Headers already sent, cannot send error response");
      }
    }
  }
);

```

# src\controllers\group.controller.ts

```ts
import { Request, Response } from "express";
import {
  createGroupService,
  deleteGroupService,
  updateGroupService,
  sendGroupInviteService,
  joinGroupService,
  getUserGroupsService,
  joinPublicGroupService,
  getGroupByIdService,
  getPublicGroupsService,
} from "../services/group.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";

export const createGroupController = asyncHandler(
  async (req: Request, res: Response) => {
    const group = await createGroupService({
      ...req.body,
      userId: req.user!.id,
    });
    res.status(201).json(group);
  }
);

export const deleteGroupController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteGroupService(Number(req.params.groupId), req.user!.id);
    res.sendStatus(204);
  }
);

export const updateGroupController = asyncHandler(
  async (req: Request, res: Response) => {
    const group = await updateGroupService(
      Number(req.params.groupId),
      req.body,
      req.user!.id
    );
    res.json(group);
  }
);

export const sendInviteController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await sendGroupInviteService(
      Number(req.params.groupId),
      req.body.email,
      req.user!.id
    );
    res.json(result);
  }
);

export const joinGroupController = asyncHandler(
  async (req: Request, res: Response) => {
    const membership = await joinGroupService(req.body.code, req.user!.id);
    res.json(membership);
  }
);

export const getUserGroupsController = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Request headers:", req.headers);
    console.log("User object from token:", req.user);
    const groups = await getUserGroupsService(req.user!.id);
    res.json(groups);
  }
);

export const getGroupByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;

    const group = await getGroupByIdService(groupId, userId);
    res.json(group);
  }
);

export const getPublicGroupsController = asyncHandler(
  async (req: Request, res: Response) => {
    const publicGroups = await getPublicGroupsService();
    res.json({ groups: publicGroups });
  }
);

export const joinPublicGroupController = asyncHandler(
  async (req: Request, res: Response) => {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;

    const membership = await joinPublicGroupService(groupId, userId);
    res.json(membership);
  }
);

```

# src\controllers\review.controller.ts

```ts
import { NextFunction, Request, Response } from "express";
import {
  createReviewService,
  deleteReviewService,
  getReviewsService,
  getSongReviewsService,
  getUserReviewForSongService,
  getUserSongReviewsService,
  updateReviewService,
} from "../services/review.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";

export const createReviewController = asyncHandler(
  async (req: Request, res: Response) => {
    const review = await createReviewService({
      ...req.body,
      userId: req.user!.id,
    });
    res.status(201).json(review);
  }
);

export const getReviewsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getReviewsService({
      ...req.query,
      userId: req.user?.id,
    });
    res.json(result);
  }
);

export const updateReviewController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const review = await updateReviewService(parseInt(id), req.user!.id, {
      ...req.body,
    });
    res.json(review);
  }
);

export const deleteReviewController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteReviewService(parseInt(id), req.user!.id);
    res.status(204).end();
  }
);

export const getSongReviewsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log(
    "GET /api/reviews/song/:songId hit",
    req.params.songId,
    req.query
  );

  try {
    const songId = Number(req.params.songId);
    if (!songId) {
      res.status(400).json({ error: "songId required" });
      return;
    }

    const result = await getSongReviewsService(songId, req.user?.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
export const getUserSongReviewsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, songIds } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!songIds) {
      return res.status(400).json({ error: "Song IDs are required" });
    }

    // Parse the comma-separated list of song IDs
    const parsedSongIds = (songIds as string)
      .split(",")
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));

    const result = await getUserSongReviewsService(
      parseInt(userId as string),
      parsedSongIds
    );

    res.json(result);
  }
);

export const getUserReviewForSongController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, songId } = req.params;

    if (!userId || !songId) {
      return res
        .status(400)
        .json({ error: "User ID and Song ID are required" });
    }

    const result = await getUserReviewForSongService(
      parseInt(userId),
      parseInt(songId)
    );

    res.json(result);
  }
);

```

# src\controllers\song.controller.ts

```ts
import { Request, Response } from "express";
import {
  getSongsService,
  getSongService,
  createSongService,
  updateSongService,
  deleteSongService,
} from "../services/song.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";

export const getSongsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getSongsService({
      albumId: req.query.albumId?.toString(),
      search: req.query.search?.toString(),
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    res.json(result);
  },
);

export const getSongController = asyncHandler(
  async (req: Request, res: Response) => {
    const song = await getSongService(Number(req.params.songId));
    res.json(song);
  },
);

export const createSongController = asyncHandler(
  async (req: Request, res: Response) => {
    const song = await createSongService(req.body);
    res.status(201).json(song);
  },
);

export const updateSongController = asyncHandler(
  async (req: Request, res: Response) => {
    const song = await updateSongService(Number(req.params.songId), req.body);
    res.json(song);
  },
);

export const deleteSongController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteSongService(Number(req.params.songId));
    res.sendStatus(204);
  },
);

```

# src\controllers\user.controller.ts

```ts
import { Request, Response } from "express";
import {
  registerUserService,
  loginUserService,
  getCurrentUserService,
  deleteUserService,
  refreshTokenService,
  updateUserService,
  forgotPasswordService,
  resetPasswordService,
} from "../services/user.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
import { UpdateUserInput } from "../validators/user.validator.js";
import {
  AuthenticationError,
  ValidationError,
} from "../errors/customErrors.js";

export const registerUserController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Call the service to register the user
      const user = await registerUserService(req.body);

      // Generate tokens for the newly registered user
      const { token, refreshToken } = await loginUserService(
        req.body.email,
        req.body.password
      );

      // Return user info and tokens
      res.status(201).json({
        user,
        token,
        refreshToken,
      });
    } catch (error) {
      console.error("Validation Error:", error);
      const typedError = error as any;
      res.status(422).json({ error: typedError.errors ?? "Invalid request" });
    }
  }
);

export const loginUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, refreshToken, user } = await loginUserService(
      req.body.email,
      req.body.password
    );

    // Return tokens and user data for frontend storage
    res.json({
      token,
      refreshToken,
      user,
    });
  }
);

export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await getCurrentUserService(req.user!.id);
    res.json(user);
  }
);

export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError("Refresh token required", {
        refreshToken: "Missing refresh token",
      });
    }

    try {
      // Get new tokens from the service
      const tokens = await refreshTokenService(refreshToken);

      // Map the service response to what the frontend expects
      res.json({
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

export const updateUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const updateData: UpdateUserInput = req.body;

    const user = await updateUserService(req.user!.id, updateData);

    res.json(user);
  }
);

export const deleteUserController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteUserService(req.user!.id);
    res.sendStatus(204);
  }
);

export const forgotPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await forgotPasswordService(req.body.email);
      res.status(200).json({ message: "Email sent" });
    } catch (e) {
      console.error(e);
    }
  }
);

export const resetPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      await resetPasswordService(token, newPassword);
      res.status(200).json({ message: "Password reset" });
    } catch (e) {
      console.error(e);
    }
  }
);

```

# src\db\prisma.ts

```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default prisma;

```

# src\errors\customErrors.ts

```ts
export class AuthenticationError extends Error {
  statusCode = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message = "Not Found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends Error {
  statusCode = 400;
  constructor(message = "Bad Request") {
    super(message);
    this.name = "BadRequestError";
  }
}

export class ValidationError extends Error {
  statusCode = 422;
  details: any;
  constructor(message = "Validation Error", details: any) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

```

# src\images\blood_sugar.jpg

This is a binary file of the type: Image

# src\images\bsides.jpg

This is a binary file of the type: Image

# src\images\by_the_way.jpg

This is a binary file of the type: Image

# src\images\californication.jpg

This is a binary file of the type: Image

# src\images\freaky_styley.jpg

This is a binary file of the type: Image

# src\images\greatest.jpg

This is a binary file of the type: Image

# src\images\im_with_you.jpg

This is a binary file of the type: Image

# src\images\live_in_hyde_park.jpg

This is a binary file of the type: Image

# src\images\mothers_milk.jpg

This is a binary file of the type: Image

# src\images\one_hot_minute.jpg

This is a binary file of the type: Image

# src\images\return_dream_canteen.jpg

This is a binary file of the type: Image

# src\images\st.jpg

This is a binary file of the type: Image

# src\images\stadium_arcadium.jpg

This is a binary file of the type: Image

# src\images\the_getaway.jpg

This is a binary file of the type: Image

# src\images\unlimited_love.jpg

This is a binary file of the type: Image

# src\images\uplift_mofo.jpg

This is a binary file of the type: Image

# src\middleware\asyncRouteHandler.ts

```ts
import { Request, Response, NextFunction } from "express";

// Async route handler wrapper function
const asyncRouteHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncRouteHandler;

```

# src\middleware\auth.ts

```ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
import { AuthenticationError } from "../errors/customErrors.js";
import nodemailer from "nodemailer";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email?: string;
        username?: string;
        image?: string | null;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) return next(new AuthenticationError("Authentication required"));

  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next(new AuthenticationError("Authentication required"));
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    console.log(
      "Auth middleware processing token:",
      token.substring(0, 15) + "..."
    );

    // Verify token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not defined");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as jwt.JwtPayload & { id: number };

    // Log the decoded user ID
    console.log("Decoded user ID:", decoded.id);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        image: true,
      },
    });

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError("Token expired"));
    }

    next(new AuthenticationError("Invalid authentication token"));
  }
};
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next();
  }

  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next(new AuthenticationError("Authentication required"));
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    console.log(
      "Auth middleware processing token:",
      token.substring(0, 15) + "..."
    );

    // Verify token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not defined");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as jwt.JwtPayload & { id: number };

    // Log the decoded user ID
    console.log("Decoded user ID:", decoded.id);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        image: true,
      },
    });

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError("Token expired"));
    }

    next(new AuthenticationError("Invalid authentication token"));
  }
};

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  await transporter.sendMail({
    from: `"Red Hot Takes" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

```

# src\middleware\errorHandler.ts

```ts
import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Request, Response, NextFunction } from "express";
import {
  AuthenticationError,
  ValidationError,
} from "../errors/customErrors.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  if (err instanceof AuthenticationError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Check if response is still writable
  if (res.headersSent || typeof res.status !== "function") {
    return next(err);
  }

  // Handle static file errors first
  if (req.path.startsWith("/images")) {
    return res.status(404).send("Image not found");
  }

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    return res?.status(400).json({
      error: "Validation Error",
      details: err.errors,
    });
  }
  console.error(err);
  // Handle Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    return res?.status(400).json({
      error: "Database Error",
      code: err.code,
    });
  }

  // Handle other errors
  res?.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
};

```

# src\middleware\groupAdminGuard.ts

```ts
import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma.js";
import { ForbiddenError } from "../errors/customErrors.js";

export const groupAdminGuard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const groupId = Number(req.params.groupId);

  const membership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId: req.user!.id,
        groupId,
      },
    },
  });

  if (!membership || membership.role !== "admin") {
    throw new ForbiddenError("Admin privileges required");
  }

  next();
};

```

# src\middleware\validate.ts

```ts
import { Request, Response, NextFunction } from "express";
import { AnyZodObject, z } from "zod";
import { ValidationError } from "../errors/customErrors.js";

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(
          new ValidationError(
            "Validation failed",
            error.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
            }))
          )
        );
      } else {
        next(error);
      }
    }
  };

```

# src\routes\albums.ts

```ts
import express from "express";
import {
  createAlbumController,
  deleteAlbumController,
  getAlbumSongStatsController,
  getAlbumsController,
  updateAlbumController,
} from "../controllers/album.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createAlbumSchema,
  updateAlbumSchema,
} from "../validators/album.validator.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  validate(createAlbumSchema),
  createAlbumController
);

router.get(
  "/:albumId/songs/stats",
  optionalAuthenticate,
  getAlbumSongStatsController
);

router.get("/", getAlbumsController);

router.put(
  "/:id",
  authenticate,
  validate(updateAlbumSchema),
  updateAlbumController
);

router.delete("/:id", authenticate, deleteAlbumController);

export default router;

```

# src\routes\groups.ts

```ts
import express from "express";
import {
  createGroupController,
  deleteGroupController,
  updateGroupController,
  sendInviteController,
  joinGroupController,
  getUserGroupsController,
  getPublicGroupsController,
  getGroupByIdController,
  joinPublicGroupController,
} from "../controllers/group.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { groupSchema } from "../validators/group.validator.js";
import { groupAdminGuard } from "../middleware/groupAdminGuard.js";
import asyncRouteHandler from "../middleware/asyncRouteHandler.js";
import prisma from "@/db/prisma.js";
import {
  NotFoundError,
  AuthenticationError,
  ValidationError,
} from "@/errors/customErrors.js";

const router = express.Router();

// Get user's groups
router.get("/", authenticate, getUserGroupsController);

// Get public groups
router.get("/public", getPublicGroupsController);

// Get specific group details
router.get("/:groupId", authenticate, getGroupByIdController);

// Create a new group
router.post("/", authenticate, validate(groupSchema), createGroupController);

// Update group details (admin only)
router.patch(
  "/:groupId",
  authenticate,
  validate(groupSchema),
  groupAdminGuard,
  updateGroupController
);

// Delete a group (admin only)
router.delete(
  "/:groupId",
  authenticate,
  groupAdminGuard,
  deleteGroupController
);

// Send invitation to join private group (admin only)
router.post(
  "/:groupId/invite",
  authenticate,
  groupAdminGuard,
  sendInviteController
);

// Join a group using invite code
router.post("/join", authenticate, joinGroupController);

// Join a public group
router.post("/:groupId/join", authenticate, joinPublicGroupController);

// Get members of a group
router.get(
  "/:groupId/members",
  authenticate,
  asyncRouteHandler(async (req, res) => {
    const groupId = parseInt(req.params.groupId);

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, isPrivate: true },
    });

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    // Check if the user is a member of this group if it's private
    if (group.isPrivate) {
      const userMembership = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: req.user?.id!,
            groupId: groupId,
          },
        },
      });

      if (!userMembership) {
        throw new AuthenticationError("You don't have access to this group");
      }
    }

    // Get all members of the group
    const groupMembers = await prisma.userGroup.findMany({
      where: { groupId: groupId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    // Format the response
    const members = groupMembers.map((member) => ({
      id: member.user.id,
      username: member.user.username,
      email: member.user.email,
      image: member.user.image,
      role: member.role,
      joinedAt: member.joinedAt,
    }));

    res.json({ members });
  })
);

// Leave a group
router.delete(
  "/:groupId/members",
  authenticate,
  asyncRouteHandler(async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user?.id!;

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    // Check if user is a member of the group
    const membership = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundError("You are not a member of this group");
    }

    // Count admins in the group
    const adminCount = await prisma.userGroup.count({
      where: {
        groupId,
        role: "admin",
      },
    });

    // Prevent the last admin from leaving
    if (adminCount === 1 && membership.role === "admin") {
      throw new ValidationError(
        "Cannot leave group as you are the last admin. Transfer admin rights or delete the group instead.",
        { adminCount, groupId }
      );
    }

    // Remove user from group
    await prisma.userGroup.delete({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    res.status(200).json({ message: "Successfully left group" });
  })
);

export default router;

```

# src\routes\reviews.ts

```ts
import express from "express";
import {
  createReviewController,
  deleteReviewController,
  getReviewsController,
  getSongReviewsController,
  getUserReviewForSongController,
  getUserSongReviewsController,
  updateReviewController,
} from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Create a new review (requires authentication)
router.post("/", authenticate, createReviewController);

// Get all reviews (with filtering)
router.get("/", getReviewsController);

// Get reviews for a specific song
router.get("/song/:songId", getSongReviewsController);

// Get reviews for specific songs by a user
router.get("/user/songs", getUserSongReviewsController);

// Get a specific user's review for a song
router.get("/user/:userId/song/:songId", getUserReviewForSongController);

// Update a review (requires authentication)
router.put("/:id", authenticate, updateReviewController);

// Delete a review (requires authentication)
router.delete("/:id", authenticate, deleteReviewController);

export default router;

```

# src\routes\songs.ts

```ts
import express from "express";
import {
  getSongsController,
  getSongController,
  createSongController,
  updateSongController,
  deleteSongController,
} from "../controllers/song.controller.js";
import { validate } from "../middleware/validate.js";
import { songSchema } from "../validators/song.validator.js";
import { authenticate } from "../middleware/auth.js";
import prisma from "@/db/prisma.js";
import { NotFoundError } from "@/errors/customErrors.js";
import { getUserGroupsService } from "@/services/group.service.js";
import asyncRouteHandler from "@/middleware/asyncRouteHandler.js";

const router = express.Router();

router.get("/", getSongsController);
router.get("/:songId", getSongController);
router.post("/", authenticate, validate(songSchema), createSongController);
router.patch(
  "/:songId",
  authenticate,
  validate(songSchema),
  updateSongController
);
router.delete("/:songId", authenticate, deleteSongController);
router.get(
  "/:userId/groups",
  authenticate,
  asyncRouteHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get the user's groups
    const groups = await getUserGroupsService(userId);

    res.json({ groups });
  })
);

export default router;

```

# src\routes\userRoutes.ts

```ts
import express from "express";
import { authenticate } from "../middleware/auth.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
import prisma from "../db/prisma.js";
import { NotFoundError } from "../errors/customErrors.js";

const router = express.Router();

// Get groups for a specific user
router.get(
  "/:userId/groups",
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get the user's groups
    const userGroups = await prisma.userGroup.findMany({
      where: { userId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            isPrivate: true,
            createdAt: true,
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    // Format the response
    const groups = userGroups.map((ug) => ({
      id: ug.group.id,
      name: ug.group.name,
      description: ug.group.description,
      image: ug.group.image,
      isPrivate: ug.group.isPrivate,
      memberCount: ug.group._count.members,
      role: ug.role,
      joinedAt: ug.joinedAt,
      createdAt: ug.group.createdAt,
    }));

    res.json({ groups });
  })
);

export default router;

```

# src\routes\users.ts

```ts
import express from "express";
import {
  registerUserController,
  loginUserController,
  getCurrentUserController,
  updateUserController,
  deleteUserController,
  refreshTokenController,
  forgotPasswordController,
  resetPasswordController,
} from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";
import {
  registrationSchema,
  loginSchema,
  updateUserSchema,
  refreshTokenSchema,
} from "../validators/user.validator.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", validate(registrationSchema), registerUserController);
router.post("/login", validate(loginSchema), loginUserController);
router.post("/refresh", validate(refreshTokenSchema), refreshTokenController);
router.get("/me", authenticate, getCurrentUserController);
router.patch(
  "/me",
  authenticate,
  validate(updateUserSchema._def.schema),
  updateUserController
);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

router.delete("/me", authenticate, deleteUserController);

export default router;

```

# src\server.ts

```ts
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
import userRoutes from "./routes/userRoutes.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { authenticate, optionalAuthenticate } from "./middleware/auth.js";
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
  const devApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 9999,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", devApiLimiter);

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(directory, "uploads");
  const fs = require("fs");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Static file serving for src/images
  app.use(
    "/src/images",
    express.static(path.join(__dirname, "images")),
    (err: any, req: Request, res: Response, next: NextFunction) => {
      if (err) {
        console.error("Image serving error:", err);
        res.status(404).send("Image not found");
      } else {
        next();
      }
    }
  );

  // Configure multer to store files in the uploads directory
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(directory, "uploads"));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
  });

  const upload = multer({ storage });

  // File upload endpoint
  app.post(
    "/api/upload",
    authenticate,
    upload.single("image"),
    asyncRouteHandler(async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      // Return URL that matches the static serving path
      res.json({ url: `/images/${req.file.filename}` });
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
  // Debug endpoint to list available images
  app.get("/api/debug/images", (req, res) => {
    const fs = require("fs");
    const uploadsDir = path.join(directory, "uploads");

    try {
      if (!fs.existsSync(uploadsDir)) {
        return res.json({
          error: "Uploads directory doesn't exist",
          path: uploadsDir,
        });
      }

      const files = fs.readdirSync(uploadsDir);
      const imageDetails = files.map((file) => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          url: `/images/${file}`,
        };
      });

      res.json({
        uploadsDir,
        imageCount: files.length,
        images: imageDetails,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Error listing images", message: error.message });
    }
  });

  // Routes
  app.use("/api/albums", albumsRouter);
  app.use("/api/songs", songsRouter);
  app.use("/api/auth", usersRouter);
  app.use("/api/groups", authenticate, groupsRouter);
  app.use("/api/reviews", optionalAuthenticate, reviewRoutes);
  app.use("/api/users", userRoutes);
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

```

# src\server.ts.d.ts

```ts
export * from "./server.js";

```

# src\services\album.service.ts

```ts
import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";

interface SongStatsParams {
  albumId: number;
  groupId?: number;
  userId?: number;
  selectedUserId?: number; // user being compared
}

export const createAlbumService = async (data: Prisma.AlbumCreateInput) => {
  return prisma.album.create({
    data: {
      ...data,
      releaseDate: new Date(data.releaseDate),
    },
  });
};

/**Returns averages for public, group, and user if ids are provided.  */
export const getAlbumSongStatsService = async ({
  albumId,
  groupId,
  userId,
  selectedUserId,
}: SongStatsParams) => {
  // Get all songs in the album
  const songs = await prisma.song.findMany({
    where: { albumId },
    select: { id: true, title: true, trackNumber: true, duration: true },
  });

  // Public stats (all reviews for songs in album)
  const publicStats = await prisma.review.groupBy({
    by: ["songId"],
    where: { song: { albumId } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  // Group-specific stats if groupId is provided
  let groupStats: any[] = [];
  if (groupId) {
    const groupMembers = await prisma.review.findMany({
      where: { groupId },
      select: { userId: true },
    } as any);

    const userIds = groupMembers.map((m) => m.userId);
    groupStats = (await prisma.review.groupBy({
      by: ["songId"],
      where: {
        song: { albumId },
        userId: { in: userIds },
      },
      _avg: { rating: true },
      _count: { rating: true },
    })) as any;
  }

  // Get user reviews if applicable
  let userReviews: any[] = [];
  if (userId) {
    userReviews = await prisma.review.findMany({
      where: { userId, song: { albumId } },
      select: { songId: true, rating: true, id: true },
      orderBy: { createdAt: "desc" },
      distinct: ["userId", "songId", "groupId"],
    });
  }

  // Get selected user reviews if applicable
  let selectedUserReviews: any[] = [];
  if (selectedUserId) {
    selectedUserReviews = await prisma.review.findMany({
      where: { userId: selectedUserId, song: { albumId } },
      select: { songId: true, rating: true, id: true },
      orderBy: { createdAt: "desc" },
    });
    console.log("selectedUserReviews:", selectedUserReviews);
  }

  // Merge data
  return songs.map((song) => {
    const all = publicStats.find((s) => s.songId === song.id);
    const group = groupStats.find((s) => s.songId === song.id);
    const userReview = userReviews.find((r) => r.songId === song.id);
    const selectedUserReview = selectedUserReviews.find(
      (r) => r.songId === song.id
    );

    return {
      id: song.id,
      title: song.title,
      trackNumber: song.trackNumber,
      duration: song.duration,
      publicAverage: all?._avg.rating || 0,
      publicReviewCount: all?._count.rating || 0,
      groupAverage: group?._avg.rating ?? null,
      groupReviewCount: group?._count.rating ?? null,
      currentUserRating: userReview?.rating ?? null,
      currentUserReviewId: userReview?.id ?? null,
      selectedUserRating: selectedUserReview?.rating ?? null,
    };
  });
};

export const getPaginatedAlbumsService = async (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  const where: Prisma.AlbumWhereInput = params.search
    ? { OR: [{ title: { contains: params.search, mode: "insensitive" } }] }
    : {};

  const [total, albums] = await prisma.$transaction([
    prisma.album.count({ where }),
    prisma.album.findMany({
      where,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { releaseDate: "desc" },
      include: {
        songs: {
          include: {
            reviews: true,
          },
        },
      },
    }),
  ]);

  return {
    data: albums,
    meta: {
      total,
      page: params.page,
      totalPages: Math.ceil(total / params.limit),
    },
  };
};

export const updateAlbumService = async (
  id: number,
  data: Prisma.AlbumUpdateInput
) => {
  if (data.releaseDate && typeof data.releaseDate === "string") {
    data.releaseDate = new Date(data.releaseDate);
  }

  return prisma.album.update({
    where: { id },
    data,
  });
};

export const deleteAlbumService = async (id: number) => {
  return prisma.album.delete({
    where: { id },
  });
};

```

# src\services\email.service.ts

```ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendInvitationEmail = async (
  email: string,
  groupName: string,
  inviteCode: string,
) => {
  const inviteLink = `${process.env.FRONTEND_URL}/join?code=${inviteCode}`;

  await transporter.sendMail({
    from: `"Red Hot Takes" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Join ${groupName}`,
    html: `
      <p>You've been invited to join the group <strong>${groupName}</strong>!</p>
      <p>Click below to join:</p>
      <a href="${inviteLink}" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #2563eb;
        color: white;
        text-decoration: none;
        border-radius: 5px;
      ">
        Join Group
      </a>
      <p>Or use this code: ${inviteCode}</p>
    `,
  });
};

```

# src\services\group.service.ts

```ts
import prisma from "../db/prisma.js";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../errors/customErrors.js";
import crypto from "crypto";
import { sendInvitationEmail } from "./email.service.js";

interface CreateGroupInput {
  name: string;
  description?: string;
  isPrivate: boolean;
  userId: number;
}

interface UpdateGroupInput {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

export const createGroupService = async (data: CreateGroupInput) => {
  if (!data.name || data.name.trim().length < 2) {
    throw new BadRequestError("Group name must be at least 2 characters");
  }

  return prisma.group.create({
    data: {
      name: data.name,
      description: data.description,
      isPrivate: data.isPrivate,
      inviteCode: data.isPrivate ? crypto.randomBytes(6).toString("hex") : null,
      members: {
        create: {
          userId: data.userId,
          role: "admin",
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { username: true, image: true },
          },
        },
      },
    },
  });
};

export const getGroupByIdService = async (groupId: number, userId: number) => {
  // Find the group
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      isPrivate: true,
      inviteCode: true,
      createdAt: true,
      members: {
        select: {
          userId: true,
          role: true,
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // For private groups, check if user is a member
  if (group.isPrivate) {
    const isMember = group.members.some((member) => member.userId === userId);

    if (!isMember) {
      throw new ForbiddenError("You don't have access to this group");
    }
  }

  // Get user's role in the group
  const userMembership = group.members.find(
    (member) => member.userId === userId
  );

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    image: group.image,
    isPrivate: group.isPrivate,
    inviteCode: group.inviteCode,
    createdAt: group.createdAt,
    memberCount: group._count.members,
    role: userMembership?.role || null,
  };
};

export const getPublicGroupsService = async () => {
  const publicGroups = await prisma.group.findMany({
    where: { isPrivate: false },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      isPrivate: true,
      createdAt: true,
      _count: {
        select: { members: true },
      },
    },
  });

  return publicGroups.map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    image: group.image,
    isPrivate: group.isPrivate,
    createdAt: group.createdAt,
    memberCount: group._count.members,
  }));
};

export const deleteGroupService = async (groupId: number, userId: number) => {
  const membership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!membership || membership.role !== "admin") {
    throw new ForbiddenError("Admin privileges required");
  }

  return prisma.group.delete({
    where: { id: groupId },
  });
};

export const updateGroupService = async (
  groupId: number,
  data: UpdateGroupInput,
  userId: number
) => {
  const membership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!membership || membership.role !== "admin") {
    throw new ForbiddenError("Admin privileges required");
  }

  return prisma.group.update({
    where: { id: groupId },
    data,
    include: {
      members: true,
    },
  });
};

export const sendGroupInviteService = async (
  groupId: number,
  email: string,
  userId: number
) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  if (!group) throw new NotFoundError("Group not found");
  if (!group.members[0] || group.members[0].role !== "admin") {
    throw new ForbiddenError("Admin privileges required");
  }
  if (!group.isPrivate) {
    throw new BadRequestError("Public groups don't require invitations");
  }

  await sendInvitationEmail(email, group.name, group.inviteCode!);
  return { message: "Invitation sent" };
};

export const joinGroupService = async (inviteCode: string, userId: number) => {
  const group = await prisma.group.findFirst({
    where: { inviteCode },
  });

  if (!group) throw new NotFoundError("Invalid invitation code");

  const existingMembership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId: group.id,
      },
    },
  });

  if (existingMembership) {
    throw new BadRequestError("Already a group member");
  }

  return prisma.userGroup.create({
    data: {
      userId,
      groupId: group.id,
      role: "member",
    },
    include: {
      group: true,
    },
  });
};

export const joinPublicGroupService = async (
  groupId: number,
  userId: number
) => {
  // Verify the group exists and is public
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) throw new NotFoundError("Group not found");

  if (group.isPrivate) {
    throw new ForbiddenError("Cannot directly join a private group");
  }

  // Check if already a member
  const existingMembership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (existingMembership) {
    throw new BadRequestError("Already a group member");
  }

  // Create membership
  return prisma.userGroup.create({
    data: {
      userId,
      groupId,
      role: "member",
    },
    include: {
      group: true,
    },
  });
};

export const getUserGroupsService = async (userId: number) => {
  const userGroups = await prisma.userGroup.findMany({
    where: { userId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          isPrivate: true,
          inviteCode: true,
          createdAt: true,
          _count: {
            select: { members: true },
          },
        },
      },
    },
  });

  return userGroups.map((membership) => ({
    id: membership.group.id,
    name: membership.group.name,
    description: membership.group.description,
    image: membership.group.image,
    isPrivate: membership.group.isPrivate,
    inviteCode: membership.group.inviteCode,
    memberCount: membership.group._count.members,
    role: membership.role,
    joinedAt: membership.joinedAt,
    createdAt: membership.group.createdAt,
  }));
};

export const getPaginatedGroupsService = async (
  userId: number,
  page: number,
  limit: number
) => {
  const [total, groups] = await prisma.$transaction([
    prisma.userGroup.count({ where: { userId } }),
    prisma.userGroup.findMany({
      where: { userId },
      include: { group: true },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data: groups, total, page, totalPages: Math.ceil(total / limit) };
};

```

# src\services\review.service.ts

```ts
import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../errors/customErrors.js";

// Type for review filters
interface ReviewFilters {
  groups?: string;
  minRating?: string;
  maxRating?: string;
  startDate?: string;
  endDate?: string;
  limit?: string;
  page?: string;
  userId?: number;
}

// Type for parsed filter values
interface ParsedFilters {
  groupIds?: number[];
  groupMemberIds?: number[];
  minRating?: number;
  maxRating?: number;
  startDate?: Date;
  endDate?: Date;
  limit: number;
  page: number;
  userId?: number;
}

export const createReviewService = async (data: {
  content?: string;
  rating: number;
  songId: number;
  userId: number;
}) => {
  // Validation
  if (data.rating < 0 || data.rating > 10) {
    throw new ValidationError("Rating must be between 0 and 10", {
      rating: "Invalid rating value",
    });
  }

  // Verify song exists
  const song = await prisma.song.findUnique({
    where: { id: data.songId },
  });
  if (!song) throw new NotFoundError("Song not found");

  // Create review
  return prisma.review.create({
    data: {
      content: data.content,
      rating: data.rating,
      songId: data.songId,
      userId: data.userId,
    },
  });
};

export const getReviewsService = async (filters: ReviewFilters) => {
  const parsed = await parseFilters(filters);

  const where: Prisma.ReviewWhereInput = buildWhereClause(parsed);

  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      include: {
        author: { select: { username: true, image: true } },
        song: true,
      },
      take: parsed.limit,
      skip: (parsed.page - 1) * parsed.limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    data: reviews,
    meta: {
      total,
      page: parsed.page,
      totalPages: Math.ceil(total / parsed.limit),
    },
  };
};

export const updateReviewService = async (
  reviewId: number,
  userId: number,
  data: {
    content?: string;
    rating: number;
  }
) => {
  // Validate rating
  if (data.rating < 0 || data.rating > 10) {
    throw new ValidationError("Rating must be between 0 and 10", {
      rating: "Invalid rating value",
    });
  }

  // Find the review
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  // Check if the user owns the review
  if (review.userId !== userId) {
    throw new ForbiddenError("Not authorized to update this review");
  }

  // Update the review
  return prisma.review.update({
    where: { id: reviewId },
    data: {
      content: data.content,
      rating: data.rating,
    },
  });
};

export const deleteReviewService = async (reviewId: number, userId: number) => {
  // Find the review
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  // Check if the user owns the review
  if (review.userId !== userId) {
    throw new ForbiddenError("Not authorized to delete this review");
  }

  // Delete the review
  return prisma.review.delete({
    where: { id: reviewId },
  });
};

export const getSongReviewsService = async (
  songId: number,
  userId?: number
) => {
  const where: Prisma.ReviewWhereInput = {
    songId,
  };

  const reviews = await prisma.review.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    reviews,
    total: reviews.length,
  };
};

// Helper function to parse filter parameters
const parseFilters = async (filters: ReviewFilters): Promise<ParsedFilters> => {
  const groupIds = filters.groups?.split(",").map(Number).filter(Boolean);

  // Get userIds for those groups
  let groupMemberIds: number[] = [];
  if (groupIds && groupIds.length > 0) {
    const memberships = await prisma.userGroup.findMany({
      where: { groupId: { in: groupIds } },
      select: { userId: true },
    });
    groupMemberIds = memberships.map((m) => m.userId);
  }

  return {
    minRating: filters.minRating ? Number(filters.minRating) : undefined,
    maxRating: filters.maxRating ? Number(filters.maxRating) : undefined,
    startDate: parseDate(filters.startDate),
    endDate: parseDate(filters.endDate),
    limit: Math.min(Number(filters.limit) || 20, 100),
    page: Math.max(Number(filters.page) || 1, 1),
    userId: filters.userId,
    groupIds,
    groupMemberIds,
  };
};

// Helper function to build Prisma where clause
const buildWhereClause = (parsed: ParsedFilters): Prisma.ReviewWhereInput => {
  const filters: Prisma.ReviewWhereInput[] = [];

  // Filter by group members if applicable
  if (parsed.groupMemberIds && parsed.groupMemberIds.length > 0) {
    filters.push({ userId: { in: parsed.groupMemberIds } });
  }

  if (parsed.minRating !== undefined) {
    filters.push({ rating: { gte: parsed.minRating } });
  }

  if (parsed.maxRating !== undefined) {
    filters.push({ rating: { lte: parsed.maxRating } });
  }

  if (parsed.startDate !== undefined) {
    filters.push({ createdAt: { gte: parsed.startDate } });
  }

  if (parsed.endDate !== undefined) {
    filters.push({ createdAt: { lte: parsed.endDate } });
  }

  return {
    AND: filters,
  };
};

// Date validation helper
const parseDate = (dateString?: string): Date | undefined => {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? undefined : date;
};

export const getUserSongReviewsService = async (
  userId: number,
  songIds: number[]
) => {
  if (!userId || !songIds.length) {
    return { reviews: [] };
  }

  const reviews = await prisma.review.findMany({
    where: {
      userId,
      songId: { in: songIds },
    },
    select: {
      id: true,
      songId: true,
      rating: true,
      content: true,
      createdAt: true,
    },
  });

  return {
    reviews,
    total: reviews.length,
  };
};

export const getUserReviewForSongService = async (
  userId: number,
  songId: number
) => {
  if (!userId || !songId) {
    return { review: null };
  }

  const review = await prisma.review.findFirst({
    where: {
      userId,
      songId,
    },
    select: {
      id: true,
      songId: true,
      rating: true,
      content: true,
      createdAt: true,
      userId: true,
    },
  });

  return {
    review,
  };
};

```

# src\services\song.service.ts

```ts
import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";
import { NotFoundError, ValidationError } from "../errors/customErrors.js";

export const getSongsService = async (filters: {
  albumId?: string;
  search?: string;
  limit?: number;
  page?: number;
}) => {
  const where: Prisma.SongWhereInput = {
    ...(filters.albumId && { albumId: Number(filters.albumId) }),
    ...(filters.search && {
      title: { contains: filters.search, mode: "insensitive" },
    }),
  };

  const [songs, total] = await prisma.$transaction([
    prisma.song.findMany({
      where,
      include: { album: { select: { title: true, artworkUrl: true } } },
    }),
    prisma.song.count({ where }),
  ]);

  return {
    data: songs,
    meta: {
      total,
      page: filters.page || 1,
      totalPages: Math.ceil(total / (filters.limit || 10)),
    },
  };
};

export const getSongService = async (songId: number) => {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: {
      album: true,
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { username: true, image: true } },
        },
      },
    },
  });

  if (!song) throw new NotFoundError("Song not found");
  return song;
};

export const createSongService = async (data: Prisma.SongCreateInput) => {
  if (!data.title || data.title.trim().length < 2) {
    throw new ValidationError("Song title must be at least 2 characters", {
      title: data.title,
    });
  }

  if (!data.album) {
    throw new ValidationError("Album ID is required", { albumId: data.album });
  }

  return prisma.song.create({
    data,
    include: { album: true },
  });
};

export const updateSongService = async (
  songId: number,
  data: Prisma.SongUpdateInput
) => {
  return prisma.song.update({
    where: { id: songId },
    data,
    include: { album: true },
  });
};

export const deleteSongService = async (songId: number) => {
  return prisma.song.delete({
    where: { id: songId },
  });
};

```

# src\services\user.service.ts

```ts
import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "../db/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
} from "../errors/customErrors.js";
import { sendEmail } from "../middleware/auth.js";
const saltRounds = 10;

export const registerUserService = async (data: {
  email: string;
  username: string;
  password: string;
  avatarColor?: string; // optional
}) => {
  if (data.password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters", {
      password: "Length validation failed",
    });
  }

  const hashedPassword = await bcrypt.hash(data.password, saltRounds);

  try {
    return await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        avatarColor: data.avatarColor ?? undefined,
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarColor: true,
      },
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const field = (error.meta?.target as string[])?.[0];
        throw new ValidationError(`${field} already exists`, {
          [field]: "Must be unique",
        });
      }
    }
    throw error;
  }
};

export const loginUserService = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      password: true,
      email: true,
      username: true,
      avatarColor: true,
    },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AuthenticationError("Invalid credentials");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable missing");
  }

  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });
  return {
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarColor: user.avatarColor,
    },
  };
};

export const getCurrentUserService = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      image: true,
      avatarColor: true,
      groups: {
        select: {
          group: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!user) throw new NotFoundError("User not found");
  return user;
};

export const updateUserService = async (
  userId: number,
  data: Partial<{
    username: string;
    email: string;
    password: string;
    newPassword: string;
    image: string;
    avatarColor: string;
  }>
) => {
  if (data.newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    const valid = await bcrypt.compare(data.password ?? "", user.password);
    if (!valid) throw new AuthenticationError("Incorrect current password");

    data.password = await bcrypt.hash(data.newPassword, saltRounds);
  }

  delete data.newPassword;

  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      username: true,
      image: true,
      avatarColor: true,
    },
  });
};

export const refreshTokenService = async (refreshToken: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable missing");
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET) as {
      id: number;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, refreshToken: true },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new AuthenticationError("Invalid refresh token");
    }

    // Generate new tokens with fresh expiration
    const newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "25m",
    });

    const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError("Refresh token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError("Invalid refresh token");
    }
    throw new AuthenticationError("Token refresh failed");
  }
};

export const forgotPasswordService = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable missing");
  }

  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "30m",
  });
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${accessToken}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    text: `Click here to reset your password: ${resetLink}`,
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 30 minutes.</p>`,
  });
};

export const resetPasswordService = async (
  token: string,
  newPassword: string
) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
  const hashed = await bcrypt.hash(newPassword, saltRounds);
  return prisma.user.update({
    where: { id: decoded.id },
    data: { password: hashed },
  });
};

export const deleteUserService = async (userId: number) => {
  return prisma.user.delete({
    where: { id: userId },
  });
};

```

# src\types\express.d.ts

```ts
import { User, Group, UserGroup } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email?: string;
        username?: string;
        image?: string | null;
      };
    }
  }
}

export {};

```

# src\validators\album.validator.ts

```ts
import { z } from "zod";

const baseAlbumSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title too long (max 100 characters)"),
  releaseDate: z.coerce
    .date({
      required_error: "Release date is required",
      invalid_type_error: "Invalid date format",
    })
    .max(new Date(), "Release date cannot be in the future")
    .refine((date) => date.getFullYear() >= 1900, "Invalid release year"),
  artworkUrl: z
    .string()
    .url("Invalid artwork URL")
    .regex(/\.(jpeg|jpg|png|webp)$/i, "Invalid image format"),
});

export const createAlbumSchema = z.object({
  body: baseAlbumSchema,
});
// For update operations - all fields optional
export const updateAlbumSchema = baseAlbumSchema.partial();

export type AlbumInput = z.infer<typeof baseAlbumSchema>;

```

# src\validators\group.validator.ts

```ts
import { z } from "zod";

export const groupSchema = z.object({
  name: z
    .string()
    .min(2, "Group name must be at least 2 characters")
    .max(100, "Group name too long (max 100 characters)"),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
});

export type GroupInput = z.infer<typeof groupSchema>;

```

# src\validators\review.validator.ts

```ts
import { z } from "zod";

export const reviewSchema = z.object({
  songId: z.number().int().positive(),
  rating: z.number().min(0.1).max(10),
  reviewText: z.string().max(500),
});

```

# src\validators\song.validator.ts

```ts
import { z } from "zod";

export const songSchema = z.object({
  title: z
    .string()
    .min(1, "Title must be at least 1 character")
    .max(100, "Title too long (max 100 characters)"),
  trackNumber: z.number().int().positive(),
  duration: z.string().regex(/^\d+:\d{2}$/, "Invalid duration format (MM:SS)"),
  albumId: z.number().int().positive(),
});

export type SongInput = z.infer<typeof songSchema>;

```

# src\validators\user.validator.ts

```ts
import { z } from "zod";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+]{8,}$/;

// src/validators/user.validator.ts
export const registrationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    username: z.string().min(3).max(20),
    password: z.string().min(8),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

// Update User Schema
export const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    username: z
      .string()
      .min(3, "Username too short")
      .max(20, "Username too long")
      .optional(),
    password: z.string().min(8).optional(),
    image: z.string().url("Invalid image URL").optional(),
  })
  .refine((data) => {
    // Ensure at least one field is provided
    return Object.keys(data).length > 0;
  }, "At least one field must be provided");

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

```

# tests\album.test.ts

```ts
import request from "supertest";
import { app } from "../src/server.js";
import { getTestUserToken } from "./helpers/auth";
import { TestHelpers } from "./helpers/testHelpers";

describe("Album Operations", () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await TestHelpers.setupTestData();
    const auth = await getTestUserToken();
    authToken = auth.token;
    userId = auth.userId;
  });

  afterAll(async () => {
    await TestHelpers.cleanupTestData();
  });

  it("should create/read/update/delete album", async () => {
    // Create Album
    const createRes = await request(app)
      .post("/api/albums")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Test Album",
        releaseDate: "2004-04-14T00:00:00Z",
        artworkUrl: "https://example.com/artwork.jpg",
      });

    expect(createRes.status).toBe(201);
    const albumId = createRes.body.id;
    // Read Album
    const getRes = await request(app).get(`/api/albums/${albumId}/songs/stats`);
    expect(getRes.status).toBe(200);

    // Update Album
    const updateRes = await request(app)
      .put(`/api/albums/${albumId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Updated Title",
      });

    expect(updateRes.status).toBe(200);

    // Delete Album
    const deleteRes = await request(app)
      .delete(`/api/albums/${albumId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(deleteRes.status).toBe(204);
  });
});

```

# tests\auth.test.ts

```ts
import request from "supertest";
import { app } from "../src/server";
import { prisma } from "./helpers/db";

function createRandomString(length: number) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

describe("Authentication System", () => {
  const id = createRandomString(7);
  const testUser = {
    email: `test-${id}@example.com`,
    password: "Test123!",
    username: `testuser-${id}`,
  };

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser); // Remove the { body: ... } wrapper

    expect(res.status).toBe(201);
  });

  it("should login with valid credentials", async () => {
    // First register the user
    await request(app).post("/api/auth/register").send(testUser);

    const res = await request(app).post("/api/auth/login").send(testUser);

    expect(res.status).toBe(200);
  });

  it("should reject invalid login credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nonexistent@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
  });

  it("should protect unauthorized access", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.status).toBe(401);
  });

  it("should refresh access tokens", async () => {
    // Register first
    await request(app).post("/api/auth/register").send(testUser);

    // Then login
    const loginRes = await request(app).post("/api/auth/login").send(testUser);

    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: loginRes.body.refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body).toHaveProperty("accessToken");
  });
});

```

# tests\helpers\auth.ts

```ts
import { app } from "../../src/server";
import request from "supertest";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export async function getTestUserToken() {
  const hashedPassword = await bcrypt.hash("Test123!", 10); // Hash the test password

  const user = await prisma.user.upsert({
    where: { email: "test1@example.com" },
    update: { password: hashedPassword },
    create: {
      username: "testuser",
      email: "test1@example.com",
      password: hashedPassword,
    },
  });

  const loginRes = await request(app).post(`/api/auth/login`).send({
    email: "test1@example.com",
    password: "Test123!",
  });

  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
  }

  return {
    token: loginRes.body.token,
    userId: loginRes.body.user.id,
  };
}

```

# tests\helpers\db.ts

```ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const connectDB = async () => {
  await prisma.$connect();
  return prisma;
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
};

```

# tests\helpers\setup.ts

```ts
import { Server } from "http";
import { startServer, stopServer } from "../../src/server";
import { prisma, disconnectDB } from "./db";

let testServer: Server | null = null;

export const setupTestEnvironment = async () => {
  testServer = await startServer();
  await prisma.$connect();
  return testServer;
};

export const teardownTestEnvironment = async () => {
  if (testServer) {
    await stopServer();
    testServer = null;
  }
  await disconnectDB();
};

```

# tests\helpers\testHelpers.ts

```ts
import { PrismaClient } from "@prisma/client";
import { app } from "../../src/server";
import request from "supertest";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const TestHelpers = {
  setupTestData: async () => {
    // Create or update test user
    const user = await prisma.user.upsert({
      where: { email: "test1@example.com" },
      update: {},
      create: {
        email: "test1@example.com",
        username: "testuser",
        password: await bcrypt.hash("Test123!", 10),
      },
    });

    // Create or update test album
    const album = await prisma.album.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        title: "Test Album",
        releaseDate: "2004-04-14T00:00:00Z",
        artworkUrl: "test.jpg",
      },
    });

    // Create or update test song
    const song = await prisma.song.upsert({
      where: { id: 519 },
      update: {},
      create: {
        id: 519,
        title: "Test Song",
        albumId: album.id,
        trackNumber: 1,
        duration: "4:56",
      },
    });

    return { user, album, song };
  },

  cleanupTestData: async () => {
    await prisma.$transaction([
      prisma.review.deleteMany({
        where: { songId: 519 },
      }),
      prisma.song.deleteMany({
        where: { id: 519 },
      }),
      prisma.album.deleteMany({
        where: { id: 1 },
      }),
      prisma.user.deleteMany({ where: { email: "test1@example.com" } }),
    ]);
  },

  getTestUserToken: async () => {
    try {
      // Create or update test user with hashed password
      const user = await prisma.user.upsert({
        where: { email: "test1@example.com" },
        update: {
          password: await bcrypt.hash("Test123!", 10),
        },
        create: {
          username: "testuser",
          email: "test1@example.com",
          password: await bcrypt.hash("Test123!", 10),
        },
      });

      // Login to get token
      const loginRes = await request(app).post(`/api/auth/login`).send({
        email: "test1@example.com",
        password: "Test123!",
      });

      if (loginRes.status !== 200) {
        throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
      }

      return {
        token: loginRes.body.token,
        userId: loginRes.body.user?.id || user.id,
      };
    } catch (error) {
      console.error("Failed to get test token:", error);
      throw error;
    }
  },
};

```

# tests\review.test.ts

```ts
import { app } from "../src/server";
import request from "supertest";
import { getTestUserToken } from "./helpers/auth";
import { TestHelpers } from "./helpers/testHelpers";

describe("Review Operations", () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    await TestHelpers.setupTestData();
    const auth = await getTestUserToken();
    authToken = auth.token;
    userId = auth.userId;
  });

  afterEach(async () => {
    await TestHelpers.cleanupTestData();
  });

  it("should create a review", async () => {
    const response = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        content: "Test review",
        rating: 7.5,
        songId: 519,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });
});

```

# tests\setup.ts

```ts
import { setupTestEnvironment, teardownTestEnvironment } from "./helpers/setup";

beforeAll(async () => {
  await setupTestEnvironment();
});

afterAll(async () => {
  await teardownTestEnvironment();
});

```

# tsconfic.server.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

# tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "outDir": "./dist",
    "strict": true,
    "skipLibCheck": true,
    "rootDir": "src",
    "baseUrl": ".",    
    "types": ["node", "jest"],
    "paths": {
      "@/*": ["./src/*"]
    },
    "sourceMap": true, 
    "resolveJsonModule": true 
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

