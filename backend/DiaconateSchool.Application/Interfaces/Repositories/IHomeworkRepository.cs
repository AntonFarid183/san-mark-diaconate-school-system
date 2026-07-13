using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IHomeworkRepository
{
    Task<List<HomeworkSubject>> GetSubjectsAsync();

    Task<List<Homework>> GetAllAsync(Guid? stageId, Guid? gradeId, Guid? subjectId, LessonStatus? status);
    Task<Homework?> GetByIdAsync(Guid id);
    Task AddAsync(Homework homework);
    Task DeleteAsync(Homework homework);

    Task<List<Homework>> GetPublishedForGradeAsync(Guid gradeId);

    Task<HomeworkSubmission?> GetSubmissionAsync(Guid homeworkId, Guid studentId);
    Task<List<HomeworkSubmission>> GetSubmissionsByHomeworkIdAsync(Guid homeworkId);
    Task<List<HomeworkSubmission>> GetSubmissionsByStudentIdsAsync(IEnumerable<Guid> studentIds);
    Task<List<Homework>> GetPublishedForGradesAsync(IEnumerable<Guid> gradeIds);
    Task AddSubmissionAsync(HomeworkSubmission submission);

    Task<int> GetDraftCountAsync();
    Task<Homework?> GetFirstDraftAsync();
}
