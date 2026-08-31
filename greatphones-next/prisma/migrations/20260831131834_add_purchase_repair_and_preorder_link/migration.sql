-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN "repairCost" INTEGER;

-- AlterTable
ALTER TABLE "PreOrder" ADD COLUMN "inventoryItemId" TEXT UNIQUE;

-- AddForeignKey
ALTER TABLE "PreOrder" ADD CONSTRAINT "PreOrder_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL;
