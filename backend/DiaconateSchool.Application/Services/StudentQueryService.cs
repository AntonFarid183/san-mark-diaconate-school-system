using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Application.Interfaces.Services;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

public class StudentQueryService : IStudentQueryService
{
    private readonly IStudentRepository _studentRepo;
    private readonly IUserRepository _userRepo;
    private readonly IPasswordHasher _hasher;
    private readonly INotificationService _notificationService;
    private readonly IStudentFeeService _feeService;
    private readonly IUnitOfWork _uow;

    public StudentQueryService(
        IStudentRepository studentRepo,
        IUserRepository userRepo,
        IPasswordHasher hasher,
        INotificationService notificationService,
        IStudentFeeService feeService,
        IUnitOfWork uow)
    {
        _studentRepo = studentRepo;
        _userRepo = userRepo;
        _hasher = hasher;
        _notificationService = notificationService;
        _feeService = feeService;
        _uow = uow;
    }

    public async Task<StudentListResponseDto> GetStudentsAsync(int page, int pageSize, string? nameFilter = null, Guid? gradeId = null, Guid? stageId = null, Guid? classId = null, StudentLevel? level = null)
    {
        var students = await _studentRepo.GetAllAsync(page, pageSize, nameFilter, gradeId, stageId, classId, level);
        var totalCount = await _studentRepo.GetFilteredCountAsync(nameFilter, gradeId, stageId, classId, level);

        return new StudentListResponseDto
        {
            Students = students.Select(s => new StudentListItemDto
            {
                Id = s.Id,
                StudentCode = s.StudentCode,
                QrToken = s.QrToken,
                UserName = s.User.UserName,
                FullName = $"{s.User.FirstName} {s.User.MiddleName} {s.User.ThirdName} {s.User.LastName}",
                FirstName = s.User.FirstName,
                SecondName = s.User.MiddleName,
                ThirdName = s.User.ThirdName,
                LastName = s.User.LastName,
                Gender = s.Gender.ToString(),
                GradeName = s.Grade.Name,
                StageName = s.Grade.Stage.Name,
                Level = s.Level,
                ClassName = s.Class?.Name,
                Status = s.Status.ToString(),
                IsActive = s.User.IsActive,
                DateOfBirth = s.DateOfBirth,
                IsDeacon = s.IsDeacon,
                DeaconRank = s.DeaconRank?.ToString(),
                FatherOfConfession = s.FatherOfConfession,
                FatherMobile = s.FatherMobile,
                MotherMobile = s.MotherMobile,
                StudentMobile = s.StudentMobile,
                WhatsAppNumber = s.WhatsAppNumber,
                Landline = s.Landline,
                Address = s.Address,
                Landmark = s.Landmark,
                FeesPaid = s.FeesPaid,
                PaidAmount = s.PaidAmount,
                RegisteredDate = s.RegisteredDate,
                ProfilePictureUrl = s.ProfilePictureUrl
            }).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<StudentDetailDto?> GetStudentByUserIdAsync(Guid userId)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId);
        if (student == null) return null;
        return MapToDetailDto(student);
    }

    public async Task<StudentDetailDto?> GetStudentByIdAsync(Guid id)
    {
        var student = await _studentRepo.GetByIdWithIncludesAsync(id);
        if (student == null) return null;
        return MapToDetailDto(student);
    }

    public async Task<StudentDetailDto?> UpdateStudentAsync(Guid id, UpdateStudentDto dto)
    {
        var student = await _studentRepo.GetByIdWithIncludesAsync(id);
        if (student == null) return null;

        if (dto.FirstName != null) student.User.FirstName = dto.FirstName;
        if (dto.SecondName != null) student.User.MiddleName = dto.SecondName;
        if (dto.ThirdName != null) student.User.ThirdName = dto.ThirdName;
        if (dto.LastName != null) student.User.LastName = dto.LastName;
        if (dto.Gender.HasValue) student.Gender = dto.Gender.Value;
        if (dto.DateOfBirth.HasValue) student.DateOfBirth = dto.DateOfBirth.Value;
        if (dto.GradeId.HasValue) student.GradeId = dto.GradeId.Value;
        if (dto.IsDeacon.HasValue) student.IsDeacon = dto.IsDeacon.Value;
        if (dto.DeaconRank.HasValue) student.DeaconRank = dto.DeaconRank;
        if (dto.FatherOfConfession != null) student.FatherOfConfession = dto.FatherOfConfession;
        if (dto.FatherMobile != null) student.FatherMobile = dto.FatherMobile;
        if (dto.MotherMobile != null) student.MotherMobile = dto.MotherMobile;
        if (dto.StudentMobile != null) student.StudentMobile = dto.StudentMobile;
        if (dto.WhatsAppNumber != null) student.WhatsAppNumber = dto.WhatsAppNumber;
        if (dto.Landline != null) student.Landline = dto.Landline;
        if (dto.Address != null) student.Address = dto.Address;
        if (dto.Landmark != null) student.Landmark = dto.Landmark;
        if (dto.FeesPaid.HasValue) student.FeesPaid = dto.FeesPaid.Value;
        if (dto.ProfilePictureUrl != null) student.ProfilePictureUrl = dto.ProfilePictureUrl;

        student.User.UpdatedAt = DateTime.UtcNow;

        await _studentRepo.UpdateAsync(student);
        await _uow.SaveChangesAsync();

        return MapToDetailDto(student);
    }

    public async Task<bool> ResetPasswordAsync(Guid studentId, string newPassword)
    {
        var student = await _studentRepo.GetByIdWithIncludesAsync(studentId);
        if (student == null) return false;

        student.User.PasswordHash = _hasher.HashPassword(newPassword);
        student.User.UpdatedAt = DateTime.UtcNow;

        await _userRepo.UpdateAsync(student.User);
        await _uow.SaveChangesAsync();
        return true;
    }

    // Same 6-digit format as the temporary password issued at registration
    // (StudentRegistrationService.GenerateRandomPassword) -- for when an admin
    // forgot to hand a student their login and needs a fresh one to give them,
    // without having to think one up themselves. Returned once, plaintext;
    // only the hash is ever persisted.
    public async Task<string?> RegeneratePasswordAsync(Guid studentId)
    {
        var student = await _studentRepo.GetByIdWithIncludesAsync(studentId);
        if (student == null) return null;

        var newPassword = Random.Shared.Next(100000, 999999).ToString();
        student.User.PasswordHash = _hasher.HashPassword(newPassword);
        student.User.UpdatedAt = DateTime.UtcNow;

        await _userRepo.UpdateAsync(student.User);
        await _uow.SaveChangesAsync();
        return newPassword;
    }

    public async Task<IEnumerable<object>> GetAllGradesAsync()
    {
        var grades = await _studentRepo.GetAllGradesAsync();
        return grades.Select(g => new { g.Id, g.Name, StageId = g.StageId, StageName = g.Stage.Name });
    }

    public async Task<IEnumerable<StudentDetailDto>> GetPendingStudentsAsync()
    {
        var students = await _studentRepo.GetPendingAsync();
        return students.Select(MapToDetailDto);
    }

    public async Task<bool> SetActiveStatusAsync(Guid studentId, bool isActive, bool withFees = false, decimal? paidAmount = null, Guid? recordedByUserId = null, bool isExempt = false, decimal? amountDue = null)
    {
        var student = await _studentRepo.GetByIdWithIncludesAsync(studentId);
        if (student == null) return false;

        var wasActive = student.User.IsActive;
        student.User.IsActive = isActive;
        student.Status = isActive ? StudentStatus.Active : StudentStatus.Suspended;
        if (isActive && withFees)
            student.FeesPaid = true;
        student.User.UpdatedAt = DateTime.UtcNow;

        await _studentRepo.UpdateAsync(student);
        await _userRepo.UpdateAsync(student.User);

        // isExempt skips charging entirely — no StudentAccount, no balance, no
        // debt on record at all. Not "paid 0": a different state from
        // "تم السداد", which always charges the full term fee first.
        decimal remainingBalance = 0;
        string? accountDescription = null;

        if (isActive && !wasActive && !isExempt)
        {
            var account = await _feeService.ChargeTermFeeAsync(studentId, withFees ? null : amountDue);
            accountDescription = account?.Description;

            // "تم السداد" means the full term fee unless paidAmount says
            // otherwise — the gap between paidAmount and the full fee becomes
            // a recorded Discount, not just a smaller Payment. Without
            // withFees, this is "سداد لاحقاً" — billed, nothing collected yet.
            if (withFees)
            {
                var amountToRecord = paidAmount ?? account?.TotalRequired;
                if (amountToRecord.HasValue) student.PaidAmount = amountToRecord.Value;
                await _feeService.RecordPaymentAsync(account, amountToRecord, recordedByUserId ?? student.RegisteredByUserId, "دفعة تفعيل الحساب");

                if (account != null && amountToRecord.HasValue && amountToRecord.Value < account.TotalRequired)
                {
                    var discount = account.TotalRequired - amountToRecord.Value;
                    await _feeService.RecordDiscountAsync(account, discount, recordedByUserId ?? student.RegisteredByUserId, "خصم عند التفعيل");
                }
            }
            else
            {
                remainingBalance = account?.TotalRequired ?? 0;
            }
        }

        await _uow.SaveChangesAsync();

        if (isActive && !wasActive)
            await _notificationService.NotifyAccountActivatedAsync(student.UserId, remainingBalance > 0 ? remainingBalance : null, accountDescription);

        return true;
    }

    public async Task<(bool Success, string? Error)> SetStudentsLevelAsync(List<Guid> studentIds, StudentLevel level)
    {
        if (studentIds.Count == 0) return (false, "لم يتم تحديد أي طلاب.");

        var students = await _studentRepo.GetByIdsAsync(studentIds);
        foreach (var student in students)
        {
            student.Level = level;
            // Their current class belongs to the previous level — pending redistribution
            // rather than a stale/incorrect assignment (see Manage Levels feature).
            student.ClassId = null;
            await _studentRepo.UpdateAsync(student);
        }
        await _uow.SaveChangesAsync();
        return (true, null);
    }

    public async Task<PaymentReportSummaryDto> GetPaymentReportAsync(PaymentReportFilterDto filter)
    {
        var (items, totalCount, paidCount, notPaidCount, exemptedCount, discountCount, totalCollected, totalDiscounted, payments) = await _studentRepo.GetPaymentReportAsync(
            filter.NameFilter, filter.StageId, filter.GradeId, filter.PaymentStatus, filter.DateFrom, filter.DateTo);

        return new PaymentReportSummaryDto
        {
            Items = items.Select(s =>
            {
                var (paidAmount, discountAmount, status) = payments[s.Id];

                return new PaymentReportItemDto
                {
                    Id = s.Id,
                    StudentCode = s.StudentCode,
                    FullName = $"{s.User.FirstName} {s.User.MiddleName} {s.User.ThirdName} {s.User.LastName}",
                    StageName = s.Grade.Stage.Name,
                    GradeName = s.Grade.Name,
                    FeesPaid = status == "paid",
                    PaidAmount = paidAmount,
                    DiscountAmount = discountAmount,
                    IsActive = s.User.IsActive,
                    RegisteredDate = s.RegisteredDate,
                    PaymentStatus = status
                };
            }).ToList(),
            TotalCount = totalCount,
            PaidCount = paidCount,
            NotPaidCount = notPaidCount,
            ExemptedCount = exemptedCount,
            DiscountCount = discountCount,
            TotalCollected = totalCollected,
            TotalDiscounted = totalDiscounted
        };
    }

    // Name kept as-is (GetBirthdaysThisMonthAsync / birthdays-this-month route) to
    // avoid touching the repository method and API contract for what's now a
    // same-day filter -- was the whole month, narrowed to just today per request.
    public async Task<List<StudentBirthdayDto>> GetBirthdaysThisMonthAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
        var students = await _studentRepo.GetActiveStudentsWithBirthMonthIncludesAsync();

        return students
            .Where(s => s.DateOfBirth.Month == today.Month && s.DateOfBirth.Day == today.Day)
            .OrderBy(s => s.DateOfBirth.Day)
            .Select(s => new StudentBirthdayDto
            {
                Id = s.Id,
                FullName = $"{s.User.FirstName} {s.User.MiddleName} {s.User.ThirdName} {s.User.LastName}",
                GradeName = s.Grade.Name,
                StageName = s.Grade.Stage.Name,
                ClassName = s.Class?.Name,
                DateOfBirth = s.DateOfBirth,
                ProfilePictureUrl = s.ProfilePictureUrl,
                IsToday = s.DateOfBirth.Day == today.Day
            })
            .ToList();
    }

    private static StudentDetailDto MapToDetailDto(Domain.Entities.Student student)
    {
        return new StudentDetailDto
        {
            Id = student.Id,
            UserId = student.UserId.ToString(),
            UserName = student.User.UserName,
            StudentCode = student.StudentCode,
            QrToken = student.QrToken,
            Status = student.Status.ToString(),
            FirstName = student.User.FirstName,
            SecondName = student.User.MiddleName,
            ThirdName = student.User.ThirdName,
            LastName = student.User.LastName,
            Gender = student.Gender.ToString(),
            DateOfBirth = student.DateOfBirth,
            GradeId = student.GradeId,
            GradeName = student.Grade.Name,
            StageId = student.Grade.StageId,
            StageName = student.Grade.Stage.Name,
            ClassId = student.ClassId,
            ClassName = student.Class?.Name,
            Level = student.Level,
            LevelLabel = student.Level == StudentLevel.Level2 ? "المستوى 2" : "المستوى 1",
            IsDeacon = student.IsDeacon,
            DeaconRank = student.DeaconRank?.ToString(),
            FatherOfConfession = student.FatherOfConfession,
            FatherMobile = student.FatherMobile,
            MotherMobile = student.MotherMobile,
            StudentMobile = student.StudentMobile,
            WhatsAppNumber = student.WhatsAppNumber,
            Landline = student.Landline,
            Address = student.Address,
            Landmark = student.Landmark,
            FeesPaid = student.FeesPaid,
            PaidAmount = student.PaidAmount,
            ProfilePictureUrl = student.ProfilePictureUrl,
            IsActive = student.User.IsActive,
            RegisteredDate = student.RegisteredDate
        };
    }
}
