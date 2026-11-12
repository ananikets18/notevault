using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NoteVault.Api.Data;
using NoteVault.Api.Models.DTOs;
using NoteVault.Api.Models.Entities;

namespace NoteVault.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotesController : ControllerBase
{
    private readonly NoteVaultDbContext _context;
    private readonly ILogger<NotesController> _logger;

    // Dependency Injection: ASP.NET Core supplies the DbContext and Logger
    public NotesController(NoteVaultDbContext context, ILogger<NotesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 1. Create note (POST /api/notes)
    /// </summary>
    /// <param name="dto">The note title and content</param>
    /// <returns>The newly created note owned by the authenticated user</returns>
    [HttpPost]
    [ProducesResponseType(typeof(Note), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<Note>> Create([FromBody] CreateNoteDto dto)
    {
        var userId = GetCurrentUserId();

        var note = new Note
        {
            Title = dto.Title.Trim(),
            Content = dto.Content,
            CreatedAt = DateTime.UtcNow,
            UserId = userId
        };

        _context.Notes.Add(note);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} created new note with Id: {NoteId}", userId, note.Id);

        // Returns HTTP 201 Created with Location header pointing to GET /api/notes/{id}
        return CreatedAtAction(nameof(GetById), new { id = note.Id }, note);
    }

    /// <summary>
    /// 2. View all notes / Search notes belonging to the authenticated user (GET /api/notes?search=dotnet)
    /// </summary>
    /// <param name="search">Optional query string to search notes by title</param>
    /// <returns>A list of saved notes owned by the authenticated user</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Note>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<Note>>> GetAll([FromQuery] string? search)
    {
        var userId = GetCurrentUserId();

        IQueryable<Note> query = _context.Notes
            .AsNoTracking()
            .Where(n => n.UserId == userId);

        // Search notes: filter by title if search term is provided
        if (!string.IsNullOrWhiteSpace(search))
        {
            var trimmedSearch = search.Trim();
            query = query.Where(n => n.Title.Contains(trimmedSearch));
        }

        // Return notes ordered chronologically with newest first
        var notes = await query
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return Ok(notes);
    }

    /// <summary>
    /// 3. Read one note (GET /api/notes/{id})
    /// </summary>
    /// <param name="id">The note ID</param>
    /// <returns>The note if owned by the caller, 403 Forbidden if owned by another user, or 404 Not Found</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Note), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Note>> GetById(int id)
    {
        var (note, error) = await FindOwnedNoteAsync(id);
        if (error is not null)
        {
            return error;
        }

        return Ok(note);
    }

    /// <summary>
    /// 4. Edit note (PUT /api/notes/{id})
    /// </summary>
    /// <param name="id">The note ID to update</param>
    /// <param name="dto">The updated title and content</param>
    /// <returns>The updated note</returns>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(Note), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Note>> Update(int id, [FromBody] UpdateNoteDto dto)
    {
        var (note, error) = await FindOwnedNoteAsync(id);
        if (error is not null)
        {
            return error;
        }

        note!.Title = dto.Title.Trim();
        note.Content = dto.Content;

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} updated note with Id: {NoteId}", note.UserId, id);

        return Ok(note);
    }

    /// <summary>
    /// 5. Delete note (DELETE /api/notes/{id})
    /// </summary>
    /// <param name="id">The note ID to delete</param>
    /// <returns>204 No Content on success</returns>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var (note, error) = await FindOwnedNoteAsync(id);
        if (error is not null)
        {
            return error;
        }

        _context.Notes.Remove(note!);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} deleted note with Id: {NoteId}", note!.UserId, id);

        return NoContent();
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Authenticated user ID claim is missing or invalid.");
        }

        return userId;
    }

    private async Task<(Note? Note, ActionResult? Error)> FindOwnedNoteAsync(int id)
    {
        var note = await _context.Notes.FindAsync(id);
        if (note is null)
        {
            return (null, NotFound(new { message = $"Note with ID {id} was not found." }));
        }

        if (note.UserId != GetCurrentUserId())
        {
            return (null, Forbid());
        }

        return (note, null);
    }
}
