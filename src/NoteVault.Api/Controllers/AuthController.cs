using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NoteVault.Api.Data;
using NoteVault.Api.Models.DTOs;
using NoteVault.Api.Models.Entities;
using NoteVault.Api.Services;

namespace NoteVault.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly NoteVaultDbContext _context;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly JwtService _jwtService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        NoteVaultDbContext context,
        IPasswordHasher<User> passwordHasher,
        JwtService jwtService,
        ILogger<AuthController> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user account and return a JWT token (POST /api/auth/register).
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        var username = dto.Username.Trim();
        var normalizedLower = username.ToLowerInvariant();

        var usernameTaken = await _context.Users
            .AnyAsync(u => u.Username.ToLower() == normalizedLower);

        if (usernameTaken)
        {
            return Conflict(new { message = "Username is already taken." });
        }

        var user = new User
        {
            Username = username,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Registered new user {Username} (Id: {UserId})", user.Username, user.Id);

        var response = _jwtService.CreateAuthResponse(user);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Authenticate an existing user and return a JWT token (POST /api/auth/login).
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        var normalizedLower = dto.Username.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == normalizedLower);

        if (user is null)
        {
            return Unauthorized(new { message = "Invalid username or password." });
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new { message = "Invalid username or password." });
        }

        if (verificationResult == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("User {Username} logged in successfully.", user.Username);

        return Ok(_jwtService.CreateAuthResponse(user));
    }
}
