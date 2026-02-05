# SPAC AWS Deployment Guide

**Document Version:** 1.0  
**Created:** 2026-02-01  
**Tech Stack:** Next.js 14, PostgreSQL (Supabase), Prisma, PayPal, AWS S3/CloudFront

---

## Table of Contents

1. [Deployment Options Analysis](#1-deployment-options-analysis)
2. [Recommended Architecture](#2-recommended-architecture)
3. [S3 Configuration](#3-s3-configuration)
4. [CloudFront CDN](#4-cloudfront-cdn)
5. [Database Configuration](#5-database-configuration)
6. [Environment Variables](#6-environment-variables)
7. [Domain & DNS](#7-domain--dns)
8. [Cost Estimation](#8-cost-estimation)
9. [Step-by-Step Deployment](#9-step-by-step-deployment)
10. [Monitoring & Maintenance](#10-monitoring--maintenance)

---

## 1. Deployment Options Analysis

### Option A: AWS Amplify (⭐ RECOMMENDED)

| Aspect | Details |
|--------|---------|
| **Complexity** | ⭐ Low |
| **Cost** | Free tier (12 months), then ~$15-30/mo |
| **Scaling** | Automatic, serverless |
| **Best For** | AWS-native Next.js hosting |

**Pros:**
- Native Next.js 14 SSR support
- Fully within AWS ecosystem (single bill)
- Automatic preview deployments for PRs
- Built-in CI/CD pipeline
- Edge network via CloudFront
- Easy S3/other AWS service integration
- Git-based deployments (GitHub, GitLab, CodeCommit)
- Free SSL certificates
- Works seamlessly with Supabase (external DB)

**Cons:**
- Slightly more setup than Vercel
- Build times can be slower
- Less mature Next.js support than Vercel

**Why Amplify for SPAC:**
- Already using Supabase (works great with Amplify)
- Need S3 for media storage (native integration)
- Single AWS account for everything
- Better cost control at scale

---

### Option B: Vercel (Alternative)

| Aspect | Details |
|--------|---------|
| **Complexity** | ⭐ Very Low |
| **Cost** | Free tier available, Pro $20/mo |
| **Scaling** | Automatic, serverless |
| **Best For** | Next.js applications (built by Vercel) |

**Pros:**
- Native Next.js support with zero configuration
- Automatic preview deployments for PRs
- Built-in analytics and speed insights
- Edge network for global distribution
- Automatic image optimization

**Cons:**
- Vendor lock-in to Vercel platform
- Separate from AWS infrastructure
- Two bills to manage (Vercel + AWS for S3)

---

### Option B: AWS Amplify

| Aspect | Details |
|--------|---------|
| **Complexity** | ⭐⭐ Low-Medium |
| **Cost** | ~$15-50/mo depending on traffic |
| **Scaling** | Automatic |
| **Best For** | AWS-native deployments |

**Pros:**
- Good Next.js 14 support
- Integrated with AWS ecosystem (S3, CloudFront built-in)
- CI/CD included
- Custom domains with free SSL

**Cons:**
- Some Next.js features may lag behind Vercel
- AWS console complexity
- SSR cold starts can be slower

---

### Option C: ECS/Fargate (Containers)

| Aspect | Details |
|--------|---------|
| **Complexity** | ⭐⭐⭐⭐ High |
| **Cost** | ~$30-100/mo minimum |
| **Scaling** | Manual/Auto with configuration |
| **Best For** | Enterprise, complex requirements |

**Pros:**
- Full control over environment
- Container-based (Docker)
- Integrates with existing AWS infrastructure
- No vendor lock-in

**Cons:**
- Significant DevOps overhead
- Requires Docker expertise
- Higher minimum cost
- Manual scaling configuration

---

### Option D: EC2 + PM2 (Traditional)

| Aspect | Details |
|--------|---------|
| **Complexity** | ⭐⭐⭐ Medium-High |
| **Cost** | ~$10-50/mo for t3.small |
| **Scaling** | Manual |
| **Best For** | Full server control, budget conscious |

**Pros:**
- Lowest cost at scale
- Full server access
- Can host multiple apps
- Complete control

**Cons:**
- Manual scaling and maintenance
- Server administration required
- Security patches are your responsibility
- No automatic deployments

---

### 🏆 RECOMMENDATION: **AWS Amplify + Supabase + S3/CloudFront**

For SPAC, I recommend an **AWS-native approach**:

```
┌─────────────────────────────────────────────────────────────────┐
│                      RECOMMENDED ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [Users] ──→ [AWS Amplify + CloudFront Edge]                   │
│                      │                                           │
│                      ├──→ Next.js App (SSR, API Routes)         │
│                      │                                           │
│                      └──→ [CloudFront CDN]                       │
│                                  │                               │
│                                  ├──→ S3: Media (gallery photos) │
│                                  ├──→ S3: Documents (PDFs)       │
│                                  └──→ S3: Backups                │
│                                                                  │
│   [Amplify] ──→ [Supabase PostgreSQL] (external DB)             │
│                                                                  │
│   [Amplify] ──→ [PayPal API]                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Why this approach:**
1. **AWS Amplify** handles Next.js 14 SSR - git-based deployments, preview branches
2. **Supabase** as external database - already configured, excellent PostgreSQL, stays as-is
3. **AWS S3 + CloudFront** for media - native integration, scalable, cost-effective
4. **Single AWS bill** - easier management, consolidated infrastructure
5. **Better long-term scaling** - full control over AWS resources

---

## 2. Recommended Architecture

### Infrastructure Diagram (Text-Based)

```
                                    ┌─────────────────┐
                                    │   Route 53      │
                                    │  stpeteastro.org│
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
            ┌───────────────┐      ┌─────────────────┐      ┌─────────────────┐
            │ AWS Amplify   │      │   CloudFront    │      │   CloudFront    │
            │   (Next.js)   │      │   (Media CDN)   │      │   (Docs CDN)    │
            │               │      │                 │      │                 │
            │stpeteastro.org│      │cdn.stpeteastro. │      │docs.stpeteastro.│
            └───────┬───────┘      └────────┬────────┘      └────────┬────────┘
                    │                       │                        │
                    │                       ▼                        ▼
                    │              ┌─────────────────┐      ┌─────────────────┐
                    │              │   S3 Bucket     │      │   S3 Bucket     │
                    │              │   spac-media    │      │  spac-documents │
                    │              └─────────────────┘      └─────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌───────────┐ ┌──────────┐ ┌──────────┐
│ Supabase  │ │  PayPal  │ │  Sentry  │
│ PostgreSQL│ │   API    │ │(Optional)│
│ (External)│ │          │ │          │
└───────────┘ └──────────┘ └──────────┘
```

### Component Overview

| Component | Service | Purpose |
|-----------|---------|---------|
| Web App | Vercel | Next.js hosting, SSR, API routes |
| Database | Supabase | PostgreSQL with connection pooling |
| Media Storage | AWS S3 | Gallery photos, user uploads |
| Document Storage | AWS S3 | Newsletters, PDFs, meeting minutes |
| CDN | CloudFront | Global content delivery |
| DNS | Route 53 | Domain management |
| SSL | ACM | Free SSL certificates |
| Payments | PayPal | Membership, donations |
| Monitoring | Sentry (opt) | Error tracking |

---

## 3. S3 Configuration

### Bucket Structure

```
AWS Account
├── spac-media-prod
│   ├── gallery/
│   │   └── {year}/{month}/{uuid}.{ext}
│   ├── uploads/
│   │   └── {year}/{month}/{uuid}.{ext}
│   ├── thumbnails/
│   │   └── thumb_{uuid}.{ext}
│   └── events/
│       └── {event-id}/{uuid}.{ext}
│
├── spac-documents-prod
│   ├── newsletters/
│   │   └── {year}/{month}/{filename}.pdf
│   ├── minutes/
│   │   └── {year}/{filename}.pdf
│   └── policies/
│       └── {filename}.pdf
│
└── spac-backups-prod
    └── database/
        └── {date}/backup.sql.gz
```

### Bucket Naming Convention

```
{organization}-{purpose}-{environment}

Examples:
- spac-media-prod
- spac-media-staging
- spac-documents-prod
- spac-backups-prod
```

### S3 Bucket Policy - Media Bucket

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAI",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity E1234EXAMPLE"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::spac-media-prod/*"
    }
  ]
}
```

### S3 Bucket Policy - Documents Bucket

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAI",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity E1234EXAMPLE"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::spac-documents-prod/*"
    }
  ]
}
```

### CORS Configuration for Direct Uploads

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
    "AllowedOrigins": [
      "https://spacohio.org",
      "https://www.spacohio.org",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### IAM Policy for Application

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3MediaAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::spac-media-prod",
        "arn:aws:s3:::spac-media-prod/*",
        "arn:aws:s3:::spac-documents-prod",
        "arn:aws:s3:::spac-documents-prod/*"
      ]
    }
  ]
}
```

### Lifecycle Rules

**Media Bucket:**
```json
{
  "Rules": [
    {
      "ID": "TransitionToIA",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "gallery/"
      },
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "STANDARD_IA"
        }
      ]
    }
  ]
}
```

**Backups Bucket:**
```json
{
  "Rules": [
    {
      "ID": "ExpireOldBackups",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "database/"
      },
      "Expiration": {
        "Days": 90
      },
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

---

## 4. CloudFront CDN

### Distribution Configuration - Media CDN

```yaml
Distribution: spac-media-cdn
  Origins:
    - DomainName: spac-media-prod.s3.us-east-1.amazonaws.com
      OriginAccessIdentity: origin-access-identity/cloudfront/E1234EXAMPLE
      
  DefaultCacheBehavior:
    ViewerProtocolPolicy: redirect-to-https
    AllowedMethods: [GET, HEAD, OPTIONS]
    CachedMethods: [GET, HEAD]
    Compress: true
    CachePolicyId: Managed-CachingOptimized
    
  CacheBehaviors:
    - PathPattern: /thumbnails/*
      TTL:
        DefaultTTL: 31536000  # 1 year
        MaxTTL: 31536000
        MinTTL: 86400
        
  PriceClass: PriceClass_100  # US, Canada, Europe only
  
  Aliases:
    - cdn.spacohio.org
    
  ViewerCertificate:
    ACMCertificateArn: arn:aws:acm:us-east-1:xxx:certificate/xxx
    SSLSupportMethod: sni-only
    MinimumProtocolVersion: TLSv1.2_2021
```

### Cache Behaviors

| Path Pattern | TTL | Compression | Purpose |
|--------------|-----|-------------|---------|
| `/gallery/*` | 30 days | Yes | Gallery images |
| `/thumbnails/*` | 1 year | Yes | Thumbnails (immutable) |
| `/uploads/*` | 7 days | Yes | User uploads |
| `/newsletters/*` | 30 days | No | PDF newsletters |
| `/*` | 1 day | Yes | Default |

### Error Pages

```yaml
CustomErrorResponses:
  - ErrorCode: 403
    ResponseCode: 404
    ResponsePagePath: /404.html
    ErrorCachingMinTTL: 300
    
  - ErrorCode: 404
    ResponseCode: 404
    ResponsePagePath: /404.html
    ErrorCachingMinTTL: 300
```

---

## 5. Database Configuration

### Current Setup: Supabase PostgreSQL

SPAC already uses Supabase PostgreSQL - **no RDS needed**.

#### Supabase Configuration

```
Database: PostgreSQL 15
Region: us-east-1 (match with S3)
Plan: Free tier (500MB) → Pro ($25/mo) for production
```

#### Connection Pooling

Supabase includes PgBouncer. Use these connection strings:

```env
# For Prisma (pooled connection - port 6543)
DATABASE_URL="postgresql://user:pass@db.xxx.supabase.co:6543/postgres?pgbouncer=true"

# For migrations (direct connection - port 5432)
DIRECT_URL="postgresql://user:pass@db.xxx.supabase.co:5432/postgres"
```

#### Backup Strategy

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| Supabase Auto | Daily | 7 days (free) / 30 days (pro) | Supabase |
| Manual Export | Weekly | 90 days | S3 spac-backups-prod |
| Point-in-time | Continuous | 7 days (pro only) | Supabase |

**Manual Backup Script (Weekly Cron):**
```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
pg_dump $DATABASE_URL | gzip > backup_$DATE.sql.gz
aws s3 cp backup_$DATE.sql.gz s3://spac-backups-prod/database/$DATE/
rm backup_$DATE.sql.gz
```

---

## 6. Environment Variables

### Production Environment Variables

```env
# ============================================
# APP CONFIGURATION
# ============================================
NODE_ENV=production
NEXTAUTH_URL=https://spacohio.org
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# ============================================
# DATABASE (Supabase)
# ============================================
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# ============================================
# AWS CONFIGURATION
# ============================================
AWS_ACCESS_KEY_ID=<iam-user-access-key>
AWS_SECRET_ACCESS_KEY=<iam-user-secret-key>
AWS_REGION=us-east-1
AWS_S3_BUCKET=spac-media-prod
CLOUDFRONT_DOMAIN=cdn.spacohio.org

# ============================================
# PAYPAL (Production)
# ============================================
PAYPAL_CLIENT_ID=<live-client-id>
PAYPAL_CLIENT_SECRET=<live-client-secret>
NEXT_PUBLIC_PAYPAL_CLIENT_ID=<live-client-id>
PAYPAL_WEBHOOK_ID=<webhook-id>

# PayPal Plan IDs (create in PayPal dashboard)
PAYPAL_PLAN_INDIVIDUAL_MONTHLY=P-xxx
PAYPAL_PLAN_INDIVIDUAL_ANNUAL=P-xxx
PAYPAL_PLAN_FAMILY_MONTHLY=P-xxx
PAYPAL_PLAN_FAMILY_ANNUAL=P-xxx
PAYPAL_PLAN_STUDENT_ANNUAL=P-xxx

# ============================================
# OPTIONAL SERVICES
# ============================================
# Sentry Error Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx

# Apple Wallet (requires $99/yr Apple Developer account)
APPLE_TEAM_ID=
APPLE_PASS_TYPE_ID=

# Google Wallet
GOOGLE_WALLET_ISSUER_ID=
```

### Secrets Management Recommendation

**For Vercel:** Use Vercel's built-in Environment Variables (encrypted at rest)

**For AWS (if using Amplify/ECS):** Use **AWS Systems Manager Parameter Store** (free tier)

```bash
# Store secrets
aws ssm put-parameter \
  --name "/spac/prod/database-url" \
  --value "postgresql://..." \
  --type "SecureString"

# Retrieve in application
aws ssm get-parameter --name "/spac/prod/database-url" --with-decryption
```

**Comparison:**

| Service | Cost | Best For |
|---------|------|----------|
| Vercel Env Vars | Free | Vercel deployments |
| SSM Parameter Store | Free (up to 10k params) | AWS-native apps |
| AWS Secrets Manager | $0.40/secret/month | Automatic rotation |

**Recommendation:** Use **Vercel Environment Variables** for this deployment.

---

## 7. Domain & DNS

### Route 53 Configuration

**Hosted Zone:** spacohio.org

```
spacohio.org.                    A       ALIAS   xxx.vercel-dns.com
www.spacohio.org.               CNAME    spacohio.org
cdn.spacohio.org.               CNAME    d1234abcd.cloudfront.net
docs.spacohio.org.              CNAME    d5678efgh.cloudfront.net
```

### DNS Records

| Name | Type | Value | Purpose |
|------|------|-------|---------|
| @ | A | ALIAS to Vercel | Main site |
| www | CNAME | spacohio.org | www redirect |
| cdn | CNAME | CloudFront distribution | Media CDN |
| docs | CNAME | CloudFront distribution | Documents CDN |

### SSL/TLS Certificates (ACM)

**Certificate 1:** Main domain
- Domain: `spacohio.org`
- SANs: `*.spacohio.org`
- Region: `us-east-1` (required for CloudFront)

**Vercel handles SSL automatically** for the main domain.

---

## 8. Cost Estimation

### Monthly Cost Breakdown

| Service | Usage Estimate | Monthly Cost |
|---------|----------------|--------------|
| **Vercel Pro** | Unlimited | $20 |
| **S3 Storage** | 50GB | $1.15 |
| **S3 Requests** | 100k GET, 10k PUT | $0.50 |
| **CloudFront** | 50GB transfer | $4.25 |
| **Route 53** | 1 hosted zone | $0.50 |
| **Supabase Pro** | 8GB, daily backups | $25 |
| | | |
| **Total** | | **~$51.40/mo** |

### Cost Optimization Tips

1. **Use Vercel Free Tier** initially ($0 vs $20)
2. **S3 Intelligent Tiering** for old gallery photos
3. **CloudFront PriceClass_100** (US/EU only, cheapest)
4. **Supabase Free Tier** works for moderate traffic

### Free Tier Estimate

| Service | Free Tier | Sufficient? |
|---------|-----------|-------------|
| Vercel | 100GB bandwidth | ✅ Likely |
| S3 | 5GB storage, 2k requests | ⚠️ Maybe |
| CloudFront | 1TB/month (first year) | ✅ Yes |
| Supabase | 500MB, 50k API calls | ⚠️ Monitor |

**Estimated Free Tier Cost:** ~$0-5/month

---

## 9. Step-by-Step Deployment

### Phase 1: AWS Setup (30 minutes)

#### 1.1 Create S3 Buckets

```bash
# Create media bucket
aws s3 mb s3://spac-media-prod --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket spac-media-prod \
  --versioning-configuration Status=Enabled

# Create documents bucket
aws s3 mb s3://spac-documents-prod --region us-east-1

# Create backups bucket
aws s3 mb s3://spac-backups-prod --region us-east-1
```

#### 1.2 Configure CORS

```bash
aws s3api put-bucket-cors \
  --bucket spac-media-prod \
  --cors-configuration file://cors-config.json
```

#### 1.3 Create CloudFront Distribution

1. Go to CloudFront Console
2. Create Distribution
3. Origin: `spac-media-prod.s3.us-east-1.amazonaws.com`
4. Create Origin Access Identity (OAI)
5. Enable HTTPS redirect
6. Add alternate domain: `cdn.spacohio.org`
7. Request/select ACM certificate

#### 1.4 Create IAM User

```bash
# Create user
aws iam create-user --user-name spac-app-prod

# Attach policy
aws iam attach-user-policy \
  --user-name spac-app-prod \
  --policy-arn arn:aws:iam::xxx:policy/SPACAppS3Access

# Create access keys
aws iam create-access-key --user-name spac-app-prod
```

### Phase 2: AWS Amplify Setup (20 minutes)

#### 2.1 Create Amplify App

1. Go to AWS Console → AWS Amplify
2. Click "Host web app"
3. Choose "GitHub" (or your git provider)
4. Authorize and select the SPAC repository
5. Select the `main` branch

#### 2.2 Configure Build Settings

Amplify will auto-detect Next.js. Update `amplify.yml` if needed:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npx prisma generate
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

#### 2.3 Configure Environment Variables

In Amplify Console → App Settings → Environment Variables:

Add all variables from Section 6. Important ones:
- `DATABASE_URL` (Supabase connection string)
- `NEXTAUTH_URL` (https://stpeteastro.org)
- `NEXTAUTH_SECRET`
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- `S3_BUCKET_NAME`

#### 2.4 Configure Domain

1. Amplify Console → Domain Management
2. Add domain: `stpeteastro.org`
3. Add subdomains: `www`, `cdn`, `docs`
4. Amplify provides Route 53 records or manual DNS setup
5. SSL certificate is automatically provisioned

### Phase 3: DNS Configuration (15 minutes)

#### 3.1 Route 53 Setup

```bash
# Create hosted zone (if not exists)
aws route53 create-hosted-zone --name stpeteastro.org --caller-reference $(date +%s)

# Amplify will provide the DNS records to add
# Or use Amplify's automatic Route 53 integration
```

#### 3.2 Update Nameservers

Point domain registrar to Route 53 nameservers:
- `ns-xxx.awsdns-xx.org`
- `ns-xxx.awsdns-xx.co.uk`
- `ns-xxx.awsdns-xx.com`
- `ns-xxx.awsdns-xx.net`

### Phase 4: Final Verification (15 minutes)

```bash
# Test DNS resolution
dig spacohio.org
dig cdn.spacohio.org

# Test SSL certificate
curl -I https://spacohio.org
curl -I https://cdn.spacohio.org

# Test S3 upload
aws s3 cp test.jpg s3://spac-media-prod/test/

# Test CloudFront
curl -I https://cdn.spacohio.org/test/test.jpg
```

---

## 10. Monitoring & Maintenance

### Recommended Monitoring Stack

1. **Vercel Analytics** (included) - Traffic, performance
2. **Sentry** (optional, free tier) - Error tracking
3. **CloudWatch** (included) - AWS resource metrics
4. **Supabase Dashboard** - Database metrics

### Key Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| Response Time P95 | > 3s | Investigate slow queries |
| Error Rate | > 1% | Check Sentry |
| S3 Storage | > 40GB | Review lifecycle rules |
| Database Connections | > 80% | Upgrade Supabase plan |
| CloudFront Cache Hit | < 80% | Review cache settings |

### Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Security updates | Weekly | Auto (Vercel) |
| Database backup verify | Monthly | Admin |
| SSL cert rotation | Never (auto) | ACM |
| Log review | Weekly | Admin |
| Cost review | Monthly | Admin |

### Rollback Procedure

```bash
# Vercel - Instant rollback
vercel rollback [deployment-url]

# Database - Restore from backup
pg_restore -d $DATABASE_URL backup.sql.gz
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPAC AWS QUICK REFERENCE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Vercel Dashboard:    https://vercel.com/spac                   │
│  AWS Console:         https://console.aws.amazon.com            │
│  Supabase Dashboard:  https://app.supabase.com                  │
│                                                                  │
│  S3 Buckets:                                                     │
│    - spac-media-prod     (gallery, uploads)                     │
│    - spac-documents-prod (PDFs, newsletters)                    │
│    - spac-backups-prod   (database backups)                     │
│                                                                  │
│  CDN URL:             https://cdn.spacohio.org                  │
│  Main Site:           https://spacohio.org                      │
│                                                                  │
│  Deploy:              git push origin main                       │
│  Rollback:            vercel rollback                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appendix: Terraform Configuration (Optional)

For infrastructure-as-code, see `infrastructure/terraform/` (to be created if needed).

```hcl
# Example S3 bucket configuration
resource "aws_s3_bucket" "media" {
  bucket = "spac-media-prod"
  
  tags = {
    Environment = "production"
    Project     = "SPAC"
  }
}

resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id
  versioning_configuration {
    status = "Enabled"
  }
}
```

---

**Document Status:** ✅ COMPLETE  
**Next Steps:** Deploy to Vercel, configure AWS S3 buckets, set up CloudFront
