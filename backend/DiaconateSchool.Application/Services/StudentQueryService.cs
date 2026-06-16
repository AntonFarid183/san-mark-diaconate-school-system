using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Application.Interfaces.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

public class StudentQueryService : IStudentQueryService
{
    private readonly IStudentRepository _studentRepo;

    public StudentQueryService(IStudentRepository studentRepo)
    {
        _studentRepo = studentRepo;
    }

    public async Task<StudentListResponseDto> GetStudentsAsync(int page, int pageSize, string? nameFilter = null)
    {
        var students = await _studentRepo.GetAllAsync(page, pageSize, nameFilter);
        var totalCount = await _studentRepo.GetFilteredCountAsync(nameFilter);

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
                RegisteredDate = s.RegisteredDate
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

    private static StudentDetailDto MapToDetailDto(Domain.Entities.Student student)
    {
        return new StudentDetailDto
        {
            Id = student.Id,
            StudentCode = student.StudentCode,
            Status = student.Status.ToString(),
            FirstName = student.User.FirstName,
            SecondName = student.User.MiddleName,
            ThirdName = student.User.ThirdName,
            LastName = student.User.LastName,
            Gender = student.Gender.ToString(),
            DateOfBirth = student.DateOfBirth,
            GradeName = student.Grade.Name,
            StageName = student.Grade.Stage.Name,
            IsDeacon = student.IsDeacon,
            DeaconRank = student.DeaconRank?.ToString(),
            FatherOfConfession = student.FatherOfConfession,
            FatherMobile = student.FatherMobile,
            MotherMobile = student.MotherMobile,
            WhatsAppNumber = student.WhatsAppNumber,
            Landline = student.Landline,
            Address = student.Address,
            Landmark = student.Landmark,
            FeesPaid = student.FeesPaid,
            RegisteredDate = student.RegisteredDate
        };
    }
}
