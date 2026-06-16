using System;
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

    public string? PhoneNumber { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAt { get; set; }

    public Student? Student { get; set; }
}
