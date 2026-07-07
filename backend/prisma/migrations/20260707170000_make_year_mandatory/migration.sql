-- Backfill/correct "year" from the email's "ugYY" admission-year code.
-- Graduation year = 2004 + YY (4-year program). This fixes existing null,
-- garbage ("2"), and raw-admission-year ("2025" instead of "2029") values
-- so they match the convention already used by the majority of rows.
UPDATE "User"
SET "year" = ((substring(email from '(?i)ug(\d{2})'))::int + 2004)::text
WHERE email ~* 'ug\d{2}'
  AND (
    "year" IS NULL
    OR "year" !~ '^\d{4}$'
    OR "year"::int <> ((substring(email from '(?i)ug(\d{2})'))::int + 2004)
  );

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "year" SET NOT NULL;
