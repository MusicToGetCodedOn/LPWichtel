-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('OPEN', 'DRAWN');

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budget" TEXT,
    "eventDate" TIMESTAMP(3),
    "inviteCode" TEXT NOT NULL,
    "adminToken" TEXT NOT NULL,
    "status" "GroupStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "wishes" TEXT,
    "groupId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_inviteCode_key" ON "Group"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "Group_adminToken_key" ON "Group"("adminToken");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_token_key" ON "Participant"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_assignedToId_key" ON "Participant"("assignedToId");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
