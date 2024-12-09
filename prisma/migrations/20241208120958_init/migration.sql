/*
  Warnings:

  - You are about to drop the column `apellidos` on the `Empleado` table. All the data in the column will be lost.
  - You are about to drop the column `imagen` on the `Empleado` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[usuario]` on the table `Empleado` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Empleado` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `apellido` to the `Empleado` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Empleado` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Empleado" DROP COLUMN "apellidos",
DROP COLUMN "imagen",
ADD COLUMN     "apellido" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "imagenes" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_usuario_key" ON "Empleado"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_email_key" ON "Empleado"("email");
