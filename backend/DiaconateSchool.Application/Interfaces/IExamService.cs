using DiaconateSchool.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface IExamService
{
    Task<List<ExamListItemDto>> GetAllExamsAsync(Guid? gradeId = null, Guid? stageId = null);
    Task<List<ExamListItemDto>> GetExamsForStudentAsync(Guid gradeId);
    Task<ExamDetailDto?> GetExamByIdAsync(Guid examId);
    Task<ExamDetailDto> CreateExamAsync(CreateExamDto dto, Guid createdByUserId);
    Task<ExamDetailDto?> UpdateExamAsync(Guid examId, UpdateExamDto dto);
    Task<bool> DeleteExamAsync(Guid examId);

    Task<ExamResultDto> EnterResultAsync(Guid examId, EnterExamResultDto dto, Guid enteredByUserId);
    Task<List<ExamResultDto>> GetResultsByExamAsync(Guid examId);
    Task<List<ExamResultDto>> GetResultsByStudentAsync(Guid studentId);
    Task<ExamResultDto?> ApproveResultAsync(Guid resultId, ApproveExamResultDto dto, Guid approvedByUserId);
}
