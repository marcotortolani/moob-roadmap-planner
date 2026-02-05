-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('CREATED', 'UPDATED', 'DELETED');

-- CreateTable
CREATE TABLE "product_history" (
    "id" TEXT NOT NULL,
    "change_type" "ChangeType" NOT NULL,
    "field_name" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by_id" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "product_id" TEXT NOT NULL,

    CONSTRAINT "product_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_history_product_id_idx" ON "product_history"("product_id");

-- CreateIndex
CREATE INDEX "product_history_changed_at_idx" ON "product_history"("changed_at");

-- CreateIndex
CREATE INDEX "product_history_changed_by_id_idx" ON "product_history"("changed_by_id");

-- AddForeignKey
ALTER TABLE "product_history" ADD CONSTRAINT "product_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_history" ADD CONSTRAINT "product_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
