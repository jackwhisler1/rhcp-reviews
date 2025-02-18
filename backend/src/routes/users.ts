import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncRouteHandler from "../middleware/asyncRouteHandler";
import prisma from "../db/prisma";
import { AuthenticationError } from "../errors/customErrors";

const router = express.Router();
const saltRounds = 10;

// Register
router.post(
  "/register",
  asyncRouteHandler(async (req, res) => {
    const { email, username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    res.status(201).json({ id: user.id, email: user.email });
  })
);

// Login
router.post(
  "/login",
  asyncRouteHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AuthenticationError("Invalid credentials");
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.json({ token });
  })
);

// Get current user
router.get(
  "/me",
  asyncRouteHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    res.json(req.user);
  })
);

export default router;
