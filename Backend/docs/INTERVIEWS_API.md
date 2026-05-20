# Nomzod suhbati (Interview) API

Base: `http://localhost:5000`  
Swagger: `/api/docs` → tag **Interviews**

## Maqsad

Admin nomzod bilan **suhbat** rejalashtiradi: nomzod, vakansiya, mavzu, suhbat oluvchi, manzil (matn / URL / kartadagi joy + ixtiyoriy koordinata), **sana-vaqt** (`scheduledAt` ISO 8601).

Belgilangan vaqtga yaqinlashganda server **Eskiz** orqali nomzod telefoniga **qisqa eslatma SMS** yuboradi (matn uzunligi cheklangan — boshqa SMS shablonlari kabi).

Suhbatdan keyin: **baholash** (`rating` 1–5), **o‘tdi/o‘tmadi** (`passed`), **qayta suhbat** (`rescheduleRequested`), izoh (`adminNotes`), holat (`status`).

## Muhit (`.env`)

| O‘zgaruvchi | Tavsif |
|-------------|--------|
| `ESKIZ_EMAIL`, `ESKIZ_PASSWORD` | SMS uchun (mavjud) |
| `INTERVIEW_REMINDER_OFFSET_MINUTES` | `0` — `scheduledAt` vaqtiga **yetgan** paytdan keyin yuboriladi (server har minut tekshiradi). Masalan `60` bo‘lsa, suhbatdan **60 daqiqa oldin** yuboriladi. |
| `INTERVIEW_REMINDER_POLL_MS` | Tekshiruv intervali, standart `60000` (1 min). |
| `INTERVIEW_TIMEZONE` | SMS matnida vaqt ko‘rinishi, standart `Asia/Tashkent`. |

## Manzil (`addressMode`)

| `addressMode` | Qanday to‘ldirish |
|----------------|-------------------|
| `text` | `addressText` — erkin matn (ofis manzili va hokazo). |
| `url` | `addressText` — havola (Google Maps havolasi va hokazo). |
| `place` | `placeLabel` va/yoki `addressText` (joy nomi) va ixtiyoriy `coordinates: { lat, lng }` (xarita tanlovi). Kamida bittasi bo‘lishi kerak. |

## Endpointlar

### `POST /api/interviews`

Yangi suhbat. Misol:

```json
{
  "candidateName": "Ali Valiyev",
  "candidatePhone": "+998901112233",
  "vacancyId": "681b35aa746f4f9b8d9c0b22",
  "applicationSubmissionId": "681c4f10746f4f9b8d9c0f12",
  "topic": "Texnik suhbat",
  "interviewerName": "Dilshod",
  "addressMode": "url",
  "addressText": "https://maps.google.com/?q=...",
  "scheduledAt": "2026-05-20T14:00:00.000+05:00"
}
```

`applicationSubmissionId` ixtiyoriy; berilsa, `vacancyId` bilan mosligi tekshiriladi.

### `GET /api/interviews`

Query: `vacancyId`, `status` (`scheduled` \| `completed` \| `cancelled` \| `no_show`).

### `GET /api/interviews/:id`

### `PATCH /api/interviews/:id`

**Vaqt / qayta reja:** `scheduledAt` yangilansa va holat `scheduled` bo‘lsa, `reminderSmsSent` avtomatik `false` (SMS qayta yuborilishi uchun).

**Natija:** masalan

```json
{
  "rating": 5,
  "passed": true,
  "adminNotes": "Juda yaxshi suhbat",
  "markEvaluated": true
}
```

`markEvaluated: true` — `evaluatedAt` qo‘yiladi; agar `status` hali `scheduled` bo‘lsa, `completed` ga o‘tkaziladi.

**O‘tmagan:** `passed: false`, `status: "no_show"` yoki `status: "completed"` + `passed: false`.

**Qayta suhbat:** `rescheduleRequested: true`, keyin yangi `scheduledAt` bilan `PATCH` (SMS qayta ishlaydi).

## SMS matni (eskizga mos — qisqa)

Shablon (backend `utils/interviewSmsTemplates.js`): nomzod ismi, vakansiya, mavzu, vaqt (Toshkent vaqti), qisqa manzil, suhbat oluvchi, **Talab va taklif agency**.

Agar Eskiz xato bersa, `reminderSmsSent` qayta tiklanadi — keyingi minutda qayta uriniladi.
