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

public class StudentRegistrationService : IStudentRegistrationService
{
    private readonly IStudentRepository _studentRepo;
    private readonly IUserRepository _userRepo;
    private readonly IUnitOfWork _uow;
    private readonly IPasswordHasher _hasher;
    private readonly IStudentCodeGenerator _codeGenerator;
    private readonly IStudentFeeService _feeService;
    private readonly INotificationService _notificationService;

    public StudentRegistrationService(
        IStudentRepository studentRepo,
        IUserRepository userRepo,
        IUnitOfWork uow,
        IPasswordHasher hasher,
        IStudentCodeGenerator codeGenerator,
        IStudentFeeService feeService,
        INotificationService notificationService)
    {
        _studentRepo = studentRepo;
        _userRepo = userRepo;
        _uow = uow;
        _hasher = hasher;
        _codeGenerator = codeGenerator;
        _feeService = feeService;
        _notificationService = notificationService;
    }

    public async Task<RegistrationResultDto> RegisterStudentAsync(RegisterStudentDto dto, Guid? recordedByUserId = null)
    {
        bool exists = await _studentRepo.ExistsAsync(
            dto.FirstName, dto.SecondName, dto.ThirdName, dto.LastName, dto.DateOfBirth);

        if (exists)
            throw new InvalidOperationException("طالب بهذا الاسم وتاريخ الميلاد مسجل بالفعل.");

        int currentCount = await _studentRepo.GetTotalCountAsync();
        string userName = $"ST-{1000 + currentCount + 1}";

        while (await _userRepo.GetByUserNameAsync(userName) != null)
        {
            currentCount++;
            userName = $"ST-{1000 + currentCount + 1}";
        }

        string temporaryPassword = GenerateRandomPassword();
        string hashedPassword = _hasher.HashPassword(temporaryPassword);

        var userId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var currentYear = DateTime.UtcNow.Year;
        string studentCode = await _codeGenerator.GenerateNextAsync(currentYear);

        var user = new ApplicationUser
        {
            Id = userId,
            UserName = userName,
            PasswordHash = hashedPassword,
            Role = Role.Student,
            MustChangePassword = false,
            IsActive = !dto.SelfRegistered,
            FirstName = dto.FirstName,
            MiddleName = dto.SecondName,
            ThirdName = dto.ThirdName,
            LastName = dto.LastName
        };

        var student = new Student
        {
            Id = studentId,
            StudentCode = studentCode,
            QrToken = GenerateQrToken(),
            Status = dto.SelfRegistered ? StudentStatus.Suspended : StudentStatus.Active,
            Gender = dto.Gender,
            DateOfBirth = dto.DateOfBirth,
            GradeId = dto.GradeId,
            IsDeacon = dto.IsDeacon,
            DeaconRank = dto.DeaconRank,
            FatherOfConfession = dto.FatherOfConfession,
            FatherMobile = dto.FatherMobile,
            MotherMobile = dto.MotherMobile,
            StudentMobile = dto.StudentMobile,
            WhatsAppNumber = dto.WhatsAppNumber,
            Landline = dto.Landline,
            Address = dto.Address,
            Landmark = dto.Landmark,
            FeesPaid = dto.HasPaidFees,
            ProfilePictureUrl = dto.ProfilePictureUrl,
            UserId = userId,
            RegisteredByUserId = userId,
            EnrollmentDate = DateTime.UtcNow
        };

        await _userRepo.AddAsync(user);
        await _studentRepo.AddAsync(student);

        // Only an admin registering a student as immediately Active charges/records a
        // fee here — a self-registered student starts Suspended and gets charged (and
        // its "تم السداد" payment recorded) later, on activation, exactly like the
        // pending-approvals flow. Same ledger, same source of truth.
        // IsExempt skips charging entirely (no debt at all); otherwise HasPaidFees
        // means the full term fee unless PaidAmount says otherwise (a discount —
        // the gap is recorded separately so it shows up in the discounts breakdown).
        decimal remainingBalance = 0;
        string? accountDescription = null;

        if (!dto.SelfRegistered && !dto.IsExempt)
        {
            var account = await _feeService.ChargeTermFeeAsync(studentId);
            accountDescription = account?.Description;

            if (dto.HasPaidFees)
            {
                var amountToRecord = dto.PaidAmount ?? account?.TotalRequired;
                student.PaidAmount = amountToRecord;
                await _feeService.RecordPaymentAsync(account, amountToRecord, recordedByUserId ?? userId, "دفعة تسجيل الطالب");

                if (account != null && amountToRecord.HasValue && amountToRecord.Value < account.TotalRequired)
                {
                    var discount = account.TotalRequired - amountToRecord.Value;
                    await _feeService.RecordDiscountAsync(account, discount, recordedByUserId ?? userId, "خصم عند التسجيل");
                }
            }
            else
            {
                // "سداد لاحقاً" — billed on registration, nothing collected yet.
                remainingBalance = account?.TotalRequired ?? 0;
            }
        }

        await _uow.SaveChangesAsync();

        // A self-registered student starts Suspended (pending review) — nothing to
        // notify yet. An admin-registered student is Active immediately, so they
        // need to know now, same as the pending-approvals activation flow.
        if (!dto.SelfRegistered)
            await _notificationService.NotifyAccountActivatedAsync(userId, remainingBalance > 0 ? remainingBalance : null, accountDescription);

        return new RegistrationResultDto
        {
            UserName = userName,
            StudentCode = studentCode,
            TemporaryPassword = temporaryPassword
        };
    }

    public async Task<IEnumerable<Grade>> GetGradesByStageAsync(Guid stageId)
    {
        return await _studentRepo.GetGradesByStageAsync(stageId);
    }

    public async Task<IEnumerable<Stage>> GetAllStagesAsync()
    {
        return await _studentRepo.GetAllStagesAsync();
    }

    public async Task DeleteStudentAsync(Guid studentId)
    {
        await _studentRepo.DeleteAsync(studentId);
    }

    private static string GenerateRandomPassword()
    {
        return Random.Shared.Next(100000, 999999).ToString();
    }

    // 32 hex chars from a fresh Guid — unique for all practical purposes, carries
    // nothing derived from the student's identity, and isn't reversible into any
    // private data. This is the only thing that ever goes inside the QR code.
    private static string GenerateQrToken() => Guid.NewGuid().ToString("N");
}
