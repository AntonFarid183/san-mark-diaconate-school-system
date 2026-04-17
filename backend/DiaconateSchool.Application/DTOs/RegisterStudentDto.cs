using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Application.DTOs;

public class RegisterStudentDto
{
    // The Servant fills out this data:
    public required string FirstName { get; set; }
    public required string SecondName { get; set; }
    public required string ThirdName { get; set; }
    public required string LastName { get; set; }

    public Gender Gender { get; set; }
    public DateOnly DateOfBirth { get; set; }

    /// <summary>
    /// Now we accept the specific ID of the grade (e.g., Primary 1 GUID).
    /// </summary>
    public Guid GradeId { get; set; }

    public bool IsDeacon { get; set; }
    public DeaconRank? DeaconRank { get; set; }
    public required string FatherOfConfession { get; set; }

    public required string FatherMobile { get; set; }
    public required string MotherMobile { get; set; }
    public required string WhatsAppNumber { get; set; }
    public string? Landline { get; set; }

    public required string Address { get; set; }
    public string? Landmark { get; set; }

    // HasPaidFees might be checked off initially during registration
    public bool HasPaidFees { get; set; }
}
