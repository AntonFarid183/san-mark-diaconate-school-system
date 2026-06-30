using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Application.Interfaces.Services;
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
    private readonly IUnitOfWork _uow;

    public StudentQueryService(
        IStudentRepository studentRepo,
        IUserRepository userRepo,
        IPasswordHasher hasher,
        IUnitOfWork uow)
    {
        _studentRepo = studentRepo;
        _userRepo = userRepo;
        _hasher = hasher;
        _uow = uow;
    }

    public async Task<StudentListResponseDto> GetStudentsAsync(int page, int pageSize, string? nameFilter = null, Guid? gradeId = null, Guid? stageId = null)
    {
        var students = await _studentRepo.GetAllAsync(page, pageSize, nameFilter, gradeId, stageId);
        var totalCount = await _studentRepo.GetFilteredCountAsync(nameFilter, gradeId, stageId);

        return new StudentListResponseDto
        {
            Students = students.Select(s => new StudentListItemDto
            {
                Id = s.Id,
                StudentCode = s.StudentCode,
                FullName = $"{s.User.FirstName} {s.User.MiddleName} {s.User.ThirdName} {s.User.LastName}",
                GradeName = s.Grade.Name,
                StageName = s.Grade.Stage.Name,
                Status = s.Status.ToString(),
                DateOfBirth = s.DateOfBirth,
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

    public async Task<bool> SetActiveStatusAsync(Guid studentId, bool isActive, bool withFees = false)
    {
        var student = await _studentRepo.GetByIdWithIncludesAsync(studentId);
        if (student == null) return false;

        student.User.IsActive = isActive;
        student.Status = isActive ? StudentStatus.Active : StudentStatus.Suspended;
        if (isActive && withFees) student.FeesPaid = true;
        student.User.UpdatedAt = DateTime.UtcNow;

        await _studentRepo.UpdateAsync(student);
        await _userRepo.UpdateAsync(student.User);
        await _uow.SaveChangesAsync();
        return true;
    }

    private static StudentDetailDto MapToDetailDto(Domain.Entities.Student student)
    {
        return new StudentDetailDto
        {
            Id = student.Id,
            UserId = student.UserId.ToString(),
            UserName = student.User.UserName,
            StudentCode = student.StudentCode,
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
            ProfilePictureUrl = student.ProfilePictureUrl,
            IsActive = student.User.IsActive,
            RegisteredDate = student.RegisteredDate
        };
    }
}
