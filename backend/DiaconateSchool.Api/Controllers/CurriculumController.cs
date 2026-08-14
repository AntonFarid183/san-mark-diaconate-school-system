using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CurriculumController : ControllerBase
{
    private readonly ICurriculumService _service;
    private readonly IFileStorageService _storage;

    public CurriculumController(ICurriculumService service, IFileStorageService storage)
    {
        _service = service;
        _storage = storage;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    [AllowAnonymous]
    [HttpGet("public/stages")]
    public async Task<IActionResult> GetPublicStages([FromQuery] CurriculumSubject subject)
    {
        var result = await _service.GetPublicStagesAsync(subject);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("public")]
    public async Task<IActionResult> GetPublic([FromQuery] CurriculumSubject subject, [FromQuery] Guid stageId)
    {
        var result = await _service.GetPublicAsync(subject, stageId);
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? stageId,
        [FromQuery] CurriculumStatus? status,
        [FromQuery] string? academicYear)
    {
        var result = await _service.GetAllAsync(stageId, status, academicYear);
        return Ok(result);
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("my")]
    public async Task<IActionResult> GetMy()
    {
        var stageIdClaim = User.FindFirst("StageId")?.Value;
        if (string.IsNullOrEmpty(stageIdClaim))
            return BadRequest(new { Message = "Stage not found in token." });

        var result = await _service.GetMyAsync(Guid.Parse(stageIdClaim));
        return Ok(result);
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCurriculumDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest(new { Message = "العنوان مطلوب." });
        if (string.IsNullOrWhiteSpace(dto.AcademicYear))
            return BadRequest(new { Message = "العام الدراسي مطلوب." });
        if (dto.StageId == Guid.Empty)
            return BadRequest(new { Message = "المرحلة مطلوبة." });

        var result = await _service.CreateAsync(dto, GetUserId());
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCurriculumDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        return result == null ? NotFound() : Ok(result);
    }

    // No [RequestSizeLimit] override here on purpose. That attribute is a hard
    // ceiling enforced by the framework itself while it reads the request body
    // -- a file over its limit gets the connection aborted mid-read, before
    // this method's own size check ever runs, so the admin got a blind
    // "فشل الحفظ" instead of the friendly message below. Falls back to the
    // app-wide Kestrel MaxRequestBodySize (200MB, set in Program.cs for hymn
    // videos) as the real backstop, so a real curriculum PDF (scanned
    // booklets routinely run 30-60MB) can actually reach the check.
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/upload-pdf")]
    public async Task<IActionResult> UploadPdf(Guid id)
    {
        var file = Request.Form.Files.GetFile("file");
        if (file == null || file.Length == 0)
            return BadRequest(new { Message = "الملف مطلوب." });
        if (!file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { Message = "يجب أن يكون الملف بصيغة PDF." });
        if (file.Length > 60_000_000)
            return BadRequest(new { Message = "حجم الملف يتجاوز الحد الأقصى (60 ميغابايت)." });

        var url = await _storage.SaveAsync(file.OpenReadStream(), file.FileName, "curriculums");
        var result = await _service.SetPdfAsync(id, url, file.FileName, file.Length);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/publish")]
    public async Task<IActionResult> Publish(Guid id)
    {
        try
        {
            var success = await _service.PublishAsync(id);
            return success ? Ok(new { Message = "تم نشر المنهج." }) : NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/archive")]
    public async Task<IActionResult> Archive(Guid id)
    {
        var success = await _service.ArchiveAsync(id);
        return success ? Ok(new { Message = "تم أرشفة المنهج." }) : NotFound();
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _service.DeleteAsync(id);
        return success ? Ok(new { Message = "تم الحذف." }) : NotFound();
    }
}
