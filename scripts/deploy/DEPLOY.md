# TourneyUp — Orax (ISPmanager) hostingga o'rnatish

Bu papka TAYYOR build. Hostingda `npm install` / `npm run build` qilish SHART EMAS.

## 1. MySQL baza
ISPmanager > **Databases** > Create: MySQL, baza nomi, foydalanuvchi, parol. Ularni yozib oling.

## 2. Node.js sayt yaratish
ISPmanager > **Sites** > Create (yoki mavjud `c869.orax1.vip` saytini tahrirlash):
- Handler / Ishlov beruvchi: **Node.js**
- Node.js version: **20.9+** (22 tavsiya)
- Connection method: **Port** (Socket EMAS)
- Startup: `npm start` (yoki fayl sifatida `start.js`)

Saytning ildiz papkasini eslab qoling, odatda: `/var/www/USER/data/www/c869.orax1.vip`

## 3. Fayllarni yuklash (SSH)
    scp tourneyup-deploy.tar.gz USER@SERVER:~/
    ssh USER@SERVER
    cd /var/www/USER/data/www/c869.orax1.vip
    # panel yaratgan namunaviy server.js / package.json ni o'chirib, paketni oching:
    rm -f server.js package.json
    tar -xzf ~/tourneyup-deploy.tar.gz --strip-components=1

## 4. .env
    cp .env.production.example .env
    nano .env      # DATABASE_URL ni to'ldiring
Parolda `@ # % / :` kabi belgilar bo'lsa URL-encode qiling (`@` -> `%40`).

## 5. Baza jadvallari
    npx -y prisma@6.19.3 migrate deploy
`node`/`npx` topilmasa — ISPmanager Node.js'ni nvm orqali o'rnatadi: `source ~/.nvm/nvm.sh` ni sinab ko'ring.
Muqobil yo'l: phpMyAdmin > baza > Import > `prisma/full-schema.sql`.

## 6. (Ixtiyoriy) Boshlang'ich ma'lumot
    node prisma/seed.js
Demo foydalanuvchilar va `admin@tourneyup.uz` SUPER_ADMIN yaratadi — admin parolini darhol almashtiring.

## 7. SSL va ishga tushirish
- ISPmanager > **SSL certificates** > Let's Encrypt — `c869.orax1.vip` uchun. SHART: login cookie faqat HTTPS orqali ishlaydi.
- Sites > sayt > Node.js ni **Restart** qiling.
- Tekshirish: `pm2 list`, `pm2 logs`

## Yangilash
Lokalda qayta build -> yangi arxiv -> `.env` dan boshqa hamma narsani almashtiring -> `migrate deploy` -> Restart.
