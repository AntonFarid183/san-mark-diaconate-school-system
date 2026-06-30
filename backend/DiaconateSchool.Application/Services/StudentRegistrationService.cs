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

    public StudentRegistrationService(
        IStudentRepository studentRepo,
        IUserRepository userRepo,
        IUnitOfWork uow,
        IPasswordHasher hasher,
        IStudentCodeGenerator codeGenerator)
    {
        _studentRepo = studentRepo;
        _userRepo = userRepo;
        _uow = uow;
        _hasher = hasher;
        _codeGenerator = codeGenerator;
    }

    public async Task<RegistrationResultDto> RegisterStudentAsync(RegisterStudentDto dto)
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
            UserId = userId,
            RegisteredByUserId = userId,
            EnrollmentDate = DateTime.UtcNow
        };

        await _userRepo.AddAsync(user);
        await _studentRepo.AddAsync(student);
        await _uow.SaveChangesAsync();

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

    private static string GenerateRandomPassword()
    {
        return Random.Shared.Next(100000, 999999).ToString();
    }
}
