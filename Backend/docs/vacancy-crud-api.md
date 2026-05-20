# Vacancy CRUD API Documentation

Base URL: `http://localhost:5000`  
Swagger UI: `http://localhost:5000/api/docs`

## Vacancy entity

Barcha **GET** javoblari (`GET /api/vacancies`, `GET /api/vacancies/:id`) va **POST** / **PUT** muvaffaqiyatli javoblarida quyidagi maydonlar **server tomonidan qo‘shiladi** (bazada saqlanmaydi):

| Maydon | Tavsif |
|--------|--------|
| `applicationFormUrl` | Faqat shu vakansiya uchun `ApplicationForm` **`status: "active"`** bo‘lsa — ariza formasi frontend URL manzili; aks holda `null`. |
| `applicationFormAvailable` | `true` — faol forma bor; `false` — yo‘q (havola ham `null`). |

URL `APPLICATION_FORM_BASE_URL` va `APPLICATION_FORM_APPLY_PATH` (backend `.env`) bo‘yicha yig‘iladi. Batafsil: [FORM_APP_API.md](./FORM_APP_API.md).

```json
{
  "_id": "681b35aa746f4f9b8d9c0b22",
  "title": "Frontend Developer",
  "experience": "2+ years",
  "minAge": 20,
  "maxAge": 35,
  "salary": "8 000 000 - 12 000 000 UZS",
  "isOpen": true,
  "descriptionDelta": { "ops": [{ "insert": "Vakansiya haqida matn\n" }] },
  "responsibilitiesDelta": { "ops": [{ "insert": "Majburiyatlar matni\n" }] },
  "advantagesDelta": { "ops": [{ "insert": "Afzalliklar matni\n" }] },
  "skills": ["JavaScript", "React", "Git"],
  "applicationFormUrl": "https://form.ishber.uz/vacancies/681b35aa746f4f9b8d9c0b22/apply",
  "applicationFormAvailable": true,
  "createdAt": "2026-05-07T09:00:00.000Z",
  "updatedAt": "2026-05-07T09:00:00.000Z"
}
```

Agar faol ariza formasi bo‘lmasa: `"applicationFormUrl": null`, `"applicationFormAvailable": false`.

> `descriptionDelta`, `responsibilitiesDelta`, `advantagesDelta` maydonlari Quill delta JSON format qabul qiladi.
> `isOpen` maydoni vakansiya holatini belgilaydi (`true` = ochiq, `false` = yopiq). Yuborilmasa default `true`.

## Endpoints

### 1) Create vacancy

- **Method:** `POST`
- **URL:** `/api/vacancies`

Request body:

```json
{
  "title": "Frontend Developer",
  "experience": "2+ years",
  "minAge": 20,
  "maxAge": 35,
  "salary": "8 000 000 - 12 000 000 UZS",
  "isOpen": true,
  "descriptionDelta": { "ops": [{ "insert": "Vakansiya haqida matn\n" }] },
  "responsibilitiesDelta": { "ops": [{ "insert": "Majburiyatlar matni\n" }] },
  "advantagesDelta": { "ops": [{ "insert": "Afzalliklar matni\n" }] },
  "skills": ["JavaScript", "React", "Git"]
}
```

Success response: `201 Created` — javob tana qismi yaratilgan vakansiya obyektidir; ichida `applicationFormUrl` va `applicationFormAvailable` ham bor (odatda yangi vakansiyada forma yo‘q bo‘lgani uchun `null` / `false`).

Possible errors:
- `400` required fieldlar yuborilmagan
- `400` `minAge` > `maxAge`

### 2) Get all vacancies

- **Method:** `GET`
- **URL:** `/api/vacancies`

Success response: `200 OK` — massiv; har bir element yuqoridagi **Vacancy entity** tuzilmasida, `createdAt` tartibida yangilar birinchi (`sort: { createdAt: -1 }`).

```json
[
  {
    "_id": "681b35aa746f4f9b8d9c0b22",
    "title": "Frontend Developer",
    "experience": "2+ years",
    "minAge": 20,
    "maxAge": 35,
    "salary": "8 000 000 - 12 000 000 UZS",
    "isOpen": true,
    "descriptionDelta": { "ops": [{ "insert": "Vakansiya haqida matn\n" }] },
    "responsibilitiesDelta": { "ops": [{ "insert": "Majburiyatlar matni\n" }] },
    "advantagesDelta": { "ops": [{ "insert": "Afzalliklar matni\n" }] },
    "skills": ["JavaScript", "React", "Git"],
    "applicationFormUrl": "https://form.ishber.uz/vacancies/681b35aa746f4f9b8d9c0b22/apply",
    "applicationFormAvailable": true,
    "createdAt": "2026-05-07T09:00:00.000Z",
    "updatedAt": "2026-05-07T09:00:00.000Z"
  }
]
```

### 3) Get vacancy by id

- **Method:** `GET`
- **URL:** `/api/vacancies/:id`

Success response: `200 OK` — bitta vakansiya obyekti (`applicationFormUrl`, `applicationFormAvailable` bilan).

```json
{
  "_id": "681b35aa746f4f9b8d9c0b22",
  "title": "Frontend Developer",
  "experience": "2+ years",
  "minAge": 20,
  "maxAge": 35,
  "salary": "8 000 000 - 12 000 000 UZS",
  "isOpen": true,
  "descriptionDelta": { "ops": [{ "insert": "Vakansiya haqida matn\n" }] },
  "responsibilitiesDelta": { "ops": [{ "insert": "Majburiyatlar matni\n" }] },
  "advantagesDelta": { "ops": [{ "insert": "Afzalliklar matni\n" }] },
  "skills": ["JavaScript", "React", "Git"],
  "applicationFormUrl": "https://form.ishber.uz/vacancies/681b35aa746f4f9b8d9c0b22/apply",
  "applicationFormAvailable": true,
  "createdAt": "2026-05-07T09:00:00.000Z",
  "updatedAt": "2026-05-07T09:00:00.000Z"
}
```

Possible errors:
- `400` invalid ObjectId
- `404` vacancy topilmadi

### 4) Update vacancy

- **Method:** `PUT`
- **URL:** `/api/vacancies/:id`

Request body (partial yoki full):

```json
{
  "isOpen": false,
  "salary": "10 000 000 - 14 000 000 UZS",
  "maxAge": 37,
  "skills": ["JavaScript", "React", "Next.js", "Git"]
}
```

Success response: `200 OK` — yangilangan vakansiya obyekti (`applicationFormUrl`, `applicationFormAvailable` qayta hisoblanadi).

Possible errors:
- `400` invalid ObjectId
- `400` `minAge` > `maxAge`
- `404` vacancy topilmadi

### 5) Delete vacancy

- **Method:** `DELETE`
- **URL:** `/api/vacancies/:id`

Success response: `204 No Content`

Possible errors:
- `400` invalid ObjectId
- `404` vacancy topilmadi

## Error response format

```json
{
  "message": "Vacancy not found"
}
```
