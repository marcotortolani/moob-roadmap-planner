-- CreateTable
CREATE TABLE "operators" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_names" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "description" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_names_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "operators_name_key" ON "operators"("name");

-- CreateIndex
CREATE UNIQUE INDEX "operators_normalized_name_key" ON "operators"("normalized_name");

-- CreateIndex
CREATE INDEX "operators_normalized_name_idx" ON "operators"("normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "product_names_name_key" ON "product_names"("name");

-- CreateIndex
CREATE UNIQUE INDEX "product_names_normalized_name_key" ON "product_names"("normalized_name");

-- CreateIndex
CREATE INDEX "product_names_normalized_name_idx" ON "product_names"("normalized_name");

-- AddForeignKey
ALTER TABLE "operators" ADD CONSTRAINT "operators_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_names" ADD CONSTRAINT "product_names_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
