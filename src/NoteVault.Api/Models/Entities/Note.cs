using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoteVault.Api.Models.Entities;

/// <summary>
/// Represents the Note entity corresponding to the single 'Notes' table in SQL Server.
/// </summary>
[Table("Notes")]
public class Note
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    [Column(TypeName = "nvarchar(100)")]
    public string Title { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "nvarchar(max)")]
    public string Content { get; set; } = string.Empty;

    [Column(TypeName = "datetime")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
