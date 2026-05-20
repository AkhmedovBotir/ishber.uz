# Form ilovasi (https://form.ishber.uz) uchun API

Asosiy server: `http://localhost:5000` (yoki `.env` dagi `PORT`).

Swagger UI: [http://localhost:5000/api/docs](http://localhost:5000/api/docs) — barcha endpointlar va sxemalar.

## Muhit o‘zgaruvchilari (backend `.env`)

| O‘zgaruvchi | Tavsif |
|-------------|--------|
| `APPLICATION_FORM_BASE_URL` | Ariza sahifasi URL, masalan `https://form.ishber.uz` |
| `APPLICATION_FORM_APPLY_PATH` | `{vacancyId}` bo‘lgan yo‘l shabloni, standart: `vacancies/{vacancyId}/apply` |

`Vacancy` JSON (admin va jamoat GET) da `applicationFormUrl` va `applicationFormAvailable` **hisoblab** qo‘shiladi (bazada saqlanmaydi). Faqat `status: active` ariza formasi bo‘lsa havola beriladi; bo‘lmasa `applicationFormUrl: null`, `applicationFormAvailable: false`.

`ApplicationForm` javoblarida `applicationFormUrl` virtual maydoni forma hujjatiga bog‘langan.

## CORS

Form va admin turli portlarda bo‘lsa, backend `cors()` hozircha barcha originlarga ruxsat beradi. Productionda cheklashni o‘zingiz sozlang.

---

## Jamoat endpointlari (`/api/public/...`)

Autentifikatsiya talab qilinmaydi. Faqat `isOpen: true` vakansiyalar va `status: active` forma.

### 1. Vakansiya (qisqa ma’lumot + havola)

`GET /api/public/vacancies/:vacancyId`

Javob: vakansiya obyekti — `applicationFormUrl` (faqat faol forma bo‘lsa, aks holda `null`) va `applicationFormAvailable` (`true` / `false`).

### 2. Vakansiya + faol so‘rovnoma (formani chizish)

`GET /api/public/vacancies/:vacancyId/form`

Javob:

```json
{
  "vacancy": { ... , "applicationFormUrl": "https://form.ishber.uz/vacancies/.../apply" },
  "form": { "_id", "vacancyId", "nom", "questions", "status", "applicationFormUrl", ... }
}
```

Har bir `questions[]` elementida `_id` bor — topshirishda shu ID ishlatiladi.

### 3. Arizani yuborish

`POST /api/public/vacancies/:vacancyId/applications`

Content-Type: `application/json`

```json
{
  "phone": "+998901112233",
  "answers": [
    { "questionId": "65a1b2c3d4e5f6789012345", "value": "Javob matni" },
    { "questionId": "65a1b2c3d4e5f6789012346", "value": ["A", "B"] }
  ]
}
```

- **`phone`** — ixtiyoriy. Bo‘lmasa, formadagi `type: "phone"` savolidan telefon olinadi. Eskiz orqali **ariza qabul qilindi** SMS yuborish uchun kerak (`SUBMISSION_SMS_ON_SUBMIT`, `.env.example`).
- `questionId` — formadagi savol subdokumentining `_id` si.
- `multiselect` / `checkbox` uchun `value` — **string massiv**.
- `select` / `radio` uchun — bitta **string** (variantlar ro‘yxatidan).
- `required: true` bo‘lgan barcha savollarga javob berilishi shart.

Muvaffaqiyat: `201` va yaratilgan `ApplicationSubmission` obyekti (`submissionNumber`, `status`, `applicantPhone`, …).

Admin: nomzodlarni boshqarish, qabul/bekor, aloqa yozuvlari va SMS — [APPLICATION_SUBMISSIONS_ADMIN.md](./APPLICATION_SUBMISSIONS_ADMIN.md).

---

## Admin paneli uchun (5173)

### Vakansiya ro‘yxati / bitta vakansiya

Mavjud `GET /api/vacancies` va `GET /api/vacancies/:id` — har bir vakansiyada `applicationFormUrl` (faol forma bo‘lmasa `null`) va `applicationFormAvailable` (`true` / `false`).

### Vakansiya bo‘yicha kelib tushgan arizalar

`GET /api/vacancies/:vacancyId/application-submissions`

So‘nggi arizalar birinchi chiqadi.

---

## Frontend marshrut bilan moslik

Standart `applicationFormUrl`:

`https://form.ishber.uz/vacancies/<vacancyId>/apply`

React Router misoli: path `/vacancies/:vacancyId/apply` yoki `/:vacancyId/apply` bo‘lsa, `APPLICATION_FORM_APPLY_PATH` ni `.env` da shunga mos qilib qo‘ying.

---

## Savol turlari (`questions[].type`)

Backend modeli: `ApplicationForm` — `type` faqat quyidagi qiymatlardan biri bo‘lishi mumkin. Admin forma yaratishda `select`, `multiselect`, `radio`, `checkbox` uchun **`options`** massivi majburiy va kamida bitta variant bo‘lishi kerak.

Arizani yuborishda (`POST .../applications`) har bir javob: `{ "questionId": "<savol _id>", "value": ... }`. Quyida `value` qanday bo‘lishi kerakligi qisqacha berilgan (JSON serializatsiya — sonlar va booleanlar ham JSON da yuboriladi).

| `type` | Nima uchun | `options` | Topshirishda `value` |
|--------|--------------|-------------|----------------------|
| `text` | Qisqa bir qatorli matn | yo‘q | **string** |
| `textarea` | Ko‘p qatorli matn | yo‘q | **string** |
| `number` | Raqam | yo‘q | **number** yoki raqam sifatida yuborilgan **string** (ikkala holatda ham server `Mixed` qabul qiladi; formada `input type="number"` mos) |
| `email` | Elektron pochta | yo‘q | **string** (validatsiya formada qilinadi) |
| `phone` | Telefon raqami | yo‘q | **string** |
| `select` | Bitta variant tanlash (ro‘yxatdan) | **majburiy** | **string** — faqat `options` ichidagi variantlardan biri |
| `multiselect` | Bir nechta variant | **majburiy** | **string[]** — har biri `options` dan |
| `radio` | Radio tugmalar (bitta tanlov) | **majburiy** | **string** — `options` dan biri |
| `checkbox` | Bir nechta belgilash | **majburiy** | **string[]** — `options` dan |
| `date` | Sana (masalan HTML `date`) | yo‘q | **string** (odatda `YYYY-MM-DD`) |
| `time` | Vaqt | yo‘q | **string** (masalan `HH:mm` yoki brauzer formati) |
| `datetime` | Sana + vaqt | yo‘q | **string** (masalan ISO 8601: `2026-05-14T12:00:00.000Z`) |
| `month` | Oy | yo‘q | **string** (masalan `YYYY-MM`) |
| `week` | Hafta | yo‘q | **string** (HTML `week` yoki loyiha kelishuvi bo‘yicha) |
| `file` | Fayl | yo‘q | **string** (masalan yuklangan fayl URL yoki identifikator — backend fayl saqlamaydi, faqat qiymatni yozadi) |
| `image` | Rasm (foto) | yo‘q | **string** — yuklangan rasmning to‘liq URL yoki storage ID si (`file` kabi) |
| `video` | Video | yo‘q | **string** — video URL yoki ID |
| `pdf` | PDF hujjat | yo‘q | **string** — PDF URL yoki ID |
| `url` | Havola | yo‘q | **string** (URL matni) |
| `password` | Maxfiy matn | yo‘q | **string** |
| `rating` | Baholash (yulduzcha va hokazo) | yo‘q | **number** yoki **string** (form UI bilan kelishilgan qiymat) |
| `boolean` | Ha / Yo‘q | yo‘q | **boolean** (`true` / `false`) |
| `range` | Diapazon (slider) | yo‘q | **number** yoki **string** (min/max formada) |

**Muhim:**

- `select`, `multiselect`, `radio`, `checkbox` — backend topshirishda variantlarni `options` ro‘yxati bilan solishtiradi; noto‘g‘ri qiymat `400` beradi.
- `required: true` bo‘lgan savollar uchun `value` bo‘sh bo‘lmasligi kerak (bo‘sh string, `null`, yoki bo‘sh massiv — xato).
- `file`, `image`, `video`, `pdf` — fayl/rasm/video/PDF ni avval storage ga yuklab, `value` ga URL yoki ID beriladi; hozirgi `POST .../applications` multipart qabul qilmaydi.

Manba (kod): `models/ApplicationForm.js` — `QUESTION_TYPES` va `OPTION_BASED_TYPES` (`select`, `multiselect`, `radio`, `checkbox`).

### Ruxsat etilgan `type` qiymatlari (model bilan bir xil)

```text
text, textarea, number, email, phone, select, multiselect, radio, checkbox,
date, time, datetime, month, week, file, image, video, pdf, url, password, rating, boolean, range
```

Variant talab qilinadigan turlar (`options` majburiy): `select`, `multiselect`, `radio`, `checkbox`.

### Savol elementi (`questions[]`) — qisqa tuzilma

Har bir savolda odatda quyidagilar bo‘ladi (admin CRUD orqali yuboriladi):

| Maydon | Tavsif |
|--------|--------|
| `_id` | MongoDB subdokument ID — ariza topshirishda `questionId` sifatida ishlatiladi |
| `question` | Savol matni (majburiy) |
| `type` | Yuqoridagi ro‘yxatdan biri (majburiy) |
| `required` | `true` bo‘lsa, topshirishda javob majburiy |
| `options` | `select` / `multiselect` / `radio` / `checkbox` uchun kamida bitta satr variant |
| `placeholder` | Ixtiyoriy yordamchi matn |
| `order` | Tartib raqami (ixtiyoriy, default `0`) |
