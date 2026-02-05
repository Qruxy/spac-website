# SPAC Data Migration Guide

This guide explains how to export data from your PHP/MySQL system and import it into the new SPAC website.

## Overview

The migration process involves:
1. Exporting data from your PHP/MySQL database as JSON
2. Validating the data format
3. Importing in order: Members → Events → Registrations → Media

## Data Export Format

### Members (Required)

Export your members table as JSON with these fields:

```json
{
  "members": [
    {
      "id": 1,
      "email": "john.doe@email.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "555-123-4567",
      "membership_type": "INDIVIDUAL",
      "status": "ACTIVE",
      "join_date": "2020-01-15",
      "expiry_date": "2025-01-15",
      "created_at": "2020-01-15T10:30:00Z"
    }
  ]
}
```

**Field Mapping:**

| PHP Field | Required | Description | Valid Values |
|-----------|----------|-------------|--------------|
| `id` | Yes | PHP auto-increment ID | Integer |
| `email` | Yes | Member email (unique) | Valid email |
| `first_name` | Yes | First name | String |
| `last_name` | Yes | Last name | String |
| `phone` | No | Phone number | String |
| `membership_type` | No | Type of membership | `FREE`, `INDIVIDUAL`, `FAMILY`, `STUDENT`, `LIFETIME` |
| `status` | No | Membership status | `ACTIVE`, `EXPIRED`, `PENDING`, `CANCELLED`, `SUSPENDED` |
| `join_date` | No | When they joined | ISO date (YYYY-MM-DD) |
| `expiry_date` | No | Membership expiry | ISO date |
| `created_at` | No | Record creation time | ISO timestamp |

### Events

```json
{
  "events": [
    {
      "id": 1,
      "title": "Monthly Star Party",
      "description": "Join us for our monthly star party at the dark site.",
      "type": "STAR_PARTY",
      "location_name": "SPAC Dark Site",
      "location_address": "123 Observatory Rd, Tampa FL",
      "start_date": "2024-03-15T19:00:00Z",
      "end_date": "2024-03-15T23:00:00Z",
      "is_obs": false,
      "max_attendees": 50,
      "member_price": null,
      "non_member_price": null,
      "created_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

**Field Mapping:**

| PHP Field | Required | Description | Valid Values |
|-----------|----------|-------------|--------------|
| `id` | Yes | PHP auto-increment ID | Integer |
| `title` | Yes | Event title | String |
| `description` | No | Full description | String (HTML allowed) |
| `type` | No | Event type | `STAR_PARTY`, `MEETING`, `WORKSHOP`, `OBS_SESSION`, `OUTREACH`, `SOCIAL`, `SPECIAL` |
| `location_name` | No | Venue name | String |
| `location_address` | No | Full address | String |
| `start_date` | Yes | Start date/time | ISO timestamp |
| `end_date` | No | End date/time | ISO timestamp |
| `is_obs` | No | OBS event flag | Boolean |
| `max_attendees` | No | Capacity limit | Integer |
| `member_price` | No | Price for members | Decimal (e.g., 10.00) |
| `non_member_price` | No | Price for non-members | Decimal |
| `created_at` | No | Record creation time | ISO timestamp |

### Registrations

```json
{
  "registrations": [
    {
      "id": 1,
      "member_id": 1,
      "event_id": 1,
      "status": "CONFIRMED",
      "guest_count": 2,
      "camping": true,
      "camping_nights": 2,
      "notes": "Bringing my 8\" Dob",
      "created_at": "2024-03-01T15:00:00Z"
    }
  ]
}
```

**Important:** `member_id` and `event_id` reference the PHP IDs. The migration tool will look up the new IDs automatically.

**Field Mapping:**

| PHP Field | Required | Description | Valid Values |
|-----------|----------|-------------|--------------|
| `id` | Yes | PHP auto-increment ID | Integer |
| `member_id` | Yes | PHP member ID | Integer |
| `event_id` | Yes | PHP event ID | Integer |
| `status` | No | Registration status | `PENDING`, `CONFIRMED`, `WAITLISTED`, `CANCELLED`, `ATTENDED`, `NO_SHOW` |
| `guest_count` | No | Number of guests | Integer (default: 0) |
| `camping` | No | Camping requested | Boolean |
| `camping_nights` | No | Number of nights | Integer |
| `notes` | No | Member notes | String |
| `created_at` | No | Registration time | ISO timestamp |

### Media/Photos (Optional)

```json
{
  "media": [
    {
      "id": 1,
      "member_id": 1,
      "event_id": null,
      "url": "https://oldsite.com/photos/orion.jpg",
      "filename": "orion.jpg",
      "caption": "Orion Nebula taken with 8\" SCT",
      "category": "DEEP_SKY",
      "created_at": "2024-02-20T10:00:00Z"
    }
  ]
}
```

| PHP Field | Required | Description | Valid Values |
|-----------|----------|-------------|--------------|
| `id` | Yes | PHP auto-increment ID | Integer |
| `member_id` | No | PHP member who uploaded | Integer |
| `event_id` | No | Associated event | Integer |
| `url` | Yes | URL to image | Valid URL |
| `filename` | No | Original filename | String |
| `caption` | No | Image caption | String |
| `category` | No | Photo category | `DEEP_SKY`, `PLANETS`, `MOON`, `SUN`, `EVENTS`, `EQUIPMENT`, `NIGHTSCAPE`, `OTHER` |
| `created_at` | No | Upload time | ISO timestamp |

## MySQL Export Scripts

### Export Members

```sql
SELECT
  id,
  email,
  first_name,
  last_name,
  phone,
  membership_type,
  status,
  DATE_FORMAT(join_date, '%Y-%m-%d') as join_date,
  DATE_FORMAT(expiry_date, '%Y-%m-%d') as expiry_date,
  DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') as created_at
FROM members
WHERE email IS NOT NULL
INTO OUTFILE '/tmp/members.json'
-- Or use mysqldump --result-file=members.json
```

Or use PHP to export:

```php
<?php
$pdo = new PDO('mysql:host=localhost;dbname=spac', 'user', 'pass');

$members = $pdo->query('SELECT * FROM members')->fetchAll(PDO::FETCH_ASSOC);

// Format dates
foreach ($members as &$m) {
    $m['join_date'] = $m['join_date'] ? date('Y-m-d', strtotime($m['join_date'])) : null;
    $m['expiry_date'] = $m['expiry_date'] ? date('Y-m-d', strtotime($m['expiry_date'])) : null;
    $m['created_at'] = $m['created_at'] ? date('c', strtotime($m['created_at'])) : null;
}

file_put_contents('members.json', json_encode(['members' => $members], JSON_PRETTY_PRINT));
echo "Exported " . count($members) . " members\n";
```

## Import Order

**IMPORTANT:** Import data in this order due to foreign key dependencies:

1. **Members** - First, creates User and Membership records
2. **Events** - Second, creates Event records
3. **Registrations** - Third, links members to events (requires both to exist)
4. **Media** - Last, can reference members and events

## Using the Migration MCP Server

### 1. Start the Migration Server

```bash
cd mcp
npm install
tsx src/index.ts migration
```

### 2. Validate Your Data First

Before importing, validate your JSON:

```typescript
// Use the validate-import-data tool
{
  "dataType": "members",
  "data": [...your member array...],
  "limit": 5
}
```

This will show any validation errors and preview the mapped data.

### 3. Dry Run Import

Test the import without actually inserting:

```typescript
// Use import-members with dryRun: true
{
  "members": [...],
  "dryRun": true
}
```

### 4. Actual Import

Once validated, run the actual import:

```typescript
{
  "members": [...],
  "dryRun": false
}
```

### 5. Check Status

Monitor progress:

```typescript
// Use get-migration-status tool
{}
```

### 6. Lookup ID Mappings

Find new IDs from old PHP IDs:

```typescript
{
  "tableName": "members",
  "legacyId": 123
}
```

## Post-Migration Steps

### 1. Password Reset

PHP password hashes are **not** compatible with the new auth system. After migration:

1. All migrated users will need to reset their passwords
2. Send a welcome email with password reset link
3. Or use the "Forgot Password" flow on first login

### 2. Verify Data

- Check member counts match
- Verify event dates are correct (timezone handling)
- Test a few registrations

### 3. Photo Migration

For photos:
1. The URL field stores the reference to old images
2. You may want to re-upload images to the new S3 bucket
3. Or update the URLs to point to a migrated S3 location

## Rollback

If something goes wrong, you can clear migrated data:

```typescript
// Use clear-migration-data tool
{
  "tableName": "all",  // or "members", "events", etc.
  "confirm": true
}
```

**Warning:** This permanently deletes migrated data!

## Support

If you encounter issues:
1. Check the validation output for field errors
2. Ensure dates are in ISO format
3. Verify foreign key references exist
4. Check the database logs for constraint violations
