using Microsoft.EntityFrameworkCore;
using NoteVault.Api.Models.Entities;

namespace NoteVault.Api.Data;

/// <summary>
/// Entity Framework Core Database Context for NoteVault.
/// Manages connection to SQL Server and maps the Note entity to the Notes table.
/// </summary>
public class NoteVaultDbContext : DbContext
{
    public NoteVaultDbContext(DbContextOptions<NoteVaultDbContext> options)
        : base(options)
    {
    }

    public DbSet<Note> Notes => Set<Note>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure single table Notes with exact schema requested
        modelBuilder.Entity<Note>(entity =>
        {
            entity.ToTable("Notes");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnType("nvarchar(100)");

            entity.Property(e => e.Content)
                .IsRequired()
                .HasColumnType("nvarchar(max)");

            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnType("datetime");
        });
    }
}
