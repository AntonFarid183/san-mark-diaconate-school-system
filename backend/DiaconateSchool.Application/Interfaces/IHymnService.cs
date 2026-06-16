using DiaconateSchool.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface IHymnService
{
    Task<List<HymnListItemDto>> GetHymnsForStudentAsync(Guid studentId, Guid gradeId);
    Task<List<HymnListItemDto>> GetAllHymnsAsync();
    Task<HymnListItemDto> CreateHymnAsync(CreateHymnDto dto);
    Task<HymnSubmissionDto> SubmitHymnAsync(Guid hymnId, Guid studentId, string audioUrl);
    Task<List<HymnSubmissionDto>> GetSubmissionsAsync(string? filter);
    Task<HymnSubmissionDto> ReviewSubmissionAsync(Guid submissionId, HymnReviewDto review, Guid reviewerUserId);
}
