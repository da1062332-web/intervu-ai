-- CreateTable
CREATE TABLE "style_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profile_type" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "style_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "style_profile_characteristics" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "characteristic_name" TEXT NOT NULL,
    "characteristic_value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "style_profile_characteristics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blueprints" (
    "id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL,
    "style_profile_id" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "style_profiles_profile_type_idx" ON "style_profiles"("profile_type");

-- CreateIndex
CREATE INDEX "style_profiles_active_idx" ON "style_profiles"("active");

-- CreateIndex
CREATE INDEX "style_profile_characteristics_profile_id_idx" ON "style_profile_characteristics"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "style_profile_characteristics_profile_id_characteristic_nam_key" ON "style_profile_characteristics"("profile_id", "characteristic_name");

-- CreateIndex
CREATE UNIQUE INDEX "blueprints_config_id_key" ON "blueprints"("config_id");

-- CreateIndex
CREATE INDEX "blueprints_config_id_idx" ON "blueprints"("config_id");

-- CreateIndex
CREATE INDEX "blueprints_style_profile_id_idx" ON "blueprints"("style_profile_id");

-- AddForeignKey
ALTER TABLE "style_profile_characteristics" ADD CONSTRAINT "style_profile_characteristics_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "style_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blueprints" ADD CONSTRAINT "blueprints_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "ExamConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blueprints" ADD CONSTRAINT "blueprints_style_profile_id_fkey" FOREIGN KEY ("style_profile_id") REFERENCES "style_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
