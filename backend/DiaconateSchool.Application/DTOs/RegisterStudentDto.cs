using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Application.DTOs;

public class RegisterStudentDto
{
    public required string FirstName { get; set; }
    public required string SecondName { get; set; }
    public required string ThirdName { get; set; }
    public required string LastName { get; set; }

    public Gender Gender { get; set; }
    public DateOnly DateOfBirth { get; set; }

    public Guid GradeId { get; set; }

    public bool IsDeacon { get; set; }
    public DeaconRank? DeaconRank { get; set; }
    public required string FatherOfConfession { get; set; }

    public required string FatherMobile { get; set; }
    public required string MotherMobile { get; set; }
    public string? StudentMobile { get; set; }
    public required string WhatsAppNumber { get; set; }
    public string? Landline { get; set; }

    public required string Address { get; set; }
    public string? Landmark { get; set; }

    public bool HasPaidFees { get; set; }
}
