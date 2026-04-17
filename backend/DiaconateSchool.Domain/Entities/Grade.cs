using System;
using System.Collections.Generic;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

/// <summary>
/// Represents a specific academic year/grade within a broader Stage.
/// e.g., Grade "1" inside the "Primary" stage.
/// </summary>
public class Grade
{
    /// <summary>
    /// Unique identifier for the Grade in the database.
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// The display name for the grade (e.g., "الصف الأول الابتدائي" or "Primary 1").
    /// </summary>
    public required string Name { get; set; } 
    
    /// <summary>
    /// The numeric level of the grade used for logical ordering and automated promotions (e.g., 1, 2, 3..).
    /// </summary>
    public int Level { get; set; }
    
    /// <summary>
    /// The Stage enum securely links this grade to its overarching category (e.g., Primary vs Secondary).
    /// </summary>
    public Stage Stage { get; set; }
    
    /// <summary>
    /// Navigation Property: One-to-Many relationship. 
    /// Automatically manages all registered students who are currently sitting in this specific grade.
    /// </summary>
    public ICollection<Student> Students { get; set; } = new List<Student>();
}
