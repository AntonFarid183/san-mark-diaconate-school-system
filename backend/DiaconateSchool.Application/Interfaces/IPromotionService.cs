using DiaconateSchool.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface IPromotionService
{
    Task<StudentDetailDto?> PromoteStudentAsync(Guid studentId, PromoteStudentDto dto, Guid promotedByUserId);
    Task<List<GradeHistoryDto>> GetHistoryAsync(Guid studentId);
}
