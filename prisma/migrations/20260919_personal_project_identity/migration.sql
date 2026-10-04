-- Rename the legacy institutional field to an internal commercial registration.
ALTER TABLE "User"
RENAME COLUMN "municipalPermit" TO "businessRegistration";
