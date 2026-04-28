-- AlterTable
ALTER TABLE "Accessory" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "compareAtPrice" INTEGER,
ADD COLUMN     "compatibleModels" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "ico" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "clientDni" TEXT,
ADD COLUMN     "clientEmail" TEXT,
ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "clientPhone" TEXT,
ADD COLUMN     "mpPaymentId" TEXT,
ADD COLUMN     "mpPreferenceId" TEXT,
ADD COLUMN     "mpStatus" TEXT,
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingFloor" TEXT,
ADD COLUMN     "shippingNumber" TEXT,
ADD COLUMN     "shippingProvince" TEXT,
ADD COLUMN     "shippingStreet" TEXT,
ADD COLUMN     "shippingZip" TEXT;
