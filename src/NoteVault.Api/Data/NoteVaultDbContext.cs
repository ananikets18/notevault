using Microsoft.EntityFrameworkCore;
using NoteVault.Api.Models.Entities;

namespace NoteVault.Api.Data;

/// <summary>
/// Entity Framework Core Database Context for NoteVault.
/// Manages connection to SQL Server and maps Users and Notes tables.
/// </summary>
public class NoteVaultDbContext : DbContext
{
    public NoteVaultDbContext(DbContextOptions<NoteVaultDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Note> Notes => Set<Note>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.Username)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnType("nvarchar(50)");

            entity.HasIndex(e => e.Username)
                .IsUnique();

            entity.Property(e => e.PasswordHash)
                .IsRequired()
                .HasColumnType("nvarchar(max)");

            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnType("datetime");
        });

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

            entity.HasOne(e => e.User)
                .WithMany(u => u.Notes)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
