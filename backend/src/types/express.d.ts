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
