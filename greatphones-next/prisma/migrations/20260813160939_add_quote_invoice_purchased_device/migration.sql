-- Add quoteId to Invoice and create PurchasedDevice model

-- Drop the existing unique constraint on Invoice.orderId (since orderId is now optional, we keep unique but allow null)
ALTER TABLE "Invoice" ALTER COLUMN "orderId" DROP NOT NULL;

-- Add quoteId column
ALTER TABLE "Invoice" ADD COLUMN "quoteId" TEXT;

-- Create unique constraint on quoteId
CREATE UNIQUE INDEX "Invoice_quoteId_key" ON "Invoice"("quoteId");

-- Create PurchasedDevice table
CREATE TABLE "PurchasedDevice" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "color" TEXT,
    "batteryHealth" INTEGER,
    "imei" TEXT,
    "serialNumber" TEXT,
    "clientName" TEXT NOT NULL,
    "clientDni" TEXT,
    "clientPhone" TEXT,
    "clientCity" TEXT,
    "clientProvince" TEXT,
    "purchasePrice" INTEGER NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchasedDevice_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "PurchasedDevice_code_key" ON "PurchasedDevice"("code");
CREATE UNIQUE INDEX "PurchasedDevice_quoteId_key" ON "PurchasedDevice"("quoteId");
CREATE UNIQUE INDEX "PurchasedDevice_invoiceId_key" ON "PurchasedDevice"("invoiceId");

-- Add foreign keys
ALTER TABLE "PurchasedDevice" ADD CONSTRAINT "PurchasedDevice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE;
ALTER TABLE "PurchasedDevice" ADD CONSTRAINT "PurchasedDevice_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE;
ALTER TABLE "PurchasedDevice" ADD CONSTRAINT "PurchasedDevice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id");

-- Add Invoice.quoteId foreign key
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE;
