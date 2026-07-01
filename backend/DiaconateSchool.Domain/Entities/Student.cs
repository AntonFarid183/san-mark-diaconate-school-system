using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class Student
{
    public Guid Id { get; set; }

    public required string StudentCode { get; set; }
    public StudentStatus Status { get; set; } = StudentStatus.Active;

    public Gender Gender { get; set; }
    public DateOnly DateOfBirth { get; set; }

    public Guid GradeId { get; set; }
    public Grade Grade { get; set; } = null!;

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

    public bool FeesPaid { get; set; }
    public decimal? PaidAmount { get; set; }
    public string? ProfilePictureUrl { get; set; }

    public Guid RegisteredByUserId { get; set; }
    public DateTime RegisteredDate { get; set; } = DateTime.UtcNow;
    public DateTime? EnrollmentDate { get; set; }

    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
}
