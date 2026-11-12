using System.ComponentModel.DataAnnotations;

namespace NoteVault.Api.Models.DTOs;

/// <summary>
/// Data Transfer Object for registering a new user account.
/// </summary>
public class RegisterDto
{
    [Required(ErrorMessage = "Username is required.")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters.")]
    [RegularExpression("^[a-zA-Z0-9_.-]+$", ErrorMessage = "Username may only contain letters, numbers, underscores, dots, and hyphens.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters long.")]
    public string Password { get; set; } = string.Empty;
}
