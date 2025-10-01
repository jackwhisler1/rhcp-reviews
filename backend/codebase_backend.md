# controllers\album.controller.ts

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

# controllers\group.controller.ts

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

# controllers\review.controller.ts

```ts
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

```

# controllers\song.controller.ts

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

# controllers\user.controller.ts

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

# db\prisma.ts

```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default prisma;

```

# errors\customErrors.ts

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

# middleware\auth.ts

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

# middleware\errorHandler.ts

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

# middleware\groupAdminGuard.ts

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

# middleware\validate.ts

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

# routes\albums.ts

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

# routes\groups.ts

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

# routes\reviews.ts

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

```

# routes\songs.ts

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

# routes\userRoutes.ts

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

# routes\users.ts

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

# server.ts

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

# server.ts.d.ts

```ts
export * from "./server.js";

```

# services\album.service.ts

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

# services\email.service.ts

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

# services\group.service.ts

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

# services\review.service.ts

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

# services\song.service.ts

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

# services\user.service.ts

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

# types\express.d.ts

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

# validators\album.validator.ts

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

# validators\group.validator.ts

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

# validators\review.validator.ts

```ts
import { z } from "zod";

export const reviewSchema = z.object({
  songId: z.number().int().positive(),
  rating: z.number().min(0.1).max(10),
  reviewText: z.string().max(500),
});

```

# validators\song.validator.ts

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

# validators\user.validator.ts

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

