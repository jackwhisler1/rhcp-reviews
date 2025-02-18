import { User, Group, UserGroup } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: User & {
        groups?: (UserGroup & { group: Group })[];
      };
    }
  }
}
