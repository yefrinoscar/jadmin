This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Recent Database Changes

### Migration 006: Multiple Service Tags Support

**Date**: 2024-01-16

**Changes Made**:
- ✅ Tickets now support multiple service tags instead of just one
- ✅ Created `ticket_service_tags` junction table for many-to-many relationship
- ✅ Migrated existing `service_tag_id` data to the new structure
- ✅ Updated TypeScript types and UI components
- ✅ Enhanced table display with proper multiple tags visualization

**To Apply Migration**:
```sql
-- Run in your Supabase SQL editor or through CLI
\i supabase/migrations/006_multiple_service_tags.sql
```

**Frontend Changes**:
- Updated `Ticket` interface to include `service_tags?: ServiceTag[]`
- Modified table columns to display multiple service tags with badges
- Enhanced filtering to search across all service tags
- Updated mobile card layout to show multiple tags

**Breaking Changes**:
- Removed `service_tag_id` field from tickets table
- Frontend now expects `service_tags` array instead of single `service_tag_id`

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
