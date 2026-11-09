using System.ComponentModel.DataAnnotations;

namespace NoteVault.Api.Models.DTOs;

/// <summary>
/// Data Transfer Object for updating an existing note.
/// </summary>
public class UpdateNoteDto
{
    [Required(ErrorMessage = "Title is required.")]
    [StringLength(100, ErrorMessage = "Title cannot exceed 100 characters.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Content is required.")]
    public string Content { get; set; } = string.Empty;
}
