# TASK.md — TourneyUp qilinishi kerak bo'lgan ishlar

> **Maqsad:** real production loyiha → xavfsizlik birinchi blokda, design ikkinchi blokda.
> **Design yo'nalishi:** joriy ko'k-krem palitra (`#384959` / `#ffffe3` / `#88bdf2`) **saqlanadi** — noldan redesign emas, sayqallash.
>
> Audit: 2026-10-08 · Next.js 16.2.0 · React 19.2.4 · Prisma 6.19 + MySQL · Tailwind 4
> Barcha yo'llar `TourneyUp/` ga nisbatan. Har bir taskda: **Muammo → Qayerda → Qilish → Tayyor deb hisoblanadi**.

---

## Loyiha holati

| | Holat |
|---|---|
| **To'liq ishlaydi** | Feed, turnir detali, saqlash (bookmark), turnir yaratish, ishtirokchi approve/reject, profil ko'rish — real Prisma/MySQL bilan |
| **Yarim ishlaydi** | `/rankings` (data real, lekin sport filtri hech narsa qilmaydi, weekly/monthly tab'lar soxta arifmetika), `/dashboard` (turnirlar real, lekin team members / recent activity / "92% success rate" hardcode) |
| **Faqat UI maketi** | `/messages` (471 satr statik, soxta auto-javob), `/results` (433 satr statik, tahrir refresh'da yo'qoladi) |
| **Umuman yo'q** | Haqiqiy auth, signup, route himoyasi, turnir edit/delete, natija kiritish, bracket, profil tahrirlash, `/settings` sahifasi, testlar, CI |
| **Shuningdek yo'q** | Xavfsizlik header'lari/CSP, rate limiting, pagination, server-side qidiruv, `generateMetadata`/OG, bildirishnoma, env validatsiyasi, xato kuzatuvi, huquqiy sahifalar |
| **Taxminiy tayyorlik** | Frontend ~80% · Backend ~45% · Xavfsizlik ~10% · Masshtab/SEO ~15% |

**Eng katta xavf:** cookie `httpOnly: false` va parol yo'q. Brauzer konsolidan `document.cookie = "userId=org1"` yozgan **har qanday** odam to'liq organizer huquqini oladi.

**Eng arzon katta yutuq:** `--success` / `--warning` token'larini qo'shish (P2-1). 20+ joydagi badge va tugmalar hozir **ko'rinmaydi** — 10 daqiqalik ish, darhol sezilади.

---

## Prioritet legendasi

| | Ma'nosi |
|---|---|
| 🔴 **P0** | Production'ga chiqishni bloklaydi |
| 🟠 **P1** | Funksional bo'shliq — foydalanuvchi "tugallanmagan" deb sezadi |
| 🟡 **P2** | Design va UX |
| ⚪ **P3** | Sifat, infra, hujjat |

---

# 🔴 P0 — Production blokerlari

## P0-1 · Haqiqiy autentifikatsiya

- [ ] **Muammo:** Parol, hash, session, CSRF — hech biri yo'q. `/login` username'ni 3 ta hardcode ID'ga map qiladi, qolganini rad etadi. `User` modelida **email ham, parol ham yo'q**.
- **Qayerda:** `app/login/page.tsx:49-61`, `lib/actions.ts:216-223`, `prisma/schema.prisma:11-31`
- **Qilish:**
  1. `Auth.js (NextAuth v5)` Credentials provider yoki `iron-session` bilan o'z session'i.
  2. Schema: `email String @unique`, `passwordHash String`, `emailVerified DateTime?`.
  3. `bcrypt`/`argon2` bilan hash. Ochiq parol **hech qachon**.
  4. `/register` sahifasi — hozir umuman yo'q, faqat 3 demo user bor.
  5. Demo tugmalarini `NODE_ENV !== 'production'` ostiga olish.
- **Tayyor:** Yangi user email+parol bilan ro'yxatdan o'tadi; DB'da faqat hash; noto'g'ri parol rad etiladi.

## P0-2 · Cookie'ni `httpOnly` qilish va imzolash

- [ ] **Muammo:** `httpOnly: false` izohi bilan `// Allow client-side access if needed`. Cookie imzolanmagan — qiymati shunchaki `userId` matni.
- **Qayerda:** `lib/actions.ts:218-222`
- **Ekspluatatsiya:** Konsolda `document.cookie = "userId=org1; path=/"` → refresh → organizer dashboard. To'siq yo'q. Yoki `loginUser('org3')` ni to'g'ridan-to'g'ri chaqirib istalgan user sifatida kirish.
- **Qilish:** `httpOnly: true`, `secure: NODE_ENV === 'production'`, `sameSite: 'lax'`. Xom `userId` o'rniga imzolangan session token (P0-1 bilan birga).
- **Tayyor:** `document.cookie` session'ni ko'rsatmaydi; qo'lda o'zgartirilgan cookie rad etiladi.

## P0-3 · `middleware.ts` bilan markazlashgan route himoyasi

- [ ] **Muammo:** `middleware.ts` yo'q. Himoya har sahifada qo'lda takrorlangan va **`/dashboard`da butunlay tushib qolgan**.
- **Qayerda:** ildizda `middleware.ts` yaratilishi kerak
- **Joriy holat (hammasi 200 qaytaradi — tekshirilgan):**

  | Route | Kim ko'rishi kerak | Hozir | Izoh |
  |---|---|---|---|
  | `/dashboard` | organizer | 🔴 **hamma** | `dashboard/page.tsx:32` `cookie ?? 'org1'` → **login qilmagan odam `org1`ning butun dashboard'ini ko'radi** |
  | `/dashboard/participants` | organizer | 🟡 redirect bor | `participants/page.tsx:13-20` |
  | `/create` | organizer | 🟡 redirect bor | `create/page.tsx:12-21` |
  | `/saved`, `/profile` | login qilgan | 🟡 redirect bor | `saved/page.tsx:12`, `profile/page.tsx:30` |
  | `/messages`, `/results` | login qilgan | 🔴 **hamma** | `cookie ?? 'user1'` → mehmon `user1` bo'lib qoladi |

- **Qilish:** `middleware.ts` yozib, barcha guard'ni bitta joyga yig'ish. `dashboard/page.tsx:32` va `actions.ts:42` dagi `'org1'` fallback'larini **olib tashlash**. Server component ichida ham `redirect()` qoldirish (middleware'ni chetlab o'tishga qarshi).
- **Tayyor:** Login qilmagan holda `/dashboard` → `/login`. Player sifatida `/create` → `/feed`. Kodda `'org1'`/`'user1'` fallback qolmaydi.

## P0-4 · RBAC teshiklarini yopish

- [ ] **Muammo:** Server action'lar **mustaqil HTTP endpoint** — mijozdan to'g'ridan-to'g'ri chaqirilishi mumkin. Lekin ular `userId`ni **parametr sifatida** qabul qiladi va huquq tekshiruvi notekis.

  | Action | Satr | Tekshiruv | Ekspluatatsiya |
  |---|---|---|---|
  | `createTournament` | `:15` | `isOrganizer()` ✅ | Cookie o'zgartirish bilan chetlanadi (P0-2). `:42` da `'org1'` fallback |
  | `registerParticipant` | `:118` | teskari `isOrganizer()` ✅ | Limit/dublikat/status/sana yo'q → **P1-1** |
  | `updateParticipantStatus` | `:166` | 🔴 **hech qanday** | 13 satr: cookie o'qilmaydi, `isOrganizer` yo'q, egalik yo'q. `status` ham validatsiya qilinmaydi (`'banana'` yozish mumkin). `tournamentId` faqat `revalidatePath` uchun → soxta ID berib **boshqa organizatorning ishtirokchisini tasdiqlash** mumkin |
  | `toggleSaveTournament` | `:80` | 🔴 `userId` parametrda | Boshqa odam nomidan saqlash |
  | `sendMessage` | `:180` | 🔴 `senderId` parametrda | Boshqa odam nomidan xabar (hozir chaqirilmagani uchun jim) |
  | `loginUser` | `:216` | 🔴 istalgan `userId` | `loginUser('org1')` → to'g'ridan-to'g'ri organizer |

- **Qilish:**
  1. `userId`/`senderId` ni **parametr sifatida qabul qilishni to'xtatish** — har doim server'da session'dan olish.
  2. `lib/auth.ts` da `getCurrentUser()` / `requireOrganizer()` helper, har action boshida.
  3. `updateParticipantStatus`: `participant.tournament.organizerId === currentUser.id` tekshiruvi + `status` enum validatsiyasi.
  4. `sendMessage`: yuboruvchi shu `Conversation` a'zosimi (`ConversationParticipant`).
- **Tayyor:** Hech bir action mijozdan kelgan `userId`ga ishonmaydi; boshqa odam nomidan amal imkonsiz.

## P0-5 · Rol modelini `id` prefiksidan ajratish

- [ ] **Muammo:** Rol `userId.startsWith('org') || globalRank === 0` orqali aniqlanadi — **4 faylda takrorlangan**. `globalRank` reyting maydoni, rol maydoni emas. Yangi organizer `cuid()` ID oladi → `org` bilan boshlanmaydi → rol yo'qoladi. `verified` belgisi ham shu mantiqdan kelib chiqadi.
- **Qayerda:** `lib/actions.ts:9-13`, `app/(main)/layout.tsx:23`, `app/(main)/messages/page.tsx:30`, `app/(main)/results/page.tsx:30`; `verified`: `feed/page.tsx:42`, `tournament/[id]/page.tsx:44`
- **Qilish:** `enum Role { PLAYER ORGANIZER ADMIN }` + `User.role Role @default(PLAYER)` + `User.verified Boolean @default(false)`. Migratsiyada `org*` ID'larni `ORGANIZER`ga o'tkazish. `isOrganizer()` ni bitta joyga yig'ib, `globalRank === 0` mantiqini butunlay olib tashlash.
- **Tayyor:** Rol faqat `User.role`dan o'qiladi; `startsWith('org')` kodda qolmaydi.

## P0-6 · `JSON.parse` ni himoyalash — sahifa 500 beradi

- [ ] **Muammo:** `rulesJson` / `requirementsJson` `String`da JSON saqlanadi va **4 joyda try/catch'siz** parse qilinadi. Buzuq JSON (qo'lda INSERT, bo'sh string, eski data) → throw → **butun sahifa 500**, va `error.tsx` yo'q (P1-9) → Next.js xom xato ekrani.
- **Qayerda:** `feed/page.tsx:45-46`, `saved/page.tsx:52-53`, `tournament/[id]/page.tsx:47-48`, `profile/page.tsx:82-83`
- **Qilish:** Qisqa muddatda `safeParseJson(str, [])` helper. Uzoq muddatda MySQL `Json` tipiga migratsiya (P1-6).
- **Tayyor:** DB'da buzuq JSON bo'lsa ham sahifa ochiladi, bo'sh ro'yxat ko'rsatadi.

## P0-7 · DB uzilsa butun sayt o'ladi

- [ ] **Muammo:** `app/(main)/layout.tsx:17` da `db.user.findUnique` **try/catch'siz**. DB o'chsa `(main)` guruhidagi **8 sahifa birdan** ishlamaydi. `lib/actions.ts`dagi **hech bir** `db.*` chaqiruvi try/catch'da emas.
- **Qayerda:** `app/(main)/layout.tsx:17`; try/catch **yo'q**: `feed/page.tsx`, `saved/page.tsx`, `profile/page.tsx`, `tournament/[id]/page.tsx`, `dashboard/page.tsx`, `rankings/page.tsx`, `participants/page.tsx`, `lib/actions.ts` (`:55`, `:87-111`, `:147`, `:171`, `:193-211`)
- **Yaxshi misol bor:** `app/page.tsx:27-31` va `messages/page.tsx:21-33` to'g'ri qilgan — shu patternni ko'chirish.
- **Qilish:** `(main)/layout.tsx`ni try/catch bilan o'rash + P1-9 (`error.tsx`).
- **Tayyor:** DB o'chirilgan holatda chiroyli xato sahifasi chiqadi, oq ekran emas.

## P0-8 · Xavfsizlik header'lari — bitta ham yo'q

- [ ] **Muammo:** `next.config.mjs` (8 satr) faqat `typescript` va `images` kalitlarini saqlaydi — `headers()` **yo'q**, `middleware.ts` ham yo'q (P0-3). Ya'ni saytda **CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy — hech biri qaytarilmaydi**.
- **Qayerda:** `next.config.mjs:1-10`
- **Nega muhim:** CSP yo'qligi XSS'ni to'liq ekspluatatsiya qilinadigan qiladi. `X-Frame-Options` yo'qligi clickjacking'ga yo'l qo'yadi — login formasi (P0-1) shaffof iframe'da o'ralishi mumkin. Cookie `httpOnly: false` (P0-2) bilan birga bu zanjir: XSS → session o'g'irlash → to'liq organizer huquqi.
- **Qilish:**
  1. `next.config.mjs`ga `async headers()` — `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
  2. CSP'ni `middleware.ts`da nonce bilan (P0-3 bilan birga) — Next.js inline script'lari uchun `'unsafe-inline'` emas, `nonce-{random}` kerak.
  3. `next/font/google` ishlatilgani uchun `font-src 'self'`+Google Fonts domenini CSP'ga kiritish (`layout.tsx:2,6-7`).
- **Tayyor:** `curl -I https://<domen>` barcha header'ni ko'rsatadi; securityheaders.com'da ≥A baho; konsolda CSP buzilish xabari yo'q.

## P0-9 · Rate limiting — login brute-force'ga ochiq

- [ ] **Muammo:** Hech bir server action'da rate limit yo'q. Hozir parol yo'qligi uchun (P0-1) bu "jim" muammo, lekin parol qo'shilgan **zahoti** `/login` cheksiz urinishga ochiq bo'ladi. Server action'lar mustaqil HTTP endpoint (P0-4) — formadan emas, `fetch` bilan sekundda minglab chaqirish mumkin.
- **Qayerda:** `lib/actions.ts` — barcha action; ayniqsa `loginUser:216`, kelgusi `registerUser`, `registerParticipant:118`, `createTournament:15`
- **Qo'shimcha xavf:** `createTournament` limitsiz → bitta organizer DB'ni minglab turnir bilan to'ldirishi mumkin. `registerParticipant` limitsiz → sig'im guard'i (P1-1) qo'shilgandan keyin ham poyga holati (race condition) qoladi.
- **Qilish:**
  1. Kutubxona: `@upstash/ratelimit` + Upstash Redis (serverless'da ishlaydi), yoki bitta instance uchun in-memory `lru-cache`.
  2. `lib/rate-limit.ts` helper → `await limit(ip, 'login', { max: 5, window: '15m' })`.
  3. IP'ni `headers()`dan (`x-forwarded-for`) olish — Netlify proxy ortida `request.ip` ishonchsiz.
  4. Login uchun IP **va** email bo'yicha alohida hisoblagich (bitta IP'dan ko'p user bo'lishi mumkin).
  5. Limit oshganda `{ ok: false, error: 'Juda ko'p urinish, 15 daqiqadan keyin qayta urinib ko'ring' }` → toast (P1-2).
- **Tayyor:** 6-chi noto'g'ri parol urinishi rad etiladi; `registerParticipant`ni 100 marta chaqirish bloklanadi.

---

# 🟠 P1 — Funksional to'liqlik

## P1-1 · Ro'yxatdan o'tish biznes-qoidalari — 4 ta guard yo'q

- [ ] **Muammo:** `registerParticipant` hech narsani tekshirmaydi:
  - **Sig'im:** `tournament.maxParticipants` o'qiladi (`:123`), lekin **taqqoslanmaydi**. 16 o'rinli turnirga 1000 kishi yozilishi mumkin; `participantPercentage` 100%dan oshadi.
  - **Dublikat:** `@@unique([tournamentId, userId])` **yo'q**, action'da `findFirst` guard **yo'q**. UI tugmani yashiradi (`tournament/[id]/page.tsx:56-61`), lekin ikki tab'da yoki to'g'ridan-to'g'ri chaqirishda dublikat yaratiladi.
  - **Status:** `tournament.status` tekshirilmaydi.
  - **Sana:** `tournament.date` tekshirilmaydi. UI "Registration closes on {date}" deb yozadi (`tournament-client.tsx:399-401`) — bu **shunchaki matn**, logika yo'q.
- **Qayerda:** `lib/actions.ts:118-164`, `prisma/schema.prisma:93-106`
- **Qilish:** Schema'ga `@@unique([tournamentId, userId])` + migratsiya. Action'ga 4 ta guard. Xatoni toast bilan ko'rsatish (P1-8).
- **Tayyor:** Ikkinchi marta yozilish rad etiladi; to'lgan/yopilgan/o'tgan turnirga yozilish imkonsiz.

## P1-2 · Toast tizimini ulash — xatolar foydalanuvchiga ko'rinmaydi

- [ ] **Muammo:** `app/layout.tsx:26-28`da **`<Toaster />` yo'q**. `components/ui/toaster.tsx`, `components/ui/sonner.tsx`, `hooks/use-toast.ts` — hech qayerda import qilinmaydi. Natijada server action xatolari **butunlay yo'qoladi**:
  - `actions.ts:52` `throw new Error('Only organizers can create tournaments')` → `create-client.tsx:157-159` `catch { console.error(err) }` → foydalanuvchi faqat "Creating..." → "Create Tournament"ga qaytganini ko'radi. **Sabab yo'q.**
  - `actions.ts:138` `throw new Error('Organizers cannot register...')` → `tournament-client.tsx:118-120` — xuddi shunday jim.
- **`console.error` bilan yashirilgan 5 joy:** `create-client.tsx:158`, `tournament-client.tsx:119`, `login/page.tsx:30,73`, `auth-modal.tsx:90,127`
- **Qo'shimcha:** `components/theme-provider.tsx:11-12` `console.error`ni **override qiladi** — xatolarni bo'g'adi. Olib tashlash kerak.
- **Qilish:** `<Toaster />`ni root layout'ga qo'shish. Action'lar `throw` o'rniga `{ ok: false, error }` qaytarsin (yoki `useActionState`). Har bir `catch`da `toast.error()`.
- **Tayyor:** Har bir rad etilgan amal sababini tushunarli toast sifatida ko'rsatadi.

## P1-3 · Messaging'ni real DB'ga ulash

- [ ] **Muammo:** `/messages` `lib/channels-data.ts`dan `useState` bilan o'qiydi. DB'da `Conversation`/`Message`/`ConversationParticipant` modellari bor, seed 5 conversation + 17 xabar yaratadi — **hech kim ko'rmaydi**. Uchala model **butunlay o'lik**. `sendMessage()` action yozilgan, lekin **hech qayerda chaqirilmagan**.
- **Eng yomoni:** javoblar `setTimeout` bilan **soxta auto-javob** generatsiya qiladi (`messages-client.tsx:293-318`), ticket raqami `Math.random()` (`:179`). Hech narsa saqlanmaydi.
- **Qayerda:** `messages/page.tsx` (DB'ni faqat ism uchun o'qiydi), `messages-client.tsx:11,60-62,237-265,293-318`, `lib/actions.ts:180-214`
- **Qilish:** Conversation+Message+a'zolarni `include` bilan o'qish → client'ga prop sifatida berish → forma'ni `sendMessage`ga ulash → `unreadCount`ni haqiqiy hisoblash → soxta auto-javobni o'chirish → `channels-data.ts`ni o'chirish.
- **Tayyor:** Xabar DB'ga saqlanadi va refresh'dan keyin ham ko'rinadi.
- **Alternativa:** Agar messaging MVP'da kerak bo'lmasa — sahifani ham, 3 modelni ham **butunlay olib tashlash**. Yarim ishlaydigan maket qoldirishdan ko'ra toza.

## P1-4 · Natijalar (Results) modulini real qilish

- [ ] **Muammo:** `/results` `lib/results-data.ts`dan `useState` bilan o'qiydi. Organizer "Edit Match" faqat local state'ni o'zgartiradi (`results-client.tsx:303-315`) — **refresh'da yo'qoladi**. DB'da `Match` modeli bor, lekin `/results` undan foydalanmaydi.
- **Qayerda:** `results-client.tsx:8,166,303-315`, `prisma/schema.prisma:54-65`
- **Muammo 2 — `Match` modeli noto'g'ri shaklda:** hozir u bitta foydalanuvchining tarixi (`userId`, `opponent` **matn** sifatida, `score` **matn**). Haqiqiy match uchun kerak: `homeParticipantId`, `awayParticipantId`, `homeScore Int`, `awayScore Int`, `stage`, `status`, `scheduledAt DateTime`.
- **Qilish:** `Match`ni qayta modellashtirish → `recordMatchResult` action (organizer huquqi bilan) → natija kiritish formasi → `results-client`ni DB'ga ulash → profil `matchHistory`ni shu modeldan hisoblash.
- **Tayyor:** Organizer natija kiritadi → `/results`da ko'rinadi → profilda ham aks etadi.
- **Eslatma:** Eng katta hajmli task. Schema o'zgaradi — P1-6 bilan birga rejalashtiring.

## P1-5 · Turnir va profil CRUD'ini tugatish

- [ ] **Muammo:** Turnir faqat **yaratiladi**. `db.tournament.update` / `.delete` kodda **umuman yo'q**.

  | Amal | Holat | Dalil |
  |---|---|---|
  | Turnir tahrirlash | ❌ yo'q | Dashboard'da faqat `ExternalLink` havola (`dashboard/page.tsx:199-203`) |
  | Turnir o'chirish | ❌ yo'q | `alert-dialog.tsx` tayyor turibdi, ishlatilmagan |
  | **Status o'zgartirish** | ❌ yo'q | `actions.ts:71` har doim `'registration_open'`da **qotib qoladi** → ro'yxat abadiy ochiq; `tournament-client.tsx:350-421`dagi barcha status shoxlari faqat seed data uchun ishlaydi |
  | Ishtirokchini o'chirish | ❌ yo'q | Foydalanuvchi registratsiyani bekor qila olmaydi |
  | **Profil tahrirlash** | ❌ yo'q | `profile-header.tsx:73` `onClick={onEdit}` — lekin `profile/page.tsx:114` `onEdit` **bermaydi** → tugma o'lik |
  | Signup | ❌ yo'q | → P0-1 |
  | Poster yuklash | ❌ yo'q | `create-client.tsx:427-435` — `<input type="file">` yo'q, faqat `cursor-pointer` div |
  | "Save Draft" | ❌ yo'q | `create-client.tsx:441-444` — `onClick` yo'q |

- **Qilish:** `updateTournament`, `deleteTournament`, `setTournamentStatus`, `removeParticipant`/`unregister`, `updateProfile` action'lari + UI. Har biri huquq tekshiruvi bilan (P0-4).
- **Tayyor:** Organizer o'z turnirini tahrirlaydi, statusini o'zgartiradi, o'chiradi; foydalanuvchi profilini tahrirlaydi.

## P1-6 · Schema sifatini tuzatish

- [ ] **Muammo A — sanalar `String` tipida (7 maydon):** `User.joinedDate:21`, `Achievement.date:38`, `Match.date:62`, `Tournament.date:73`, `Tournament.endDate:74`, `Participant.registeredAt:98`, `Conversation.lastMessageTime:120`, `Message.timestamp:148`
  - `orderBy: { date: 'asc' }` (`feed/page.tsx:15`, `participants/page.tsx:25`) → **leksikografik** saralash. ISO `YYYY-MM-DD` uchun tasodifan ishlaydi, boshqa formatda buziladi.
  - `new Date(tournament.date)` 2 joyda (`dashboard/page.tsx:183`, `tournament-client.tsx:195`) → noto'g'ri string → **`Invalid Date`**.
  - Sana bilan taqqoslash imkonsiz → shu sababli "turnir o'tib ketganmi" guard'i yo'q (P1-1).
- **Muammo B — `Tournament.time` formatlari aralash:** seed `'10:00 AM'` (`seed.js:198`), `<input type="time">`dan `'10:00'`, default `'12:00 PM'` (`actions.ts:62`) → UI'da bir xil ko'rinmaydi.
- **Muammo C — `rulesJson`/`requirementsJson`:** `String`da JSON → P0-6. MySQL `Json` tipiga yoki alohida `TournamentRule` jadvaliga.
- **Muammo D — pul `String`da:** `prizePool`/`entryFee` (`:83-84`) va `"$"` kodda yopishtiriladi (`actions.ts:39-40`). `Decimal` + `currency` kerak. Hozir `entryFee !== 'Free'` matniga ishonadi (`:155`) — `'free'`, `'0'`, `''` hammasi "pullik" deb hisoblanadi. Live Preview'da `$20,000,000 UZS` chiqadi (`create-client.tsx:519,525`).
- **Muammo E — `status`/`category` erkin `String`:** tipografik xato DB'ga tushadi, `categoryIcons[...]` `undefined` beradi. Prisma `enum` kerak.
- **Muammo F — `Participant.email` uydirma:** `actions.ts:150` `user.username + '@tuit.uz'`. P0-1 bilan hal bo'ladi.
- **Qilish:** Yuqoridagilarni **bitta migratsiyada** yig'ib o'zgartirish + `seed.js`ni yangi tiplarga moslash.
- **Tayyor:** Sanalar to'g'ri saralanadi; enum tashqarisidagi qiymat DB'ga tushmaydi; `prisma validate` toza.

## P1-7 · Yarim-soxta data'ni tozalash

- [ ] **Muammo:** Bir qancha sahifa real data ustiga **uydirma raqam** qo'shadi. Foydalanuvchi buni ishonchli deb qabul qiladi.

  | Joy | Nima soxta |
  |---|---|
  | `rankings/page.tsx:25-27` | `change`/`changeAmount` — simulyatsiya |
  | `rankings-client.tsx:176,196` | Weekly/Monthly tab'lar — `points * 0.08` / `* 0.28` arifmetikasi |
  | `rankings-client.tsx:44,151` | Sport filtri **hech narsa filtrlamaydi** — faqat sarlavhada ko'rinadi |
  | `dashboard/page.tsx:24-28` | `teamMembers` hardcode |
  | `dashboard/page.tsx:107-112` | `recentActivity` hardcode |
  | `dashboard/page.tsx:101` | `'Success Rate': '92%'` hardcode |
  | `dashboard/page.tsx:97,103` | `trend` qiymatlari hardcode |
  | `navbar.tsx:44` | Messages badge `3` hardcode |
  | `app/page.tsx:66-68` | Fallback raqamlar `'10+'/'8'/'24+'` |
  | `profile/page.tsx:199` | "Upcoming" tab har doim bo'sh |
  | `rankings/page.tsx:16` | `sportRanks` `include` qilinadi-u **ishlatilmaydi** |

- **Qilish:** Har birini yo haqiqiy hisoblash, yo UI'dan olib tashlash. Oraliq variant: "Coming soon" deb belgilash — lekin soxta raqam ko'rsatishdan ko'ra yaxshi.
- **Tayyor:** Ekranda ko'rsatilgan har bir raqam DB'dan hisoblangan.

## P1-8 · Validatsiya — `zod` o'rnatilgan, 0 marta ishlatilgan

- [ ] **Muammo:** `zod@^3.24.1` dependency'da bor, `grep "from 'zod'"` → **0 natija**. `react-hook-form` ham faqat ishlatilmagan `components/ui/form.tsx`da. `@hookform/resolvers` umuman ishlatilmaydi.
- **`createTournament` validatsiyasiz** (`actions.ts:57-72`) — faqat `|| 'default'` fallback'lar:
  - Bo'sh forma → DB'ga `"Untitled Tournament"` yoziladi.
  - `maxParticipants: '-5'` → `parseInt` `-5` qaytaradi, `|| 32` **ishga tushmaydi** (chunki `-5` truthy) → **manfiy sig'imli turnir**.
  - `maxParticipants: '999999999'` ham o'tadi.
  - `date` o'tgan sana bo'lishi tekshirilmaydi; `category` enum tekshirilmaydi.
- **Client'da ham yo'q:** `create-client.tsx:153-162` `handleSubmit` hech narsa tekshirmaydi; hech bir `<Input>`da `required` yo'q; tugma faqat `isSubmitting`da disable bo'ladi.
- **Qilish:** `lib/schemas.ts` da har action uchun `zod` schema → action boshida `parse` → client'da `zodResolver` bilan `react-hook-form`. `teamName` uzunligini ham cheklash (`tournament-client.tsx:114`).
- **Tayyor:** Bo'sh yoki noto'g'ri forma server'ga o'tmaydi; manfiy/haddan tashqari qiymatlar rad etiladi.

## P1-9 · `error.tsx` va `not-found.tsx` qo'shish

- [ ] **Muammo:** `find app -name "error.tsx" -o -name "not-found.tsx" -o -name "global-error.tsx"` → **bo'sh**. DB uzilishi (P0-7), `JSON.parse` throw (P0-6), `notFound()` (`tournament/[id]/page.tsx:26`) — hammasi Next.js xom xato ekraniga olib boradi.
- **Qilish:** `app/error.tsx`, `app/not-found.tsx`, `app/global-error.tsx`, `app/(main)/error.tsx`. `components/empty-state.tsx`ni asos qilib (u `icon`/`title`/`description`/`action` propslarini allaqachon qo'llab-quvvatlaydi), "Qayta urinish" tugmasi bilan.
- **Tayyor:** DB o'chirilgan holatda va mavjud bo'lmagan turnir ID'da chiroyli sahifa chiqadi.

## P1-10 · Hardcoded `'user1'` / `'org1'`ni tozalash

- [ ] **Muammo:** `'user1'` **11 joyda**. Eng yomoni `saved-client.tsx:17` — `toggleSaveTournament(id, 'user1')` literal.
- **Nozik detal:** `actions.ts:82` va `:130`dagi `|| finalUserId === 'user1'` sharti **sababli** bu literal hozir cookie bilan almashtiriladi — ya'ni **tasodifan to'g'ri ishlayapti**. Lekin: (1) haqiqiy `user1` login qilganda ham ortiqcha cookie o'qish yo'li bosiladi; (2) `'user2'` kabi boshqa literal berilsa himoya yo'q; (3) cookie yo'q bo'lsa `'user1'`ga tushadi.
- **Qayerda:** `actions.ts:82,84,130,132,182,184`; `saved-client.tsx:17`; `messages/page.tsx:15`; `results/page.tsx:15`; `'Abbos Qurbonov'`/`/avatars/alex.jpg` fallback'lari `messages/page.tsx:17-18`, `results/page.tsx:17-18`; `'org1'`: `actions.ts:42`, `dashboard/page.tsx:32`
- **Qilish:** Barcha fallback'ni olib tashlash. Session yo'q → `redirect('/login')`, jim turib `user1`ga aylanmaslik.
- **Tayyor:** `grep -rn "'user1'\|'org1'" app components lib` faqat demo-login mapping'ini topadi.

## P1-11 · O'lik route havolalarini tuzatish — 16 ta 404

- [ ] **Muammo:** Navbar va footer mavjud bo'lmagan sahifalarga havola qiladi.
  - **`/settings`** — route **yo'q**, lekin `navbar.tsx:181` va `landing-navbar.tsx:161`da havola bor → 404.
  - **Footer'da 15 ta yo'q route** (`footer.tsx:5-29`): `/features`, `/pricing`, `/organizers`, `/app`, `/about`, `/careers`, `/blog`, `/press`, `/help`, `/community`, `/docs`, `/partners`, `/privacy`, `/terms`, `/cookies` — **barchasi 404**.
  - 3 ta `href="#"` ijtimoiy havola (`footer.tsx:124,130,136`).
- **Qilish:** `/settings` sahifasini yasash (profil tahrirlash + tema + logout — P1-5 bilan birga). Footer havolalarini: kerakli bo'lsa sahifa yasash, aks holda **olib tashlash**. Ijtimoiy havolalarni haqiqiy URL bilan to'ldirish yoki o'chirish.
- **Tayyor:** Saytdagi hech bir havola 404 bermaydi.

## P1-12 · Ishlamaydigan tugmalarni tozalash

- [ ] **Muammo:** `onClick` berilmagan yoki hech narsa saqlamaydigan elementlar foydalanuvchini chalg'itadi.

  | Element | Qayerda | Jiddiylik |
  |---|---|---|
  | "Follow Organizer" / "Join Channel" checkbox'lari — faqat `useState`, serverga yuborilmaydi | `tournament-client.tsx:370-387` (state `:78-79`) | o'rta |
  | "Email All Participants" — `onClick` yo'q | `participants-client.tsx:359-362` | o'rta |
  | Mail / MoreHorizontal (ishtirokchi qatorida) | `participants-client.tsx:249-254` | o'rta |
  | Share2 tugmasi | `tournament-client.tsx:155-157`, `profile-header.tsx:83` | past |
  | Bell (notification) | `navbar.tsx:127-130`, `landing-navbar.tsx:111` | past |
  | "Settings" tugmasi (dashboard header) | `dashboard/page.tsx:132-135` | past |
  | Team Members "+" | `dashboard/page.tsx:272-274` | past |
  | Search ikonkasi — qidiruv maydoni emas, `/feed`ga havola | `navbar.tsx:120-125` | past |
  | MoreHorizontal (profil) | `profile-header.tsx:86` | past |

- **Qilish:** Har birini yo ishga ulash, yo UI'dan olib tashlash. Yarim ishlaydigan tugma — yo'q tugmadan yomon.
- **Tayyor:** Bosiladigan har bir element biror ish qiladi.

## P1-13 · Optimistik UI rollback'siz

- [ ] **Muammo:** Avval `useState` o'zgaradi, keyin action chaqiriladi. **Action throw qilsa state teskari qaytmaydi** → UI DB bilan mos kelmaydi.
- **Qayerda:** `feed-client.tsx:40-43`, `saved-client.tsx:16-17`, `tournament-client.tsx:93-94`, `participants-client.tsx:109-115`. `participants-client.tsx:349-353` "Approve All Pending" — har pending uchun alohida `startTransition` (N ta parallel), xato boshqarilmaydi.
- **Qilish:** React 19 `useOptimistic` ishlatish yoki `catch`da state'ni qaytarish + toast (P1-2).
- **Tayyor:** Rad etilgan amalda UI eski holatga qaytadi va sabab ko'rsatiladi.

## P1-14 · `revalidatePath` bo'shliqlari va buzilgan SPA navigatsiya

- [ ] **Muammo A — yetishmayotgan revalidate'lar:**

  | Action | Hozir | Yetishmaydi | Ta'sir |
  |---|---|---|---|
  | `createTournament` `:76` | `/feed` | `/dashboard`, `/` | Yangi turnir dashboard'da ko'rinmaydi |
  | `toggleSaveTournament` `:114-115` | `/feed`, `/saved` | `/tournament/[id]` | Detal sahifada bookmark ikonkasi eskicha |
  | `registerParticipant` `:161-163` | `/tournament/[id]`, `/dashboard/participants`, `/feed` | `/profile`, `/dashboard`, `/saved`, `/` | Profil "Tournaments" tab'ida yangi registratsiya ko'rinmaydi |
  | `updateParticipantStatus` `:176-177` | `/dashboard/participants`, `/tournament/[id]` | `/dashboard`, `/profile` | Dashboard'dagi pending/approved hisoblari eskicha |

- **Muammo B — `loginUser`/`logoutUser` hech narsa revalidate qilmaydi** (`:216-228`). Shu sababli kod hamma joyda `window.location.href` / `reload()` ishlatadi (`login/page.tsx:26,67`, `navbar.tsx:190`, `auth-modal.tsx:76,79`) → **to'liq sahifa qayta yuklanadi, SPA navigatsiya buzilgan**.
- **Qilish:** `revalidatePath('/', 'layout')` yoki to'liq ro'yxat. Login/logout'dan keyin `router.refresh()` ishlatib, `window.location`dan voz kechish.
- **Tayyor:** Amaldan keyin barcha tegishli sahifa yangilanadi; login/logout'da sahifa qayta yuklanmaydi.

## P1-15 · N+1 so'rovlar — 6 joyda, sahifa ochilishi turnir soniga proporsional sekinlashadi

- [ ] **Muammo:** Har bir sahifa turnirlar ro'yxatini olib, keyin **har bir turnir uchun alohida** `db.participant.count()` chaqiradi. `Promise.all` bu so'rovlarni **parallel** qiladi, lekin soni kamaytirmaydi — 50 turnir = **51 so'rov**.

  | Joy | Satr | So'rov soni |
  |---|---|---|
  | `feed/page.tsx` — asosiy ro'yxat | `:22` | 1 + N |
  | `feed/page.tsx` — highlights (yana shu turnirlar!) | `:66` | + 10 gacha **takroriy** |
  | `saved/page.tsx` | `:29` | 1 + N |
  | `dashboard/page.tsx` | `:55` | 1 + N |
  | `profile/page.tsx` | `:61` | 1 + N |
  | `tournament/[id]/page.tsx` — related | `:92` | 1 + 3 |

  `/feed` eng yomoni: bir xil turnir uchun `count` **ikki marta** bajariladi (`:22` va `:66`).
- **Qo'shimcha — `rankings/page.tsx:12-19`:** `include: { matchHistory: true }` bilan **barcha** foydalanuvchining **barcha** matchini yuklab, keyin JS'da `filter(m => m.result === 'win').length` hisoblaydi (`:24`). 1000 user × 50 match = 50 000 satr RAM'ga, faqat raqam olish uchun. `sportRanks` ham yuklanadi va **ishlatilmaydi** (P1-7).
- **Qilish:**
  1. `count` o'rniga Prisma `_count`: `include: { organizer: true, _count: { select: { participants: true } } }` → `t._count.participants`. **Bitta** so'rov.
  2. `feed/page.tsx`da bitta `tournamentsRaw`dan ikkala ro'yxatni (`tournaments` va `dynamicHighlights`) qurish — ikkinchi marta `count` qilmaslik.
  3. Rankings: `matchHistory` o'rniga `_count: { select: { matchHistory: { where: { result: 'win' } } } }`.
  4. `P3-8` (keshlash) bilan birga qilish — `force-dynamic` olib tashlanganda bu so'rovlar kesh ortida qoladi.
- **Tayyor:** Prisma log'da har sahifa uchun so'rov soni **turnir sonidan mustaqil**; `/feed` 3-4 so'rov bilan ochiladi.

## P1-16 · Pagination yo'q — butun jadval har so'rovda yuklanadi

- [ ] **Muammo:** `take`/`skip`/`cursor` butun loyihada **faqat 2 joyda** bor (`app/page.tsx:46` — landing'dagi 3 ta turnir, `tournament/[id]/page.tsx:84` — 3 ta related). Qolgan hamma joyda `findMany` **limitsiz**:

  | Sahifa | So'rov | 1000 yozuvda nima bo'ladi |
  |---|---|---|
  | `/feed` | barcha turnir + organizer | Butun jadval server'da map qilinadi, keyin **to'liq** client'ga JSON sifatida yuboriladi |
  | `/rankings` | barcha ranked user + barcha match | P1-15 dagi RAM muammosi |
  | `/dashboard/participants` | barcha ishtirokchi | Organizer 5 turnir × 200 kishi = 1000 qator DOM'da |
  | `/saved`, `/profile` | barcha saqlangan / registratsiya | Odatda kichik, lekin chegarasi yo'q |

- **Jiddiyroq tomoni:** `/feed` butun ro'yxatni client'ga yuboradi, chunki filtrlash client'da (→ P1-17). Ya'ni pagination qo'shish uchun **avval filtrlashni server'ga ko'chirish** kerak — ikkisi bitta ish.
- **Qilish:** `searchParams.page` + `take: 20, skip: (page-1)*20` yoki cursor-based (feed uchun "Load more" tugmasi tabiiyroq). Jami sonni `db.tournament.count()` bilan olib, pagination komponentini ko'rsatish — `components/ui/pagination.tsx` **allaqachon bor va ishlatilmaydi**.
- **Tayyor:** Seed'ga 500 turnir qo'yilganda `/feed` sekinlashmaydi; birinchi yuklanishda 20 ta karta keladi.

## P1-17 · Qidiruv va filtrlash client'da — URL'da saqlanmaydi, server'ga yetib bormaydi

- [ ] **Muammo:** `feed-client.tsx:47-77` butun filtrlashni **brauzerda** bajaradi: `initialTournaments.filter(...)` — qidiruv matni, sport, lokatsiya, status. `SearchFilters` (`search-filters.tsx:55-66`) ham holatni faqat `useState`da saqlaydi.
- **Natijalari:**
  - **Shareable URL yo'q:** "futbol turnirlar" filtri qo'llangan sahifani havola qilib yuborish mumkin emas — `/feed` har doim bo'sh filtr bilan ochiladi.
  - **Refresh'da filtr yo'qoladi**, "back" tugmasi filtrni tiklamaydi.
  - **SEO:** sport/lokatsiya bo'yicha sahifalar indekslanmaydi (→ P1-18).
  - **Pagination bilan mos emas** (P1-16): server 20 ta yuborsa, client faqat shu 20 tasini filtrlaydi → "hech narsa topilmadi" noto'g'ri chiqadi.
  - `rankings-client.tsx:43-44` — xuddi shu, ustiga sport filtri **umuman ishlamaydi** (P1-7).
- **Qilish:** Filtrlarni `searchParams`ga ko'chirish (`/feed?sport=football&status=registration_open&q=...`) → server component'da Prisma `where` qurish → `useRouter().replace()` bilan URL'ni yangilash (`useSearchParams` + `nuqs` yoki qo'lda `URLSearchParams`). Qidiruv uchun debounce (300ms).
- **Tayyor:** Filtr qo'llangach URL o'zgaradi; shu URL'ni yangi tab'da ochganda aynan shu natija chiqadi; filtr server'da bajariladi.

## P1-18 · SEO va ulashish (share) metadata'si — 11 route'dan 3 tasida bor

- [ ] **Muammo A — `generateMetadata` butun loyihada 0 marta:** `/tournament/[id]` dinamik sahifasi **o'z sarlavhasini bermaydi** → root'dagi "Tourney Up — Find your next bracket" ishlatiladi. Natijada **har bir turnir havolasi Telegram/WhatsApp/Twitter'da bir xil ko'rinadi**. Bu turnir ulashish platformasi uchun asosiy funksiya.
- **Muammo B — `openGraph`/`twitter` kalitlari yo'q:** `app/layout.tsx:9-14`da faqat `title`/`description`/`keywords`/`authors`. OG rasm yo'q → havola oldindan ko'rinishida **rasmsiz oddiy matn**. `metadataBase` ham yo'q → nisbiy rasm yo'llari ishlamaydi.
- **Muammo C — mavjud 2 metadata noto'g'ri:** `results/page.tsx:8-11` va `messages/page.tsx:8` `title: 'Match Results & Live Center | TourneyUp'` — lekin root'da `template: '%s | Tourney Up'` (`layout.tsx:10`) → natija **"Match Results & Live Center | TourneyUp | Tourney Up"** (ikki marta brend). Qo'shimcha: brend nomi ikki xil yozilgan — `TourneyUp` va `Tourney Up`.
- **Muammo D — metadata'siz 8 route:** `/feed`, `/rankings`, `/profile`, `/saved`, `/create`, `/dashboard`, `/dashboard/participants`, `/login`, `/tournament/[id]`.
- **Muammo E:** `manifest.json`/`manifest.ts` yo'q (`public/`da ikon'lar bor: `icon.svg`, `icon-light-32x32.png`, `icon-dark-32x32.png`, `apple-icon.png`, `logo.png` — lekin manifest ularni bog'lamaydi) → telefon ekraniga qo'shish ishlamaydi.
- **Qilish:**
  1. `layout.tsx`ga `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!)` + `openGraph` + `twitter: { card: 'summary_large_image' }`. Brend nomini **bitta** variantga keltirish.
  2. `/tournament/[id]`ga `generateMetadata` — turnir nomi, sport, sana, tashkilotchi; `notFound` holatini ham hisobga olish.
  3. `app/tournament/[id]/opengraph-image.tsx` — Next.js `ImageResponse` bilan dinamik OG rasm (turnir nomi + sport + sana). Rasm yuklash (P2-9) hal bo'lmaganda ham ishlaydi.
  4. 8 route'ga `metadata` (private sahifalarga `robots: { index: false }` — `/dashboard`, `/profile`, `/saved`, `/messages`).
  5. `app/manifest.ts` + `app/sitemap.ts` + `app/robots.ts` (→ P3-10).
  6. `title` suffikslarini olib tashlab, root `template`ga tayanish.
- **Tayyor:** Turnir havolasini Telegram'ga tashlaganda turnir nomi, tavsifi va rasmi chiqadi; sarlavhada brend ikki marta takrorlanmaydi.

---

# 🟡 P2 — Design yangilash

> Joriy palitra saqlanadi. Ishlar tartibi: **avval ishlamayotgan token'lar**, keyin kontrast, keyin ko'chirish.

## P2-1 · 🔴 `--success` / `--warning` token'lari **mavjud emas** — badge'lar ko'rinmaydi

- [ ] **Muammo:** Kodda `bg-success`, `text-success`, `bg-warning`, `text-warning` **20+ joyda** ishlatiladi, lekin `app/globals.css`da `--success` ham, `--warning` ham **yo'q** (`styles/globals.css`da ham yo'q). Tailwind v4'da `@theme`ga kiritilmagan rang uchun utility **umuman generatsiya qilinmaydi**.
- **Natija:** "Live" status badge'i fonsiz → `text-white` oq matn shaffof fonda → **ko'rinmaydi**. Win/loss badge'lari rangsiz. "Join Tournament" tugmasi (`bg-success`) fonsiz. Approve/reject badge'lari bir-biridan farq qilmaydi.
- **Qayerda:** `tournament-card.tsx:41,206`; `tournament-client.tsx:41,271,342`; `participants-client.tsx:41,42,47,48,232,311,320`; `profile/page.tsx:21,23`; `dashboard/page.tsx:309`; `stats-card.tsx:34`; `ranking-table.tsx:59`; `profile-header.tsx:126`; `participant-slots.tsx:62`; `login/page.tsx:108`
- **Qilish:** `:root` va `.dark`ga `--success`, `--success-foreground`, `--warning`, `--warning-foreground` qo'shish; `@theme inline`ga `--color-success: var(--success)` va h.k. map qilish. Keyin `text-white`larni `text-success-foreground`ga almashtirish.
- **Tayyor:** Barcha status badge'lari ikkala rejimda rangli va o'qiladi.
- **Baho:** ~15 daqiqa ish, eng katta vizual ta'sir. **Birinchi shuni qiling.**

## P2-2 · 🔴 Mavjud bo'lmagan utility klasslar — jim ishlamaydigan stillar

- [ ] **Muammo:** 4 ta klass hech qayerda ta'riflanmagan, lekin ishlatiladi:

  | Klass | Qayerda | Natija |
  |---|---|---|
  | `h-safe-area-inset-bottom` | `mobile-nav.tsx:91` | 🔴 **iPhone home-indicator safe area ishlamaydi** — FAB/nav home bar ostida qoladi |
  | `glow-primary` | `mobile-nav.tsx:54`, `ranking-table.tsx:179`, `search-filters.tsx:310`, `tournament-card.tsx:129`, `login/page.tsx:88,98` | Featured card va podium 1-o'rin "porlashi" yo'q |
  | `scrollbar-hide` | `search-filters.tsx:302`, `featured-story.tsx:428` | Gorizontal scroll'da scrollbar ko'rinadi |
  | `scrollbar-none` | `results-client.tsx:354` | Xuddi shu |

  Shuningdek `glow-primary/5` (`login/page.tsx:98`) — bu **umuman valid sintaksis emas**.
- **Qilish:** `globals.css`ga `@utility glow-primary { box-shadow: 0 0 20px -4px var(--primary); }` va `@utility scrollbar-hide {...}`. `h-safe-area-inset-bottom` → `pb-[env(safe-area-inset-bottom)]`. `glow-primary/5`ni olib tashlash.
- **Tayyor:** iOS'da pastki nav home bar bilan to'qnashmaydi; glow effektlari ko'rinadi.

## P2-3 · 🔴 Light mode kontrasti WCAG AA'dan o'tmaydi

- [ ] **Muammo:** `app/globals.css`dagi light palitra:

  | Juftlik | Nisbat | Holat |
  |---|---|---|
  | `--muted-foreground #6d8196` on `--background #ffffe3` | **3.95:1** | ❌ AA fail |
  | `--muted-foreground #6d8196` on `--muted #f2f0d9` | **3.48:1** | ❌ AA fail |
  | `--primary #6d8196` + `--primary-foreground #ffffe3` | **3.95:1** | ❌ **barcha primary tugma yozuvlari** |

  `text-muted-foreground` loyihadagi **eng ko'p ishlatiladigan** matn klassi (footer, barcha caption, placeholder, nav inactive) → muammo global. Dark mode esa yaxshi: `#ffffe3` on `#384959` = 9.1:1 ✅
- **Qilish:** Light `--muted-foreground`ni `#4f6476`ga (≈5.6:1), `--primary`ni `#53687d`ga, `--muted`ni `#ecead2`ga tushirish. Keyin `tailwind`ni qayta build qilib ko'z bilan tekshirish.
- **Tayyor:** Barcha matn juftliklari ≥4.5:1; Lighthouse Accessibility ≥90.

## P2-4 · 🔴 `/login` sahifasi light mode'da buzuq

- [ ] **Muammo:** `app/layout.tsx:27` `defaultTheme="system" enableSystem` — light mode **haqiqatda ishlatiladi**. Lekin `/login` butunlay dark uchun yozilgan: `bg-slate-950` (`:80`), `text-white` (`:91`), `text-slate-400` (`:94,101,120,139,166`), `bg-slate-900/60 border-slate-800` (`:98`), Input `bg-slate-950/50 text-white` (`:192`). Natija: light mode'da ham qop-qora sahifa — **qolgan saytdan butunlay ajralib turadi**, brending buziladi. Bu birinchi ko'riladigan sahifa.
- **Qulaylik:** `components/auth-modal.tsx:144-265`da **aynan shu UI token bilan to'g'ri yozilgan** — uni nusxa qilish kifoya.
- **Qilish:** `bg-slate-950`→`bg-background`, `text-white`→`text-foreground`, `text-slate-400/500`→`text-muted-foreground`, `border-slate-800`→`border-border`, `bg-slate-950/40`→`bg-card/60`.
- **Boshqa light-mode muammolari:** `ranking-table.tsx:35,160` (`text-gray-800`, kumush gradient ustida `text-white`); `profile-header.tsx:36-38` (`bg-blue-500/20 text-blue-400` — `#ffffe3` fonda o'qilmaydi); `messages-client.tsx:402,922,925` (`text-emerald-500` past kontrast).
- **Tayyor:** 10 sahifaning hammasi light va dark rejimda o'qiladi.

## P2-5 · `--card` va `--muted` token'lari fondan farq qilmaydi

- [ ] **Muammo:** `globals.css:10` va `:13` — light'da `--card` === `--background` (ikkisi `#ffffe3`). `:62` va `:65` — dark'da ham bir xil (`#384959`). Bundan tashqari `:77` `--muted: #384959` dark'da **background bilan aynan bir xil** → `bg-muted` (completed badge `tournament-card.tsx:42`, bo'sh slotlar `participant-slots.tsx:47`) dark rejimda **mutlaqo ko'rinmaydi**.
- **Natija:** Butun card ierarxiyasi yo'qoladi — `components/ui/card.tsx:10`da faqat `border` + `shadow-sm` qoladi.
- **Qilish:** Dark: `--card: #2e3d4b` (fondan ochiqroq), `--muted: #44576b`. Light: `--card: #fffff2` yoki `--background`ni `#f7f5e4`ga tushirish.
- **Tayyor:** Card fonda ajralib turadi; `bg-muted` ikkala rejimda ko'rinadi.

## P2-6 · Mobil balandlik va kesilish xatolari

- [ ] **Muammo A (kritik):** `results-client.tsx:349` — `h-[calc(100dvh-4rem)]`, **mobil tuzatish yo'q**. `MobileNav` (`mobile-nav.tsx:36`, `h-16` = 64px) kontentni qoplaydi → oxirgi 64px ko'rinmaydi. **Taqqoslang:** `messages-client.tsx:332` to'g'ri qilgan — `h-[calc(100dvh-4rem-4rem)] md:h-[calc(100dvh-4rem)]`.
- **Muammo B:** `ranking-table.tsx:75` `overflow-hidden` wrapper — ichkaridagi `ui/table.tsx:12`ning `overflow-x-auto`sini **kesadi**. Jadval 320px ekranda ≥360px kerak → **kesiladi va scroll qilib bo'lmaydi**. (`university`/`wins` ustunlari `hidden md:`/`sm:` bilan to'g'ri yashirilgan — demak niyat bor edi.)
- **Muammo C:** `ranking-table.tsx:147` `TopThreePodium` — `flex items-end justify-center gap-4`, **wrap yo'q, overflow yo'q**. 96+112+80 + gap 32 ≈ 350px → 360px ekranda kesiladi.
- **Muammo D — responsive prefikssiz grid'lar:** `results-client.tsx:1367` `grid-cols-4`, `:1411` `grid-cols-3` (Input'lar bilan), `messages-client.tsx:909` `grid-cols-2`, `tournament-card.tsx:176,290` `grid-cols-2`.
- **Muammo E:** `dashboard/page.tsx:149` `grid lg:grid-cols-3` → **tablet (768-1024px)da bir ustun**, `stats-card.tsx:95` esa `lg:grid-cols-4` → tablet'da 2 ustun. `md:` breakpoint butunlay o'tkazib yuborilgan.
- **Muammo F:** `(main)/layout.tsx:28` `<main className="pb-20 md:pb-0">` ichida `100dvh`-based blok → mobil'da 80px ortiqcha surilish.
- **Qilish:** A: `h-[calc(100dvh-8rem)] md:h-[calc(100dvh-4rem)]`. B: `overflow-hidden` → `overflow-x-auto`. C: podiumga `overflow-x-auto` yoki `scale`. D: `grid-cols-2 sm:grid-cols-4` ko'rinishida prefiks. E: `md:` breakpointni qo'shish. F: `pb-20`ni faqat kerakli sahifalarga.
- **Tayyor:** 360px, 768px, 1024px kengliklarda hech bir sahifada gorizontal scroll yoki kesilish yo'q.

## P2-7 · Hardcoded ranglarni token'ga ko'chirish

- [ ] **Muammo:** ~150 ta hardcoded Tailwind rang klassi token'ni chetlab o'tadi. Palitrani o'zgartirish uchun 18 faylni qo'lda tahrirlash kerak.

  | Fayl | Soni | Asosiy ranglar |
  |---|---|---|
  | `messages-client.tsx` | 38 | `amber-500`, `emerald-500`, `blue-500` (`385,402,519,532-534,647,692,794,817-819,922-970`) |
  | `login/page.tsx` | 32 | `slate-*`, `text-white` (`80-219`) → P2-4 |
  | `profile-header.tsx` | 28 | tier gradientlari `26-31`, rarity `36-38` |
  | `ranking-table.tsx` | 23 | medal ranglari `27-42`, podium `151-197` |
  | `results-client.tsx` | 12 | `emerald-600`/`amber-600` `87,88,1224`; `amber-500` `488,572,577,1008` |
  | `navbar.tsx` | 8 | LIVE badge `red-500` `101,102,239,240` |
  | `landing-navbar.tsx` | 4 | LIVE badge `red-500` `88,89` |
  | `mobile-nav.tsx`, `tournament-card.tsx`, `tournament-client.tsx` | 1 har biri | `bg-red-500` `75`; `text-white` `41` |

- **Qilish — uch guruhga ajratish:**
  1. LIVE / `red-500` → `destructive` token. (`results-client.tsx`dagi `RESULTS_THEME.liveBadge` allaqachon `destructive` ishlatadi — navbar ham shunga o'tsin.)
  2. `amber`/`emerald` → yangi `warning`/`success` token'lar (P2-1).
  3. Medal/tier gradientlari → `globals.css`da `--medal-gold/silver/bronze`, `--tier-*` semantik token. (Medal ranglari atayin "oltin/kumush", lekin ular ham token bo'lishi kerak — light mode'da `from-gray-300 to-gray-500` + `text-gray-800` kontrasti past.)
- **Tayyor:** `globals.css`da `--primary`ni o'zgartirish butun saytga ta'sir qiladi; hardcoded rang 20 tadan kam qoladi.

## P2-8 · Navbar dublikatini birlashtirish

- [ ] **Muammo:** `navbar.tsx` (278 satr) va `landing-navbar.tsx` (230 satr) ≈ **85% bir xil**. So'zma-so'z takrorlangan bloklar: header wrapper (`:73` ≡ `:60`), logo (`:76-83` ≡ `:63-70`), `navLinks` massivi (`:40-46` ≡ `:36-42`), desktop nav + LIVE badge (`:86-113` ≡ `:73-99`), dropdown (`:142-198` ≡ `:124-178`), mobil menyu (`:219-275` ≈ `:194-227`).
- **Farqlar atigi 3 ta:**
  1. `navbar`da `isOrganizer` filtri (`:67-70`) va theme toggle (`:117,252`) bor — `landing-navbar`da **yo'q** → landing va login sahifalarida foydalanuvchi **temani o'zgartira olmaydi**.
  2. `landing-navbar.tsx:116` Create tugmasi **hamma uchun** ko'rinadi (rol tekshiruvi yo'q).
  3. Logo 3 xil: `navbar.tsx:78` va `landing-navbar.tsx` — `Trophy` ikonkasi; `footer.tsx:39` va `auth-modal.tsx:148` — `LogoIcon`.
- **Qo'shimcha:** `(main)` layoutida **ikkita mobil navigatsiya bir vaqtda** — `navbar.tsx:206-275` hamburger menyu **va** `mobile-nav.tsx` pastki tab bar (`layout.tsx:27` va `:31`). Ikkalasida ham Profile/Saved/Messages bor → ortiqcha.
- **Qilish:** Bitta `<Navbar variant="app" | "landing" />`. Logo uchun `<Brand />` komponenti (hozir 4 joyda takrorlanadi). Theme toggle'ni landing va login'ga ham qo'shish. Ikkita mobil navigatsiyadan bittasini tanlash.
- **Tayyor:** Logout, tema va nav mantiqi bitta joyda; landing'da tema almashtirgich bor.

## P2-9 · 🔴 Rasmlar — 37 ta asset 404, poster umuman render qilinmaydi

- [ ] **Muammo A — yo'q papkalar:**

  | Guruh | Soni | Holat |
  |---|---|---|
  | `/avatars/*.jpg` | 24 | ❌ `public/avatars/` **yo'q** |
  | `/tournaments/*.jpg` | 8 | ❌ `public/tournaments/` **yo'q** |
  | `/stories/*.jpg` | 5 | ❌ `public/stories/` **yo'q** |
  | `/patterns/grid.svg` | 1 | ❌ yo'q — `profile-header.tsx:49` banner teksturasi |

  Runtime'da tasdiqlangan: `/avatars/alex.jpg` → **404**, `/tournaments/football.jpg` → **404**. `public/`da `placeholder.jpg`, `placeholder-user.jpg`, `placeholder.svg` **bor**, lekin hech qayerda ishlatilmaydi.

- **Muammo B — `posterUrl` o'lik data:** `actions.ts:64`da yoziladi, barcha sahifalarda prop sifatida uzatiladi (`feed/page.tsx:37,86`, `profile/page.tsx:72`, `saved/page.tsx:44`, `tournament/[id]/page.tsx:39,103`) — lekin `tournament-card.tsx:131,245` **uni umuman render qilmaydi**, o'rniga gradient+ikonka ko'rsatadi. Natijada **barcha turnirlar bir xil ko'rinadi** — vizual farqlovchi yo'q.
- **Muammo C:** Loyihada **0 ta** `next/image` import va **0 ta** `<img>` tegi. Yagona rasm yo'li — Radix `AvatarImage`. `next.config.mjs:7` `images: { unoptimized: true }` — hozircha ta'siri yo'q, lekin poster qo'shilsa optimizatsiya o'chiq qoladi.
- **Qilish:**
  1. **Tez (10 daq):** `seed.js` va `mock-data.ts`dagi yo'llarni `/placeholder-user.jpg` / `/placeholder.jpg`ga o'zgartirish → 404'lar yo'qoladi.
  2. **O'rta:** `tournament-card.tsx:131,245`da `posterUrl`ni `next/image` bilan render qilib, gradientni fallback qoldirish → turnirlar bir-biridan farq qiladi.
  3. **To'liq (production):** rasm yuklash — UploadThing / Cloudinary / S3. Keyin `unoptimized: true`ni olib tashlash.
  4. `profile-header.tsx:49` — SVG qo'shish yoki satrni o'chirish.
- **Tayyor:** Konsolda 404 yo'q; turnir kartalarida poster ko'rinadi.

## P2-10 · Accessibility

- [ ] **Muammo A (kritik):** `app/layout.tsx:23` `maximumScale: 1` → **pinch-zoom o'chirilgan**, WCAG 1.4.4 buzilishi.
- **Muammo B — label'siz icon-only tugmalar, 8 faylda 15+ holat:** `profile-header.tsx:83,86`; `tournament-card.tsx:148,257`; `tournament-client.tsx:155,160`; `results-client.tsx:1267,1290,1315,1338`; `dashboard/page.tsx:199`; `search-filters.tsx:150` — bu fayllarda **0 ta** `aria-label`/`sr-only`. `messages-client.tsx`da atigi 2 ta.
  **Yaxshi misol:** `navbar.tsx:117` `aria-label="Toggle color theme"`, `:123,129,214` `<span className="sr-only">`, `footer.tsx:125,131,137` `sr-only` + `aria-hidden` ✅
- **Muammo C — `AvatarImage` `alt` nomuvofiq.** Bor: `navbar.tsx:146`, `ranking-table.tsx:108,152,170,189`, `profile-header.tsx:57`, `dashboard/page.tsx:120,282`, `messages-client.tsx:437,581`. **Yo'q:** `tournament-card.tsx:167,279`, `tournament-client.tsx:176,462`, `featured-story.tsx:254`, `participants-client.tsx:194`, `results-client.tsx:513,557,622,695,732,827`, `messages-client.tsx:675`.
- **Muammo D — custom `<button>`lar focus stilisiz:** `login/page.tsx:125,152`, `auth-modal.tsx:169,196`, `messages-client.tsx:341,381,400`, `results-client.tsx:1371,1388,1399`, `search-filters.tsx` pill'lari. (`ui/button.tsx:8`da `focus-visible:ring-ring/50` ✅ bor — demak `Button`ga o'tkazish yetarli.)
- **Muammo E:** `login/page.tsx:120` `<label>` `htmlFor`siz. `participant-slots.tsx:41` — slot ma'lumoti faqat `title` atributida (skrinrider'ga yetmaydi).
- **Muammo F:** Status badge'lari faqat rang bilan ma'no beradi — matn bor, lekin P2-1 tufayli badge'lar **bir xil ko'rinadi**. (`ranking-table.tsx:57-69` TrendIndicator to'g'ri qilgan: rang + ikonka + raqam ✅)
- **Qilish:** `maximumScale: 1`ni olib tashlash; har `size="icon"` tugmaga `aria-label`; barcha `AvatarImage`ga `alt`; custom `<button>`larni `Button`ga o'tkazish.
- **Tayyor:** Lighthouse Accessibility ≥90; zoom ishlaydi; klaviatura bilan butun saytni aylanib chiqish mumkin.

## P2-11 · Loading va empty holatlarini to'ldirish

- [ ] **Muammo A:** Route-darajali `loading.tsx` **yo'q** — faqat `app/loading.tsx` va `app/(main)/loading.tsx` bor. Natijada `(main)/loading.tsx`ning **"Loading tournaments..."** matni Rankings, Messages, Profile, Dashboard sahifalarida ham chiqadi → matn noto'g'ri.
- **Muammo B:** `components/ui/skeleton.tsx` loyihada **0 marta** ishlatiladi. Card/jadval skeletonlari yo'q, faqat full-page Lottie spinner → layout shift.
- **Muammo C — ikkita empty tizimi, bittasi o'lik:** `components/empty-state.tsx`da 5 variant bor, 4 tasi ishlatilgan (`feed-client.tsx:107`, `profile/page.tsx:199`, `saved-client.tsx:32`, `participants-client.tsx:174`). `NoMessages` **ishlatilmaydi** — o'rniga `messages-client.tsx:422`da inline `<div>No channels found</div>`. Ayni paytda `components/ui/empty.tsx` (shadcn `Empty`/`EmptyHeader`/...) **0 marta** import qilinadi.
- **Muammo D:** `rankings-client.tsx`, `results-client.tsx`, `dashboard/page.tsx`da empty state **umuman yo'q**.
- **Qilish:** Har `(main)` route'ga o'ziga mos `loading.tsx` + `Skeleton` asosidagi skeleton. `empty-state.tsx` yoki `ui/empty.tsx` — bittasini tanlab, ikkinchisini o'chirish. `NoMessages`ni ishlatish.
- **Tayyor:** Har sahifa o'ziga mos loading matni va skeleton ko'rsatadi; bo'sh ro'yxatlar chiroyli empty state beradi.

## P2-12 · Komponent konsistensiyasi

- [ ] **Muammo:** Bir xil ish uchun turli yechimlar.

  | Muammo | Dalil |
  |---|---|
  | **Card padding 3 xil** | `ui/card.tsx:10` default `py-6 gap-6`; `tournament-card.tsx:97,129,243` → `p-3`; `stats-card.tsx:48` → `p-5`; `profile-header.tsx:52` → `px-4 md:px-6 pb-6`; `app/page.tsx:157` → `p-6`; `rankings-client.tsx:73` → `p-4` |
  | **`gap-6` qoldig'i** | `tournament-card.tsx:129,157` — `p-3` `py-6`ni bosadi, lekin `gap-6` qoladi → banner va CardContent orasida 24px + `pt-4` = **40px kutilmagan bo'shliq** |
  | **Border-radius 22 variant** | `rounded-full` ×88, `rounded-md` ×60, `rounded-lg` ×58, `rounded-sm` ×21, `rounded-xl` ×17, `rounded` ×15, `rounded-xs` ×5, `rounded-2xl` ×5, `rounded-3xl` ×1. Sababi: `--radius: 0.875rem` (`globals.css:45`) juda katta, shuning uchun hamma qo'lda override qiladi |
  | **Shadow tarqoq** | `shadow-xs` ×30, `shadow-lg` ×14, `shadow` ×14 (deprecated alias), `shadow-sm` ×12, `shadow-md` ×10, `shadow-xl` ×5, `shadow-2xl` ×2 + 2 arbitrary (`participant-slots.tsx:46`) |
  | **Ikki dizayn tili** | `app/page.tsx:99` — kvadrat, soyasiz `border border-border p-6` (brutalist); **shu sahifaning o'zida** `:156` — `<Card>` (`rounded-xl shadow-sm`). Landing'da `font-mono` ×6, `tracking-[-0.07em]`, `rounded-full` tugmalar (`:90,93`) vs ilovaning `rounded-md` tugmalari |
  | **Status badge mantiqi 2 joyda nusxa** | `tournament-card.tsx:39-51` ≡ `tournament-client.tsx:41-51` (`statusColors`+`statusLabels`) |
  | **Theming 2 xil yondashuv** | `results-client.tsx:47-92`da `RESULTS_THEME` obyekti (yaxshi pattern, lekin faqat shu sahifada); boshqa joyda inline klasslar |
  | **Page container 2 tizim** | `(main)`: `container mx-auto px-4 py-6` (8 joy); landing: `container mx-auto max-w-6xl px-5 md:px-8 py-20`. `max-w` yo'qligi sababli `(main)` sahifalar keng ekranlarda cho'ziladi |

- **Qilish:** `--radius`ni `0.625rem`ga qaytarib, `rounded-md`/`rounded-lg`/`rounded-full` bilan cheklash; `shadow` → `shadow-sm`; `statusColors`ni `lib/`ga ko'chirish; `<PageContainer>` komponenti; `RESULTS_THEME` patternini global qilish yoki olib tashlash; landing va ilova dizayn tilini yaqinlashtirish.
- **Tayyor:** Yangi sahifa qo'shganda qaysi padding/radius/shadow ishlatishni o'ylab qolmaydi.

## P2-13 · Takroriy `globals.css`ni o'chirish

- [ ] **Muammo:** `app/layout.tsx:4` → faqat `app/globals.css` import qilinadi (`components.json`da ham `"css": "app/globals.css"`). `styles/globals.css` (125 satr) **hech qayerdan import qilinmaydi** — o'lik kod. Farqi: eski shadcn default (oklch neytral palitra, `--radius: 0.625rem`, `--font-sans: 'Geist'`) vs amaldagi brend palitra. U ham `--success`/`--warning`ni ta'riflamaydi.
- **Qilish:** `styles/globals.css`ni o'chirish.
- **Tayyor:** Bitta `globals.css` qoladi.

## P2-14 · Tipografiya

- [ ] **To'g'ri qism:** `app/layout.tsx:2,6,7` — `Inter` va `Geist_Mono` `next/font/google` orqali **haqiqatan yuklanadi**, `:27`da body'ga qo'llanadi, `globals.css:112-113` map qiladi ✅
- **Muammo:** `.pixel-word` (`globals.css:159-164`) butun loyihada **atigi 1 joyda** — `app/page.tsx:83`. Hero sarlavhasining faqat birinchi qatori mono, ikkinchisi (`:84`) sans → nomuvofiq. `font-mono` landing'da 6 marta (`page.tsx:81,101,104,113,134,146`), ilovaning qolgan qismida **0 marta** → ikki tipografik til. Sarlavha o'lchamlari: h1 uchun 4 xil (`text-5xl md:text-7xl`, `text-3xl md:text-4xl`, `text-2xl md:text-3xl`, `text-2xl`). `tracking` qiymatlari qo'lda: `-0.07em`, `-0.06em`, `-0.05em`, `-0.04em`, `0.18em` (`page.tsx:81,82,115,133,147`).
- **Qilish:** `globals.css`da `--text-h1/h2/h3` yoki `.h1 .h2 .h3` klasslari; `tracking` uchun token; `.pixel-word`ni kengaytirish yoki o'chirish; landing'ning `font-mono` aksentini dizayn tizimining rasmiy qismi qilish.
- **Tayyor:** Sarlavha o'lchamlari shkaladan olinadi; `tracking` arbitrary qiymatlari qolmaydi.

---

# ⚪ P3 — Sifat, infra, hujjat

## P3-1 · O'lik kodni tozalash

- [ ] **`lib/mock-data.ts` (879 satr) — ~95% o'lik.** Qiymat sifatida ishlatiladigan **yagona** narsa: `sportCategories`, `locations` → `search-filters.tsx:24`. Tip sifatida: `Tournament`, `User`, `RankingEntry`. **0 ta reference:** `tournaments`, `featuredStories`, `currentUser`, `globalRankings`, `conversations`, `sampleMessages`, `sampleParticipants`, `organizerProfile`, `platformStats`, `testimonials` + `Achievement`/`SportRank`/`Match`/`Message`/`Conversation`/`Participant` tiplari.
  **Qilish:** tiplarni `lib/types.ts`ga, `sportCategories`/`locations`ni `lib/constants.ts`ga chiqarib, qolgan ~750 satrni o'chirish.
- [ ] **Dublikat fayllar:** `hooks/use-toast.ts` ↔ `components/ui/use-toast.ts` (ikkisi 191 satr, **identik**); `hooks/use-mobile.ts` ↔ `components/ui/use-mobile.tsx`. Bittasini qoldirish.
- [ ] **`components/ui/form.tsx` (167 satr)** — hech qayerda import qilinmaydi. `react-hook-form` ishlatilsa (P1-8) kerak bo'ladi, aks holda o'chirish.
- [ ] **`components/ui/empty.tsx`** — 0 marta ishlatiladi → P2-11.
- [ ] **`sendMessage` action** — 0 marta chaqiriladi → P1-3.

## P3-2 · ESLint konfigini qo'shish

- [ ] **Muammo:** `package.json`da `"lint": "eslint ."` bor, lekin `eslint.config.*` ham, `.eslintrc*` ham **yo'q** → buyruq ishlamaydi.
- **Qilish:** `eslint.config.mjs` (`eslint-config-next` bilan). `no-unused-vars` va `no-console` qoidalarini yoqish — P3-1 va P1-2 muammolarini avtomatik topadi.

## P3-3 · `ignoreBuildErrors`ni olib tashlash

- [ ] **Muammo:** `next.config.mjs:4` `typescript.ignoreBuildErrors: true`. Hozir `npx tsc --noEmit` **0 xato** beradi — ya'ni flag hech narsa yashirmayapti, lekin kelajakda jim yashiradi.
- **Qilish:** Flagni olib tashlash.

## P3-4 · Testlar

- [ ] Birorta test fayli yo'q, runner ham o'rnatilmagan.
- **Minimal to'plam:**
  - [ ] `vitest` — `lib/actions.ts` unit testlari: RBAC (P0-4), sig'im/dublikat guard'lari (P1-1), `zod` schema'lar (P1-8)
  - [ ] `playwright` — 3 E2E oqim: login → feed; turnir yaratish; ro'yxatdan o'tish
  - [ ] Alohida test DB (`DATABASE_URL_TEST`)

## P3-5 · CI pipeline

- [ ] `.github/workflows/` yo'q.
- **Qilish:** Har PR'da `lint` + `tsc --noEmit` + `test` + `prisma validate`.

## P3-6 · `seed.js`ni production'dan himoyalash

- [ ] **Muammo:** `prisma/seed.js:6-15` — **10 jadvalda `deleteMany()`**, ya'ni butun bazani o'chiradi. `package.json`da `postinstall: "prisma generate"` (seed emas — bu yaxshi), lekin kimdir production'da `npx prisma db seed` yozsa hamma narsa yo'qoladi.
- **Qilish:** `seed.js` boshiga: `if (process.env.NODE_ENV === 'production') throw new Error('Seed production da ishlamaydi')`.

## P3-7 · Deployment

- [ ] **Managed MySQL kerak.** Lokal MySQL production'da ishlamaydi. Variantlar: PlanetScale, Railway, Aiven, AWS RDS. `DATABASE_URL`ni Netlify env'ga.
- [ ] **`netlify.toml`da plugin yo'q.** `publish = ".next"` ko'rsatilgan, lekin Next.js 16 uchun `@netlify/plugin-nextjs` kerak. Git tarixida bu bilan bog'liq 4 ta tuzatish commit'i bor — ya'ni allaqachon muammo bo'lgan.
- [ ] **`build: "next build --webpack"`** — Turbopack majburan o'chirilgan, izoh yozilmagan. Qayta urinib ko'rish kerak (build ancha tez).
- [ ] **`prisma migrate deploy`**ni deploy qadamiga ulash — hozir qo'lda.
- [ ] `schema.prisma:8` `binaryTargets = ["native", "rhel-openssl-3.0.x"]` — serverless uchun. Platforma o'zgarsa yangilash kerak.

## P3-8 · Keshlashni tiklash

- [ ] **Muammo:** **Barcha 10 sahifa** `export const dynamic = 'force-dynamic'` → kesh yo'q, har so'rov DB'ga uradi.
- **Qilish:** Haqiqatda dinamik bo'lishi kerakli sahifalarni qoldirish (`/dashboard`, `/messages`), qolganlarini `revalidate` yoki tag-based keshga. `revalidatePath` allaqachon action'larda ishlatiladi — infra tayyor (P1-14 bilan birga).

## P3-9 · `.env.example` va README

- [ ] **`.env.example` yo'q** — yangi dev qanday boshlashini bilmaydi.
- [ ] **README "Getting Started" to'liq emas:** `npm install` → `.env` → `prisma generate` → `npm run dev` yozilgan, lekin **`prisma migrate deploy` va `prisma db seed` qadamlari tushib qolgan**. Shu ko'rsatma bilan loyiha **bo'sh baza** bilan ishga tushadi.
- **Qilish:** `.env.example` yaratish; README'ga migrate va seed qadamlarini qo'shish; Docker MySQL variantini yozish:
  ```bash
  docker run -d --name tourneyup-mysql -e MYSQL_ROOT_PASSWORD=tourneyup \
    -e MYSQL_DATABASE=tourneyup -p 3307:3306 mysql:8.4
  ```

## P3-10 · Repo gigiyenasi

- [ ] **Ikki lock fayl:** `package-lock.json` **va** `pnpm-lock.yaml`. Bittasini tanlab, ikkinchisini o'chirish — aks holda turli devlar turli daraxt o'rnatadi.
- [ ] `app/sitemap.ts` va `app/robots.ts` yo'q — SEO uchun qo'shish.
- [ ] `CLAUDE.md` yo'q — loyiha konvensiyalarini yozib qo'yish.
- [ ] `theme-provider.tsx:11-12` `console.error`ni override qiladi → P1-2 bilan olib tashlash.
- [ ] **`.env` git tarixida bor** (`6e611b7`), lekin ichida faqat `mysql://root:@localhost:3306/tourney_up` edi — **haqiqiy sir oshkor bo'lmagan**, kredensial aylantirish shart emas. Shunchaki eslatma.

## P3-11 · O'lik DB modellari bo'yicha qaror

- [ ] `Conversation`, `ConversationParticipant`, `Message` — **UI'da 0 marta o'qiladi** (P1-3). Seed 5 conversation yaratadi, hech kim ko'rmaydi.
- [ ] `Achievement` — faqat `profile/page.tsx:37`da o'qiladi, lekin **hech qachon berilmaydi** (`db.achievement.create` yo'q).
- [ ] `SportRank` — `profile/page.tsx:38` va `rankings/page.tsx:16`da `include` qilinadi, **hisoblanmaydi** va rankings'da **ishlatilmaydi**.
- [ ] `Match` — profil/rankings'da o'qiladi, lekin yozilmaydi (P1-4).
- **Qilish:** Har biri uchun qaror: ishlatish yoki schema'dan olib tashlash. Yarim-o'lik model keyingi devni chalg'itadi.

## P3-12 · Ishlatilmaydigan dependency'lar — 7 ta paket bundle'ni kattalashtiradi

- [ ] **Muammo:** 6 ta og'ir paket **faqat hech qayerdan import qilinmaydigan** `components/ui/*` fayllari tomonidan ishlatiladi. Ya'ni paket ham, uni ishlatadigan komponent ham o'lik:

  | Paket | Yagona ishlatuvchi | Shu fayl import qilinadimi |
  |---|---|---|
  | `recharts` (~450 KB) | `components/ui/chart.tsx` | ❌ 0 marta |
  | `embla-carousel-react` | `components/ui/carousel.tsx` | ❌ 0 marta |
  | `vaul` | `components/ui/drawer.tsx` | ❌ 0 marta |
  | `cmdk` | `components/ui/command.tsx` | ❌ 0 marta |
  | `input-otp` | `components/ui/input-otp.tsx` | ❌ 0 marta |
  | `react-resizable-panels` | `components/ui/resizable.tsx` | ❌ 0 marta |

- **Qo'shimcha:** `@vercel/analytics@1.6.1` — `grep -rn "vercel/analytics" app components lib` → **0 natija**. `4898241` commit'i uni bundle'dan olib tashlagan, lekin `package.json`da qolgan. `date-fns@4.1.0` ham **0 marta** ishlatiladi (`react-day-picker` peer dependency sifatida kerak bo'lishi mumkin — tekshirish kerak).
- **Qilish:** Yuqoridagi 6 `ui/*` faylni va 6 paketni o'chirish; `@vercel/analytics`ni olib tashlash; `date-fns`ni `react-day-picker` ishlatadimi tekshirib qaror qilish. Keyin `npm run build` bilan bundle hajmini taqqoslash. **Eslatma:** `components/ui/chart.tsx` kelgusida dashboard grafiklari uchun kerak bo'lsa — qoldirish, lekin P1-7 (soxta data) hal bo'lgandan keyin qayta ko'rish.
- **Tayyor:** `package.json`da faqat haqiqatda import qilinadigan paket qoladi.

## P3-13 · Env o'zgaruvchilarini validatsiya qilish

- [ ] **Muammo:** `grep -rn "process.env" app lib prisma` → **yagona natija** `lib/db.ts:9` (`NODE_ENV` tekshiruvi). `DATABASE_URL` faqat Prisma ichida o'qiladi → noto'g'ri yoki yo'q bo'lsa xato **ishga tushish paytida emas, birinchi so'rovda** chiqadi, va u ham try/catch'siz (P0-7) → oq ekran.
- **Kelgusi o'zgaruvchilar:** `AUTH_SECRET` (P0-1), `NEXT_PUBLIC_SITE_URL` (P1-18), `UPSTASH_REDIS_*` (P0-9), rasm saqlash kalitlari (P2-9). Validatsiyasiz ularning har biri jim `undefined` bo'lib ketadi — `AUTH_SECRET` uchun bu **xavfsizlik muammosi**.
- **Qilish:** `lib/env.ts` — `zod` schema (P1-8 bilan birga, `zod` allaqachon dependency'da):
  ```ts
  const env = z.object({
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(32),
    NEXT_PUBLIC_SITE_URL: z.string().url(),
  }).parse(process.env)
  ```
  Uni `lib/db.ts`da import qilish → build/startup paytida darhol yiqiladi. `process.env`ni boshqa joyda **to'g'ridan-to'g'ri o'qimaslik**.
- **Tayyor:** `DATABASE_URL` yo'q holda `npm run dev` tushunarli xato bilan to'xtaydi, 500 sahifa bilan emas.

## P3-14 · Xato kuzatuvi va loglash yo'q

- [ ] **Muammo:** Production'da xato bo'lsa **hech kim bilmaydi**. Error tracking (Sentry va h.k.) yo'q, strukturali log yo'q, faqat `console.error` — va u ham `components/theme-provider.tsx:11-12`da **override qilingan** (P1-2), ya'ni ba'zi xatolar hech qayerga chiqmaydi.
- **Qilish:**
  1. `@sentry/nextjs` (yoki Netlify log + Axiom) — `app/global-error.tsx` (P1-9) bilan ulash.
  2. `lib/logger.ts` — server action'larda `console.log` o'rniga strukturali log (`{ action, userId, ok, ms }`).
  3. `theme-provider.tsx:11-12` override'ini olib tashlash (P1-2).
  4. Sezgir ma'lumotni log'ga **yozmaslik**: parol, token, cookie qiymati.
- **Tayyor:** Ishlab chiqarishdagi xato dashboard'da stack trace bilan ko'rinadi.

## P3-15 · Lokalizatsiya bo'yicha qaror (o'zbekcha interfeys)

- [ ] **Muammo:** Interfeys **to'liq inglizchada** (`layout.tsx:27` `lang="en"`), lekin maqsadli auditoriya o'zbek universitet talabalari (`seed.js`da `@tuit.uz`, `university` maydoni, `profile-header.tsx`da universitet nishoni). Matnlar 30+ faylga **qotib yozilgan** (hardcode) — hech qayerda matn fayli yo'q.
- **Nega hozir qaror kerak:** Agar o'zbekcha kerak bo'lsa, `next-intl` **design blokidan (P2) oldin** qo'shilishi kerak — aks holda har bir matnni ikki marta tahrirlash kerak bo'ladi. Shuningdek o'zbekcha matnlar **uzunroq** → tugma va badge'lar kengligi o'zgaradi (P2-6 mobil kesilish muammosi kuchayadi).
- **Qilish (agar "ha" bo'lsa):** `next-intl` → `messages/uz.json` + `messages/en.json` → `lang` atributini dinamik qilish → sana/raqam formatlashni `Intl` bilan (P1-6 `DateTime` migratsiyasi bilan birga).
- **Tayyor:** Til almashtirgich ishlaydi yoki qaror "faqat inglizcha" deb rasman yozib qo'yilgan.
- **Bog'liq:** "Qaror kutayotgan savollar" #7.

## P3-16 · Bildirishnoma (notification) tizimi — UI bor, backend yo'q

- [ ] **Muammo:** Bell ikonkasi 2 joyda (`navbar.tsx:127-130`, `landing-navbar.tsx:111`) — `onClick` yo'q (P1-12). Messages badge `3` hardcode (`navbar.tsx:44`, P1-7). Schema'da `Notification` modeli **yo'q**.
- **Holbuki ehtiyoj real:** ishtirokchi `approved`/`rejected` bo'lganini **bilmaydi** (`updateParticipantStatus:166` hech kimga xabar bermaydi); turnir statusi o'zgarganda hech kim xabardor bo'lmaydi; yangi registratsiya kelganda organizer sahifani qo'lda yangilashi kerak.
- **Qilish — ikki variantdan biri:**
  1. **Minimal:** `Notification { id, userId, type, title, body, link, read, createdAt }` modeli + action'larda yaratish (`updateParticipantStatus`, `registerParticipant`, `setTournamentStatus` — P1-5) + Bell dropdown'da ko'rsatish + `read` belgisi.
  2. **Yoki:** Bell ikonkasini va messages badge'ini **olib tashlash** (P1-12 bo'yicha), bildirishnomani keyingi versiyaga qoldirish.
- **Email variantiga eslatma:** `participants-client.tsx:359-362` "Email All Participants" tugmasi bor (ishlamaydi) → email yuborish uchun Resend/Postmark + P0-1 dagi haqiqiy `email` maydoni kerak. Hozir email **uydirma** (`actions.ts:150`, P1-6 F).
- **Tayyor:** Ishtirokchi tasdiqlanganini biladi, yoki soxta Bell UI'dan tozalangan.

## P3-17 · Huquqiy sahifalar va foydalanuvchi ma'lumotlari huquqi

- [ ] **Muammo:** Footer `/privacy`, `/terms`, `/cookies`ga havola qiladi (`footer.tsx:5-29`) — uchalasi **404** (P1-11). Haqiqiy foydalanuvchi ma'lumoti (email, parol, universitet, match tarixi) saqlanadigan loyiha uchun bu shunchaki o'lik havola emas, **huquqiy bo'shliq**.
- **Yetishmaydigan funksiyalar:**
  - **Akkauntni o'chirish** — `db.user.delete` kodda yo'q. Schema'dagi `onDelete` qoidalari ham tekshirilmagan: user o'chsa uning turnirlari, registratsiyalari, xabarlari nima bo'ladi?
  - **Ma'lumotni eksport qilish** — yo'q.
  - **Cookie banner** — cookie ishlatiladi (session), lekin xabardor qilish yo'q.
- **Qilish:** `/privacy`, `/terms` sahifalarini yozish (yoki footer havolalarini olib tashlash — P1-11); `deleteAccount` action + `schema.prisma`da `onDelete: Cascade`/`SetNull` qoidalarini **har bir relation uchun ataylab** belgilash (P1-6 migratsiyasi bilan birga); `/settings`ga "Akkauntni o'chirish" bo'limi (P1-11).
- **Tayyor:** Foydalanuvchi o'z akkauntini o'chira oladi va bunda DB'da yetim (orphan) yozuv qolmaydi.

---

## Tavsiya etilgan tartib

| Sprint | Mazmun | Nega shu tartibda |
|---|---|---|
| **0 — tez yutuqlar (1 kun)** | P2-1, P2-2, P2-9(1), P1-11, P1-2, P3-12, P3-13 | Token'lar, utility'lar, 404 rasmlar, o'lik havolalar, Toaster, o'lik paketlar, env validatsiyasi. Mustaqil, arzon, darhol seziladi |
| **1 — auth poydevori** | P0-1, P0-2, P0-5 | `User.role` + parol maydonlari schema'ni o'zgartiradi — keyingi hamma narsa shunga tayanadi |
| **2 — himoya** | P0-3, P0-4, P0-8, P0-9, P1-10 | Route guard + RBAC + header'lar + rate limit. Hammasi `middleware.ts` va `lib/auth.ts`ga tegadi — bitta sprint |
| **3 — barqarorlik** | P0-6, P0-7, P1-9, P1-8, P3-14 | `JSON.parse`, try/catch, `error.tsx`, `zod`, xato kuzatuvi. Crash manbalarini yopadi va qolganini ko'rinadigan qiladi |
| **4 — biznes-qoidalar** | P1-1, P1-6, P3-17(onDelete) | Sig'im/dublikat guard'lari + schema tozalash + `onDelete` qoidalari. **Bitta migratsiyada** yig'ish |
| **5 — design** | P2-3, P2-4, P2-5, P2-6, P2-7, P2-10 | Funksional qism barqarorlashgandan keyin — aks holda UI'ni ikki marta tahrirlash kerak. **Oldin P3-15 (til) qarorini chiqarish** |
| **6 — CRUD** | P1-5, P1-7, P1-12, P1-13, P1-14 | Turnir/profil CRUD, soxta data, o'lik tugmalar |
| **7 — ko'lam va topilish** | P1-15, P1-16, P1-17, P1-18, P3-8 | N+1, pagination, server-side filtr, SEO/OG, keshlash. **Shu beshtasi bir-biriga bog'langan** — P1-17 bo'lmasa P1-16 ishlamaydi, P1-15 bo'lmasa kesh ham yordam bermaydi |
| **8 — modullar** | P1-3, P1-4, P3-11, P3-16 | Messaging, Results, bildirishnoma. Eng katta hajm, schema o'zgarishi bilan |
| **9 — sifat** | P2-8, P2-11…P2-14, P3-1…P3-7, P3-10, P3-15, P3-17 | Refaktoring, testlar, CI, deployment, hujjat, huquqiy sahifalar |

**Sprint 0'ni albatta birinchi qiling** — P2-1 (token'lar) va P2-2 (utility'lar) hozir **jim buzilgan** stillarni tiklaydi. Bir necha soatlik ish, lekin loyiha butunlay boshqacha ko'rinadi.

**Sprint 7 haqida:** hozir DB kichik bo'lgani uchun N+1 va pagination sezilmaydi. Lekin birinchi haqiqiy foydalanish to'lqinida (bir universitetda 300+ ro'yxatdan o'tish) `/feed` birinchi yiqiladigan joy bo'ladi. Shuning uchun uni "optimizatsiya" deb emas, **funksional** blok deb belgilangan.

---

## Qaror kutayotgan savollar

1. **Auth kutubxonasi:** `Auth.js (NextAuth v5)` yoki `iron-session` bilan o'z session'i? Auth.js tezroq, lekin Next.js 16 bilan moslikni tekshirish kerak.
2. **Messaging — ulaymizmi yoki olib tashlaymizmi?** DB modellari tayyor, lekin to'liq ulash ~2-3 kun. MVP'da kerak bo'lmasa, sahifani va 3 modelni olib tashlash toza yechim.
3. **Results moduli ko'lami:** haqiqiy live score (real-time) kerakmi yoki organizer qo'lda natija kiritishi yetarlimi? Bu P1-4 hajmini 3 barobar farq qiladi.
4. **Rasm saqlash:** UploadThing / Cloudinary / S3 — qaysi biri? Yoki hozircha placeholder bilan ketamizmi?
5. **Managed MySQL:** PlanetScale / Railway / Aiven / RDS?
6. **Dizayn tili:** Landing brutalist (kvadrat, mono font), ilova esa yumaloq shadcn. **Qaysi biri g'alaba qilsin?** Bu P2-12 va P2-14 yo'nalishini belgilaydi.
7. **Til:** interfeys inglizchada. O'zbekcha lokalizatsiya rejadami? Agar ha — `next-intl`ni design blokidan **oldin** qo'shish kerak, aks holda matnlarni ikki marta tahrirlash kerak bo'ladi. → P3-15
8. **Bildirishnoma:** ishtirokchi `approved`/`rejected` bo'lganini qanday biladi — in-app `Notification` modelimi, emailmi, yoki hozircha hech qandaymi? Email tanlansa P0-1 (haqiqiy email maydoni) + Resend/Postmark kerak. → P3-16
9. **Rate limit infrastrukturasi:** Upstash Redis (tashqi servis, serverless'da ishlaydi) yoki in-memory (bepul, lekin Netlify'ning har bir funksiya instance'ida alohida hisoblagich → limit kuchsizlanadi)? → P0-9
10. **Domen:** `NEXT_PUBLIC_SITE_URL` uchun yakuniy domen qanday? OG rasm, `metadataBase`, `sitemap.ts` va cookie `domain` sozlamasi shunga bog'liq. → P1-18, P3-13
11. **Masshtab taxmini:** birinchi 6 oyda qancha turnir va foydalanuvchi kutiladi? Agar 100 turniradan kam bo'lsa, Sprint 7'ni (pagination) keyinga surish mumkin; 1000+ bo'lsa — Sprint 5'dan **oldin** qilish kerak.
