using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

public class AcademicYearService : IAcademicYearService
{
    private readonly IAcademicYearRepository _repo;
    private readonly ISchoolClassRepository _classRepo;
    private readonly IAttendanceRepository _attendanceRepo;
    private readonly IUnitOfWork _uow;

    public AcademicYearService(IAcademicYearRepository repo, ISchoolClassRepository classRepo, IAttendanceRepository attendanceRepo, IUnitOfWork uow)
    {
        _repo = repo;
        _classRepo = classRepo;
        _attendanceRepo = attendanceRepo;
        _uow = uow;
    }

    public async Task<List<AcademicYearDto>> GetAllAsync()
    {
        var years = await _repo.GetAllAsync();
        return years.Select(Map).ToList();
    }

    public async Task<AcademicYearDto?> GetCurrentAsync()
    {
        var year = await _repo.GetCurrentAsync();
        return year == null ? null : Map(year);
    }

    public async Task<(bool Success, string? Error, AcademicYearDto? Result)> CreateAsync(CreateAcademicYearDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return (false, "اسم السنة الدراسية مطلوب.", null);

        if (dto.EndDate <= dto.StartDate)
            return (false, "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية.", null);

        if (await _repo.NameExistsAsync(dto.Name))
            return (false, "يوجد سنة دراسية بهذا الاسم مسبقاً.", null);

        if (dto.SetAsCurrent)
            await ClearCurrentFlag();

        var year = new AcademicYear
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsCurrent = dto.SetAsCurrent,
            CreatedAt = DateTime.UtcNow
        };

        await _repo.AddAsync(year);
        await _uow.SaveChangesAsync();

        return (true, null, Map(year));
    }

    public async Task<(bool Success, string? Error, AcademicYearDto? Result)> UpdateAsync(Guid id, UpdateAcademicYearDto dto)
    {
        var year = await _repo.GetByIdAsync(id);
        if (year == null) return (false, "السنة الدراسية غير موجودة.", null);

        if (string.IsNullOrWhiteSpace(dto.Name))
            return (false, "اسم السنة الدراسية مطلوب.", null);

        if (dto.EndDate <= dto.StartDate)
            return (false, "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية.", null);

        if (await _repo.NameExistsAsync(dto.Name, id))
            return (false, "يوجد سنة دراسية بهذا الاسم مسبقاً.", null);

        year.Name = dto.Name.Trim();
        year.StartDate = dto.StartDate;
        year.EndDate = dto.EndDate;

        await _uow.SaveChangesAsync();
        return (true, null, Map(year));
    }

    public async Task<(bool Success, string? Error)> SetCurrentAsync(Guid id)
    {
        var year = await _repo.GetByIdAsync(id);
        if (year == null) return (false, "السنة الدراسية غير موجودة.");

        await ClearCurrentFlag();
        year.IsCurrent = true;
        await _uow.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(Guid id)
    {
        var year = await _repo.GetByIdAsync(id);
        if (year == null) return (false, "السنة الدراسية غير موجودة.");

        if (year.IsCurrent)
            return (false, "لا يمكن حذف السنة الدراسية الحالية.");

        // Cascade: attendance sessions/records for this year's classes, then the classes
        // themselves, then the year. Grades just lose their AcademicYearId (SetNull) — they're
        // shared across years and aren't touched.
        var classes = await _classRepo.GetByAcademicYearIdAsync(id);
        var classIds = classes.Select(c => c.Id).ToList();
        if (classIds.Count > 0)
        {
            await _attendanceRepo.DeleteSessionsByClassIdsAsync(classIds);
            await _classRepo.DeleteRangeAsync(classes);
        }

        await _repo.DeleteAsync(year);
        await _uow.SaveChangesAsync();
        return (true, null);
    }

    private async Task ClearCurrentFlag()
    {
        var current = await _repo.GetCurrentAsync();
        if (current != null)
        {
            current.IsCurrent = false;
        }
    }

    private static AcademicYearDto Map(AcademicYear y) => new()
    {
        Id = y.Id,
        Name = y.Name,
        StartDate = y.StartDate,
        EndDate = y.EndDate,
        IsCurrent = y.IsCurrent,
        CreatedAt = y.CreatedAt
    };
}
