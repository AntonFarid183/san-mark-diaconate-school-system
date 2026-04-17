using DiaconateSchool.Application.DTOs;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Services;

public interface IStudentRegistrationService
{
    /// <summary>
    /// Registers a new student, generates their user account, and returns credentials to be printed.
    /// </summary>
    Task<RegistrationResultDto> RegisterStudentAsync(RegisterStudentDto dto);

    /// <summary>
    /// Fetches the list of years/grades for a specific Stage.
    /// Used by the frontend to populate the filtered dropdown.
    /// </summary>
    Task<System.Collections.Generic.IEnumerable<DiaconateSchool.Domain.Entities.Grade>> GetGradesByStageAsync(DiaconateSchool.Domain.Enums.Stage stage);
}
