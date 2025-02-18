import jwt from "jsonwebtoken";
import asyncRouteHandler from "../middleware/asyncRouteHandler";
import prisma from "../db/prisma";
import express, { Request, Response, NextFunction } from "express";

const router = express.Router();

router.post(
  "/login",
  asyncRouteHandler(async (req, res) => {
    const { email, password } = req.body;
    // Add validation and password hashing
    const user = await prisma.user.findUnique({ where: { email } });
    const token = jwt.sign({ id: user?.id }, process.env.JWT_SECRET!);
    res.json({ token });
  })
);
