using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Domain.Enums;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface IStudentPerformanceService
{
    Task<StudentPerformanceResponseDto> GetPerformanceAsync(
        Guid? stageId, Guid? gradeId, StudentLevel? level, Guid? classId, string? name);
}
