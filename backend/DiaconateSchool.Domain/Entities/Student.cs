using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

/// <summary>
/// Represents a student enrolled in the Diaconate School.
/// </summary>
public class Student
{
    public Guid Id { get; set; }
    
    // --- Core Info ---
    
    public required string FirstName { get; set; }  
    public required string SecondName { get; set; } 
    public required string ThirdName { get; set; }  
    public required string LastName { get; set; }   
    
    public Gender Gender { get; set; }     
    public DateOnly DateOfBirth { get; set; }
    
    // --- Academic Info ---
    
    /// <summary>
    /// Foreign Key to the Grade table.
    /// Note: We intentionally removed the direct "Stage" property from the Student.
    /// Why? Database Normalization (3NF). Since Grade belongs to Stage, giving Student a Grade inherently assigns their Stage cleanly.
    /// </summary>
    public Guid GradeId { get; set; }
    
    /// <summary>
    /// Navigation Property linking the student directly to their assigned grade instance.
    /// </summary>
    public Grade Grade { get; set; } = null!;
    
    // --- Church & Deacon Info ---
    
    public bool IsDeacon { get; set; }
    
    /// <summary>
    /// Only populated if IsDeacon is true.
    /// </summary>
    public DeaconRank? DeaconRank { get; set; } 
    
    public required string FatherOfConfession { get; set; } 
    
    // --- Contact & Family Info ---
    
    public required string FatherMobile { get; set; }
    public required string MotherMobile { get; set; }
    public required string WhatsAppNumber { get; set; }
    public string? Landline { get; set; } 
    
    // --- Address Info ---
    
    public required string Address { get; set; }
    public string? Landmark { get; set; } // Made nullable as landmarks aren't always provided
    
    // --- Administrative ---
    
    public bool HasPaidFees { get; set; }
    public string? ProfileImagePath { get; set; } 
    
    // --- Navigation Properties ---
    
    /// <summary>
    /// The user account linked to this student for login purposes.
    /// </summary>
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!; // null-forgiving operator to satisfy compiler
}
