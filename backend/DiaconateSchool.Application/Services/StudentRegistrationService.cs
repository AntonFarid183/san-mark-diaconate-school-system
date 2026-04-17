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

    public StudentRegistrationService(
        IStudentRepository studentRepo, 
        IUserRepository userRepo, 
        IUnitOfWork uow, 
        IPasswordHasher hasher)
    {
        _studentRepo = studentRepo;
        _userRepo = userRepo;
        _uow = uow;
        _hasher = hasher;
    }

    public async Task<RegistrationResultDto> RegisterStudentAsync(RegisterStudentDto dto)
    {
        // 1. Business Rule: Guard against duplicate students
        bool exists = await _studentRepo.ExistsAsync(
            dto.FirstName, dto.SecondName, dto.ThirdName, dto.LastName, dto.DateOfBirth);
            
        if (exists)
            throw new InvalidOperationException("A student with this exactly name and date of birth is already registered.");

        // 2. Generate Unique Username (ST-1000 upwards)
        int currentCount = await _studentRepo.GetTotalCountAsync();
        string userName = $"ST-{1000 + currentCount + 1}";

        // Fast safety check just to ensure complete uniqueness
        while (await _userRepo.GetByUserNameAsync(userName) != null)
        {
            currentCount++;
            userName = $"ST-{1000 + currentCount + 1}";
        }

        // 3. Generate Temporary Password & Hash it
        string temporaryPassword = GenerateRandomPassword(8);
        string hashedPassword = _hasher.HashPassword(temporaryPassword);

        var userId = Guid.NewGuid();
        var studentId = Guid.NewGuid();

        // 4. Build User Entity
        var user = new ApplicationUser
        {
            Id = userId,
            UserName = userName,
            PasswordHash = hashedPassword,
            Role = Role.Student,
            RequiresPasswordChange = true, // Rule: Mandatory change on first login
            StudentId = studentId
        };

        // 5. Build Student Entity
        var student = new Student
        {
            Id = studentId,
            FirstName = dto.FirstName,
            SecondName = dto.SecondName,
            ThirdName = dto.ThirdName,
            LastName = dto.LastName,
            Gender = dto.Gender,
            DateOfBirth = dto.DateOfBirth,
            GradeId = dto.GradeId, // NEW: Links student to their specific grade
            IsDeacon = dto.IsDeacon,
            DeaconRank = dto.DeaconRank,
            FatherOfConfession = dto.FatherOfConfession,
            FatherMobile = dto.FatherMobile,
            MotherMobile = dto.MotherMobile,
            WhatsAppNumber = dto.WhatsAppNumber,
            Landline = dto.Landline,
            Address = dto.Address,
            Landmark = dto.Landmark,
            HasPaidFees = dto.HasPaidFees,
            UserId = userId
        };

        // 6. Save as a single Unit of Work
        await _userRepo.AddAsync(user);
        await _studentRepo.AddAsync(student);
        await _uow.SaveChangesAsync();

        // 7. Return plain credentials to be given to the family
        return new RegistrationResultDto
        {
            UserName = userName,
            TemporaryPassword = temporaryPassword
        };
    }

    public async Task<IEnumerable<Grade>> GetGradesByStageAsync(Stage stage)
    {
        // Simply delegate to the repository to fetch the data
        return await _studentRepo.GetGradesByStageAsync(stage);
    }

    /// <summary>
    /// Generates a random alphanumeric string for the temporary password.
    /// </summary>
    private static string GenerateRandomPassword(int length)
    {
        const string chars = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}
