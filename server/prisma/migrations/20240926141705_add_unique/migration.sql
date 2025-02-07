/*
  Warnings:

  - You are about to drop the column `booking_ids` on the `course` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `club` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "course" DROP COLUMN "booking_ids";

-- AlterTable
ALTER TABLE "location_data" ALTER COLUMN "address2" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "club_slug_key" ON "club"("slug");
