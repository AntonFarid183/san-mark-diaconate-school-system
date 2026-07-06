using DiaconateSchool.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface IHymnSubmissionService
{
    Task<HymnSubmissionDto?> GetMySubmissionAsync(Guid studentId, Guid hymnLessonId);
    Task<(bool Success, string? Error, HymnSubmissionDto? Result)> SubmitRecordingAsync(
        Guid studentId, Guid hymnLessonId, SubmitHymnRecordingDto dto);

    Task<List<HymnSubmissionRosterItemDto>> GetRosterAsync(Guid hymnLessonId, Guid gradeId, Guid? classId);
    Task<(bool Success, string? Error, HymnSubmissionDto? Result)> ReviewAsync(
        Guid submissionId, ReviewHymnSubmissionDto dto, Guid reviewedByUserId);
}
