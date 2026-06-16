using DiaconateSchool.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface IExamService
{
    Task<ExamDto> GetExamAsync(Guid examId);
    Task<List<ExamDto>> GetExamsForStudentAsync(Guid gradeId);
    Task<ExamDto> CreateExamAsync(CreateExamDto dto);
    Task<ExamResultDto> SubmitExamAsync(Guid examId, Guid studentId, SubmitExamDto dto);
    Task<ExamResultDto> GetExamResultAsync(Guid examId, Guid studentId);
}
