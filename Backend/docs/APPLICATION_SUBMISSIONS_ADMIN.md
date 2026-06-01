# Nomzod arizalari — admin API

Base: `http://localhost:5000`  
Swagger: `/api/docs` (tag **ApplicationSubmissions**)

Ariza yuborilganda `submissionNumber` vakansiya bo‘yicha ketma-ket raqam (alohida `SubmissionSeqCounter` orqali). SMS matnlarida **№** shu raqam (yoki eski arizalar uchun qisqa id).

## Telefon (SMS uchun)

- `POST /api/public/vacancies/:vacancyId/applications` tana qismida ixtiyoriy **`phone`**.
- Bo‘lmasa, formadagi **`type: "phone"`** savolining javobidan olinadi.
- Telefon bo‘lmasa, ariza saqlanadi, lekin keyingi admin SMS lari `400` beradi (telefon majburiy deb).

## Eskiz va uzunlik

Matnlar `utils/submissionSmsTemplates.js` da yig‘iladi: vakansiya sarlavhasi va bekor sababi qisqartiriladi (taxminan **480** belgidan oshmasligi uchun).

---

## Endpointlar

### Ro‘yxat (vakansiya bo‘yicha)

`GET /api/application-submissions/vacancy/:vacancyId`  

Shuningdek mavjud: `GET /api/vacancies/:vacancyId/application-submissions` (bir xil ma’lumot).

**Tezlik:** nomzodlar formada **rasm/faylni base64** (`data:image/jpeg;base64,...`) sifatida saqlaydi (~1–3 MB har bir ariza). Shuning uchun ro‘yxat endpointi **standart ravishda `answers` maydonini qaytarmaydi** (telefon, status, `contactLog`, va hokazo yetarli). To‘liq forma javoblari (rasmlar bilan): `GET /api/application-submissions/:id`.

Agar eski xatti-harakat kerak bo‘lsa (sekin): `?includeAnswers=true`

### Bitta ariza

`GET /api/application-submissions/:id`  

Javobda: `vacancyTitle`, `displayNumber`, `status`, `contactLog`, `applicantPhone`, `contactedAt`, `answers`, …

### Nomzod ma’lumotlarini tahrirlash

`PATCH /api/application-submissions/:id`

Admin nomzodning **telefoni** va/yoki **forma javoblarini** yangilashi mumkin. Kamida bitta maydon yuborilishi shart. Javoblar shu arizaga bog‘langan so‘rovnoma (`applicationFormId`) bo‘yicha tekshiriladi — xuddi nomzod topshirgandek (`required`, `select` variantlari va hokazo).

```json
{
  "applicantPhone": "+998901112233",
  "answers": [
    { "questionId": "65a1b2c3d4e5f6789012345", "value": "Yangilangan javob" },
    { "questionId": "65a1b2c3d4e5f6789012346", "value": ["React", "Vue"] }
  ]
}
```

- Faqat `applicantPhone` yoki faqat `answers` ham mumkin.
- `answers` yuborilsa — **to‘liq** javoblar ro‘yxati (barcha majburiy savollar bilan); qisman patch emas.
- `status` (qabul/bekor) bu endpoint orqali o‘zgartirilmaydi — buning uchun `PATCH .../status` ishlatiladi.

### Qabul / bekor

`PATCH /api/application-submissions/:id/status`

```json
{
  "status": "accepted",
  "sendSms": true
}
```

```json
{
  "status": "rejected",
  "rejectionReason": "Talablariga mos kelmadi",
  "sendSms": true
}
```

- `sendSms` yuborilmasa yoki `true` — Eskiz orqali SMS.
- `sendSms: false` — holatni yangilaydi, SMS yubormaydi.
- `rejected` uchun **`rejectionReason` majburiy**.
- Faqat **`pending`** holatdan o‘tkazish mumkin.

### Aloqaga chiqildi

`PATCH /api/application-submissions/:id/contact`

Tan body shart emas. `contactedAt` joriy vaqtga qo‘yiladi (SMS yuborilmaydi).

### Aloqa / natija yozuvi (todo)

`POST /api/application-submissions/:id/contact-notes`

```json
{
  "text": "Qo‘ng‘iroq qildim, suhbat o‘tkazildi",
  "outcome": "2-bosqichga qoldi"
}
```

`contactLog` massiviga yangi element qo‘shiladi (`_id`, `createdAt` bilan).

---

## SMS shablonlari (kod bilan bir xil)

| Voqea | Matn |
|--------|------|
| **Ariza yuborilganda** | `{VACANCY_TITLE} uchun topshirgan №{n} arizangiz yuborildi. Tez orada ariza natijasini SMS orqali yuboramiz. Talab va taklif agency` |
| **Qabul** | `{VACANCY_TITLE} uchun topshirgan №{n} arizangiz qabul qilindi. Tez orada aloqaga chiqamiz. Talab va taklif agency` |
| **Bekor** | `{VACANCY_TITLE} uchun topshirgan №{n} arizangiz bekor qilindi. Sababi: {reason}. Talab va taklif agency` |

Ariza yuborilganda SMS: `.env` da `SUBMISSION_SMS_ON_SUBMIT=false` bo‘lsa o‘chadi.

---

## Xatoliklar

| Kod | Sabab |
|-----|--------|
| `400` | `rejectionReason` yo‘q (reject), telefon yo‘q (SMS), noto‘g‘ri body |
| `404` | Ariza topilmadi |
| `409` | Ariza allaqachon `accepted` yoki `rejected` |
