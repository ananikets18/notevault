using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NoteVault.Api.Models.Entities;

/// <summary>
/// Represents an application user stored in the 'Users' table.
/// </summary>
[Table("Users")]
public class User
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    [Column(TypeName = "nvarchar(50)")]
    public string Username { get; set; } = string.Empty;

    [Required]
    [JsonIgnore]
    [Column(TypeName = "nvarchar(max)")]
    public string PasswordHash { get; set; } = string.Empty;

    [Column(TypeName = "datetime")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<Note> Notes { get; set; } = new List<Note>();
}
