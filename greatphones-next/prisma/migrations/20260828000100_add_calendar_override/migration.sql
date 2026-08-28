-- CreateTable
CREATE TABLE "CalendarOverride" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "operator" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarOverride_date_idx" ON "CalendarOverride"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarOverride_entityType_entityId_key" ON "CalendarOverride"("entityType", "entityId");
