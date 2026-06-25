using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CertificateController : ControllerBase
{
    private readonly ICertificateService _service;

    public CertificateController(ICertificateService service)
    {
        _service = service;
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("my")]
    public async Task<IActionResult> GetMyCertificates()
    {
        var studentIdClaim = User.FindFirst("StudentId")?.Value;
        if (string.IsNullOrEmpty(studentIdClaim))
            return BadRequest(new { Message = "Student profile not found." });

        var certs = await _service.GetByStudentAsync(Guid.Parse(studentIdClaim));
        return Ok(certs);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> GetStudentCertificates(string studentId)
    {
        if (!Guid.TryParse(studentId, out var parsedId))
            return BadRequest(new { Message = "Invalid student ID." });

        var certs = await _service.GetByStudentAsync(parsedId);
        return Ok(certs);
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetCertificate(string id)
    {
        if (!Guid.TryParse(id, out var certId))
            return BadRequest(new { Message = "Invalid certificate ID." });

        var cert = await _service.GetByIdAsync(certId);
        return cert == null ? NotFound(new { Message = "Certificate not found." }) : Ok(cert);
    }
}
