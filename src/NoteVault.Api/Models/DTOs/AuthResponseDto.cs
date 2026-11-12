namespace NoteVault.Api.Models.DTOs;

/// <summary>
/// Response returned after successful registration or login containing the JWT token.
/// </summary>
public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
