# API Endpoints Reference

Base URL: `http://localhost:5017/api`

## Authentication

Protected endpoints require:

`Authorization: Bearer <jwt>`

## Auth

### POST `/Auth/login`

- Auth: Public
- Body:

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

- 200:

```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "8f4f5d76-66a5-4dff-b3cb-8a5f1c9a130f",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "address": "123 Main St",
    "city": "Madrid",
    "country": "ES",
    "phone": "+34123456789",
    "createdAt": "2026-03-26T10:00:00Z",
    "updatedAt": "2026-03-26T10:00:00Z"
  }
}
```

- 401: `{ "error": "Invalid credentials" }`

## Users

### POST `/Users`

- Auth: Public
- Body: `CreateUserDto`
- 201: `UserDto`

### GET `/Users/{id}`

- Auth: Bearer token
- 200: `UserDto`

### GET `/Users`

- Auth: Bearer token
- 200: `UserDto[]`

### GET `/Users/email/{email}`

- Auth: Bearer token
- 200: `UserDto`

### PUT `/Users/{id}`

- Auth: Bearer token
- Body: `UpdateUserDto`
- 204: No Content

### DELETE `/Users/{id}`

- Auth: Bearer token
- 204: No Content

## Videogames

### POST `/Videogames`

- Auth: Bearer token
- Body: `CreateVideogameDto`
- 201: `VideogameDto`

### GET `/Videogames`

- Auth: Public
- 200: `VideogameDto[]`

### GET `/Videogames/{id}`

- Auth: Public
- 200: `VideogameDto`

### PUT `/Videogames/{id}`

- Auth: Bearer token
- Body: `UpdateVideogameDto`
- 204: No Content

### DELETE `/Videogames/{id}`

- Auth: Bearer token
- 204: No Content

## Images

### POST `/Images/upload`

- Auth: Bearer token
- Content-Type: `multipart/form-data`
- Form field: `file`
- 200: `{ "fileName": "uuid.jpg" }`

### GET `/Images/{fileName}`

- Auth: Public
- 302: Redirect to presigned URL

## Authorization Policy Notes

- Marketplace catalog (`GET /Videogames` and `GET /Videogames/{id}`) should remain public for anonymous browsing.
- User data endpoints remain protected due to personally identifiable information.
- Write operations (`POST`, `PUT`, `DELETE`) remain protected for videogame and image upload resources.
