/*
  Warnings:

  - Added the required column `county` to the `location_data` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "location_data" ADD COLUMN     "county" TEXT NOT NULL;
