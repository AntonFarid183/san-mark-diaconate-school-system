using DiaconateSchool.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface IAcademicYearService
{
    Task<List<AcademicYearDto>> GetAllAsync();
    Task<AcademicYearDto?> GetCurrentAsync();
    Task<(bool Success, string? Error, AcademicYearDto? Result)> CreateAsync(CreateAcademicYearDto dto);
    Task<(bool Success, string? Error, AcademicYearDto? Result)> UpdateAsync(Guid id, UpdateAcademicYearDto dto);
    Task<(bool Success, string? Error)> SetCurrentAsync(Guid id);
    Task<(bool Success, string? Error)> DeleteAsync(Guid id);
}
