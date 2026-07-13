using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

public class SchoolClassService : ISchoolClassService
{
    // Class identifiers: A, B, C, D... standardized across the whole system
    private static readonly string[] ClassLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

    private readonly ISchoolClassRepository _repo;
    private readonly IUnitOfWork _uow;

    public SchoolClassService(ISchoolClassRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task<List<SchoolClassDto>> GetClassesAsync(Guid gradeId, Guid academicYearId, StudentLevel level)
    {
        var classes = await _repo.GetByGradeAndYearAsync(gradeId, academicYearId, level);
        return classes.Select(MapToDto).ToList();
    }

    public async Task<List<DistributionPreviewDto>> GetDistributionOptionsAsync(
        Guid gradeId, Guid academicYearId, StudentLevel level, int preferredSize)
    {
        var students = await _repo.GetStudentsByGradeAsync(gradeId, level);
        int n = students.Count;

        if (n == 0)
            return new List<DistributionPreviewDto>();

        // Calculate suggested class count from preferred size
        int suggested = Math.Max(1, (int)Math.Round((double)n / preferredSize));

        // Generate options: suggested-1, suggested, suggested+1, suggested+2
        var options = new List<int>();
        if (suggested > 1) options.Add(suggested - 1);
        options.Add(suggested);
        if (suggested + 1 <= n) options.Add(suggested + 1);
        if (suggested + 2 <= n && suggested + 2 <= ClassLetters.Length) options.Add(suggested + 2);

        return options
            .Where(k => k >= 1 && k <= ClassLetters.Length)
            .Select(k => BuildPreview(k, students))
            .ToList();
    }

    public async Task<DistributionPreviewDto> PreviewDistributionAsync(PreviewDistributionDto dto)
    {
        if (dto.ClassCount < 1 || dto.ClassCount > ClassLetters.Length)
            return new DistributionPreviewDto();

        var students = await _repo.GetStudentsByGradeAsync(dto.GradeId, dto.Level);
        return BuildPreview(dto.ClassCount, students);
    }

    public async Task<(bool Success, string? Error, List<SchoolClassDto> Result)> ApplyDistributionAsync(
        ApplyDistributionDto dto)
    {
        if (dto.Classes.Count == 0)
            return (false, "لا توجد فصول في التوزيع.", new());

        if (dto.Classes.Count > ClassLetters.Length)
            return (false, $"الحد الأقصى المسموح به هو {ClassLetters.Length} فصول.", new());

        // Remove existing unlocked classes for this grade+year+level
        var existing = await _repo.GetByGradeAndYearAsync(dto.GradeId, dto.AcademicYearId, dto.Level);
        var unlocked = existing.Where(c => !c.IsLocked).ToList();
        var lockedStudentIds = existing
            .Where(c => c.IsLocked)
            .SelectMany(c => c.Students.Select(s => s.Id))
            .ToHashSet();

        // Clear ClassId for students being re-assigned (only those not in locked classes)
        var allStudents = await _repo.GetStudentsByGradeAsync(dto.GradeId, dto.Level);
        foreach (var student in allStudents.Where(s => !lockedStudentIds.Contains(s.Id)))
            student.ClassId = null;

        await _repo.DeleteRangeAsync(unlocked);

        // Create new classes and assign students
        var created = new List<SchoolClass>();
        foreach (var slot in dto.Classes)
        {
            var schoolClass = new SchoolClass
            {
                Id = Guid.NewGuid(),
                Name = slot.Name,
                GradeId = dto.GradeId,
                Level = dto.Level,
                AcademicYearId = dto.AcademicYearId,
                CreatedAt = DateTime.UtcNow
            };
            created.Add(schoolClass);

            var studentsInSlot = allStudents
                .Where(s => slot.StudentIds.Contains(s.Id))
                .ToList();

            foreach (var s in studentsInSlot)
                s.ClassId = schoolClass.Id;
        }

        await _repo.AddRangeAsync(created);
        await _uow.SaveChangesAsync();

        // Re-fetch to get navigation properties populated
        var result = await _repo.GetByGradeAndYearAsync(dto.GradeId, dto.AcademicYearId, dto.Level);
        return (true, null, result.Select(MapToDto).ToList());
    }

    public async Task<(bool Success, string? Error)> MoveStudentsAsync(MoveStudentsDto dto)
    {
        if (dto.TargetClassId.HasValue)
        {
            var targetClass = await _repo.GetByIdAsync(dto.TargetClassId.Value);
            if (targetClass == null)
                return (false, "الفصل المستهدف غير موجود.");
        }

        var allStudents = await _repo.GetStudentsByGradeForMoveAsync(dto.StudentIds);
        foreach (var student in allStudents)
            student.ClassId = dto.TargetClassId;

        await _uow.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> ToggleLockAsync(Guid classId)
    {
        var schoolClass = await _repo.GetByIdAsync(classId);
        if (schoolClass == null) return (false, "الفصل غير موجود.");

        schoolClass.IsLocked = !schoolClass.IsLocked;
        await _uow.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> DeleteClassAsync(Guid classId)
    {
        var schoolClass = await _repo.GetByIdAsync(classId);
        if (schoolClass == null) return (false, "الفصل غير موجود.");

        // Remove class assignment from all students in this class
        foreach (var student in schoolClass.Students)
            student.ClassId = null;

        await _repo.DeleteRangeAsync(new[] { schoolClass });
        await _uow.SaveChangesAsync();
        return (true, null);
    }

    // The core balancing algorithm: given N students and K classes,
    // produces K classes where sizes differ by at most 1.
    // R = N % K classes get ⌈N/K⌉ students, (K-R) classes get ⌊N/K⌋ students.
    private static DistributionPreviewDto BuildPreview(int k, List<Student> students)
    {
        int n = students.Count;
        int baseSize = n / k;
        int extra = n % k; // first `extra` classes get one more student

        var classes = new List<ClassSlotDto>();
        int idx = 0;

        for (int i = 0; i < k; i++)
        {
            int size = (i < extra) ? baseSize + 1 : baseSize;
            var slot = new ClassSlotDto
            {
                Name = ClassLetters[i],
                Students = students.Skip(idx).Take(size).Select(MapToStudentDto).ToList()
            };
            classes.Add(slot);
            idx += size;
        }

        return new DistributionPreviewDto
        {
            ClassCount = k,
            TotalStudents = n,
            Classes = classes,
            // Balanced when all classes are within 1 student of each other (always true with this algorithm)
            IsBalanced = true
        };
    }

    private static ClassStudentDto MapToStudentDto(Student s) => new()
    {
        Id = s.Id,
        FullName = $"{s.User.FirstName} {s.User.MiddleName} {s.User.LastName}".Trim(),
        StudentCode = s.StudentCode
    };

    private static SchoolClassDto MapToDto(SchoolClass c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        GradeId = c.GradeId,
        GradeName = c.Grade.Name,
        Level = c.Level,
        AcademicYearId = c.AcademicYearId,
        AcademicYearName = c.AcademicYear.Name,
        IsLocked = c.IsLocked,
        StudentCount = c.Students.Count,
        Students = c.Students
            .OrderBy(s => s.User.FirstName)
            .Select(MapToStudentDto)
            .ToList()
    };
}
