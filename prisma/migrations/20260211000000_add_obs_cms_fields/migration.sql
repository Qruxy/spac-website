-- AlterTable
ALTER TABLE "obs_configs" ADD COLUMN "description" TEXT;
ALTER TABLE "obs_configs" ADD COLUMN "schedule_data" JSONB;
ALTER TABLE "obs_configs" ADD COLUMN "what_to_bring" JSONB;
ALTER TABLE "obs_configs" ADD COLUMN "location_info" JSONB;
ALTER TABLE "obs_configs" ADD COLUMN "stats_data" JSONB;
