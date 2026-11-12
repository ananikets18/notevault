# NoteVault

A minimal, focused notes application built with **C#**, **ASP.NET Core Web API**, **JWT Bearer Authentication**, **Entity Framework Core**, and **Microsoft SQL Server**, featuring a lightweight **Tailwind CSS** frontend and **Swagger** API explorer.

---

## 1. Features

| Feature | Functionality |
| :--- | :--- |
| **Register & Sign In** | Username & password accounts with PBKDF2 hashing and JWT Bearer tokens |
| **Create notes** | Provide title and content (scoped to the authenticated user) |
| **View notes** | Display all notes owned by the signed-in user (ordered newest first) |
| **Edit notes** | Update title and content of your own note (`403 Forbidden` for others) |
| **Delete notes** | Remove your own note by ID (`403 Forbidden` for others) |
| **Search notes** | Filter your notes by title using query parameter `?search=` |

> *Clean and concise: no bookmarks, tags, categories, pinning, or dashboards.*

---

## 2. Minimal Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Language** | C# 12 | Strongly-typed backend programming |
| **Framework** | .NET 8 LTS | High-performance development platform |
| **Web API** | ASP.NET Core Web API | RESTful controllers, routing, and model validation |
| **Auth** | JWT Bearer + `PasswordHasher<User>` | Stateless token authentication and user-ownership authorization |
| **ORM** | Entity Framework Core 8 | Code-first migrations, DbSet, and LINQ queries |
| **Database** | Microsoft SQL Server | Relational persistence (`.\SQLEXPRESS` / `NoteVaultDb`) |
| **API Testing** | Swagger / OpenAPI | Interactive browser documentation with Bearer **Authorize** modal |
| **Frontend** | Vanilla HTML5 + Tailwind CSS + JS | Zero-build, responsive UI served directly via `wwwroot` |
| **Version Control** | Git & GitHub | Source tracking |

---

## 3. Database Schema (2 Tables)

### `Users` Table

| Column | Type | Nullable | Details |
| :--- | :--- | :--- | :--- |
| `Id` | `int` | No | Primary Key, Identity `(1, 1)` |
| `Username` | `nvarchar(50)` | No | Unique index (`IX_Users_Username`) |
| `PasswordHash` | `nvarchar(max)` | No | PBKDF2 salted password hash |
| `CreatedAt` | `datetime` | No | Account creation timestamp (UTC) |

### `Notes` Table

| Column | Type | Nullable | Details |
| :--- | :--- | :--- | :--- |
| `Id` | `int` | No | Primary Key, Identity `(1, 1)` |
| `Title` | `nvarchar(100)` | No | Note title (Max length: 100 characters) |
| `Content` | `nvarchar(max)` | No | Full note body text |
| `CreatedAt` | `datetime` | No | Timestamp recorded in UTC |
| `UserId` | `int` | No | Foreign Key to `Users.Id` (`ON DELETE CASCADE`) |

---

## 4. API Endpoints

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Purpose | Request Body | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a user & get JWT | `RegisterDto` | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `POST` | `/api/auth/login` | Sign in & get JWT | `LoginDto` | `200 OK`, `400 Bad Request`, `401 Unauthorized` |

### Protected Note Endpoints (`/api/notes`, requires `Authorization: Bearer <token>`)

| Method | Endpoint | Purpose | Request Body | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/notes` | Create a note | `CreateNoteDto` | `201 Created`, `400 Bad Request`, `401 Unauthorized` |
| `GET` | `/api/notes` | Read all owned notes | *None* | `200 OK`, `401 Unauthorized` |
| `GET` | `/api/notes?search={term}` | Search owned notes by title | *None* | `200 OK`, `401 Unauthorized` |
| `GET` | `/api/notes/{id}` | Read one owned note by ID | *None* | `200 OK`, `401`, `403 Forbidden`, `404 Not Found` |
| `PUT` | `/api/notes/{id}` | Update owned note | `UpdateNoteDto` | `200 OK`, `400`, `401`, `403 Forbidden`, `404 Not Found` |
| `DELETE` | `/api/notes/{id}` | Delete owned note | *None* | `204 No Content`, `401`, `403 Forbidden`, `404 Not Found` |

---

## 5. Project Structure

```text
NoteVault/
├── NoteVault.sln                          # Visual Studio / .NET Solution
├── NoteVault.http                         # Executable HTTP test file for VS / VS Code
├── README.md                              # Documentation
│
└── src/
    └── NoteVault.Api/
        ├── Controllers/
        │   ├── AuthController.cs          # Register & Login endpoints
        │   └── NotesController.cs         # 5 JWT-protected CRUD & Search endpoints
        ├── Data/
        │   └── NoteVaultDbContext.cs      # EF Core DbContext (Users & Notes)
        ├── Migrations/                    # EF Core migrations
        ├── Models/
        │   ├── DTOs/
        │   │   ├── AuthResponseDto.cs     # Token, Username, ExpiresAt
        │   │   ├── CreateNoteDto.cs       # Validation contract for creating notes
        │   │   ├── LoginDto.cs            # Login payload
        │   │   ├── RegisterDto.cs         # Registration payload
        │   │   └── UpdateNoteDto.cs       # Validation contract for updating notes
        │   └── Entities/
        │       ├── Note.cs                # Note entity linked to User via UserId
        │       └── User.cs                # User entity
        ├── Services/
        │   └── JwtService.cs              # Signs and issues JWT Bearer tokens
        ├── Properties/
        │   └── launchSettings.json        # Development server launch profiles
        ├── wwwroot/                       # Lightweight static frontend
        │   ├── index.html                 # Tailwind CSS Auth & Notes UI
        │   └── js/
        │       └── app.js                 # Vanilla JS calling /api/auth & /api/notes
        ├── appsettings.json               # SQL Server & JWT config template
        ├── appsettings.Development.json   # Local development SQL & JWT key
        └── Program.cs                     # App setup, DI, JWT auth, Swagger, static files
```

---

## 6. Getting Started

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- Microsoft SQL Server or SQL Server Express running locally (`.\SQLEXPRESS`)

### Run the Application
From the repository root:
```powershell
dotnet run --project src/NoteVault.Api
```

Once running:
- **Web UI**: Open [http://localhost:5170](http://localhost:5170) to register/sign in and manage your private notes.
- **Swagger UI**: Open [http://localhost:5170/swagger](http://localhost:5170/swagger), call `POST /api/auth/login` or `/register`, click **Authorize**, and enter your JWT token to test protected endpoints.
- The database `NoteVaultDb` and tables (`Users`, `Notes`) are automatically migrated on startup.

> **Production Note**: Configure `Jwt:Key` (at least 32 characters) via User Secrets or environment variables (`Jwt__Key`) before deploying outside Development.

### Test via .http File
Open [`NoteVault.http`](NoteVault.http) in Visual Studio or VS Code (with the REST Client extension) to register, log in, and execute authenticated requests.
