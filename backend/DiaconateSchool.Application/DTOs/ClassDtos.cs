using System;
using System.Collections.Generic;

namespace DiaconateSchool.Application.DTOs;

public class SchoolClassDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid GradeId { get; set; }
    public string GradeName { get; set; } = string.Empty;
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; } = string.Empty;
    public bool IsLocked { get; set; }
    public int StudentCount { get; set; }
    public List<ClassStudentDto> Students { get; set; } = new();
}

public class ClassStudentDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
}

// Distribution preview — returned before applying
public class DistributionPreviewDto
{
    public int ClassCount { get; set; }
    public int TotalStudents { get; set; }
    public List<ClassSlotDto> Classes { get; set; } = new();
    public bool IsBalanced { get; set; }
}

public class ClassSlotDto
{
    public string Name { get; set; } = string.Empty;
    public List<ClassStudentDto> Students { get; set; } = new();
}

// Request to preview distribution
public class PreviewDistributionDto
{
    public Guid GradeId { get; set; }
    public Guid AcademicYearId { get; set; }
    public int ClassCount { get; set; }
}

// Request to apply a distribution (uses preview data)
public class ApplyDistributionDto
{
    public Guid GradeId { get; set; }
    public Guid AcademicYearId { get; set; }
    public List<ApplyClassSlotDto> Classes { get; set; } = new();
}

public class ApplyClassSlotDto
{
    public string Name { get; set; } = string.Empty;
    public List<Guid> StudentIds { get; set; } = new();
}

// Move students between classes
public class MoveStudentsDto
{
    public List<Guid> StudentIds { get; set; } = new();
    public Guid? TargetClassId { get; set; } // null = remove from class
}
