// Prisma-7-Konfiguration: Verbindungs-URLs leben hier (nicht mehr im Schema).
// Laufzeit (PrismaClient) nutzt weiterhin DATABASE_URL aus der Umgebung;
// CLI-Kommandos (generate, db push) lesen diese Datei.
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    // db push/migrate brauchen die direkte (ungepoolte) Verbindung – Neon-Best-Practice.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '',
  },
})
