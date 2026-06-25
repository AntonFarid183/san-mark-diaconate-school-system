using DiaconateSchool.Application.DTOs;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Services;

public interface IStudentQueryService
{
    Task<StudentListResponseDto> GetStudentsAsync(int page, int pageSize, string? nameFilter = null);
    Task<StudentDetailDto?> GetStudentByIdAsync(Guid id);
    Task<StudentDetailDto?> GetStudentByUserIdAsync(Guid userId);
    Task<StudentDetailDto?> UpdateStudentAsync(Guid id, UpdateStudentDto dto);
    Task<bool> ResetPasswordAsync(Guid studentId, string newPassword);
    Task<bool> SetActiveStatusAsync(Guid studentId, bool isActive);
}
