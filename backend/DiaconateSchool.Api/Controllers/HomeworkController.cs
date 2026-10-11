using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/homework")]
public class HomeworkController : ControllerBase
{
    private readonly IHomeworkService _service;
    private readonly IStudentRepository _studentRepo;
    private readonly IFileStorageService _storage;

    public HomeworkController(IHomeworkService service, IStudentRepository studentRepo, IFileStorageService storage)
    {
        _service = service;
        _studentRepo = studentRepo;
        _storage = storage;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<Guid?> GetCurrentStudentIdAsync()
    {
        var student = await _studentRepo.GetByUserIdAsync(GetUserId());
        return student?.Id;
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("subjects")]
    public async Task<IActionResult> GetSubjects()
        => Ok(await _service.GetSubjectsAsync());

    // ── Admin ──────────────────────────────────────────────

    [Authorize(Policy = "AdminOnly")]
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? stageId, [FromQuery] Guid? gradeId, [FromQuery] Guid? subjectId, [FromQuery] LessonStatus? status)
        => Ok(await _service.GetAllAsync(stageId, gradeId, subjectId, status));

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateHomeworkDto dto)
    {
        var (success, error, result) = await _service.CreateAsync(dto, GetUserId());
        return success ? Ok(result) : BadRequest(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/publish")]
    public async Task<IActionResult> Publish(Guid id)
    {
        var (success, error) = await _service.SetStatusAsync(id, LessonStatus.Published);
        return success ? Ok() : NotFound(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/unpublish")]
    public async Task<IActionResult> Unpublish(Guid id)
    {
        var (success, error) = await _service.SetStatusAsync(id, LessonStatus.Draft);
        return success ? Ok() : NotFound(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var (success, error) = await _service.DeleteAsync(id);
        return success ? NoContent() : NotFound(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("{id}/roster")]
    public async Task<IActionResult> GetGradingRoster(Guid id)
    {
        var (success, error, result) = await _service.GetGradingRosterAsync(id);
        return success ? Ok(result) : NotFound(new { Message = error });
    }

    // Written answers to review, newest unmarked first
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("{id}/essay-review")]
    public async Task<IActionResult> GetEssayReview(Guid id)
    {
        var (success, error, result) = await _service.GetEssayReviewAsync(id);
        return success ? Ok(result) : NotFound(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("answers/{answerId}/grade")]
    public async Task<IActionResult> GradeEssayAnswer(Guid answerId, [FromBody] GradeEssayAnswerDto dto)
    {
        var (success, error, result) = await _service.GradeEssayAnswerAsync(answerId, dto.Score);
        return success ? Ok(result) : BadRequest(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/manual-grades")]
    public async Task<IActionResult> SetManualGrades(Guid id, [FromBody] ManualGradeEntryDto dto)
    {
        var (success, error) = await _service.SetManualGradesAsync(id, dto);
        return success ? Ok() : BadRequest(new { Message = error });
    }

    // Reuses the exact same per-student aggregation used by the student's own "my homework"
    // list (GetAvailableForStudentAsync already takes a raw studentId, not JWT-derived) —
    // this just lets an admin call it for a student they're viewing, for the profile dashboard.
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> GetForStudent(Guid studentId)
        => Ok(await _service.GetAvailableForStudentAsync(studentId));

    // ── Student ────────────────────────────────────────────

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("my")]
    public async Task<IActionResult> GetMine()
    {
        var studentId = await GetCurrentStudentIdAsync();
        if (studentId == null) return BadRequest(new { Message = "هذه الميزة متاحة للطلاب فقط." });

        return Ok(await _service.GetAvailableForStudentAsync(studentId.Value));
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("my/{id}")]
    public async Task<IActionResult> GetMineById(Guid id)
    {
        var studentId = await GetCurrentStudentIdAsync();
        if (studentId == null) return BadRequest(new { Message = "هذه الميزة متاحة للطلاب فقط." });

        var (success, error, result) = await _service.GetForStudentAsync(id, studentId.Value);
        return success ? Ok(result) : NotFound(new { Message = error });
    }

    // A student attaches a photo or PDF to an essay answer. Deliberately narrower than the general
    // upload: only images and PDFs, a size cap, and the content is checked (not just the name),
    // because these files are served publicly from /uploads.
    private const long MaxAnswerFileBytes = 10_000_000;

    private static bool LooksLikeAllowedFile(byte[] head, string extension)
    {
        static bool Starts(byte[] data, params byte[] prefix) => data.Length >= prefix.Length && data.Take(prefix.Length).SequenceEqual(prefix);
        return extension switch
        {
            ".pdf" => Starts(head, 0x25, 0x50, 0x44, 0x46),                         // %PDF
            ".jpg" or ".jpeg" => Starts(head, 0xFF, 0xD8, 0xFF),
            ".png" => Starts(head, 0x89, 0x50, 0x4E, 0x47),
            ".webp" => head.Length >= 12 && Starts(head, 0x52, 0x49, 0x46, 0x46) && head[8] == 0x57 && head[9] == 0x45 && head[10] == 0x42 && head[11] == 0x50,
            _ => false
        };
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpPost("my/upload-answer")]
    [RequestSizeLimit(12_000_000)]
    public async Task<IActionResult> UploadAnswerFile()
    {
        var studentId = await GetCurrentStudentIdAsync();
        if (studentId == null) return BadRequest(new { Message = "هذه الميزة متاحة للطلاب فقط." });

        var file = Request.Form.Files.GetFile("file");
        if (file == null || file.Length == 0)
            return BadRequest(new { Message = "لم يتم اختيار ملف." });
        if (file.Length > MaxAnswerFileBytes)
            return BadRequest(new { Message = "حجم الملف يتجاوز الحد الأقصى (10 ميغابايت)." });

        var extension = System.IO.Path.GetExtension(file.FileName).ToLowerInvariant();
        var head = new byte[12];
        await using (var peek = file.OpenReadStream())
        {
            var read = await peek.ReadAsync(head.AsMemory(0, head.Length));
            if (read < head.Length) head = head.Take(read).ToArray();
        }
        if (!LooksLikeAllowedFile(head, extension))
            return BadRequest(new { Message = "الملف يجب أن يكون صورة (JPG أو PNG أو WEBP) أو ملف PDF." });

        await using var stream = file.OpenReadStream();
        var url = await _storage.SaveAsync(stream, file.FileName, "homework-answers");
        return Ok(new { Url = url, FileName = System.IO.Path.GetFileName(file.FileName) });
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpPost("my/{id}/submit")]
    public async Task<IActionResult> Submit(Guid id, [FromBody] SubmitHomeworkDto dto)
    {
        var studentId = await GetCurrentStudentIdAsync();
        if (studentId == null) return BadRequest(new { Message = "هذه الميزة متاحة للطلاب فقط." });

        var (success, error, result) = await _service.SubmitAsync(id, studentId.Value, dto);
        return success ? Ok(result) : BadRequest(new { Message = error });
    }
}
