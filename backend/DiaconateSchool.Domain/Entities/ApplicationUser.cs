using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

/// <summary>
/// Represents a user account in the system for Authentication and Authorization.
/// </summary>
public class ApplicationUser
{
    /// <summary>
    /// Unique identifier for the user.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// For students, this will be auto-generated (e.g., ST-1023).
    /// </summary>
    public required string UserName { get; set; }

    /// <summary>
    /// The securely hashed password.
    /// </summary>
    public required string PasswordHash { get; set; }

    /// <summary>
    /// Defines the permissions of the user (Admin, Servant, Student).
    /// </summary>
    public Role Role { get; set; }

    /// <summary>
    /// If true, the system will block navigation and force a password change on the next login.
    /// Default is true because newly generated student passwords are temporary.
    /// </summary>
    public bool RequiresPasswordChange { get; set; } = true;
    
    // --- Navigation Properties ---
    
    /// <summary>
    /// The associated Student Profile. Null if the user is an Admin or Servant.
    /// </summary>
    public Guid? StudentId { get; set; }
    public Student? Student { get; set; }
}
