using System;

namespace DiaconateSchool.Application.DTOs;

public class AcademicYearDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsCurrent { get; set; }
    public decimal TermFee { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateAcademicYearDto
{
    public string Name { get; set; } = string.Empty;
    public bool SetAsCurrent { get; set; }
    public decimal TermFee { get; set; }
}

public class UpdateAcademicYearDto
{
    public string Name { get; set; } = string.Empty;
    public decimal TermFee { get; set; }
}
