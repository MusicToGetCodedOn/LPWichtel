/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Participant_username_key" ON "Participant"("username");
