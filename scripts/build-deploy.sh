#!/usr/bin/env bash
# Production build + ISPmanager (Orax) uchun tayyor arxiv: deploy/tourneyup-deploy.tar.gz
# Ishlatish:  bash scripts/build-deploy.sh [SITE_URL]
set -euo pipefail

SITE_URL="${1:-https://c869.orax1.vip}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/deploy/tourneyup"
cd "$ROOT"

echo "==> Build: $SITE_URL"
npx prisma generate
rm -rf .next
NODE_ENV=production \
NEXT_PUBLIC_SITE_URL="$SITE_URL" \
NEXT_PUBLIC_SHOW_DEMO_LOGINS=false \
  npm run build

echo "==> Paket yig'ilmoqda"
rm -rf "$ROOT/deploy"
mkdir -p "$OUT/prisma"
cp -a .next/standalone/. "$OUT/"
rm -f "$OUT/.env"                       # lokal parollar paketga tushmasin
cp -a .next/static "$OUT/.next/static"
cp -a public "$OUT/public"
cp -a prisma/migrations prisma/schema.prisma prisma/seed.js "$OUT/prisma/"
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script \
  > "$OUT/prisma/full-schema.sql"
cp scripts/deploy/start.js scripts/deploy/DEPLOY.md "$OUT/"

cat > "$OUT/package.json" <<'JSON'
{
  "name": "tourneyup",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "node start.js"
  }
}
JSON

cat > "$OUT/.env.production.example" <<ENV
# Hostingdagi MySQL bazasi. Parolda maxsus belgilar bo'lsa URL-encode qiling (@ -> %40)
DATABASE_URL="mysql://BAZA_USER:PAROL@localhost:3306/BAZA_NOMI"

NODE_ENV=production
NEXT_PUBLIC_SITE_URL="$SITE_URL"
ENV

tar -czf "$ROOT/deploy/tourneyup-deploy.tar.gz" -C "$ROOT/deploy" tourneyup
echo "==> Tayyor: deploy/tourneyup-deploy.tar.gz ($(du -h "$ROOT/deploy/tourneyup-deploy.tar.gz" | cut -f1))"
