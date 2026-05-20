# Admin CRUD API Documentation

Base URL: `http://localhost:5000`  
Swagger UI: `http://localhost:5000/api/docs`

## Login (Auth)

### Login with username/password

- **Method:** `POST`
- **URL:** `/api/auth/login`

Request body:

```json
{
  "username": "superadmin",
  "password": "superadmin123"
}
```

Success response: `200 OK`

```json
{
  "token": "jwt_token_here",
  "admin": {
    "_id": "681b2b5f746f4f9b8d9c0a11",
    "firstName": "Super",
    "lastName": "Admin",
    "phoneNumber": "+998900000000",
    "username": "superadmin",
    "createdAt": "2026-05-07T08:20:00.000Z",
    "updatedAt": "2026-05-07T08:20:00.000Z"
  }
}
```

Possible errors:
- `400` username yoki password berilmagan
- `401` username yoki password noto'g'ri

## Admin entity

```json
{
  "_id": "681b2b5f746f4f9b8d9c0a11",
  "firstName": "Ali",
  "lastName": "Valiyev",
  "phoneNumber": "+998901112233",
  "username": "ali_admin",
  "createdAt": "2026-05-07T08:20:00.000Z",
  "updatedAt": "2026-05-07T08:20:00.000Z"
}
```

> `password` hash holatda saqlanadi va API javobida qaytmaydi.

## Endpoints

### 1) Create admin

- **Method:** `POST`
- **URL:** `/api/admins`

Request body:

```json
{
  "firstName": "Ali",
  "lastName": "Valiyev",
  "phoneNumber": "+998901112233",
  "username": "ali_admin",
  "password": "StrongPass123"
}
```

Success response: `201 Created`

```json
{
  "_id": "681b2b5f746f4f9b8d9c0a11",
  "firstName": "Ali",
  "lastName": "Valiyev",
  "phoneNumber": "+998901112233",
  "username": "ali_admin",
  "createdAt": "2026-05-07T08:20:00.000Z",
  "updatedAt": "2026-05-07T08:20:00.000Z"
}
```

Possible errors:
- `400` missing fields
- `409` username yoki phoneNumber band

### 2) Get all admins

- **Method:** `GET`
- **URL:** `/api/admins`

Success response: `200 OK`

```json
[
  {
    "_id": "681b2b5f746f4f9b8d9c0a11",
    "firstName": "Ali",
    "lastName": "Valiyev",
    "phoneNumber": "+998901112233",
    "username": "ali_admin",
    "createdAt": "2026-05-07T08:20:00.000Z",
    "updatedAt": "2026-05-07T08:20:00.000Z"
  }
]
```

### 3) Get admin by id

- **Method:** `GET`
- **URL:** `/api/admins/:id`

Success response: `200 OK`

```json
{
  "_id": "681b2b5f746f4f9b8d9c0a11",
  "firstName": "Ali",
  "lastName": "Valiyev",
  "phoneNumber": "+998901112233",
  "username": "ali_admin",
  "createdAt": "2026-05-07T08:20:00.000Z",
  "updatedAt": "2026-05-07T08:20:00.000Z"
}
```

Possible errors:
- `400` invalid ObjectId
- `404` admin topilmadi

### 4) Update admin

- **Method:** `PUT`
- **URL:** `/api/admins/:id`

Request body (partial yoki full):

```json
{
  "firstName": "Alisher",
  "phoneNumber": "+998907778899",
  "password": "NewStrongPass123"
}
```

Success response: `200 OK`

```json
{
  "_id": "681b2b5f746f4f9b8d9c0a11",
  "firstName": "Alisher",
  "lastName": "Valiyev",
  "phoneNumber": "+998907778899",
  "username": "ali_admin",
  "createdAt": "2026-05-07T08:20:00.000Z",
  "updatedAt": "2026-05-07T08:33:00.000Z"
}
```

Possible errors:
- `400` invalid ObjectId
- `404` admin topilmadi
- `409` username yoki phoneNumber band

### 5) Delete admin

- **Method:** `DELETE`
- **URL:** `/api/admins/:id`

Success response: `204 No Content`

Possible errors:
- `400` invalid ObjectId
- `404` admin topilmadi

## Error response format

```json
{
  "message": "Admin not found"
}
```

Development rejimida qo‘shimcha `stack` maydoni ham qaytadi.

## Initial admin creation

Birlamchi admin yaratish:

```bash
npm run create-admin
```

`.env` dagi quyidagi qiymatlar ishlatiladi:

- `ADMIN_FIRST_NAME`
- `ADMIN_LAST_NAME`
- `ADMIN_PHONE`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
