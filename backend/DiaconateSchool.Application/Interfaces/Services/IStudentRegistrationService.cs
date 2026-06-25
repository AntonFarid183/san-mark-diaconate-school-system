using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Services;

public interface IStudentRegistrationService
{
    Task<RegistrationResultDto> RegisterStudentAsync(RegisterStudentDto dto);
    Task<IEnumerable<Grade>> GetGradesByStageAsync(Guid stageId);
    Task<IEnumerable<Stage>> GetAllStagesAsync();
}
