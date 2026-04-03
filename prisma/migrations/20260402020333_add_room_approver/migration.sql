-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "approverId" INTEGER;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
