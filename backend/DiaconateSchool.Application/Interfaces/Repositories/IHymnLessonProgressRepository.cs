using DiaconateSchool.Domain.Entities;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IHymnLessonProgressRepository
{
    Task<HymnLessonProgress?> GetAsync(Guid studentId, Guid hymnLessonId);
    Task<List<HymnLessonProgress>> GetByStudentAsync(Guid studentId);
    Task<List<HymnLessonProgress>> GetByLessonAsync(Guid hymnLessonId);
    Task UpsertAsync(HymnLessonProgress progress);
    Task<HymnLessonProgressStats> GetLessonStatsAsync(Guid hymnLessonId);
}

public class HymnLessonProgressStats
{
    public int TotalStudents { get; set; }
    public int Started { get; set; }
    public int Completed { get; set; }
    public int NeverStarted { get; set; }
    public decimal AveragePercent { get; set; }
    public decimal CompletionRate { get; set; }
}
