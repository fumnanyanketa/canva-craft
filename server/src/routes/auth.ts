import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import {
  hashPassword,
  signToken,
  verifyPassword,
} from "../lib/auth.js";
import { authenticate } from "../plugins/authenticate.js";

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).optional(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/register", async (request, reply) => {
    const parsed = credentials.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }
    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({ error: "Email already registered" });
    }

    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword(password), name },
    });

    const token = signToken({ sub: user.id, email: user.email });
    return reply.code(201).send({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  });

  app.post("/api/auth/login", async (request, reply) => {
    const parsed = credentials
      .pick({ email: true, password: true })
      .safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid credentials" });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const token = signToken({ sub: user.id, email: user.email });
    return {
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  });

  app.get("/api/auth/me", { preHandler: authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) return reply.code(404).send({ error: "User not found" });
    return { user };
  });
}
