using System;
using System.Collections.Generic;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Application.DTOs;

public class PaymentReportFilterDto
{
    public string? NameFilter { get; set; }
    public Guid? StageId { get; set; }
    public Guid? GradeId { get; set; }
    public string? PaymentStatus { get; set; } // all, paid, not_paid
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
}

public class PaymentReportItemDto
{
    public Guid Id { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string StageName { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public bool FeesPaid { get; set; }
    public decimal? PaidAmount { get; set; }
    public bool IsActive { get; set; }
    public DateTime RegisteredDate { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
}

public class PaymentReportSummaryDto
{
    public List<PaymentReportItemDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PaidCount { get; set; }
    public int NotPaidCount { get; set; }
    public decimal TotalCollected { get; set; }
}

public class ActivateStudentDto
{
    public bool WithFees { get; set; } = false;
    public decimal? PaidAmount { get; set; }
}

public class StudentListItemDto
{
    public Guid Id { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string SecondName { get; set; } = string.Empty;
    public string ThirdName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public string StageName { get; set; } = string.Empty;
    public StudentLevel Level { get; set; }
    public string? ClassName { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateOnly DateOfBirth { get; set; }
    public bool IsDeacon { get; set; }
    public string? DeaconRank { get; set; }
    public string FatherOfConfession { get; set; } = string.Empty;
    public string FatherMobile { get; set; } = string.Empty;
    public string MotherMobile { get; set; } = string.Empty;
    public string? StudentMobile { get; set; }
    public string WhatsAppNumber { get; set; } = string.Empty;
    public string? Landline { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? Landmark { get; set; }
    public bool FeesPaid { get; set; }
    public decimal? PaidAmount { get; set; }
    public DateTime RegisteredDate { get; set; }
    public string? ProfilePictureUrl { get; set; }
}

public class StudentDetailDto
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string SecondName { get; set; } = string.Empty;
    public string ThirdName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {SecondName} {ThirdName} {LastName}";
    public string Gender { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public Guid GradeId { get; set; }
    public string GradeName { get; set; } = string.Empty;
    public Guid StageId { get; set; }
    public string StageName { get; set; } = string.Empty;
    public bool IsDeacon { get; set; }
    public string? DeaconRank { get; set; }
    public string FatherOfConfession { get; set; } = string.Empty;
    public string FatherMobile { get; set; } = string.Empty;
    public string MotherMobile { get; set; } = string.Empty;
    public string? StudentMobile { get; set; }
    public string WhatsAppNumber { get; set; } = string.Empty;
    public string? Landline { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? Landmark { get; set; }
    public bool FeesPaid { get; set; }
    public decimal? PaidAmount { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime RegisteredDate { get; set; }
}

public class UpdateStudentDto
{
    public string? FirstName { get; set; }
    public string? SecondName { get; set; }
    public string? ThirdName { get; set; }
    public string? LastName { get; set; }
    public Gender? Gender { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public Guid? GradeId { get; set; }
    public bool? IsDeacon { get; set; }
    public DeaconRank? DeaconRank { get; set; }
    public string? FatherOfConfession { get; set; }
    public string? FatherMobile { get; set; }
    public string? MotherMobile { get; set; }
    public string? StudentMobile { get; set; }
    public string? WhatsAppNumber { get; set; }
    public string? Landline { get; set; }
    public string? Address { get; set; }
    public string? Landmark { get; set; }
    public bool? FeesPaid { get; set; }
    public string? ProfilePictureUrl { get; set; }
}

public class StudentListResponseDto
{
    public List<StudentListItemDto> Students { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class SetStudentsLevelDto
{
    public List<Guid> StudentIds { get; set; } = new();
    public StudentLevel Level { get; set; }
}
