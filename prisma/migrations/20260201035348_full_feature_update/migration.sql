-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('FREE', 'INDIVIDUAL', 'FAMILY', 'STUDENT', 'LIFETIME');

-- CreateEnum
CREATE TYPE "MembershipInterval" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED', 'ATTENDED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ListingCategory" AS ENUM ('TELESCOPE', 'MOUNT', 'EYEPIECE', 'CAMERA', 'FINDER', 'FOCUSER', 'ACCESSORY', 'BINOCULAR', 'SOLAR', 'BOOK', 'SOFTWARE', 'OTHER');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'SOLD', 'EXPIRED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ListingCondition" AS ENUM ('NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'FOR_PARTS');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PhotoCategory" AS ENUM ('DEEP_SKY', 'PLANETS', 'MOON', 'SUN', 'EVENTS', 'EQUIPMENT', 'NIGHTSCAPE', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PAYMENT', 'SUBSCRIPTION_CHANGE', 'ROLE_CHANGE', 'APPROVAL', 'REJECTION', 'CHECK_IN');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('SUBSCRIPTION', 'EVENT_TICKET', 'OBS_REGISTRATION', 'CAMPING_FEE', 'DONATION');

-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('PRIMARY', 'SPOUSE', 'CHILD', 'OTHER');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "OBSSessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'WEATHER_CANCELLED');

-- CreateEnum
CREATE TYPE "OBSEquipmentType" AS ENUM ('TELESCOPE', 'MOUNT', 'EYEPIECE', 'CAMERA', 'FILTER', 'FOCUSER', 'FINDER', 'POWER_SUPPLY', 'COMPUTER', 'ACCESSORY', 'BUILDING', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BYLAWS', 'MEETING_MINUTES', 'FINANCIAL_REPORT', 'NEWSLETTER', 'FORM', 'POLICY', 'GUIDE', 'OTHER');

-- CreateEnum
CREATE TYPE "OutreachType" AS ENUM ('SCHOOL_VISIT', 'PUBLIC_STAR_PARTY', 'LIBRARY_EVENT', 'SCOUT_EVENT', 'PRIVATE_EVENT', 'FESTIVAL', 'LECTURE', 'WORKSHOP', 'OTHER');

-- CreateEnum
CREATE TYPE "OutreachStatus" AS ENUM ('PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OutreachRole" AS ENUM ('CHAIR', 'VICE_CHAIR', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('BOARD', 'GENERAL', 'SPECIAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "MotionStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'TABLED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('NEWSLETTER', 'MEETING_MINUTES', 'BYLAWS', 'POLICY', 'FORM', 'FINANCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "OBSRegistrationType" AS ENUM ('ATTENDEE', 'SPEAKER', 'VENDOR', 'STAFF', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "OBSDocumentCategory" AS ENUM ('SCHEDULE', 'MAP', 'SPEAKER_BIO', 'VENDOR_INFO', 'VOLUNTEER_GUIDE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'PARTIAL');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(3) NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMPTZ(3),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "is_validated" BOOLEAN NOT NULL DEFAULT false,
    "qr_uuid" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "stripe_customer_id" TEXT,
    "family_id" TEXT,
    "family_role" "FamilyRole",
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cognito_id" TEXT,
    "name" TEXT,
    "avatar_url" TEXT,
    "is_primary_member" BOOLEAN DEFAULT false,
    "apple_pass_serial" TEXT,
    "google_pass_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "type" "MembershipType" NOT NULL,
    "interval" "MembershipInterval",
    "status" "MemberStatus" NOT NULL DEFAULT 'PENDING',
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "start_date" TIMESTAMPTZ(3),
    "end_date" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripe_current_period_end" TIMESTAMP(6),
    "cancelled_at" TIMESTAMP(6),
    "obs_eligible" BOOLEAN DEFAULT false,
    "discount_percent" INTEGER DEFAULT 0,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'MEETING',
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMPTZ(3) NOT NULL,
    "end_date" TIMESTAMPTZ(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "location_name" TEXT NOT NULL,
    "location_address" TEXT,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "capacity" INTEGER,
    "member_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "guest_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "camping_available" BOOLEAN NOT NULL DEFAULT false,
    "camping_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "registration_opens" TIMESTAMPTZ(3),
    "registration_closes" TIMESTAMPTZ(3),
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_pattern" TEXT,
    "recurrence_end_date" TIMESTAMPTZ(3),
    "parent_event_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "guest_count" INTEGER NOT NULL DEFAULT 0,
    "camping_requested" BOOLEAN NOT NULL DEFAULT false,
    "dietary_restrictions" TEXT,
    "notes" TEXT,
    "payment_id" TEXT,
    "amount_paid" DECIMAL(10,2),
    "checked_in_at" TIMESTAMPTZ(3),
    "checked_in_by_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ListingCategory" NOT NULL,
    "condition" "ListingCondition" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "is_negotiable" BOOLEAN NOT NULL DEFAULT true,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "seller_id" TEXT NOT NULL,
    "sold_price" DECIMAL(10,2),
    "sold_at" TIMESTAMPTZ(3),
    "buyer_id" TEXT,
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brand" TEXT,
    "model" TEXT,
    "year_made" INTEGER,
    "original_price" DECIMAL(10,2),
    "location" TEXT,
    "minimum_offer" DECIMAL(10,2),
    "shipping_available" BOOLEAN NOT NULL DEFAULT false,
    "local_pickup_only" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "listing_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "message" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "response_message" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "type" "MediaType" NOT NULL,
    "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
    "category" "PhotoCategory",
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "caption" TEXT,
    "uploaded_by_id" TEXT NOT NULL,
    "event_id" TEXT,
    "listing_id" TEXT,
    "folder" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripe_payment_intent_id" TEXT,
    "stripe_invoice_id" TEXT,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "paid_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT,
    "actor_id" TEXT,
    "subject_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migration_id_mappings" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "entity_type" TEXT NOT NULL,
    "legacy_id" TEXT NOT NULL,
    "new_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "migration_id_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_members" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "email" TEXT,
    "image_url" TEXT,
    "bio" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obs_sessions" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "session_date" DATE NOT NULL,
    "start_time" TIMESTAMPTZ(3) NOT NULL,
    "end_time" TIMESTAMPTZ(3),
    "status" "OBSSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "weather" TEXT,
    "seeing" INTEGER,
    "transparency" INTEGER,
    "host_id" TEXT NOT NULL,
    "max_attendees" INTEGER,
    "notes" TEXT,
    "is_members_only" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obs_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obs_attendees" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "checked_in_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obs_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obs_equipment" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "type" "OBSEquipmentType" NOT NULL,
    "description" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "serial_number" TEXT,
    "purchase_date" DATE,
    "purchase_price" DECIMAL(10,2),
    "condition" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "last_maintenance" DATE,
    "next_maintenance" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obs_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obs_equipment_logs" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "equipment_id" TEXT NOT NULL,
    "session_id" TEXT,
    "used_by" TEXT,
    "used_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returned_at" TIMESTAMPTZ(3),
    "notes" TEXT,
    "condition" TEXT,

    CONSTRAINT "obs_equipment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "title" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "description" TEXT,
    "file_url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_events" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "OutreachType" NOT NULL,
    "event_date" DATE NOT NULL,
    "start_time" TIMESTAMPTZ(3),
    "end_time" TIMESTAMPTZ(3),
    "location" TEXT,
    "location_address" TEXT,
    "expected_attendees" INTEGER,
    "actual_attendees" INTEGER,
    "organizer_id" TEXT NOT NULL,
    "status" "OutreachStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outreach_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_volunteers" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "outreach_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT,
    "hours_worked" DECIMAL(4,2),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outreach_volunteers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_committee_members" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "role" "OutreachRole" NOT NULL DEFAULT 'VOLUNTEER',
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outreach_committee_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_minutes" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "title" TEXT NOT NULL,
    "meeting_date" TIMESTAMPTZ(3) NOT NULL,
    "meetingType" "MeetingType" NOT NULL DEFAULT 'BOARD',
    "content" TEXT,
    "pdf_url" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_at" TIMESTAMPTZ(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_minutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motions" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "meeting_id" TEXT NOT NULL,
    "motion_number" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "moved_by" TEXT,
    "seconded_by" TEXT,
    "votes_for" INTEGER NOT NULL DEFAULT 0,
    "votes_against" INTEGER NOT NULL DEFAULT 0,
    "abstentions" INTEGER NOT NULL DEFAULT 0,
    "status" "MotionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "motions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_documents" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "DocumentCategory" NOT NULL,
    "file_url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "year" INTEGER,
    "month" INTEGER,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obs_configs" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "year" INTEGER NOT NULL,
    "event_name" TEXT NOT NULL,
    "start_date" TIMESTAMPTZ(3) NOT NULL,
    "end_date" TIMESTAMPTZ(3) NOT NULL,
    "registration_opens" TIMESTAMPTZ(3) NOT NULL,
    "registration_closes" TIMESTAMPTZ(3) NOT NULL,
    "early_bird_deadline" TIMESTAMPTZ(3),
    "location" TEXT NOT NULL,
    "member_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "non_member_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "early_bird_discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "camping_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "meal_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "capacity" INTEGER NOT NULL DEFAULT 200,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obs_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obs_registrations" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "obs_config_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "is_member" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT,
    "registration_type" "OBSRegistrationType" NOT NULL DEFAULT 'ATTENDEE',
    "camping_requested" BOOLEAN NOT NULL DEFAULT false,
    "meal_requested" BOOLEAN NOT NULL DEFAULT false,
    "dietary_restrictions" TEXT,
    "t_shirt_size" TEXT,
    "arrival_date" TIMESTAMPTZ(3),
    "departure_date" TIMESTAMPTZ(3),
    "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT,
    "payment_date" TIMESTAMPTZ(3),
    "checked_in" BOOLEAN NOT NULL DEFAULT false,
    "checked_in_at" TIMESTAMPTZ(3),
    "checked_in_by_id" TEXT,
    "badge_printed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obs_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obs_documents" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "obs_config_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "category" "OBSDocumentCategory" NOT NULL DEFAULT 'OTHER',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obs_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obs_financials" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "obs_config_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "is_income" BOOLEAN NOT NULL DEFAULT true,
    "date" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obs_financials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vsa_targets" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "object_type" TEXT NOT NULL,
    "constellation" TEXT,
    "right_ascension" TEXT,
    "declination" TEXT,
    "magnitude" DOUBLE PRECISION,
    "is_current_target" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "start_date" TIMESTAMPTZ(3),
    "end_date" TIMESTAMPTZ(3),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vsa_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vsa_equipment" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "specs" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vsa_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_qr_uuid_key" ON "users"("qr_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "users_cognito_id_idx" ON "users"("cognito_id");

-- CreateIndex
CREATE INDEX "users_stripe_customer_id_idx" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_user_id_key" ON "memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_stripe_subscription_id_key" ON "memberships"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "memberships_status_idx" ON "memberships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_status_start_date_idx" ON "events"("status", "start_date");

-- CreateIndex
CREATE INDEX "events_start_date_idx" ON "events"("start_date");

-- CreateIndex
CREATE INDEX "events_type_status_idx" ON "events"("type", "status");

-- CreateIndex
CREATE INDEX "registrations_event_id_status_idx" ON "registrations"("event_id", "status");

-- CreateIndex
CREATE INDEX "registrations_user_id_idx" ON "registrations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_event_id_user_id_key" ON "registrations"("event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "listings_slug_key" ON "listings"("slug");

-- CreateIndex
CREATE INDEX "listings_seller_id_idx" ON "listings"("seller_id");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "listings_category_status_idx" ON "listings"("category", "status");

-- CreateIndex
CREATE INDEX "media_status_category_listing_id_idx" ON "media"("status", "category", "listing_id");

-- CreateIndex
CREATE INDEX "media_uploaded_by_id_idx" ON "media"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "media_status_created_at_idx" ON "media"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_payment_intent_id_key" ON "payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "migration_id_mappings_entity_type_legacy_id_key" ON "migration_id_mappings"("entity_type", "legacy_id");

-- CreateIndex
CREATE INDEX "obs_sessions_session_date_idx" ON "obs_sessions"("session_date");

-- CreateIndex
CREATE INDEX "obs_sessions_status_idx" ON "obs_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "obs_attendees_session_id_user_id_key" ON "obs_attendees"("session_id", "user_id");

-- CreateIndex
CREATE INDEX "obs_equipment_type_idx" ON "obs_equipment"("type");

-- CreateIndex
CREATE INDEX "obs_equipment_is_available_idx" ON "obs_equipment"("is_available");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "documents"("type");

-- CreateIndex
CREATE INDEX "documents_is_public_idx" ON "documents"("is_public");

-- CreateIndex
CREATE INDEX "outreach_events_event_date_idx" ON "outreach_events"("event_date");

-- CreateIndex
CREATE INDEX "outreach_events_status_idx" ON "outreach_events"("status");

-- CreateIndex
CREATE UNIQUE INDEX "outreach_volunteers_outreach_id_user_id_key" ON "outreach_volunteers"("outreach_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "outreach_committee_members_user_id_key" ON "outreach_committee_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "obs_configs_year_key" ON "obs_configs"("year");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_parent_event_id_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_checked_in_by_id_fkey" FOREIGN KEY ("checked_in_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obs_attendees" ADD CONSTRAINT "obs_attendees_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "obs_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obs_equipment_logs" ADD CONSTRAINT "obs_equipment_logs_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "obs_equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obs_equipment_logs" ADD CONSTRAINT "obs_equipment_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "obs_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_volunteers" ADD CONSTRAINT "outreach_volunteers_outreach_id_fkey" FOREIGN KEY ("outreach_id") REFERENCES "outreach_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motions" ADD CONSTRAINT "motions_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meeting_minutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obs_registrations" ADD CONSTRAINT "obs_registrations_obs_config_id_fkey" FOREIGN KEY ("obs_config_id") REFERENCES "obs_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obs_documents" ADD CONSTRAINT "obs_documents_obs_config_id_fkey" FOREIGN KEY ("obs_config_id") REFERENCES "obs_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obs_financials" ADD CONSTRAINT "obs_financials_obs_config_id_fkey" FOREIGN KEY ("obs_config_id") REFERENCES "obs_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
