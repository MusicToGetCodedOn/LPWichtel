import "dotenv/config";
import cors from "cors";
import express, { Request, Response } from "express";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient, GroupStatus } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());
app.use((request, response, next) => {
  if (!process.env.DATABASE_URL) {
    return error(response, 503, "Database is not configured. Set DATABASE_URL in backend/.env and restart the API.");
  }
  next();
});

const token = (bytes: number) => randomBytes(bytes).toString("base64url");
const scrypt = promisify(scryptCallback);
const error = (response: Response, status: number, message: string) => response.status(status).json({ error: message });
const hashPassword = async (password: string) => {
  const salt = token(16);
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
};
const verifyPassword = async (password: string, storedHash: string) => {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  const storedKey = Buffer.from(key, "hex");
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
};

app.post("/api/groups", async (request, response) => {
  const { name, creator, budget, date } = request.body as Record<string, string>;
  if (!name?.trim() || !creator?.trim()) return error(response, 400, "Group name and your name are required.");
  const group = await prisma.group.create({
    data: {
      name: name.trim(), budget: budget?.trim() || null,
      eventDate: date ? new Date(`${date}T00:00:00.000Z`) : null,
      inviteCode: token(6), adminToken: token(18),
      participants: { create: { name: creator.trim(), token: token(18) } },
    },
    include: { participants: true },
  });
  return response.status(201).json({ groupId: group.id, adminToken: group.adminToken, inviteCode: group.inviteCode, participantToken: group.participants[0].token });
});

app.post("/api/groups/join", async (request, response) => {
  const { inviteCode, name } = request.body as Record<string, string>;
  if (!inviteCode || !name?.trim()) return error(response, 400, "Invite code and name are required.");
  const group = await prisma.group.findUnique({ where: { inviteCode } });
  if (!group) return error(response, 404, "Group not found.");
  if (group.status !== GroupStatus.OPEN) return error(response, 409, "This group has already been drawn.");
  const participant = await prisma.participant.create({ data: { name: name.trim(), token: token(18), groupId: group.id } });
  return response.status(201).json({ participantToken: participant.token });
});

app.post("/api/auth/register", async (request, response) => {
  const { participantToken, username, password } = request.body as Record<string, string>;
  if (!participantToken || !username?.trim() || !password) return error(response, 400, "Personal link, username, and password are required.");
  if (username.trim().length < 3) return error(response, 400, "Username must be at least 3 characters.");
  if (password.length < 8) return error(response, 400, "Password must be at least 8 characters.");
  const participant = await prisma.participant.findUnique({ where: { token: participantToken } });
  if (!participant) return error(response, 404, "Personal link not found.");
  if (participant.username) return error(response, 409, "This participant already has an account.");
  try {
    const updated = await prisma.participant.update({
      where: { id: participant.id },
      data: { username: username.trim(), passwordHash: await hashPassword(password) },
    });
    return response.status(201).json({ participantToken: updated.token });
  } catch (requestError) {
    if (requestError instanceof Error && requestError.message.includes("Unique constraint")) return error(response, 409, "That username is already in use.");
    throw requestError;
  }
});

app.post("/api/auth/login", async (request, response) => {
  const { username, password } = request.body as Record<string, string>;
  if (!username?.trim() || !password) return error(response, 400, "Username and password are required.");
  const participant = await prisma.participant.findUnique({ where: { username: username.trim() } });
  if (!participant?.passwordHash || !(await verifyPassword(password, participant.passwordHash))) return error(response, 401, "Invalid username or password.");
  return response.json({ participantToken: participant.token });
});

app.post("/api/groups/draw", async (request, response) => {
  const { groupId, adminToken } = request.body as Record<string, string>;
  const group = await prisma.group.findUnique({ where: { id: groupId }, include: { participants: true } });
  if (!group || group.adminToken !== adminToken) return error(response, 403, "Invalid admin credentials.");
  if (group.status !== GroupStatus.OPEN) return error(response, 409, "This group has already been drawn.");
  if (group.participants.length < 3) return error(response, 400, "At least 3 participants are needed to draw.");
  let shuffled = [...group.participants];
  let valid = false;
  for (let attempt = 0; attempt < 50 && !valid; attempt++) {
    shuffled = [...group.participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    valid = !shuffled.some((recipient, index) => recipient.id === group.participants[index].id);
  }
  if (!valid) return error(response, 409, "Could not create a valid draw. Please try again.");
  await prisma.$transaction([
    ...group.participants.map((participant, index) => prisma.participant.update({ where: { id: participant.id }, data: { assignedToId: shuffled[index].id } })),
    prisma.group.update({ where: { id: group.id }, data: { status: GroupStatus.DRAWN } }),
  ]);
  return response.json({ status: GroupStatus.DRAWN });
});

app.get("/api/me/:token", async (request, response) => {
  const participant = await prisma.participant.findUnique({ where: { token: request.params.token }, include: { group: true, assignedTo: true } });
  if (!participant) return error(response, 404, "Personal link not found.");
  return response.json({ name: participant.name, account: Boolean(participant.username), wishes: participant.wishes, status: participant.group.status, group: { name: participant.group.name, budget: participant.group.budget, eventDate: participant.group.eventDate }, recipient: participant.assignedTo ? { name: participant.assignedTo.name, wishes: participant.assignedTo.wishes } : null });
});

app.put("/api/me/:token/wishes", async (request, response) => {
  const { wishes } = request.body as { wishes?: string };
  const participant = await prisma.participant.update({ where: { token: request.params.token }, data: { wishes: wishes?.trim() || null } });
  return response.json({ wishes: participant.wishes });
});

app.get("/api/groups/:id/admin", async (request, response) => {
  const group = await prisma.group.findUnique({ where: { id: request.params.id }, include: { participants: { select: { id: true, name: true, wishes: true, createdAt: true } } } });
  if (!group || group.adminToken !== request.query.token) return error(response, 403, "Invalid admin credentials.");
  return response.json({ id: group.id, name: group.name, budget: group.budget, eventDate: group.eventDate, status: group.status, participants: group.participants });
});

app.listen(Number(process.env.PORT ?? 3001), () => console.log("LPWichtel API listening on port 3001"));