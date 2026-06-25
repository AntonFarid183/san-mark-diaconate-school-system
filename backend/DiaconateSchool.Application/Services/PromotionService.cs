using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Application.Interfaces.Services;
using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

public class PromotionService : IPromotionService
{
    private readonly IStudentRepository _studentRepo;
    private readonly IGradeHistoryRepository _historyRepo;
    private readonly IUnitOfWork _uow;
    private readonly IStudentQueryService _queryService;

    public PromotionService(
        IStudentRepository studentRepo,
        IGradeHistoryRepository historyRepo,
        IUnitOfWork uow,
        IStudentQueryService queryService)
    {
        _studentRepo = studentRepo;
        _historyRepo = historyRepo;
        _uow = uow;
        _queryService = queryService;
    }

    public async Task<StudentDetailDto?> PromoteStudentAsync(Guid studentId, PromoteStudentDto dto, Guid promotedByUserId)
    {
        var student = await _studentRepo.GetByIdWithIncludesAsync(studentId);
        if (student == null) return null;

        var history = new GradeHistory
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            FromGradeId = student.GradeId,
            ToGradeId = dto.ToGradeId,
            AcademicYear = dto.AcademicYear,
            Notes = dto.Notes,
            PromotedByUserId = promotedByUserId,
            PromotedAt = DateTime.UtcNow
        };

        student.GradeId = dto.ToGradeId;
        await _historyRepo.AddAsync(history);
        await _studentRepo.UpdateAsync(student);
        await _uow.SaveChangesAsync();

        return await _queryService.GetStudentByIdAsync(studentId);
    }

    public async Task<List<GradeHistoryDto>> GetHistoryAsync(Guid studentId)
    {
        var history = await _historyRepo.GetByStudentAsync(studentId);
        return history.Select(h => new GradeHistoryDto
        {
            Id = h.Id,
            FromGradeName = h.FromGrade?.Name ?? "",
            ToGradeName = h.ToGrade?.Name ?? "",
            AcademicYear = h.AcademicYear,
            Notes = h.Notes,
            PromotedAt = h.PromotedAt
        }).ToList();
    }
}
