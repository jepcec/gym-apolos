-- El DNI pasa a ser el código de verificación del cliente.
-- Se elimina el campo `code` autogenerado (FRJ####) y `dni` pasa a ser
-- obligatorio y único.

-- 1) Normalización defensiva sobre datos existentes:
--    un cliente sin DNI hereda su antiguo código (que ya era único),
--    de modo que la columna NOT NULL no rompe la migración.
UPDATE Client SET dni = code WHERE dni IS NULL OR TRIM(dni) = '';

-- 2) Deduplicado: el cliente más antiguo conserva el DNI; los repetidos
--    reciben el sufijo -dup-<id> (único por construcción) para que el
--    índice UNIQUE no falle. El administrador podrá corregirlos después.
UPDATE Client SET dni = dni || '-dup-' || id
WHERE id NOT IN (SELECT MIN(id) FROM Client GROUP BY dni)
  AND dni IN (SELECT dni FROM Client GROUP BY dni HAVING COUNT(*) > 1);

-- 3) Redefinición de la tabla (SQLite no permite DROP COLUMN sobre
--    columnas con índice UNIQUE; Prisma reconstruye la tabla).
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "birthDate" DATETIME,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastCheckin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Client" ("address", "birthDate", "createdAt", "dni", "email", "id", "lastCheckin", "name", "phone", "status", "updatedAt")
  SELECT "address", "birthDate", "createdAt", "dni", "email", "id", "lastCheckin", "name", "phone", "status", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";

CREATE UNIQUE INDEX "Client_dni_key" ON "Client"("dni");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
