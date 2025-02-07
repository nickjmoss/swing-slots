/*
  Warnings:

  - You are about to drop the column `booking_window` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `num_of_holes` on the `course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "course" DROP COLUMN "booking_window",
DROP COLUMN "num_of_holes";
