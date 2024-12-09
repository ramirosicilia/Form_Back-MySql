/*
  Warnings:

  - Added the required column `token` to the `Empleado` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verificado` to the `Empleado` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Empleado" ADD COLUMN     "token" TEXT NOT NULL,
ADD COLUMN     "verificado" BOOLEAN NOT NULL;
