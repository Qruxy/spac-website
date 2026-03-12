# AWS Migration Guide

This document covers everything needed to migrate spac-website to a new AWS account.

## AWS Resources Inventory

| Resource | Type | Current Value | Env Var |
|---|---|---|---|
| S3 Bucket | S3 | spac-astronomy-media-132498934035 | `S3_BUCKET` |
| CloudFront Distribution | CloudFront | d2gbp2i1j2c26l.cloudfront.net | `CLOUDFRONT_URL` |
| Amplify App | Amplify | dw31ke605du7u (us-east-1) | — |
| Cognito User Pool | Cognito | us-east-1_L6YMqSeqa | `AUTH_COGNITO_POOL_ID` |
| Cognito App Client | Cognito | 7gjst6hajt91lulrka1ks0i8q9 | `AUTH_COGNITO_ID` |
| SES Region | SES | us-east-1 | `SES_REGION` |
| SES Sender Identity | SES | noreply@stpeteastro.org | `EMAIL_FROM` |

## Required IAM Permissions

Create an IAM user with these policies for the application:

### S3 + CloudFront (media uploads)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
    }
  ]
}
```

### SES (email sending + stats)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:GetSendStatistics",
        "ses:GetSendQuota"
      ],
      "Resource": "*"
    }
  ]
}
```

## Migration Steps

### 1. New AWS Account Setup
1. Create IAM user `spac-app` with programmatic access
2. Attach the S3+CloudFront and SES policies above
3. Save the Access Key ID and Secret Access Key

### 2. S3 Bucket
1. Create a new S3 bucket (private)
2. Enable versioning (recommended)
3. Set CORS policy:
```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedOrigins": ["https://yourdomain.com"],
  "ExposeHeaders": ["ETag"]
}]
```
4. Create a CloudFront distribution pointing to this bucket
5. Enable OAC (Origin Access Control) — bucket should NOT be public

### 3. SES
1. Verify your sending domain in SES (DNS DKIM + SPF records)
2. Request production access (exit sandbox) — submit a support ticket to AWS
3. Set up SNS notifications for bounces and complaints (recommended for deliverability monitoring)
4. Set `EMAIL_FROM` to a verified address

### 4. Cognito
1. Create a new User Pool in the new account
2. Create an App Client with USER_PASSWORD_AUTH enabled
3. Import existing users (AWS CLI: `aws cognito-idp create-user-import-job`)
4. Update `AUTH_COGNITO_POOL_ID`, `AUTH_COGNITO_ID`, `AUTH_COGNITO_SECRET`

### 5. Amplify
1. Connect the GitHub repo to Amplify in the new account
2. Set all environment variables (see full list below)
3. Trigger a manual build

### 6. Database (Supabase)
Supabase is not AWS-specific. Just update the `DATABASE_URL` / `DIRECT_URL` env vars to point to the new project if migrating Supabase projects.

## Full Environment Variable Checklist

```
# Database
DATABASE_URL=
DIRECT_URL=

# Auth (NextAuth)
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Cognito
AUTH_COGNITO_ID=
AUTH_COGNITO_SECRET=
AUTH_COGNITO_POOL_ID=
AUTH_COGNITO_ISSUER=

# AWS (S3 + SES) — use S3_* prefix (Amplify blocks AWS_* at runtime)
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION=
S3_BUCKET=
CLOUDFRONT_URL=

# SES
SES_REGION=
EMAIL_FROM=

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_SANDBOX=

# App
NEXT_PUBLIC_APP_URL=
CRON_SECRET=
```

## Notes
- Amplify blocks `AWS_*` env var prefix at Lambda runtime — always use `S3_*` prefix for AWS credentials
- `PAYPAL_SANDBOX=true` must be set until live PayPal credentials are configured
- Supabase DB password rotation needed before go-live (dashboard.supabase.com → Database → Reset)
