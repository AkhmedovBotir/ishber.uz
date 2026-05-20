# Application Form CRUD API Documentation

Base URL: `http://localhost:5000`  
Swagger UI: `http://localhost:5000/api/docs`

Required ENV for SMS:
- `ESKIZ_EMAIL`
- `ESKIZ_PASSWORD`
- `APPLICATION_FORM_BASE_URL` (optional, default: `https://form.ishber.uz`)
- `SUBMISSION_SMS_ON_SUBMIT` (optional, default: yuboriladi; `false` bo‘lsa ariza yuborilganda tasdiq SMS yuborilmaydi)

Nomzod arizalarini boshqarish (qabul/bekor, aloqa, SMS): [APPLICATION_SUBMISSIONS_ADMIN.md](./APPLICATION_SUBMISSIONS_ADMIN.md).

## ApplicationForm entity

```json
{
  "_id": "681c4f10746f4f9b8d9c0f11",
  "vacancyId": "681b35aa746f4f9b8d9c0b22",
  "nom": "Frontend Developer so'rovnomasi",
  "questions": [
    {
      "_id": "681c4f10746f4f9b8d9c0f12",
      "question": "To'liq ism-sharifingiz",
      "type": "text",
      "required": true,
      "options": [],
      "placeholder": "Ism familiya",
      "order": 1
    },
    {
      "_id": "681c4f10746f4f9b8d9c0f13",
      "question": "Qaysi texnologiyalarni bilasiz?",
      "type": "checkbox",
      "required": true,
      "options": ["React", "Vue", "Angular"],
      "placeholder": "",
      "order": 2
    }
  ],
  "status": "active",
  "createdAt": "2026-05-09T06:20:00.000Z",
  "updatedAt": "2026-05-09T06:20:00.000Z"
}
```

> `vacancyId` maydoni vakansiyaga bog'lanadi.  
> Har bir `vacancyId` uchun faqat bitta so'rovnoma yaratiladi (`unique`).  
> `select`, `multiselect`, `radio`, `checkbox` turlarida `options` bo'sh bo'lmasligi kerak.  
> `file`, `image`, `video`, `pdf` — nomiga mos media/hujjat; javobda odatda yuklangan faylning **URL** yoki **ID** si (string) yuboriladi.

## Supported question types

`text`, `textarea`, `number`, `email`, `phone`, `select`, `multiselect`, `radio`, `checkbox`, `date`, `time`, `datetime`, `month`, `week`, `file`, `image`, `video`, `pdf`, `url`, `password`, `rating`, `boolean`, `range`

## Endpoints

### 1) Create application form

- **Method:** `POST`
- **URL:** `/api/application-forms`

Request body:

```json
{
  "vacancyId": "681b35aa746f4f9b8d9c0b22",
  "nom": "Frontend Developer so'rovnomasi",
  "questions": [
    {
      "question": "To'liq ism-sharifingiz",
      "type": "text",
      "required": true,
      "placeholder": "Ism familiya",
      "order": 1
    },
    {
      "question": "Qaysi frontend frameworklarda ishlagansiz?",
      "type": "multiselect",
      "required": true,
      "options": ["React", "Vue", "Angular", "Svelte"],
      "order": 2
    },
    {
      "question": "Portfolio havolasi",
      "type": "url",
      "required": false,
      "placeholder": "https://...",
      "order": 3
    }
  ],
  "status": "active"
}
```

Success response: `201 Created`

Possible errors:
- `400` required fieldlar yuborilmagan (`vacancyId`, `nom`, `questions`)
- `400` invalid `ObjectId`
- `400` `questions` noto'g'ri formatda
- `409` ushbu vakansiya uchun forma allaqachon mavjud

### 2) Get all application forms

- **Method:** `GET`
- **URL:** `/api/application-forms`

Success response: `200 OK`

```json
[
  {
    "_id": "681c4f10746f4f9b8d9c0f11",
    "vacancyId": "681b35aa746f4f9b8d9c0b22",
    "nom": "Frontend Developer so'rovnomasi",
    "questions": [],
    "status": "active",
    "createdAt": "2026-05-09T06:20:00.000Z",
    "updatedAt": "2026-05-09T06:20:00.000Z"
  }
]
```

### 3) Get application form by id

- **Method:** `GET`
- **URL:** `/api/application-forms/:id`

Success response: `200 OK`

Possible errors:
- `400` invalid `ObjectId`
- `404` form topilmadi

### 4) Get application form by vacancy id

- **Method:** `GET`
- **URL:** `/api/application-forms/vacancy/:vacancyId`

Success response: `200 OK`

Possible errors:
- `400` invalid `ObjectId`
- `404` form topilmadi

### 5) Update application form

- **Method:** `PUT`
- **URL:** `/api/application-forms/:id`

Request body (partial yoki full):

```json
{
  "nom": "Frontend Developer yangilangan so'rovnomasi",
  "status": "inactive",
  "questions": [
    {
      "question": "Email manzilingiz",
      "type": "email",
      "required": true,
      "placeholder": "example@mail.com",
      "order": 1
    },
    {
      "question": "Ish tajribangiz (yil)",
      "type": "number",
      "required": true,
      "order": 2
    }
  ]
}
```

Success response: `200 OK`

Possible errors:
- `400` invalid `ObjectId`
- `400` savollar validatsiyadan o'tmadi
- `404` form topilmadi
- `409` boshqa forma shu `vacancyId` bilan mavjud

### 6) Send application form link via SMS

- **Method:** `POST`
- **URL:** `/api/application-forms/send-link-sms`

SMS matni shablon: `{vakansiya nomi} vakansiyasi uchun ariza yuborish havolasi: {URL}. Talab va taklif agenycy` — `{URL}` `APPLICATION_FORM_BASE_URL` + `APPLICATION_FORM_APPLY_PATH` bo‘yicha yig‘iladi.

Request body:

```json
{
  "phone": "+998901112233",
  "vacancyId": "681b35aa746f4f9b8d9c0b22"
}
```

Success response: `200 OK`

```json
{
  "success": true,
  "vacancyId": "681b35aa746f4f9b8d9c0b22",
  "formId": "681c4f10746f4f9b8d9c0f11",
  "formUrl": "https://form.ishber.uz/vacancies/681b35aa746f4f9b8d9c0b22/apply",
  "sms": {
    "success": true,
    "status": "sent",
    "messageId": "123456789"
  }
}
```

Possible errors:
- `400` `phone` yoki `vacancyId` yuborilmagan
- `400` invalid `vacancyId`
- `404` vacancy topilmadi
- `404` ushbu vacancy uchun active so'rovnoma topilmadi
- `500` Eskiz API xatoligi

### 7) Delete application form

- **Method:** `DELETE`
- **URL:** `/api/application-forms/:id`

Success response: `204 No Content`

Possible errors:
- `400` invalid `ObjectId`
- `404` form topilmadi

## Error response format

```json
{
  "message": "Application form not found"
}
```
