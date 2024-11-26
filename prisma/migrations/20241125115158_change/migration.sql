/*
  Warnings:

  - You are about to drop the column `barcode` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[qrcode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_barcode_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "barcode",
ADD COLUMN     "qrcode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_qrcode_key" ON "User"("qrcode");
