# 🚀 PROMPTI KALONI «USTOGO» — САРМОЯИ ПУРРАИ ТАҲИЯИ ПРОЕКТ

> **ПЕШВОЯИ УМУМӢ:** Ин проджект **UstoGo** — бозори онлайн байни **УСТО (master)** ва **МИЗОҶ (client)** мебошад. Ту (AI) ҳамчун **инженер + архитектор + аналитики маҳсулот** кор мекунӣ.
> **ҚОИДАИ №1:** ҲАМА ВАҚТ аввал коди мавҷударо хон ва таҳлил кун, баъд код навис. Ҳеҷ гоҳ аз хотира нагӯ, ки дар код чӣ аст — ҳар дафъа файлҳоро кушо ва тасдиқ кун.
> **ҚОИДАИ №2:** Ҳар идеяро бо тартиби «таҳлил → спецификация → код → тест → санҷиш» иҷро кун. Ҳеҷ гоҳ якбора ҳамаи идеяҳоро дар як ҷавоб иҷро накун — як-як, бо тартиби §7.

---

## 1. ЗАМИНАИ ПРОЕКТ (барои AI, ки проектро намедонад)

**ЧӢ МЕКУНАД:** Мизоҷон устоҳоро меҷӯянд, онлайн захира (банд) мекунанд, кор баҷо оварда мешавад, тақриз ва баҳо мегузоранд. Давраи корӣ: **ҷустуҷӯ → интихоб → банд → иҷро → тақриз → обрӯ → ҷустуҷӯи нав**. Бозор — Тоҷикистон, рақамҳо +992.

**СТЕК (stack):**
- **Backend (папка `UstoGo-backend`):** NestJS 11 · TypeScript strict · PostgreSQL 16 · Prisma 6 · Passport JWT (RS256) · class-validator · Swagger · S3/MinIO · Redis · Socket.io · Prometheus · cron jobs.
  - Локально: `http://localhost:3000/api/v1` · Swagger: `/api/docs` · Деплой: `https://ustogo-backend.onrender.com/api/v1` · Swagger JSON: `https://ustogo-backend.onrender.com/api/docs-json`
  - Тестҳо: `npm run lint && npm run typecheck && npm test` · e2e: `npm run test:e2e`
- **Frontend (папка `ustogo`):** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · next-intl (`tj` + `en`) · socket.io-client · framer-motion · lucide-react.
  - Тестҳо: `npm run lint` ва `npm run build`
  - Роутҳо дар `app/`, ҷузъҳо дар `components/`, API-клиент: `lib/api/endpoints.ts` + `lib/api/client.ts`, типҳо: `lib/api/types.ts`, тарҷума: `messages/tj` + `messages/en`.

**РОЛҲО (3 роль):**
1. **ADMIN** — тасдиқи устоҳо, категория, баннер, тақриз, бандҳо, статистика, аудит. Админ танҳо бо CLI сохта мешавад: `npm run cli -- admin:create`.
2. **CLIENT** (мизоҷ) — ҷустуҷӯ, favorites, банд, тақриз, алоқа бо усто тавассути WhatsApp.
3. **MASTER** (усто) — профил, хидматҳо, ҷадвали корӣ, сертификат, портфолио, статистика.

---

## 2. ВОҚЕИЯТИ ҲОЗИРА — ЧӢ АЛЛАҚАЙ ТАЙЁР АСТ (натиҷаи таҳлил)

### 2.1 Backend — модулҳои мавҷуда
| Модул | Чӣ кор кардааст |
|---|---|
| **auth** | email+парол, JWT RS256, refresh-ротатсия + reuse-detection, TOTP 2FA (админ), сессияҳо, forgot/reset-password, verify-email, логаут |
| **users** | GET/PATCH /users/me, аватар/баннер, экспорти маълумот, DELETE (soft), GET /cities |
| **masters** | Регистратсия бо телефон ҳатмӣ (E.164), approve/reject аз админ, профил, категорияҳо, сертификатҳо, портфолио (макс 20), ҷадвали ҳафтаина + истисноҳо, availability 31 рӯз, GET /masters/:id + media + certificates |
| **services** | CRUD хидматҳои усто (FIXED/HOURLY/FROM price, duration) |
| **bookings** | 9 статус, манъи дугона-захира (exclusion constraint), idempotency, cron (expire 10 дақ + reminder), socket `/bookings`, стат: /bookings/me/stats |
| **search** | Full-text (tsvector/GIN), филтр: категория/шаҳр/нарх/дата, сорт, пагинация |
| **reviews** | Як тақриз ба як банд, 24с edit, reply, admin hide/unhide |
| **chat** | REST + Socket.io `/chat`: Conversation, Message, typing, read (гат ба shared booking) |
| **notifications** | In-app 17 намуд, broadcast-админ; email танҳо барои auth |
| **favorites** | Добавить/удалить/рӯйхат (client) |
| **files** | Presign (S3/MinIO) + confirm + URL 15-дақ |
| **admin** | Dashboard (агрегатҳо, daily series, top-категория), тасдиқи усто, категория CRUD, тақриз moderation, баннер CRUD, broadcast, audit-logs, /metrics |
| **audit** | Append-only журнал, PII-redacted |
| **idempotency** | Header Idempotency-Key барои мутацияҳои муҳим |

### 2.2 Frontend — саҳифаҳои мавҷуда
home, search (+SearchClient), categories, master/[id], booking (соз + детал), messages (чати socket real), notifications, favorites, reviews, payments (танҳо намоиш), dashboard/{admin,client,master}, settings (profile/services/schedule/portfolio/certificates/security), auth (login, register/client, register/master, forgot/reset-password, verify-email), about, contact, faq.

**Интегратсия:** ҳама чиз ба API-и воқеӣ пайваст аст (`NEXT_PUBLIC_API_URL` → бэкенди deploy-шуда), токен-рефреш бо lock, 2-дақиқа cache, типҳои JSON дар `lib/api/types.ts`. **i18n:** tj + en пурра.

---

## 3. ТАҲЛИЛИ ПУРРА: ЧӢ НАМЕРАСАД (инҳоро ислоҳ кун!)

### 3.1 Проблемаҳои функсионалӣ (барои корбарон)
1. **Чати клиент ↔ усто in-app аст** — барои бозори Тоҷикистон кор намекунад. Одамон танҳо бо WhatsApp кор мекунанд. **Ин бояд ба WhatsApp гузарад** (тафсилоти пурра дар §4).
2. **NPS / ризоятмандии мизоҷ** — маълумоти «чанд нафар розӣ, чанд нафар тавсия медиҳад» тамоман НЕСТ (§6.1).
3. **Статистикаи фардии усто барои админ** — админ намебинад: чанд клиент гирифт, чанд кор анҷом дод, чанд кор нотамом монд, баҳои мизоҷон чӣ гуна аст (§5).
4. **Пардохти онлайн / wallet** — тамоман нест. Пайдо нест: Payment, Wallet, Order, Payout, Refund, Invoice (§6.14).
5. **Ҷустуҷӯи географӣ / харита** — координатҳо нигоҳ дошта мешаванд (City.latitude/longitude, Booking.latitude/longitude, MasterProfile.serviceRadiusKm) вале ҳеҷ ҷой истифода намешаванд (§6.3).
6. **Забони русӣ** — танҳо tj ва en. Барои бозори Тоҷикистон забони русӣ зарур аст (§6.2).
7. **Уведомления Push/SMS** — танҳо in-app; email танҳо барои auth-транзакцияҳо (§6.7).
8. **Идораи корбарон аз админ** — рӯйхати корбарон, block/unblock, сабабҳо — НЕСТ (§6.11).
9. **Реферальная система** — нест (§6.4).
10. **Дархости мизоҷ ба усто (quote/reverse marketplace)** — мизоҷ наметавонад «ман усто меҷӯям» нависад (§6.5).
11. **Аналитикаи даромади усто** — танҳо `/bookings/me/stats`-и оддӣ (§6.6).
12. **Банди такрорӣ (rebook)** — нест (§6.10).
13. **Report/block/амният** — нест (§6.8).
14. **Подпискаи Pro барои устоҳо** — нест (§6.9).
15. **SEO/OG/PWA** — нест (§6.12, §6.13).
16. **AI-ассистент** — нест (§6.15).
17. **Тақвими усто (calendar sync)** — нест (§6.16).

### 3.2 Проблемаҳои техникӣ (аз таҳлили код)
1. **Департмент:** дар production базаи маълумот танҳо 0 усто дорад ва категорияҳои кӯҳна (3 реша) — лозим аст `prisma migrate deploy` + seed иҷро шавад.
2. **Телефони корбар** танҳо дар регистратсия ҷамъоварӣ мешавад, вале барои ҳеҷ чиз истифода намешавад (на auth, на WhatsApp, на verify).
3. **emailVerifiedAt** ҳеҷ чизро маҳдуд намекунад (на gates).
4. **Redis** дар `/health/ready` санҷида намешавад.
5. **Тестҳои e2e** барои Favorites ва Portfolio навишта нашудаанд; баъзе e2e flaky (audit-count, chat socket).
6. **Модули chat-и бэкенд** ҳоло дар UI фаъол аст, аммо пас аз гузариш ба WhatsApp (§4) UI-и он бояд бардошта шавад, модули бэкенд танҳо барои админ (назорат) боқӣ мемонад.
7. **MasterProfile.serviceRadiusKm** нигоҳ дошта мешавад вале истифода намешавад (ба §6.3 нигар).
8. **Certificate.verifiedAt/verifiedByUserId** захира шудааст, вале кор намекунад — moderation-и сертификатҳо лозим аст (§6.8 ё алоҳида).
9. **Промо-позицияи устоҳо дар search** — нест (sort танҳо rating/price/createdAt).
10. **Мета/OG/SEO** — саҳифаҳо metadata-и пурра надоранд.

---

## 4. ИДЕЯИ АСОСИИ ФАРМОИШГАР №1: ЧАТ → WHATSAPP (АВВАЛИН ИҶРО КУН!)

### 4.1 Моҳият
Чати дохили-интернетӣ байни клиент ва усто **нест карда шавад**. Ба ҷои он: вақте усто регистратсия мекунад, **номераи телефон мераваду он худи номери WhatsApp-и ӯ мешавад**. Усто метавонад ин номерро **худаш edit** кунад (иваз кунад). Клиент бо усто **мустақиман дар WhatsApp** гуфтугӯ мекунад. Админ низ метавонад бо ҳар усто дар WhatsApp гуфтугӯ кунад.

### 4.2 Талаботҳои Backend (дар `UstoGo-backend`)
1. **Prisma migration (модели нав):**
   - Ба `MasterProfile` илова кун:
     - `whatsappPhone String?` — номери WhatsApp-и усто.
     - `whatsappEnabled Boolean @default(true)` — усто метавонад хомӯш кунад.
     - `whatsappChangedAt DateTime?` — барои маҳдудияти ивазкунӣ (1 маротиба дар 24 соат).
   - Ба `Booking` илова кун:
     - `whatsappLinkClickedAt DateTime?` — санҷиши фаъолнокии клиент (аналитика).
2. **Регистратсияи усто:** дар `RegisterMasterDto` поляи `phone` ҳатмӣ монад. Пас аз сохтани усто: `whatsappPhone = phone`. Дар UI-и регистратсия лаблел иваз шавад: «Номери телефон (WhatsApp) — клиентҳо ба ин номер менависанд».
3. **Ивазкунӣ аз ҷониби усто:** `PATCH /users/me` метавонад `whatsappPhone`-ро қабул кунад (валидатсияи E.164 + санҷиши 24 соат). Ҳангоми иваз: `whatsappChangedAt = now`.
4. **Публикатсия:** `GET /masters/:id` (ва `/masters/:id/services`, `/masters/:id/reviews`) — `whatsappPhone` ва `whatsappEnabled`-ро баргардонад. **Ин публикӣ аст — мақсади худи фича.** Танҳо агар `whatsappEnabled=true` бошад.
5. **Админ:** `GET /admin/masters` — сутуни `whatsappPhone` нишон дода шавад. Админ бо кнопкаи `wa.me` метавонад бо ҳар усто дар WhatsApp гуфтугӯ кунад.
6. **Шаблони тайёри WhatsApp барои клиент:**
   ```
   https://wa.me/<num>?text=Салом! Ман аз UstoGo барои хидмати «<serviceTitle>» навиштам. Рамзи банд: <bookingNumber>
   ```
   (Рамзи банд барои усто кӯмак мекунад, ки клиентро дар система шиносад.)
7. **Чати in-app дар бэкенд:** модулро якбора нест накун (хатари мигратсия), вале **коди нав барои он нанавис**. UI-и чат дар фронтенд бардошта шавад (§4.3). Модули бэкенд барои админ-назорат боқӣ мемонад (аудиторӣ).

### 4.3 Талаботҳои Frontend (дар `ustogo`)
1. **Регистратсияи усто** (`app/auth/register/master/page.tsx`): лаблели телефон → «Номери телефон (WhatsApp)» + матни кӯмак.
2. **Танзимотҳои усто** (`app/settings/profile/page.tsx`): полеи нав «Номери WhatsApp» + кнопкаи «Санҷидан» (wa.me дар ҷадвали нав) + огоҳӣ: «Пас аз иваз, клиентҳо ба номери нав менависанд».
3. **Профили публикии усто** (`app/master/[id]/page.tsx`): кнопкаи калони сабз «Нависан ба WhatsApp» бо иконкаи расмии WhatsApp — танҳо агар `whatsappEnabled=true`. Матн: «Бе воситаи платформа, мустақим дар WhatsApp нависед».
4. **Саҳифаи банд** (`app/booking/[id]/page.tsx`): вақте статус ACCEPTED/IN_PROGRESS — блоки WhatsApp бо шаблони тайёр (баннер).
5. **Саҳифаи messages** (`app/messages/page.tsx`): бардошта шавад. Ба ҷои он саҳифаи нав **«Алоқа бо WhatsApp»** — рӯйхати устоҳое, ки бо онҳо кор кардааст (бандҳои COMPLETED/ACCEPTED/IN_PROGRESS), ҳар кадом бо кнопкаи WhatsApp. `lib/chat/socket.ts` дигар истифода нашавад (дар navbar саҳифаи messages бардошта шавад).
6. **Админ** (`app/dashboard/admin/page.tsx`): дар рӯйхати устоҳо сутуни «WhatsApp» бо кнопкаи `wa.me`.
7. **i18n:** ҳамаи матнҳои нав → `messages/tj` + `messages/en` (+ `ru` агар §6.2 иҷро шуда бошад).

### 4.4 Санҷиши фича
- Регистратсияи устои нав → дар БД `whatsappPhone == phone`.
- Ивазкунии номер → маҳдудияти 24 соат кор кунад; пас аз иваз кнопкаҳои кӯҳна иваз шаванд.
- Кнопкаи WhatsApp дар профили публикӣ → URL-и wa.me дуруст бошад (рақами +992 бе фосила).
- Устои `whatsappEnabled=false` → кнопка нишон дода нашавад.
- Админ рӯйхат ва wa.me-и ҳар усто кор кунад.
- Саҳифаи «Алоқа бо WhatsApp» барои клиент — танҳо бандҳои ҳақиқӣ намоиш дода шаванд.

---

## 5. ИДЕЯИ АСОСИИ ФАРМОИШГАР №2: АДМИН-СТАТИСТИКАИ ПУРРА (КИ, ЧАНД, ЧӢ ҲОЛ)

### 5.1 Моҳият
Админ бояд дар як ҷой ҳамаро бинад: **дар сатҳи платформа** (чанд корбар, чанд клиент, чанд розӣ, чанд тавсия медиҳад, чанд кор иҷро шуд) ва **барои ҳар усто алоҳида** (чанд клиент гирифт, чанд кор анҷом дод, чанд нотамом монд, баҳо ва NPS).

### 5.2 Backend
1. **Prisma:** ба `MasterProfile` сутунҳои зеринро илова кун (denormalized, ҳангоми тағйири банд/тақриз навсозӣ шавад):
   - `totalClientsServed Int @default(0)` — шумораи клиентҳои гуногун (Distinct clientProfileId дар бандҳои COMPLETED).
   - `unfinishedJobsCount Int @default(0)` — бандҳои PENDING + ACCEPTED + IN_PROGRESS + CANCELLED_*.
   - `completedJobsCount Int @default(0)` — аллакай ҳаст, идома диҳ.
   - `nps Int?` — NPS-и усто (аз §6.1 ҳисоб карда мешавад).
2. **Endpoint-и нав:**
   - `GET /admin/masters/:id/stats` → `{ totalClientsServed, completedJobs, unfinishedJobs, avgRating, ratingCount, nps, reviewsBreakdown: {5,4,3,2,1}, monthlySeries: [{month, bookings, completed, revenue}], topServices: [...] }`
   - `GET /admin/nps` → NPS-и умумӣ + бо категория + бо усто + бо давра (from/to).
   - `GET /admin/platform-stats` ё васеъ кардани dashboard: клиентҳои розӣ (баҳо >= 4), тавсиядиҳандагон (NPS), корбарони фаъол (lastLoginAt < 30 рӯз), корбарони нав дар моҳ.
3. **Аудит:** ҳар дастрасии админ ба статистикаи усто → `@Audit` (ба мисли CONVERSATION_ACCESSED).
4. **Андозаҳо:** ҳисобҳои heavy бо cron ё дар транзаксияи transition (масалан вақте банд COMPLETED мешавад) — на дар ҳар request.

### 5.3 Frontend
1. **`app/dashboard/admin/page.tsx`:** блоки нави «Статистикаи устоҳо» — карточкаи ҳар усто: клиентҳо, корҳои анҷомдода, нотамом, рейтинг, NPS. Кнопкаи «Статистика» → саҳифаи алоҳида.
2. **Саҳифаи нав `app/dashboard/admin/masters/[id]/page.tsx`:** профили статистикии усто + графикҳо (time series бо SVG-оддӣ ё библиотекаи хуби charts — ба стили проекта) + кнопкаи WhatsApp (§4).
3. **Дэшборди клиент** (`app/dashboard/client/page.tsx`): блоки «Тавсия додан» — саҳифаи NPS-анкета бо линкҳои тавсия.
4. **Дэшборди усто** (`app/dashboard/master/page.tsx`): NPS-и худаш, шумораи клиентҳо, корҳои нотамом — огоҳӣ: «Шумо N корҳои нотамом доред».
5. **i18n:** ҳамаи матнҳои нав.

### 5.4 Санҷиш
- Пас аз COMPLETED банд: `totalClientsServed` ва `completedJobsCount` дуруст афзоиш ёбад.
- Банди нави ACCEPTED: `unfinishedJobsCount` +1.
- Админ саҳифаи статистикаи усторо мекушояд → audit-log сабт мешавад.
- NPS: бо маълумоти тестӣ дуруст ҳисоб мешавад.

---

## 6. 15 ИДЕЯИ ДИГАР (ҳар яке бо спецификация)

### 6.1 NPS ва тадқиқи ризоятмандии мизоҷ (P1 — барои §5 зарур аст)
- **Моҳият:** Баъд аз ҳар банд-и COMPLETED мизоҷ анкета мебинад: баҳо 0–10 + «Оё ба дӯстон тавсия медиҳед?» (ҳа/не) + комментарӣ. 9–10 = promoter, 7–8 = passive, 0–6 = detractor. NPS = %promoters − %detractors.
- **Backend:** сутуни `Review.npsScore Int?` ва `Review.wouldRecommend Boolean?` дар Prisma. Endpoint: `GET /admin/nps` (умумӣ, бо категория, бо усто, бо давра). Аз ҷониби мастер: `GET /masters/me/nps`.
- **Frontend:** модал-анкета пас аз тақриз; дар админ-дашборд блоки NPS; дар кабинети усто NPS-и худаш.
- **Иртибот:** ин маълумот мустақиман ба идеяи №5 (админ-статистика) меравад — «чанд нафар розӣ, чанд нафар тавсия медиҳад».

### 6.2 Забони русӣ (P2)
- **Моҳият:** Рыноки асосии Тоҷикистон русӣзабон аст.
- **Иҷро:** папкаи `messages/ru` — пурраи ҳамаи файлҳо (зеркали tj/en); `i18n/locales.ts` + switcher-ро илова кун; metadata-и ҳар саҳифа бо локализатсия; default-locale = tj, аммо auto-detect бо браузер (ru).
- **Санҷиш:** гузариши лока дар UI кор кунад, ҳеҷ hardcode намонad.

### 6.3 Ҷустуҷӯи географӣ ва харита (P3)
- **Backend:** ба search фильтри `lat/lng/radius` илова кун (формулаи haversine дар SQL ё PostGIS). Аз `MasterProfile.serviceRadiusKm` ва `City.latitude/longitude` истифода кун. Сорт: аз рӯи масофа. Новие координатҳои усто: `PATCH /users/me` (танзимоти профил).
- **Frontend:** дар `app/search` режими «Рӯйхат / Харита» — библиотекаи Leaflet (бе пулаки). Дар карта маркерҳои устоҳо бо кнопкаи WhatsApp. Геолокацияи корбар бо геолокатсияи браузер.
- **Санҷиш:** ду усто дар ду шаҳр — наздиктарин аввал ояд; радиус 5 км — аз берун наояд.

### 6.4 Реферальная система ва промо (P4)
- **Моҳият:** Ҳар клиент линк-коди худаш (`/register?ref=CODE`). Дӯст регистратсия шавад → ҳарду бонус.
- **Backend:** `ClientProfile.referralCode String? unique` + `ClientProfile.referredByClientProfileId String?`. Endpoint: `GET /me/referral` (код, линк, шумораи муроҷиатҳо, бонусҳо). Мант. бонус: баъд аз аввалин COMPLETED-банди ин клиент, ҳарду +5 бонус (дар модел `ReferralReward` сабт кун).
- **Frontend:** блоки «Тавсия додан» дар дэшборди клиент — линк + кнопкаи копировать + share ба WhatsApp.
- **Санҷиш:** регистратсия бо ref-код → пайвастшавӣ дуруст; бонус пас аз банди аввал.

### 6.5 Дархости мизоҷ ба усто (quote / reverse marketplace) (P4)
- **Моҳият:** Мизоҷ навишта метавонад: категория, шаҳр, бюджет, фото (3 расм), тавсиф, санаи дилхоҳ. Устоҳои ҳамин категория дар ҳамин шаҳр пешниҳод мефиристанд (текст + нарх + мӯҳлат).
- **Backend:** моделҳои нав: `ServiceRequest` (clientProfileId, categoryId, cityId, budgetFrom/to, description, preferredDate, status: OPEN/ACCEPTED/CLOSED/EXPIRED) + `RequestQuote` (serviceRequestId, masterProfileId, price, message, status: PENDING/ACCEPTED/DECLINED). Cron: EXPIRED пас аз 7 рӯз. Notification ба устоҳо ва клиент.
- **Frontend:** саҳифаи нав `app/requests` (клиент: сози дархост + рӯйхати қимат-гузориҳо; усто: фееди дархостҳои категорияи ӯ). Пас аз қабул: кнопкаи WhatsApp (§4) — бе воситаи платформа гуфтугӯ.
- **Санҷиш:** клиент дархост мекунад → танҳо устоҳои ҳамин категория/шаҳр мебинанд; клиент ҳамаи қимат-гузориҳоро мебинад.

### 6.6 Аналитикаи даромади усто (P5)
- **Моҳият:** Усто бояд донад: даромади моҳона, аз кадом хидмат/шаҳр, чанд клиенти нав, чанд такрорӣ.
- **Backend:** `GET /masters/me/stats/detailed?from&to` → `{ revenueByMonth, revenueByService, revenueByCity, newClients, repeatClients, avgBookingValue, conversionRate (профил боздид → банд) }`. Ба `MasterProfile.profileViews` аллакай ҳаст — истифода кун.
- **Frontend:** дар `app/dashboard/master` графикҳо + экспорт CSV.
- **Санҷиш:** маълумот бо фильтр-давра дуруст.

### 6.7 Уведомления push + email (P2/P5)
- **Email:** барои ҳодисаҳои банд (ACCEPTED, COMPLETED, CANCELLED, REMINDER) — SmtpMailProvider мавҷуд аст, танҳо listener-ҳоро васеъ кун.
- **Push:** барои ояндаи мобилӣ — таблитсаи `Device` (userId, token, platform). MVP: web-push бо service worker (дар §6.13 PWA).
- **Танзимот:** `NotificationPreference` барои ҳар корбар (email/push/in-app on/off).
- **Санҷиш:** пас аз қабули банд клиент email мегирад (mailpit/sandbox).

### 6.8 Амният: report + block + ҳалли низоъ (P5)
- **Backend:** модели `Report` (reporterUserId, reportedUserId, type: SPAM/FRAUD/ABUSE/OTHER, description, status: OPEN/REVIEWED/RESOLVED/REJECTED, adminNote). Endpoint-ҳо: `POST /reports`, `GET /admin/reports`, `POST /admin/reports/:id/resolve`. Барои блок: `POST /admin/users/:id/block` + `/unblock` (сутуни `User.status` ҳаст — BLOCKED). Ҳама бо @Audit.
- **Frontend:** дар профили усто/клиент — менюи «Шикоят»; дар админ — рӯйхати шикоятҳо бо ҳал.
- **Санҷиш:** шикоят → админ мебинад → блок → корбар наметавонад даромад.

### 6.9 Усто Pro (подписка) (P6)
- **Моҳият:** Подпискаи моҳона: boost дар search, значок PRO, ҷойи аввал дар категория, квотаи сертификатҳо.
- **Backend:** моделҳои `Subscription` (masterProfileId, plan, startsAt, endsAt, status) + промо-вектор дар search (PRO аввал). Пардохт — пас аз §6.14.
- **Frontend:** саҳифаи «Pro» дар танзимотҳои усто.
- **Санҷиш:** устои Pro пеш аз оддӣ дар натиҷаҳо.

### 6.10 Банди такрорӣ (rebook) (P4)
- **Backend:** ҳеҷ — танҳо endpoint-и мавҷуда POST /bookings.
- **Frontend:** дар таърихи бандҳо кнопкаи «Боз ҳам фармоиш» — банд-и нав бо ҳамон усто/хидмат, санаи нав. Дар `app/booking/[id]` пас аз COMPLETED — кнопкаи «Дубора фармоиш».
- **Санҷиш:** клик → саҳифаи банд бо маълумоти пуршуда.

### 6.11 Идораи корбарон аз админ (P5)
- **Backend:** `GET /admin/users` (фильтр: role, status, city, search, давраи регистратсия; pagination) + `GET /admin/users/:id` (профили пурра + бандҳо + тақризҳо) + block/unblock.
- **Frontend:** саҳифаи нав `app/dashboard/admin/users/page.tsx` бо ҷадвали филтршаванда.
- **Санҷиш:** админ корбарро пайдо ва блок мекунад; блокшуда даромада наметавонад (логин 403).

### 6.12 SEO + OpenGraph + structured data (P2)
- Schema.org `LocalBusiness`/`Person` дар профили устоҳо (JSON-LD); OG-расмҳои авто (Canvas/og-библиотека); sitemap.xml (SSG ё route); robots.txt; metadata-и пурраи ҳар саҳифа (title/description бо локализатсия); slug-роутҳои SEO-фардо (`/master/dushanbe-elektrik-123`).
- **Санҷиш:** Google Rich Results Test — schema валид; саҳифаҳо дар sitemap.

### 6.13 PWA (P5)
- manifest.json + service worker (next-pwa ё дастӣ): насбшавӣ, offline-cache-и саҳифаҳои статикӣ, web-push-уведомления (пайваст бо §6.7).
- **Санҷиш:** Lighthouse PWA-score; насб дар телефон.

### 6.14 Пардохти онлайн / wallet (P6 — фазаи 2, калон)
- **Backend:** моделҳои `Wallet` (userId, balance), `WalletTransaction` (type: TOPUP/PAYMENT/WITHDRAWAL/REFUND/COMMISSION, amount, status, referenceId), `Payment` (bookingId, amount, provider, status). Комиссияи платформа (масалан 5%) — пешниҳод. Провайдерҳои Тоҷикистон (Алиф/Эсхата/Корти миллии) — интерфейси `PaymentProvider` бо моки. Escrow: пул пас аз COMPLETED + тасдиқи клиент (24с) ба усто.
- **Frontend:** саҳифаи нав барои пополнить/тарихи транзакцияҳо; дар booking — кнопкаи пардохт.
- **Санҷиш:** сенарияи пурраи escrow бо мок-провайдер.

### 6.15 AI-ассистент (P6)
- **Моҳият:** Чат-бот дар саҳифаи аввал: «Ман усто меҷӯям...» — мефаҳмад категория ва шаҳр, пешниҳоди беҳтарин устоҳо (ба API-и search пайваст). Матнҳои шаблонӣ + класификатсияи оддии keyword-based (бидуни LLM ё бо API-и хурд).
- **Backend:** endpoint-и `POST /assistant/suggest` (query → categoryId, cityId, suggestions[]).
- **Frontend:** мини-виджет дар home (модал ё канати паҳлӯ).

### 6.16 Тақвими усто (calendar sync) (P6)
- Экспорти .ics: `GET /masters/me/calendar.ics` (бандҳои тасдиқшуда); Google Calendar Sync — опсияи оянда. Frontend: кнопкаи «Ба тақвим илова кун» дар дэшборди усто.

### 6.17 Модерацияи сертификатҳо (P3)
- `Certificate.verifiedAt/verifiedByUserId` фаъол кун: админ рӯйхати сертификатҳои verify-нашударо мебинад, тасдиқ/рад мекунад. Дар профили усто: нишони «Тасдиқшуда» (verification badge).

---

## 7. ТАРТИБИ ИҶРО (приоритети кор — аз ин тартиб нагузар)

1. **P0 — WhatsApp (§4)** — пурра: backend + frontend + санҷиш.
2. **P1 — NPS (§6.1) + Админ-статистика (§5)** — аввал NPS (маълумоти он ба §5 лозим), баъд статистикаи фардӣ ва платформа.
3. **P2 — Забони русӣ (§6.2) + SEO (§6.12)** — арзон, барои ҳамаи бозор.
4. **P3 — Харита/гео-поиск (§6.3) + Модерацияи сертификатҳо (§6.17).**
5. **P4 — Реферал (§6.4) + Дархост/quote (§6.5) + Рибук (§6.10).**
6. **P5 — Аналитикаи усто (§6.6) + Email/push (§6.7) + Report/block (§6.8) + Идораи корбарон (§6.11) + PWA (§6.13).**
7. **P6 — Pro-подписка (§6.9) + Пардохти онлайн (§6.14) + AI (§6.15) + Тақвим (§6.16).**

**Қоида:** ҳар идеяро ҷудо-ҷудо, бо тартиби боло иҷро кун. Пас аз ҳар идея — натиҷа ва санҷиш. Пас аз ҳар банд (block) — тамоми тестҳои проектаро мегузаронад.

---

## 8. ҚОИДАҲОИ КОД (ҲАТМӢ — ҳангоми ҳар як тағйирот)

1. **Пеш аз код — кодро хон.** Дар проект қоидаҳои махсуси Next.js 16 ҳаст (ба `node_modules/next/dist/docs/` нигар). Backend — ба стили модулҳои мавҷуда (module → controller → service → domain).
2. **Backend:**
   - DTO бо class-validator барои ҳар input.
   - Idempotency-Key барои мутацияҳои муҳим.
   - Pagination бо X-Total-Count.
   - Swagger-декораторҳо барои ҳар endpoint; пас аз тағйирот: `npm run swagger:export` + update-и openapi.json.
   - Ҳар мутацияи admin → `@Audit`.
   - Prisma: барои ҳар тағйири schema мигратсияи нав.
3. **Frontend:**
   - «use client» танҳо дар ҷойи зарурӣ.
   - Ҳамаи матнҳо → next-intl (`messages/tj`, `messages/en`, `messages/ru`) — ҳеҷ гоҳ hardcode.
   - Типҳои API → `lib/api/types.ts`; ҳамаи роутҳо → `lib/api/endpoints.ts`.
   - Стили UI-и мавҷударо риоя кун (Tailwind, ҷузъҳои мавҷуда, dark mode).
4. **Тестҳо (пеш аз тамом кардани ҳар идея):**
   - Backend: `npm run lint && npm run typecheck && npm test`
   - Frontend: `npm run lint && npm run build`
5. **Бехатарӣ:** сиррҳо (паролҳо, токенҳо, DATABASE_URL) ҳеҷ гоҳ ба код/коммит надарорем. Номери телефонро ҳатман E.164 санҷида кун (validator-и мавҷуда дар `lib/validation.ts` ва бэкенд).
6. **Коммитҳо:** пас аз ҳар идея як коммити алоҳида бо message-и равшан (стили conventional commits).
7. **Ҷавоб ва код-комментарҳо:** ба забони точикӣ ё русӣ.

---

## 9. ТАРЗИ КОР (роҳнамои қадам-ба-қадам барои AI)

1. **Қадами 0 — Таҳлил:** коди мавҷударо хон (модули дахлдор дар backend + саҳифаҳои дахлдор дар frontend). Дар ҷавоб навис: «Ман инро пайдо кардам: ...» бо файлҳо.
2. **Қадами 1 — Спецификация:** чӣ вазъият, чӣ тағйирот, кадом файлҳо. Пешниҳоди тарҳро ба корбар нишон диҳ, агар шубҳа бошад — пурс (дар сурати интихоб — вариантҳоро пешниҳод кун).
3. **Қадами 2 — Код:** тағйиротро иҷро кун, ҳамаи файлҳои дахлдор (backend + frontend + i18n + типҳо).
4. **Қадами 3 — Тест:** тестҳои дахлдорро навис/навсозӣ кун ва ҳамаи командаҳои §8.4-ро дава.
5. **Қадами 4 — Хулоса:** навис чӣ кардӣ, чӣ санҷида шуд, чӣ боқӣ монд.

---

**ХОТИМА:** Ин ҳуҷҷат сармояи пурраи кор аст: таҳлил (§2-3) + идеяҳои асосии фармоишгар (§4-5) + 17 идеяи дигар бо спецификатсия (§6) + приоритетҳо (§7) + қоидаҳо (§8-9). Аз P0 (WhatsApp) оғоз кун ва як-як иҷро намо. Ҳар қадамро бо забони точикӣ ба корбар шарҳ диҳ.
