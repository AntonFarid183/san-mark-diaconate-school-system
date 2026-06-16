using System;
using System.Collections.Generic;

namespace DiaconateSchool.Domain.Entities;

public class Grade
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public int Level { get; set; }

    public Guid StageId { get; set; }
    public Stage Stage { get; set; } = null!;

    public Guid? AcademicYearId { get; set; }
    public AcademicYear? AcademicYear { get; set; }

    public ICollection<Student> Students { get; set; } = new List<Student>();
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
}
