using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Domain.Enums;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Services;

public class PublicStatsService : IPublicStatsService
{
    private readonly ApplicationDbContext _context;

    public PublicStatsService(ApplicationDbContext context) => _context = context;

    public async Task<PublicStatsDto> GetAsync() => new()
    {
        ActiveStudents = await _context.Students.CountAsync(s => s.Status == StudentStatus.Active),
        Classes = await _context.SchoolClasses.CountAsync(c => c.AcademicYear.IsCurrent),
        PublishedCurricula = await _context.Curriculums.CountAsync(c => c.Status == CurriculumStatus.Published),
        PublishedHymnLessons = await _context.HymnLessons.CountAsync(h => h.Status == LessonStatus.Published),
    };
}
