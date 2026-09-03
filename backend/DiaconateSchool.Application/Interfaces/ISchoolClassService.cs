using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface ISchoolClassService
{
    Task<List<SchoolClassDto>> GetClassesAsync(Guid gradeId, Guid academicYearId, StudentLevel level);

    // Returns 3-4 preview options for different class counts
    Task<List<DistributionPreviewDto>> GetDistributionOptionsAsync(Guid gradeId, Guid academicYearId, StudentLevel level, int preferredSize);

    // Preview for a specific class count
    Task<DistributionPreviewDto> PreviewDistributionAsync(PreviewDistributionDto dto);

    // Delete existing classes and create new ones with student assignments
    Task<(bool Success, string? Error, List<SchoolClassDto> Result)> ApplyDistributionAsync(ApplyDistributionDto dto);

    // Move students to another class (or remove from class if targetClassId is null)
    Task<(bool Success, string? Error)> MoveStudentsAsync(MoveStudentsDto dto);

    Task<(bool Success, string? Error)> ToggleLockAsync(Guid classId);

    Task<(bool Success, string? Error)> DeleteClassAsync(Guid classId);

    // Rename an existing class -- "A"/"B" letters are just the smart-distribution
    // default, admins can call a class whatever they want (e.g. "فصل مارجرجس").
    Task<(bool Success, string? Error)> RenameClassAsync(Guid classId, string name);
}
