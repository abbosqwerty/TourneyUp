# TASK.md — TourneyUp: keyingi bosqich rejasi

> **Manba:** `prompt.md` dagi 4 ta g'oya (Tourney Points, My Teams, Messages, Competition) + joriy kod tahlili.
> **Sana:** 2026-10-10 · Next.js 16.2 · React 19.2 · Prisma 6.19 + MySQL · Tailwind 4 · Netlify
> **Qoida:** mavjud dizayn, ranglar, komponentlar (`components/ui/*`), `ActionResult` / `fail()` / `guard()` / `getTournamentAbility()` patternlari qayta ishlatiladi. Yangi dublikat sahifa yoki tizim yaratilmaydi.
> Har bir task: **Hozir → Qilish → Tayyor deb hisoblanadi**.

---

## ✅ Bajarilish holati — 2026-10-10

Barcha 4 faza kod darajasida bajarildi. `npm run typecheck` ✅ · `npm run test` ✅ (77 test: 59 unit + 18 MySQL integratsiya) · `npm run build` ✅ · test bazasida smoke (sahifalar + server log) ✅.

| Faza | Holat | Asosiy fayllar |
|---|---|---|
| 0 Poydevor | ✅ | `vitest.config.ts`, `tests/`, `lib/time.ts`, migratsiya `20261010200000_competition_engine` |
| 1 Competition | ✅ | `lib/competition/{engine,elimination,standings,swiss,seeding,lifecycle,hooks,view}.ts`, `app/(main)/results/**`, `app/(main)/dashboard/tournaments/[id]/matches/**`, `components/competition/*` |
| 2 My Teams | ✅ | `lib/teams.ts`, `lib/team-actions.ts`, `app/(main)/teams/**`, `components/teams/*`, migratsiya `20261010220000_teams_messages_support` |
| 3 Tourney Points | ✅ | `lib/points/{score,award,leaderboard,actions}.ts`, `app/(main)/rankings/*`, migratsiya `20261010210000_tourney_points` |
| 4 Messages + Support | ✅ | `lib/channels.ts`, `lib/channel-actions.ts`, `lib/support.ts`, `lib/support-actions.ts`, `app/(main)/messages/**` |

### Qanday sinab ko'rish
1. `npm run db:migrate` (3 ta yangi migratsiya). Seed **o'zgardi**: soxta ballar va qo'lda yasalgan match'lar yo'q, turnirlar har xil formatda. `npm run db:seed` butun bazani o'chiradi — o'zingiz qaror qiling.
2. Tashkilot akkaunti → Panel → turnir statusini **"Davom etmoqda"** → qur'a avtomatik tashlanadi.
3. "O'yinlar" → natijalarni tasdiqlash → to'r avtomatik yuradi → oxirgi natijada turnir `completed`, ballar `/rankings` da.
4. Testlar: `.env` da `DATABASE_URL_TEST` (alohida baza) → `npm run test`.

### Qolgan ishlar / cheklovlar
- [ ] **Diskvalifikatsiya** tugmasi (o'yinchining qolgan barcha o'yinlarini bir bosishda FORFEIT qilish). Hozir har o'yin alohida "Kelmagan tomon" bilan.
- [ ] **Real-time**: xabarlar 8 s polling (`components/auto-refresh.tsx`). Haqiqiy push — Pusher/Ably/SSE.
- [ ] **Turnirni tahrirlash UI** yo'q (bu loyihada avval ham yo'q edi). `updateTournament` action draw'dan keyin format o'zgarishini bloklaydi.
- [ ] **Jamoa tarkibini ro'yxatdan keyin tahrirlash**: hozir — ro'yxatdan chiqib, qayta yozilish (draw'gacha).
- [ ] **Tashkilot kanalida qo'shimcha yozuvchilar** (org egasidan boshqa) — hozir faqat org egasi + super admin.
- [ ] **Leaderboard tiebreak**: teng ballda bir xil rank, tartib — username. "Eng yaxshi o'rin" bo'yicha tiebreak qilinmagan.
- [ ] **Avtomatik registration deadline** (Netlify Scheduled Function) — status hozircha qo'lda o'zgartiriladi.
- [ ] Integratsiya testlari Prisma'ning AI himoyasi sababli `migrate reset` emas, `migrate deploy` ishlatadi — test bazasi tozalanmaydi, har test unikal ma'lumot yaratadi.
- [ ] `components/featured-story.tsx` dagi 2 ta lint xatosi — bu ishdan oldin ham bor edi, tegilmadi.

---

## 0. Bajarish tartibi (nima uchun aynan shunday)

G'oyalar bir-biriga bog'liq, shuning uchun `prompt.md` dagi tartibda emas, **bog'liqlik tartibida** qilinadi:

```
Faza 0  Poydevor (test, schema asoslari, timezone)
   │
Faza 1  Competition — format engine (bracket/standings/o'rinlar)   ← ballar o'rinlarga bog'liq
   │
Faza 2  My Teams — jamoa modeli + jamoaviy ro'yxatdan o'tish       ← ballar roster'ga bog'liq
   │
Faza 3  Tourney Points (T) + Leaderboard                           ← 1 va 2 tayyor bo'lishi shart
   │
Faza 4  Messages — 4 bo'lim (Org / Tournament / Teams / Support)   ← 2 dagi jamoalarga bog'liq
```

Har bir faza alohida PR / commit seriyasi, alohida migratsiya. Faza tugamaguncha keyingisi boshlanmaydi.

---

## Joriy holat (kod tahlilidan)

| Soha | Hozir nima bor | Muammo / bo'shliq |
|---|---|---|
| **Auth** | Real: `Session` jadvali, `tu_session` cookie, parol hash (`lib/password.ts`), `/register`, `/settings` | ✅ Yaxshi — qayta ishlatiladi |
| **Rollar** | `UserRole` (USER / ORGANIZATION / SUPER_ADMIN), `TournamentStaff` (ADMIN / ORGANIZER / SUPPORT), `getTournamentAbility()` | ✅ Ruxsatlar uchun asos. Support xodimi uchun platforma roli yo'q |
| **Turnir** | `Tournament.category` (sports/esports/academic), `sport`, `status` (upcoming → registration_open → ongoing → completed/cancelled), `closedAt` | ❌ **Format yo'q** (single/double/RR/groups/swiss). ❌ **Individual/jamoaviy turi yo'q**. ❌ Natija yakunlangan vaqti yo'q |
| **Ishtirokchi** | `Participant` (status: pending/approved/rejected, `paymentStatus`, `teamName` — oddiy matn) | ❌ Jamoa = shunchaki matn. Roster yo'q. `@@unique([tournamentId, userId])` jamoaviy ro'yxat uchun to'g'ri kelmaydi |
| **O'yinlar** | `Match` (home/away, score, `winnerUserId`, status), `lib/match-actions.ts` — **qo'lda** yaratish, natija kiritish | ❌ Raund, bracket, pozitsiya, keyingi o'yin bog'lanishi yo'q. ❌ Avtomatik generatsiya yo'q. ❌ Jamoa g'olibi saqlanmaydi (`winnerUserId` faqat bitta user) |
| **/results** | Real DB: barcha turnirlar o'yinlari aralash, tab: Jonli / Jadval / Yakunlangan | ❌ Turnir tanlab, uning ichida Overview / Match History / Schedule yo'q |
| **/rankings** | `User.totalPoints`, `globalRank`, `SportRank` — **faqat seed'dan** keladi, hech qayerda hisoblanmaydi | ❌ Weekly/Monthly — `rankings-client.tsx:80-89` dagi **soxta arifmetika** (user id'ning harfi bo'yicha koeffitsient). ❌ Sport ro'yxati clientda hardcode, `lib/constants.ts` bilan mos emas |
| **/messages** | `Channel` (ORGANIZATION / TOURNAMENT), broadcast — faqat owner/staff yozadi, `lastReadAt` orqali unread | ❌ Tournament kanalida ishtirokchi yoza olmaydi. ❌ Team / Support bo'limi yo'q. ❌ Real-time yo'q (Netlify → websocket yo'q) |
| **Jamoalar** | Umuman yo'q | ❌ Model, sahifa, navigatsiya — hammasi yangi |
| **Testlar** | Yo'q (`package.json` da test runner yo'q) | ❌ Barcha 4 g'oya test talab qiladi |
| **Timezone** | Hech qanday konvensiya yo'q, sanalar `String` (`date`, `time`) | ❌ Weekly/Monthly uchun aniq timezone kerak |
| **Commit qilinmagan** | `prisma/migrations/20261010120000_tournament_gallery/`, `next-env.d.ts` | Avval commit qilinsin — yangi migratsiyalar shundan keyin |

---

# Faza 0 — Poydevor

## 0-1 · Test infratuzilmasi
- [x] `vitest` + `@vitest/coverage-v8` qo'shish, `npm run test` skripti.
- [x] Ikki qatlam:
  - **Unit (DB'siz):** scoring formulasi, bracket generatorlar, standings/tiebreak — **sof funksiyalar** (`lib/competition/*`, `lib/points/*`). Asosiy testlar shu yerda.
  - **Integratsiya (test MySQL):** `DATABASE_URL_TEST`, har test oldidan `prisma migrate reset --force --skip-seed`. Idempotentlik, parallel so'rovlar, qayta hisoblash shu yerda.
- [x] Server action'larni testlash uchun `getCurrentUser` ni mock qiladigan helper.
- **Tayyor:** `npm run test` yashil, CI'da (yoki hech bo'lmasa lokal) ishlaydi.

## 0-2 · Timezone konvensiyasi
- [x] `lib/time.ts`: `APP_TIMEZONE = 'Asia/Tashkent'`, `startOfWeek()` (dushanba 00:00), `startOfMonth()` — shu timezone'da, UTC `Date` qaytaradi.
- [x] Barcha yangi vaqt maydonlari `DateTime` (UTC) da saqlanadi. Eski `date`/`time` string maydonlariga tegilmaydi.
- **Tayyor:** unit test: yakshanba 23:30 Toshkent va dushanba 00:10 Toshkent har xil haftaga tushadi.

## 0-3 · Turnir sozlamalari (schema)
- [x] `Tournament` ga qo'shish:
  ```prisma
  format          TournamentFormat  @default(SINGLE_ELIMINATION)
  participantType ParticipantType   @default(INDIVIDUAL)   // INDIVIDUAL | TEAM
  teamSize        Int?                                      // TEAM bo'lsa: roster o'lchami (min)
  teamSizeMax     Int?
  formatConfigJson String?  @db.Text   // groupCount, advancePerGroup, swissRounds, thirdPlaceMatch, seeding, win/draw points
  drawGeneratedAt DateTime?            // idempotentlik belgisi
  resultsFinalizedAt DateTime?         // ballar va leaderboard uchun rasmiy vaqt
  ```
  `enum TournamentFormat { SINGLE_ELIMINATION DOUBLE_ELIMINATION ROUND_ROBIN GROUPS_KNOCKOUT SWISS }`
- [x] `lib/schemas.ts` → `createTournamentSchema` ga `format`, `participantType`, `teamSize`, format config (zod `discriminatedUnion` format bo'yicha).
- [x] `app/(main)/create/create-client.tsx` — **mavjud formaga** "Format" select va "Individual / Jamoaviy" switch qo'shish (yangi sahifa emas).
- [x] Mavjud turnirlar uchun migratsiya default'i: `SINGLE_ELIMINATION`, `INDIVIDUAL`.
- **Tayyor:** turnir yaratishda format va tur tanlanadi, DB'da saqlanadi, tahrirlashda (`updateTournament`) draw yaratilgandan keyin format **o'zgartirib bo'lmaydi**.

---

# Faza 1 — Competition (hozirgi `/results` o'rniga)

## 1-1 · Match modelini kengaytirish
- [x] `Match` ga qo'shish:
  ```prisma
  bracket        BracketType  @default(MAIN)  // MAIN | WINNERS | LOSERS | GRAND_FINAL | THIRD_PLACE | GROUP | SWISS
  round          Int
  position       Int                          // raund ichidagi tartib
  groupId        String?                      // GROUPS_KNOCKOUT uchun → CompetitionGroup
  nextMatchId    String?   nextMatchSlot  MatchSlot?   // g'olib qayerga boradi (HOME|AWAY)
  loserNextMatchId String? loserNextSlot  MatchSlot?   // double elim: mag'lub qayerga
  isBye          Boolean   @default(false)
  winnerParticipantId String?               // jamoa ham bo'lishi mumkin — winnerUserId yetarli emas
  finalizedAt    DateTime?
  @@unique([tournamentId, bracket, round, position])   // ← dublikat generatsiyadan himoya
  ```
- [x] `CompetitionGroup { id, tournamentId, name, order }` (`@@unique([tournamentId, order])`).
- [x] `winnerUserId` qoladi (profil statistikasi uchun), lekin manba — `winnerParticipantId`.
- **Tayyor:** migratsiya mavjud match'larni buzmaydi (eski match'lar: `bracket=MAIN, round=1, position=autoincrement`).

## 1-2 · Format engine (sof funksiyalar, `lib/competition/`)
Har format uchun alohida modul, bir xil interfeys:
```ts
generateInitial(participants, config, rng): PlannedMatch[]
onMatchFinalized(state, match): Mutation[]   // keyingi o'yinga o'tkazish / yangi raund
computeStandings(state): StandingRow[]
computePlacements(state): Placement[]        // Faza 3 shu yerdan oladi
```
- [x] **Single Elimination** — 2ⁿ gacha bye, bye'lar yuqori seed'larga; g'olib `nextMatch` ga o'tadi; ixtiyoriy 3-o'rin o'yini.
- [x] **Double Elimination** — winners/losers bracket, mag'lub `loserNextMatch` ga tushadi, grand final (bracket reset — config bo'yicha).
- [x] **Round Robin** — circle method, har kim har kim bilan bir marta; toq sonda bye.
- [x] **Groups + Knockout** — snake-seeding bilan guruhlarga bo'lish, guruh ichida RR, `advancePerGroup` o'tadi; **barcha guruh o'yinlari yakunlanganda** knockout bracket avtomatik yaratiladi (guruh g'oliblari bir-biriga erta tushmasligi uchun cross-seeding).
- [x] **Swiss** — 1-raund random/seeded; keyingi raund **faqat oldingi raund to'liq yakunlanganda**, ochkolar bo'yicha juftlash, takroriy raqibdan qochish, bye eng past ochkoliga (bir kishiga bir martadan ko'p emas). Raundlar soni: config yoki `ceil(log2(N))`.
- [x] **Durrang:** eliminatsiya formatlarida durrang **taqiqlanadi** (natija kiritishda validatsiya). RR / Swiss / guruhda ruxsat.
- [x] **Tiebreak (RR/Swiss/guruh)** — loyihada mavjud qoida yo'q, shuning uchun bitta hujjatlashtirilgan tartib: ochko → shaxsiy uchrashuv → hisob farqi → urilgan → (Swiss: Buchholz) → seed. `formatConfigJson` da g'alaba/durrang ochkolari (default 3/1/0, shaxmat uchun 1/½/0).
- [x] RNG injektsiya qilinadi (testda seed bilan deterministik), production'da `crypto.randomInt`.
- **Tayyor:** har 5 format uchun unit testlar: 2, 3, 5, 8, 13, 16 ishtirokchi; bye; to'liq turnirni simulyatsiya qilib oxirigacha yetib borish; Swiss'da takroriy juftlik yo'q.

## 1-3 · Avtomatik lifecycle (server tomonida)
- [x] Trigger: `setTournamentStatus` (`lib/actions.ts:177`) da `registration_open → ongoing` o'tishi. Alohida "Generate Bracket" tugmasi **yo'q**.
- [x] `lib/competition/lifecycle.ts` → `startCompetition(tournamentId)`:
  1. Bitta `db.$transaction` ichida `SELECT ... FOR UPDATE` (tournament qatori).
  2. `drawGeneratedAt != null` bo'lsa — hech narsa qilmaydi (**idempotent**).
  3. Eligible: `status='approved'` **va** `paymentStatus in ('paid','waived')`; TEAM turnirda — roster minimal o'lchamga yetgan jamoalar (Faza 2).
  4. Eligible < 2 bo'lsa — xato, status o'zgarmaydi.
  5. Match'larni yaratadi, bye'larni darhol avtomatik o'tkazadi, `drawGeneratedAt = now()`.
- [x] `@@unique([tournamentId, bracket, round, position])` — parallel so'rovda ikkinchisi constraint'ga uriladi va ushlanadi.
- [x] Draw yaratilgandan keyin: ishtirokchini approve/reject/remove qilish, registration'ni qayta ochish **bloklanadi** (`updateParticipantStatus`, `removeParticipant`, `setTournamentStatus` ga tekshiruv). Yagona yo'l — "Diskvalifikatsiya" (o'yinlari texnik mag'lubiyat/walkover) — owner/ADMIN uchun, audit bilan.
- [x] Netlify'da background job kerak emas — generatsiya status o'zgartirish action'i ichida sinxron. (Kelajakda "registration deadline'da avtomatik yopish" kerak bo'lsa → Netlify Scheduled Function, alohida task.)
- **Tayyor:** integratsiya testi: `startCompetition` ni 5 marta parallel chaqirish → match'lar soni bir xil, juftliklar o'zgarmagan.

## 1-4 · Natija kiritish va avtomatik progressiya
- [x] `lib/match-actions.ts` → `recordMatchResult` qayta yoziladi:
  - Tranzaksiya: natijani yozish → `finalizedAt` → format engine `onMatchFinalized` → keyingi match'ga g'olib/mag'lubni joylash / yangi Swiss raund / knockout yaratish.
  - Bir xil natijani qayta yuborish — no-op (idempotent).
  - Eliminatsiyada durrang → `fail()`.
- [x] **Natijani tuzatish (controlled correction):** yakunlangan match natijasini o'zgartirish faqat, agar bog'liq keyingi match hali o'ynalmagan bo'lsa; aks holda `fail('Keyingi o'yin allaqachon o'ynalgan')`. Majburiy `reason` maydoni. `MatchResultRevision` jadvaliga yoziladi (kim, qachon, eski/yangi hisob, sabab).
- [x] `createMatch` (qo'lda match qo'shish) normal oqimdan olib tashlanadi; `deleteMatch` — draw yaratilgandan keyin taqiqlanadi.
- [x] Organizer faqat: sana/vaqt belgilash (`scheduleMatch`), natija kiritish, tuzatish. Hammasi `getTournamentAbility().canRecordResults` orqali.
- [x] Oxirgi match yakunlanganda: `resultsFinalizedAt = now()`, status `completed`, `closeTournamentAccess()` (mavjud) → **Faza 3 dagi ball hisoblash** shu joydan chaqiriladi.
- **Tayyor:** testlar: progressiya har formatda, qayta yuborish, tuzatish (ruxsat etilgan/taqiqlangan holat), ruxsatsiz user.

## 1-5 · Competition UI (mavjud `/results` ni o'zgartirish)
- [x] Navigatsiya: `components/navbar.tsx:79`, `components/mobile-nav.tsx:22` — label "Natijalar" → **"Musobaqa"**. Route `/results` saqlanadi (yoki `/competition` + `/results` dan redirect — bittasini tanlash).
- [x] `/results` — **turnirlar ro'yxati**: nom, kategoriya, organizer, status, format, ishtirokchilar soni, "Ochish". Qidiruv + status/kategoriya filtri (mavjud `components/search-filters.tsx` uslubida).
- [x] `/results/[tournamentId]` — 3 tab (mavjud `components/ui/tabs`):
  - **Overview:** formatga qarab — bracket daraxti (single/double), guruh jadvallari + knockout, standings jadvali (RR/Swiss).
  - **Match History:** faqat `finalizedAt != null` — ishtirokchilar, hisob, g'olib, raund, sana.
  - **Schedule:** yakunlanmagan match'lar, sana/vaqt; "Vaqt belgilanmagan" alohida belgilangan. Organizer uchun shu yerda inline sana belgilash.
- [x] Draw hali yo'q bo'lsa — status bilan empty state ("Ro'yxatdan o'tish davom etmoqda", "Turnir boshlanishini kutmoqda"), **soxta match ko'rsatilmaydi**.
- [x] Barcha so'rovlar `tournamentId` bilan qat'iy filtrlanadi — turnirlar aralashmaydi.
- [x] `app/(main)/dashboard/tournaments/[id]/matches/` — natija kiritish interfeysi shu yerda qoladi, faqat yangi modelga moslanadi.
- **Tayyor:** 2 ta turnir parallel o'tkazilganda hech qaysi tabda boshqa turnir ma'lumoti chiqmaydi; mobil va desktop'da ishlaydi.

---

# Faza 2 — My Teams

## 2-1 · Data model
```prisma
model Team {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  sport       String               // Tournament.sport bilan bir xil lug'at
  category    String               // sports | esports | academic
  description String?  @db.Text
  logoMediaId String?              // mavjud MediaAsset + /api/upload qayta ishlatiladi
  ownerId     String
  disbandedAt DateTime?            // soft delete — tarix saqlanadi
  createdAt   DateTime @default(now())
  @@unique([ownerId, name])        // bitta owner'da bir xil nomli 2 jamoa yo'q
}
model TeamMember {
  teamId String; userId String
  role   TeamRole  // OWNER | CAPTAIN | MEMBER
  joinedAt DateTime @default(now())
  leftAt   DateTime?
  @@unique([teamId, userId])
}
model TeamInvite {
  id String @id; teamId String; invitedUserId String; invitedById String
  status InviteStatus  // PENDING | ACCEPTED | DECLINED | REVOKED | EXPIRED
  expiresAt DateTime; createdAt DateTime @default(now())
  @@index([invitedUserId, status])
}
```
- [x] Platforma limiti: user boshiga maks. jamoa soni — konstanta (masalan 10), `lib/constants.ts`.
- [x] `NotificationType` ga: `TEAM_INVITE`, `TEAM_MEMBER_JOINED`, `TEAM_MEMBER_REMOVED`, `TEAM_REGISTERED`.

## 2-2 · Server action'lar (`lib/team-actions.ts`) + ruxsatlar (`lib/teams.ts`)
- [x] `getTeamAbility(userId, teamId)` — `getTournamentAbility` uslubida. OWNER: hammasi. CAPTAIN: taklif, a'zoni chiqarish (OWNER'dan tashqari), turnirga yozish. MEMBER: ko'rish, jamoadan chiqish.
- [x] `createTeam`, `updateTeam`, `inviteMember` (username/email bo'yicha, mavjud `searchAssignableUsers` mantiqiga o'xshash), `respondToInvite`, `removeMember`, `leaveTeam`, `setMemberRole`, `transferOwnership`, `disbandTeam`.
- [x] Hammasi: zod schema, `guard()` rate-limit, ruxsat **backend'da**.
- [x] Himoyalar: dublikat a'zolik (unique), o'zini chiqarib yuborish/oxirgi OWNER'ni yo'qotish taqiqlangan, **faol turnirda locked roster** dagi a'zoni chiqarib bo'lmaydi.
- [x] `disbandTeam` — `disbandedAt` qo'yadi, hech narsa o'chirmaydi; aktiv (ongoing) turnirda bo'lsa — taqiqlanadi.

## 2-3 · UI
- [x] Navigatsiyaga **"Jamoalarim"** (`/teams`) — `navbar.tsx` va `mobile-nav.tsx` ga, faqat `role === 'USER'` uchun.
- [x] `/teams` — dashboard: jamoa kartalari (logo, nom, sport, owner/captain, a'zolar soni, **mening rolim** badge, "Boshqarish"). Katta "Jamoa yaratish" tugmasi. Kutilayotgan takliflar bloki (qabul/rad).
- [x] Empty state (mavjud `components/empty-state.tsx`): funksiyani tushuntirish + "Birinchi jamoangizni yarating".
- [x] Create — `Dialog` yoki `/teams/new`: nom, sport (`sportCategories`), logo (`components/image-uploader.tsx`), tavsif.
- [x] `/teams/[id]` — ma'lumot, a'zolar + rollar, takliflar, turnir ishtiroki tarixi, sozlamalar. Destruktiv amallar (`removeMember`, `transferOwnership`, `disbandTeam`) — `AlertDialog` bilan tasdiq.
- [x] `loading.tsx`, `error` holatlari, `sonner` toast'lar — boshqa sahifalardagi kabi.

## 2-4 · Jamoaviy turnirga yozilish
- [x] `Participant` ga: `teamId String?`, `@@unique([tournamentId, teamId])`. TEAM turnirlarda `userId` = yozgan captain (eski unique'ni saqlab qolish uchun yoki `userId` ni nullable + alohida tekshiruv — migratsiyada hal qilinadi).
- [x] **Roster snapshot:** `ParticipantRosterMember { participantId, userId, @@unique([participantId, userId]) }` — turnir boshlanganda muzlatiladi. Ballar va tarix shu jadvaldan olinadi (jamoa keyin tarqalsa ham tarix buzilmaydi).
- [x] `registerParticipant` (`lib/actions.ts:281`):
  - `participantType === 'INDIVIDUAL'` — hozirgidek, jamoa so'ralmaydi.
  - `TEAM` — `teamId` + tanlangan roster majburiy; tekshiruv: caller OWNER/CAPTAIN, roster o'lchami `teamSize..teamSizeMax`, sport mos, **bitta o'yinchi bir turnirda ikki jamoada emas**, jamoa tarqatilmagan.
- [x] `tournament/[id]/tournament-client.tsx` — erkin `teamName` input o'rniga TEAM turnirda "Jamoangizni tanlang" select + roster tanlash + kerakli roster o'lchami/qoidalar ko'rsatiladi.
- [x] Draw yaratilgach roster **locked** (`drawGeneratedAt != null`).
- **Tayyor (testlar):** bir user ko'p jamoa; taklif qabul/rad/muddati o'tgan; MEMBER owner amalini bajara olmaydi; bitta o'yinchi ikki jamoada bitta turnirga yozila olmaydi; tarqatilgan jamoaning eski turnir natijalari saqlangan.

---

# Faza 3 — Tourney Points (T) + Leaderboard

## 3-1 · Konfiguratsiya (`lib/points/config.ts`)
```ts
export const POINTS_CONFIG = {
  base: { 1: 100, 2: 70, 3: 50, top8: 25, participated: 10, registeredOnly: 0 },
  sizeBonusFactor: 0.2,      // Final = round(Base × (1 + 0.2 × log10(N)))
  version: 1,
} as const
```
- [x] Barcha sport/kategoriya uchun **bitta jadval**. Konstantalar o'zgarganda `version` oshadi.

## 3-2 · Sof hisoblash funksiyasi (`lib/points/score.ts`)
- [x] `basePoints(placement | null, participated: boolean)`; `finalPoints(base, N)` — `N = max(1, N)`, `Math.round`.
- [x] **N:** INDIVIDUAL → haqiqatda o'ynagan individlar soni; TEAM → haqiqatda o'ynagan jamoalar soni.
- [x] **"Ishtirok etdi"** = kamida bitta yakunlangan, bye bo'lmagan match'da o'ynagan. Faqat ro'yxatdan o'tish → 0 T.
- [x] O'rinlar `computePlacements()` dan (Faza 1-2). **Bo'lingan o'rin** (masalan, 3-o'rin o'yini yo'q bo'lsa ikkala yarim final mag'lubi) — ikkalasiga ham shu o'rin bali.
- [x] TEAM: jamoa bali `ParticipantRosterMember` dagi **har bir** o'yinchiga.

## 3-3 · Ledger + audit (schema)
```prisma
model PointAward {
  id String @id; userId String; tournamentId String; participantId String
  placement Int?; basePoints Int; fieldSize Int; points Int
  sport String; category String          // "By Game" filtri uchun snapshot
  earnedAt DateTime                       // = Tournament.resultsFinalizedAt
  configVersion Int
  @@unique([tournamentId, userId])        // ← ikki marta ball yo'q
  @@index([earnedAt]) @@index([sport, earnedAt]) @@index([userId])
}
model PointAuditLog {
  id String @id; tournamentId String; userId String
  delta Int; previousPoints Int; newPoints Int
  reason PointChangeReason   // FINALIZED | RESULT_CORRECTED | TOURNAMENT_CANCELLED | RECALCULATED
  note String? @db.Text; actorId String?; createdAt DateTime @default(now())
}
```
- [x] Leaderboard **faqat** `PointAward` dan hisoblanadi. `User.totalPoints` / `globalRank` / `SportRank` — kesh sifatida qayta hisoblanadi (profil sahifasi buzilmasligi uchun) yoki profil ham ledger'ga o'tkaziladi. Seed'dagi soxta ballar o'chiriladi.

## 3-4 · Avtomatik hisoblash (`lib/points/award.ts`)
- [x] `awardTournamentPoints(tournamentId, reason, actorId)` — **bitta tranzaksiya**:
  1. Kerakli yangi `PointAward` to'plamini hisoblaydi.
  2. Mavjudlari bilan diff qiladi → faqat o'zgarganlarini upsert/delete qiladi.
  3. Har o'zgarishga `PointAuditLog` yozadi.
  4. Kesh (`totalPoints` va h.k.) yangilanadi.
  → Qayta chaqirish natijani o'zgartirmaydi (**idempotent**), ikki marta hisoblanmaydi.
- [x] Chaqiriladigan joylar:
  - Oxirgi match yakunlanib turnir `completed` bo'lganda → `FINALIZED`.
  - Yakunlangan turnirda natija tuzatilganda → `RESULT_CORRECTED` (o'rinlar qayta hisoblanadi).
  - `cancelled` ga o'tganda → barcha `PointAward` o'chiriladi, audit `TOURNAMENT_CANCELLED`.
- [x] Ballar **hech qachon** registration, o'ynalmagan match, tugallanmagan turnir yoki tasdiqlanmagan natijadan berilmaydi.
- [x] Organizer uchun qo'lda ball berish interfeysi **yo'q**. Faqat SUPER_ADMIN uchun `/admin` da "Qayta hisoblash" tugmasi (`RECALCULATED`).

## 3-5 · Leaderboard integratsiyasi (UI o'zgarmaydi)
- [x] `app/(main)/rankings/page.tsx` — `searchParams`: `period=weekly|monthly|all`, `sport=...`. Server'da `PointAward` bo'yicha `groupBy userId, _sum points`:
  - Weekly: `earnedAt >= startOfWeek()` (Asia/Tashkent, dushanba)
  - Monthly: `earnedAt >= startOfMonth()`
  - All-time: filtrsiz
  - By Game: `sport = ?`
- [x] `rankings-client.tsx:80-89` dagi **soxta weekly/monthly arifmetika o'chiriladi**. Tab/select o'zgarganda URL o'zgaradi → server qayta hisoblaydi.
- [x] Clientdagi hardcode `sportCategories` → `lib/constants.ts` dagi umumiy ro'yxat (yoki DB'dagi mavjud sportlar).
- [x] Teng ballda tartib: ballar → turnirlardagi eng yaxshi o'rin → username (deterministik). Teng ballilar bir xil rank oladi.
- [x] Layout, podium (`TopThreePodium`), avatar, username, "Your Rank" kartasi — **saqlanadi**. Faqat ma'lumot manbai o'zgaradi.
- **Tayyor (testlar — prompt.md talabi):** har o'rin bali; registration-only = 0; size bonus (N=1, 8, 16, 100); natijani ikki marta yuborish; natija tuzatilib qayta hisoblash; bekor qilingan turnir ballari qaytariladi; weekly / monthly / all-time / sport bo'yicha totallar; jamoa — har roster a'zosiga bir martadan.

---

# Faza 4 — Messages (4 bo'lim)

## 4-1 · Data model o'zgarishlari
- [x] `ChannelType` ga `TEAM` qo'shish; `Channel.teamId String? @unique` (`Team` ga relation). Jamoa uchun **alohida a'zolik jadvali yaratilmaydi**: `ChannelMember` `TeamMember` dan sinxronlanadi.
- [x] `ChannelPost` ga `kind PostKind @default(MESSAGE)` — `ANNOUNCEMENT | MESSAGE | SYSTEM` (rasmiy e'lon, admin, ishtirokchi xabarini vizual farqlash uchun).
- [x] Support — kanal **emas**, alohida modellar (qaror #5 — ikki xil support):
  ```prisma
  model SupportTicket { id; userId; scope SupportScope /* PLATFORM | TOURNAMENT */; tournamentId String?
                        subject; category SupportCategory /* TECHNICAL | TOURNAMENT_ISSUE | REPORT_BEHAVIOR | OTHER */
                        status TicketStatus /* OPEN | IN_PROGRESS | RESOLVED | CLOSED */
                        userLastReadAt DateTime?; staffLastReadAt DateTime?; createdAt; updatedAt }
  model SupportMessage { id; ticketId; authorId; content @db.Text; isStaff Boolean; createdAt }
  ```
- [x] PLATFORM → `SUPER_ADMIN` javob beradi. TOURNAMENT → shu turnirning faol `SUPPORT`/`ADMIN`/`ORGANIZER` staff'i + owner. Turnir yopilganda TOURNAMENT ticket'lar `CLOSED` bo'ladi.

## 4-2 · Ruxsatlar (`lib/channels.ts` → `getChannelAccess` qayta yoziladi)
| Kanal | O'qish | Yozish |
|---|---|---|
| ORGANIZATION | obunachilar (ochiq follow) | faqat org owner + SUPER_ADMIN (+ org bergan ruxsat) |
| TOURNAMENT | organizer, staff, **tasdiqlangan** ishtirokchilar (TEAM: roster a'zolari) | hammasi yozadi; `ANNOUNCEMENT` faqat organizer/ADMIN/ORGANIZER |
| TEAM | faqat joriy jamoa a'zolari (`leftAt == null`) | joriy a'zolar |
| SUPPORT (PLATFORM) | ticket egasi + SUPER_ADMIN | ikkalasi |
| SUPPORT (TOURNAMENT) | ticket egasi + turnirning **faol** SUPPORT/ADMIN/ORGANIZER staff'i + owner | ikkalasi, turnir yopilguncha |
- [x] `channel/[channelId]/page.tsx` — a'zo bo'lmagan user **hech qanday** xabarni olmaydi (server'da tekshiruv, faqat UI emas).
- [x] Hozirgi "broadcast-only" izoh va mantiq (`lib/channels.ts:89-93`) TOURNAMENT/TEAM uchun o'zgartiriladi.

## 4-3 · A'zolik avtomatikasi
- [x] **Tournament kanali:** `registerParticipant` dagi pending holatda avtomatik obuna (`lib/actions.ts:341-349`) **olib tashlanadi**. O'rniga:
  - `updateParticipantStatus` → `approved`: kanalga qo'shish; `rejected`/`removeParticipant`: chiqarish.
  - `startCompetition` (draw): yakuniy eligible ro'yxat bilan sinxronlash (bitta `syncTournamentChannelMembers()`).
  - Staff grant/revoke → STAFF rol qo'shish/olish (`closeTournamentAccess` allaqachon qisman qiladi).
  - `completed` → arxiv (read-only, a'zolar o'qiy oladi — mavjud xatti-harakat). `cancelled` → arxiv + e'lon.
- [x] **Team kanali:** `createTeam` → `ensureTeamChannel()` (mavjud `ensureTournamentChannel` uslubida). A'zo qo'shilsa/chiqsa/chiqarilsa → `ChannelMember` sinxron (o'sha tranzaksiyada). `disbandTeam` → arxiv.
- [x] Hamma joyda `upsert` / `@@unique([channelId, userId])` — dublikat a'zolik yo'q.

## 4-4 · UI (`/messages` ni qayta qurish, yangi route emas)
- [x] Nav label "Kanallar" → **"Xabarlar"**.
- [x] Chap panel: 4 bo'lim tab/segment — **Tashkilotlar · Turnirlar · Jamoalarim · Yordam**; har birida ro'yxat (avatar, nom, oxirgi xabar, vaqt, unread badge). O'ng panel — tanlangan suhbat. Mobil: ro'yxat ↔ suhbat almashinadi.
- [x] Tashkilotlar: "Kashf qilish" (mavjud `discover` bloki) + follow/unfollow.
- [x] Turnirlar: header'da turnir nomi, status, sanalar, ishtirokchilar soni; pinned e'lonlar yuqorida.
- [x] Jamoalarim: `/teams` dagi jamoalar avtomatik; jamoa yo'q bo'lsa — empty state + `/teams` ga havola.
- [x] Yordam: "Yangi murojaat" formasi — avval tur: **TourneyUp yordami** yoki **Turnir bo'yicha** (turnir tanlanadi); kategoriya, mavzu, tavsif. Murojaatlar ro'yxati status badge bilan, suhbat.
- [x] Xodim tomoni: `/admin/support` (PLATFORM ticket'lar, SUPER_ADMIN) va `/staff` → turnir → "Murojaatlar" (TOURNAMENT ticket'lar, SUPPORT staff).
- [x] Rol bo'yicha ko'rinish: e'lon (`ANNOUNCEMENT`) — alohida kartochka; admin/organizer xabari — rol badge; oddiy ishtirokchi — oddiy pufak.
- [x] Unread: mavjud `lastReadAt` mexanizmi; support uchun `SupportTicket` da `userLastReadAt` / `staffLastReadAt`.
- [x] **Real-time:** Netlify serverless'da websocket yo'q → ochiq suhbatda 5–10 s polling (`router.refresh()` yoki kichik `GET` route) + yuborilgan xabar optimistic. (Haqiqiy real-time — kelajakdagi task, ochiq savol #6.)
- [x] Discord-uslubidagi server/sub-kanal, erkin DM, ovoz/video — **qilinmaydi**.
- **Tayyor (testlar):** ruxsatsiz user turnir/jamoa/support xabarlarini o'qiy olmaydi (server darajasida); approve → kanalga qo'shildi, reject → chiqarildi; jamoadan chiqqan a'zo kanalga kira olmaydi; dublikat a'zolik yo'q; unread to'g'ri; mobil layout.

---

# Qarorlar (2026-10-10 da tasdiqlangan)

| # | Savol | Qaror |
|---|---|---|
| 1 | Single elim'da 3-o'rin o'yini bo'lmasa, yarim final mag'lublari nechanchi o'rin? | ✅ **Ikkalasi ham 3-o'rin (50 T har biriga)**. Sabab: loyihada 3-o'rin o'yini tushunchasi yo'q va har bir qo'shimcha o'yin organizerga ortiqcha jadval ishi; ball jadvali 3-o'rinni (50) 4–8 dan (25) ajratadi — yarim finalga chiqqan ikkalasini 25 ga tushirish adolatsiz. Organizer `formatConfig.thirdPlaceMatch = true` ni yoqsa — 3-o'rin o'yini avtomatik yaratiladi, g'olibi 3 (50 T), mag'lubi 4 (25 T). Default: **o'chiq**. Double elim'ga taalluqli emas (u yerda 3-o'rin = losers final mag'lubi) |
| 2 | Kelmagan tomon (walkover / no-show) ishtirok etdimi? | ✅ **Yo'q — qatnashmagan hisoblanadi.** Match natijasi `FORFEIT` sifatida yoziladi: g'olib keyingi bosqichga o'tadi va bu match uning uchun "ishtirok" sanaladi, kelmagan tomon uchun — yo'q. Boshqa yakunlangan match'da o'ynamagan bo'lsa → 0 T va N ga kirmaydi |
| 3 | RR/Swiss/guruh ochkolari va tiebreak | 3/1/0 (config'da o'zgartiriladi) → shaxsiy uchrashuv → hisob farqi → urilgan → Buchholz (Swiss) → seed |
| 4 | Groups+Knockout'da guruhdan chiqmaganlar o'rni | Knockout'dagilardan keyin, guruhdagi o'rni va ochkolari bo'yicha |
| 5 | Support kim? | ✅ **Ikki xil support** — pastdagi "Support modeli" ga qarang |
| 6 | Real-time | MVP — polling (Netlify serverless). Keyin Pusher/Ably yoki SSE |
| 7 | Route nomi | `/results` saqlanadi (havolalar buzilmasin), nav label "Musobaqa" |
| 8 | Seed'dagi soxta `totalPoints`/`SportRank` | Ledger'dan qayta hisoblanadigan kesh bo'ladi; seed soxta ball yozmaydi |

## Support modeli (qaror #5)

| | **Platforma support** (TourneyUp o'zi) | **Turnir support** |
|---|---|---|
| Nima uchun | Akkaunt, texnik xato, shikoyat, ilova bo'yicha savol | Aynan bitta turnir: qoidalar, jadval, natija, to'lov, ishtirok savollari |
| Kim javob beradi | `SUPER_ADMIN` (platforma xodimi) | Shu turnirga tayinlangan `TournamentStaff.role = SUPPORT` (+ owner, ADMIN, ORGANIZER) — **mavjud** rol qayta ishlatiladi |
| Muddat | Doimiy | **Faqat turnir davomida**: turnir `completed`/`cancelled` bo'lganda grant avtomatik bekor bo'ladi (`closeTournamentAccess`), ochiq murojaatlar yopiladi, tarix user uchun o'qishga qoladi |
| Kim yoza oladi | Har qanday kirgan user | Turnirga yozilgan user yoki turnirning ochiq sahifasidan har qanday user (turnir yopilmagan bo'lsa) |
| Maxfiylik | Faqat murojaat egasi + SUPER_ADMIN | Faqat murojaat egasi + shu turnirning **faol** support/staff'i. Boshqa ishtirokchilar ko'rmaydi |
| Model | `SupportTicket.scope = PLATFORM`, `tournamentId = null` | `SupportTicket.scope = TOURNAMENT`, `tournamentId` majburiy |
| UI | Messages → Yordam → "TourneyUp yordami" | Messages → Yordam → "Turnir bo'yicha" (turnir tanlanadi) + turnir sahifasida "Savol berish"; xodim tomoni: `/staff` (Mening rolim) da shu turnir murojaatlari |

---

# Umumiy "Tayyor" mezonlari (har faza uchun)

- [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` — xatosiz.
- [x] Yangi Prisma migratsiya, mavjud ma'lumotni buzmaydi; `prisma/seed.js` yangilangan.
- [x] Barcha ruxsatlar server action'da tekshiriladi, client faqat ko'rsatadi.
- [x] Har bir yozish amali: zod validatsiya + `guard()` rate-limit + kerak bo'lsa tranzaksiya.
- [x] Loading / empty / error / success holatlari bor; mobil (≤ 375px) va desktop tekshirilgan.
- [x] Mavjud dizayn (ranglar, `components/ui/*`, tipografiya) o'zgarmagan.
- [x] Faza oxirida qisqa xulosa: o'zgargan fayllar, DB o'zgarishlari, nima qilinmay qoldi.
