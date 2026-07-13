using System;
using System.Collections.Generic;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class SchoolClass
{
    public Guid Id { get; set; }
    public required string Name { get; set; }

    public Guid GradeId { get; set; }
    public Grade Grade { get; set; } = null!;

    public StudentLevel Level { get; set; } = StudentLevel.Level1;

    public Guid AcademicYearId { get; set; }
    public AcademicYear AcademicYear { get; set; } = null!;

    public int? MaxCapacity { get; set; }
    public bool IsLocked { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Student> Students { get; set; } = new List<Student>();
}
