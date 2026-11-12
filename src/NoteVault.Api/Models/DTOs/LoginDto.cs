using System.ComponentModel.DataAnnotations;

namespace NoteVault.Api.Models.DTOs;

/// <summary>
/// Data Transfer Object for user login.
/// </summary>
public class LoginDto
{
    [Required(ErrorMessage = "Username is required.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; set; } = string.Empty;
}
