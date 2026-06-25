using DiaconateSchool.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface ICertificateService
{
    Task<List<CertificateDto>> GetByStudentAsync(Guid studentId);
    Task<CertificateDto?> GetByIdAsync(Guid certificateId);
}
