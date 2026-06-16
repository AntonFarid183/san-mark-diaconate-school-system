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
            throw new InvalidOperationException("A student with this name and date of birth is already registered.");

        int currentCount = await _studentRepo.GetTotalCountAsync();
        string userName = $"ST-{1000 + currentCount + 1}";

        while (await _userRepo.GetByUserNameAsync(userName) != null)
        {
            currentCount++;
            userName = $"ST-{1000 + currentCount + 1}";
        }

        string temporaryPassword = GenerateRandomPassword(12);
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
            MustChangePassword = true,
            FirstName = dto.FirstName,
            MiddleName = dto.SecondName,
            ThirdName = dto.ThirdName,
            LastName = dto.LastName
        };

        var student = new Student
        {
            Id = studentId,
            StudentCode = studentCode,
            Status = StudentStatus.Active,
            Gender = dto.Gender,
            DateOfBirth = dto.DateOfBirth,
            GradeId = dto.GradeId,
            IsDeacon = dto.IsDeacon,
            DeaconRank = dto.DeaconRank,
            FatherOfConfession = dto.FatherOfConfession,
            FatherMobile = dto.FatherMobile,
            MotherMobile = dto.MotherMobile,
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

    private static string GenerateRandomPassword(int length)
    {
        const string upper = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
        const string lower = "abcdefghijkmnopqrstuvwxyz";
        const string digits = "23456789";
        const string special = "!@#$%&?";

        var random = new Random();
        var password = new char[length];

        password[0] = upper[random.Next(upper.Length)];
        password[1] = lower[random.Next(lower.Length)];
        password[2] = digits[random.Next(digits.Length)];
        password[3] = special[random.Next(special.Length)];

        string all = upper + lower + digits + special;
        for (int i = 4; i < length; i++)
        {
            password[i] = all[random.Next(all.Length)];
        }

        return new string(password.OrderBy(_ => random.Next()).ToArray());
    }
}
