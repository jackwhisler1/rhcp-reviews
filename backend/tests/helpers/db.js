import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
// Load test environment variables
dotenv.config({ path: ".env.test" });
// Create a singleton PrismaClient for tests
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});
export default prisma;
