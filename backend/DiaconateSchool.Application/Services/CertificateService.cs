using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

public class CertificateService : ICertificateService
{
    private readonly ICertificateRepository _repo;

    public CertificateService(ICertificateRepository repo)
    {
        _repo = repo;
    }

    public async Task<List<CertificateDto>> GetByStudentAsync(Guid studentId)
    {
        var certs = await _repo.GetByStudentAsync(studentId);
        return certs.Select(MapToDto).ToList();
    }

    public async Task<CertificateDto?> GetByIdAsync(Guid certificateId)
    {
        var cert = await _repo.GetByIdAsync(certificateId);
        return cert == null ? null : MapToDto(cert);
    }

    private static CertificateDto MapToDto(Domain.Entities.Certificate c) => new()
    {
        Id = c.Id,
        StudentId = c.StudentId,
        StudentFullName = c.StudentFullName,
        StudentCode = c.Student?.StudentCode ?? "",
        StageName = c.StageName,
        GradeName = c.GradeName,
        AcademicYear = c.AcademicYear,
        ExamTitle = c.ExamTitle,
        Period = c.Period.ToString(),
        Score = c.Score,
        TotalScore = c.TotalScore,
        Percentage = c.Percentage,
        Classification = c.Classification,
        Status = c.Status.ToString(),
        IssuedAt = c.IssuedAt
    };
}
