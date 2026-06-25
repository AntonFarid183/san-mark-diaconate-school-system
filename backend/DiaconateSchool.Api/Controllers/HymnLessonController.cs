using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/hymn-lessons")]
public class HymnLessonController : ControllerBase
{
    private readonly IHymnLessonService _service;
    private readonly IFileStorageService _storage;

    public HymnLessonController(IHymnLessonService service, IFileStorageService storage)
    {
        _service = service;
        _storage = storage;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    [Authorize(Policy = "AdminOnly")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? stageId, [FromQuery] LessonStatus? status)
    {
        var result = await _service.GetAllAsync(stageId, status);
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
    public async Task<IActionResult> Create([FromBody] CreateHymnLessonDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest(new { Message = "العنوان مطلوب." });
        if (dto.StageId == Guid.Empty)
            return BadRequest(new { Message = "المرحلة مطلوبة." });

        var result = await _service.CreateAsync(dto, GetUserId());
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateHymnLessonDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/upload-video")]
    [RequestSizeLimit(200_000_000)]
    public async Task<IActionResult> UploadVideo(Guid id)
    {
        var file = Request.Form.Files.GetFile("file");
        if (file == null || file.Length == 0)
            return BadRequest(new { Message = "الملف مطلوب." });
        if (!file.ContentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { Message = "يجب أن يكون ملف فيديو." });

        var url = await _storage.SaveAsync(file.OpenReadStream(), file.FileName, "hymn-videos");
        var result = await _service.SetVideoFileAsync(id, url, file.FileName);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/upload-lyrics-pdf")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> UploadLyricsPdf(Guid id)
    {
        var file = Request.Form.Files.GetFile("file");
        if (file == null || file.Length == 0)
            return BadRequest(new { Message = "الملف مطلوب." });
        if (!file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { Message = "يجب أن يكون الملف بصيغة PDF." });

        var url = await _storage.SaveAsync(file.OpenReadStream(), file.FileName, "hymn-lyrics");
        var result = await _service.SetLyricsPdfAsync(id, url, file.FileName);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/upload-lyrics-image")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> UploadLyricsImage(Guid id)
    {
        var file = Request.Form.Files.GetFile("file");
        if (file == null || file.Length == 0)
            return BadRequest(new { Message = "الملف مطلوب." });
        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { Message = "يجب أن يكون ملف صورة." });

        var url = await _storage.SaveAsync(file.OpenReadStream(), file.FileName, "hymn-lyrics");
        var result = await _service.SetLyricsImageAsync(id, url);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/publish")]
    public async Task<IActionResult> Publish(Guid id)
    {
        var success = await _service.PublishAsync(id);
        return success ? Ok(new { Message = "تم نشر الدرس." }) : NotFound();
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/archive")]
    public async Task<IActionResult> Archive(Guid id)
    {
        var success = await _service.ArchiveAsync(id);
        return success ? Ok(new { Message = "تم الأرشفة." }) : NotFound();
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _service.DeleteAsync(id);
        return success ? Ok(new { Message = "تم الحذف." }) : NotFound();
    }
}
