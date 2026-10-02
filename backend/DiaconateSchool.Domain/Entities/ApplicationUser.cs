using System;
using System.Linq;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class ApplicationUser
{
    public Guid Id { get; set; }

    public required string UserName { get; set; }

    public required string PasswordHash { get; set; }

    public Role Role { get; set; }

    public bool MustChangePassword { get; set; } = true;

    public string? Email { get; set; }

    public required string FirstName { get; set; }
    public required string MiddleName { get; set; }
    public required string ThirdName { get; set; }
    public required string LastName { get; set; }

    // All four name parts, skipping blanks (admin/staff accounts often have no
    // middle names -- "  " gaps looked broken). Use this instead of hand-rolling
    // FirstName + LastName: that shortcut was copy-pasted into the attendance,
    // progress and hymn screens and silently dropped the middle two names.
    // Get-only, so EF doesn't map it -- and it can't be used inside a LINQ query
    // that translates to SQL, only on already-loaded entities.
    public string FullName => string.Join(" ",
        new[] { FirstName, MiddleName, ThirdName, LastName }.Where(n => !string.IsNullOrWhiteSpace(n)));

    public string? PhoneNumber { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAt { get; set; }

    public Student? Student { get; set; }
}
