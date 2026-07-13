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

public class StudentPerformanceService : IStudentPerformanceService
{
    private readonly IStudentRepository _studentRepo;
    private readonly IHomeworkRepository _homeworkRepo;
    private readonly IHymnSubmissionRepository _hymnRepo;
    private readonly IAttendanceRepository _attendanceRepo;

    public StudentPerformanceService(
        IStudentRepository studentRepo,
        IHomeworkRepository homeworkRepo,
        IHymnSubmissionRepository hymnRepo,
        IAttendanceRepository attendanceRepo)
    {
        _studentRepo = studentRepo;
        _homeworkRepo = homeworkRepo;
        _hymnRepo = hymnRepo;
        _attendanceRepo = attendanceRepo;
    }

    public async Task<StudentPerformanceResponseDto> GetPerformanceAsync(
        Guid? stageId, Guid? gradeId, StudentLevel? level, Guid? classId, string? name)
    {
        var students = await _studentRepo.GetAllAsync(1, 500, name, gradeId, stageId, classId, level);

        var subjects = await _homeworkRepo.GetSubjectsAsync();
        var subjectDefs = new List<PerformanceSubjectDefDto> { new() { Key = "hymns", Name = "الألحان" } };
        subjectDefs.AddRange(subjects.Select(s => new PerformanceSubjectDefDto { Key = s.Id.ToString(), Name = s.Name }));

        if (students.Count == 0)
            return new StudentPerformanceResponseDto { Subjects = subjectDefs };

        // ── Bulk-fetch every data source once, in memory group by student — avoids N+1 ──
        var studentIds = students.Select(s => s.Id).ToList();
        var gradeIds = students.Select(s => s.GradeId).Distinct().ToList();

        var homeworkSubmissions = await _homeworkRepo.GetSubmissionsByStudentIdsAsync(studentIds);
        var publishedHomeworks = await _homeworkRepo.GetPublishedForGradesAsync(gradeIds);
        var hymnSubmissions = await _hymnRepo.GetSubmissionsByStudentIdsAsync(studentIds);
        var attendanceRecords = await _attendanceRepo.GetRecordsByStudentIdsAsync(studentIds);

        var homeworkByStudent = homeworkSubmissions.GroupBy(s => s.StudentId).ToDictionary(g => g.Key, g => g.ToList());
        var hymnByStudent = hymnSubmissions.GroupBy(s => s.StudentId).ToDictionary(g => g.Key, g => g.ToList());
        var attendanceByStudent = attendanceRecords.GroupBy(r => r.StudentId).ToDictionary(g => g.Key, g => g.ToList());
        var publishedByGrade = publishedHomeworks.GroupBy(h => h.GradeId).ToDictionary(g => g.Key, g => g.Select(h => h.Id).ToHashSet());

        var rows = students.Select(student => BuildRow(student, subjects, subjectDefs,
            homeworkByStudent.GetValueOrDefault(student.Id) ?? new List<HomeworkSubmission>(),
            hymnByStudent.GetValueOrDefault(student.Id) ?? new List<HymnSubmission>(),
            attendanceByStudent.GetValueOrDefault(student.Id) ?? new List<AttendanceRecord>(),
            publishedByGrade.GetValueOrDefault(student.GradeId) ?? new HashSet<Guid>()))
            .OrderBy(r => r.FullName)
            .ToList();

        return new StudentPerformanceResponseDto
        {
            Subjects = subjectDefs,
            Students = rows,
            Summary = BuildSummary(rows)
        };
    }

    private static StudentPerformanceRowDto BuildRow(
        Student student,
        List<HomeworkSubject> subjects,
        List<PerformanceSubjectDefDto> subjectDefs,
        List<HomeworkSubmission> homeworkSubs,
        List<HymnSubmission> hymnSubs,
        List<AttendanceRecord> attendanceRecs,
        HashSet<Guid> publishedHomeworkIdsForGrade)
    {
        var row = new StudentPerformanceRowDto
        {
            StudentId = student.Id,
            FullName = $"{student.User.FirstName} {student.User.MiddleName} {student.User.LastName}".Trim(),
            StudentCode = student.StudentCode,
            ClassName = student.Class?.Name
        };

        var componentPercentages = new List<decimal>();

        // Hymns — scored out of a fixed 10, same convention as homework
        var hymnScore = BuildSubjectScore("hymns",
            hymnSubs.Select(h => (h.HymnLesson.Title, h.Score!.Value, 10m, h.SubmittedAt)).ToList());
        row.SubjectScores.Add(hymnScore);
        if (hymnScore.AverageScore.HasValue)
            componentPercentages.Add(hymnScore.AverageScore.Value / hymnScore.MaxScore * 100);

        // One column per Homework subject (Coptic / Rite / Memorization / ...)
        foreach (var subject in subjects)
        {
            var subjectSubs = homeworkSubs
                .Where(h => h.Homework.SubjectId == subject.Id)
                .Select(h => (h.Homework.Title, h.Score, h.Homework.TotalMarks, h.SubmittedAt))
                .ToList();

            var score = BuildSubjectScore(subject.Id.ToString(), subjectSubs);
            row.SubjectScores.Add(score);
            if (score.AverageScore.HasValue)
                componentPercentages.Add(score.AverageScore.Value / score.MaxScore * 100);
        }

        // Attendance
        if (attendanceRecs.Count > 0)
        {
            var present = attendanceRecs.Count(r => r.Status == AttendanceStatus.Present);
            row.AttendancePercentage = Math.Round(100m * present / attendanceRecs.Count, 1);
            componentPercentages.Add(row.AttendancePercentage.Value);
        }

        // Overall — simple average of whichever components have data (no weighting yet;
        // future modules like Exams/Competitions just add one more percentage to this list)
        row.OverallPercentage = componentPercentages.Count > 0
            ? Math.Round(componentPercentages.Average(), 1)
            : null;

        // Weakest subject — among academic subjects only (attendance isn't a "subject")
        var weakest = row.SubjectScores
            .Where(s => s.AverageScore.HasValue)
            .OrderBy(s => s.AverageScore!.Value / s.MaxScore)
            .FirstOrDefault();
        row.WeakestSubjectName = weakest != null
            ? subjectDefs.First(d => d.Key == weakest.SubjectKey).Name
            : null;

        row.RequiresFollowUp = row.OverallPercentage.HasValue && row.OverallPercentage.Value < PerformanceThresholds.FollowUpPercentage;

        var submittedHomeworkIds = homeworkSubs.Select(h => h.HomeworkId).ToHashSet();
        row.IsMissingHomework = publishedHomeworkIdsForGrade.Any(id => !submittedHomeworkIds.Contains(id));

        return row;
    }

    private static SubjectScoreDto BuildSubjectScore(string key, List<(string Title, decimal Score, decimal MaxScore, DateTime Date)> submissions)
    {
        if (submissions.Count == 0)
            return new SubjectScoreDto { SubjectKey = key, AverageScore = null, MaxScore = 10 };

        // Normalize each submission to a common /10 scale (assignments can have different
        // TotalMarks) so the column stays consistent regardless of how many assignments exist.
        var normalized = submissions.Select(s => s.Score / s.MaxScore * 10).ToList();
        var latest = submissions.OrderByDescending(s => s.Date).First();

        return new SubjectScoreDto
        {
            SubjectKey = key,
            AverageScore = Math.Round(normalized.Average(), 2),
            MaxScore = 10,
            LatestLabel = latest.Title,
            LatestDate = latest.Date,
            History = submissions.OrderByDescending(s => s.Date).Select(s => new PerformanceSubmissionDto
            {
                Title = s.Title,
                Score = s.Score,
                MaxScore = s.MaxScore,
                Date = s.Date
            }).ToList()
        };
    }

    private static StudentPerformanceSummaryDto BuildSummary(List<StudentPerformanceRowDto> rows)
    {
        var withOverall = rows.Where(r => r.OverallPercentage.HasValue).ToList();
        var withAttendance = rows.Where(r => r.AttendancePercentage.HasValue).ToList();
        var top = withOverall.OrderByDescending(r => r.OverallPercentage!.Value).FirstOrDefault();

        return new StudentPerformanceSummaryDto
        {
            TotalStudents = rows.Count,
            AverageOverall = withOverall.Count > 0 ? Math.Round(withOverall.Average(r => r.OverallPercentage!.Value), 1) : null,
            TopStudentName = top?.FullName,
            TopStudentScore = top?.OverallPercentage,
            FollowUpCount = rows.Count(r => r.RequiresFollowUp),
            MissingHomeworkCount = rows.Count(r => r.IsMissingHomework),
            AverageAttendance = withAttendance.Count > 0 ? Math.Round(withAttendance.Average(r => r.AttendancePercentage!.Value), 1) : null
        };
    }
}
