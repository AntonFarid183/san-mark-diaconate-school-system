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

    // "تم سداد المصاريف الإدارية للترم الحالي" — always means the current
    // year's full term fee; there's no admin-typed amount here anymore.
    public bool HasPaidFees { get; set; }
    public bool SelfRegistered { get; set; } = false;

    // Uploaded (via /file/upload-registration-photo for self-registration, or
    // the authenticated /file/upload for an admin) BEFORE this form submits —
    // photo capture happens as its own step, this DTO just carries the URL.
    public string? ProfilePictureUrl { get; set; }
}
