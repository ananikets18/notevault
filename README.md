# NoteVault

A minimal, focused REST API built with **C#**, **ASP.NET Core Web API**, **Entity Framework Core**, and **Microsoft SQL Server**.

---

## 1. Features — Only 5

| Feature | Functionality |
| :--- | :--- |
| **Create notes** | Provide title and content |
| **View notes** | Display all saved notes (ordered newest first) |
| **Edit notes** | Update title and content of an existing note |
| **Delete notes** | Remove a note by ID |
| **Search notes** | Filter notes by title using query parameter `?search=` |

> *No bookmarks, tags, categories, pinning, authentication, or dashboards. Zero bloat.*

---

## 2. Minimal Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **C# 12** | Backend programming language |
| **.NET 8 LTS** | Runtime and development platform (forward-compatible with .NET 9 / 10) |
| **ASP.NET Core Web API** | RESTful HTTP API controllers and middleware |
| **Entity Framework Core 8** | Database ORM, migrations, and LINQ querying |
| **Microsoft SQL Server** | Persistent relational storage (`.\SQLEXPRESS` / `NoteVaultDb`) |
| **Swagger / OpenAPI** | Interactive API documentation and testing UI |
| **Vanilla HTML + Tailwind CSS + JS** | Lightweight, zero-build frontend served via `wwwroot` |
| **Git & GitHub** | Version control |

---

## 3. Database — Just One Table

### `Notes` Table Schema

| Column | Type | Description |
| :--- | :--- | :--- |
| `Id` | `int` | Primary Key, Identity `(1, 1)` |
| `Title` | `nvarchar(100)` | Note title (Max length: 100, Required) |
| `Content` | `nvarchar(max)` | Full text of the note (Required) |
| `CreatedAt` | `datetime` | Creation timestamp (`DateTime.UtcNow`) |

*Only one entity. No relationships.*

---

## 4. Only 5 API Endpoints

| Method | Endpoint | Purpose | Request Body | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/notes` | Create a note | `CreateNoteDto` | `201 Created`, `400 Bad Request` |
| `GET` | `/api/notes` | Read all notes | *None* | `200 OK` |
| `GET` | `/api/notes?search={term}` | Search notes by title | *None* | `200 OK` |
| `GET` | `/api/notes/{id}` | Read one note by ID | *None* | `200 OK`, `404 Not Found` |
| `PUT` | `/api/notes/{id}` | Update title & content | `UpdateNoteDto` | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/notes/{id}` | Delete a note | *None* | `204 No Content`, `404 Not Found` |

---

## 5. What You Learn with This Project

Even with this minimal application, the codebase demonstrates 12 fundamental concepts:

1. **C# Classes & Objects**: Entity class `Note`, DTO models `CreateNoteDto` and `UpdateNoteDto`.
2. **Properties & Constructors**: Auto-implemented properties, get/set, and dependency-injected constructor in `NotesController`.
3. **ASP.NET Core Controllers**: `[ApiController]`, `[Route("api/[controller]")]`, inheriting from `ControllerBase`.
4. **HTTP Methods & Status Codes**: `[HttpPost]` (`201 Created`), `[HttpGet]` (`200 OK`), `[HttpPut]` (`200 OK`), `[HttpDelete]` (`204 NoContent`), `400 BadRequest`, `404 NotFound`.
5. **Dependency Injection**: Registering `NoteVaultDbContext` in `Program.cs` and injecting it into `NotesController`.
6. **Entity Framework Core**: Object-relational mapping between C# objects and relational SQL Server tables.
7. **DbContext & DbSet**: `NoteVaultDbContext : DbContext` managing `DbSet<Note> Notes`.
8. **SQL Server Integration**: `UseSqlServer` with connection string and automatic schema migrations on startup.
9. **LINQ Queries**: Filtering with `.Where(n => n.Title.Contains(search))`, sorting with `.OrderByDescending(n => n.CreatedAt)`, `.ToListAsync()`, and `.FindAsync(id)`.
10. **Model Validation**: `[Required]`, `[StringLength(100)]` Data Annotations and automated RFC 9110 ProblemDetails responses on invalid input.
11. **Exception Handling**: Startup database migration try-catch logging and standard ASP.NET Core developer exception diagnostics.
12. **CRUD Operations**: Clean, idiomatic implementation of Create, Read, Update, and Delete operations.

---

## 6. Project Structure

```
NoteVault/
│
├── NoteVault.sln                      # Visual Studio / .NET solution
├── NoteVault.http                     # Quick HTTP test file for VS / VS Code REST Client
├── README.md                          # Documentation
│
└── src/
    └── NoteVault.Api/
        ├── Controllers/
        │   └── NotesController.cs     # 5 CRUD & Search API endpoints
        ├── Data/
        │   └── NoteVaultDbContext.cs  # EF Core DbContext with Notes table mapping
        ├── Migrations/                # EF Core migrations (InitialCreate)
        ├── Models/
        │   ├── DTOs/
        │   │   ├── CreateNoteDto.cs   # Validation for creating notes
        │   │   └── UpdateNoteDto.cs   # Validation for updating notes
        │   └── Entities/
        │       └── Note.cs            # Notes entity with exact schema
        ├── Properties/
        │   └── launchSettings.json    # Local development server profiles
        ├── appsettings.json           # SQL Server connection string
        ├── appsettings.Development.json
        └── Program.cs                 # App setup, DI, Swagger, and auto-migration
```

---

## 7. How to Run

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- Microsoft SQL Server or SQL Server Express running locally (`.\SQLEXPRESS`)

### Run the API
```powershell
dotnet run --project src/NoteVault.Api
```

Once running:
- Open your browser to **Swagger UI**: [http://localhost:5170/swagger](http://localhost:5170/swagger)
- The database `NoteVaultDb` and table `Notes` are automatically created on startup if they don't already exist.

### Test via .http File
Open [`NoteVault.http`](file:///d:/PEAK_PREP/RESUME/Software-developer/.Net/NoteVault/NoteVault.http) in Visual Studio or VS Code (with REST Client extension) to execute requests with one click.
