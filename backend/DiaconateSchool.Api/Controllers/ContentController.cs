using DiaconateSchool.Application.DTOs;
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
public class ContentController : ControllerBase
{
    private readonly IContentService _contentService;

    public ContentController(IContentService contentService)
    {
        _contentService = contentService;
    }

    // ── Lessons ───────────────────────────────────────────────────────

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("lessons")]
    public async Task<IActionResult> GetLessons(
        [FromQuery] Guid? stageId,
        [FromQuery] Guid? gradeId,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 50) pageSize = 50;

        var result = await _contentService.GetLessonsAsync(stageId, gradeId, status, page, pageSize);
        return Ok(result);
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("my-lessons")]
    public async Task<IActionResult> GetMyLessons([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var gradeIdClaim = User.FindFirst("GradeId")?.Value;
        if (string.IsNullOrEmpty(gradeIdClaim))
            return BadRequest(new { Message = "Grade not found in token." });

        var result = await _contentService.GetLessonsAsync(null, Guid.Parse(gradeIdClaim), "Published", page, pageSize);
        return Ok(result);
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("lessons/{id}")]
    public async Task<IActionResult> GetLesson(string id)
    {
        if (!Guid.TryParse(id, out var lessonId))
            return BadRequest(new { Message = "Invalid lesson ID format." });

        var lesson = await _contentService.GetLessonByIdAsync(lessonId);
        if (lesson == null)
            return NotFound(new { Message = "Lesson not found." });

        return Ok(lesson);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("lessons")]
    public async Task<IActionResult> CreateLesson([FromBody] CreateLessonDto dto)
    {
        try
        {
            var lesson = await _contentService.CreateLessonAsync(dto);
            return Ok(lesson);
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An unexpected error occurred." });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("lessons/{id}")]
    public async Task<IActionResult> UpdateLesson(string id, [FromBody] UpdateLessonDto dto)
    {
        if (!Guid.TryParse(id, out var lessonId))
            return BadRequest(new { Message = "Invalid lesson ID format." });

        var lesson = await _contentService.UpdateLessonAsync(lessonId, dto);
        if (lesson == null)
            return NotFound(new { Message = "Lesson not found." });

        return Ok(lesson);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("lessons/{id}/publish")]
    public async Task<IActionResult> PublishLesson(string id)
    {
        if (!Guid.TryParse(id, out var lessonId))
            return BadRequest(new { Message = "Invalid lesson ID format." });

        var success = await _contentService.PublishLessonAsync(lessonId);
        if (!success)
            return NotFound(new { Message = "Lesson not found." });

        return Ok(new { Message = "Lesson published successfully." });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("lessons/{id}/archive")]
    public async Task<IActionResult> ArchiveLesson(string id)
    {
        if (!Guid.TryParse(id, out var lessonId))
            return BadRequest(new { Message = "Invalid lesson ID format." });

        var success = await _contentService.ArchiveLessonAsync(lessonId);
        if (!success)
            return NotFound(new { Message = "Lesson not found." });

        return Ok(new { Message = "Lesson archived successfully." });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("lessons/{id}")]
    public async Task<IActionResult> DeleteLesson(string id)
    {
        if (!Guid.TryParse(id, out var lessonId))
            return BadRequest(new { Message = "Invalid lesson ID format." });

        var success = await _contentService.DeleteLessonAsync(lessonId);
        if (!success)
            return NotFound(new { Message = "Lesson not found." });

        return Ok(new { Message = "Lesson deleted successfully." });
    }

    // ── Content items ─────────────────────────────────────────────────

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("lessons/{lessonId}/content")]
    public async Task<IActionResult> AddContentItem(string lessonId, [FromBody] CreateContentItemDto dto)
    {
        if (!Guid.TryParse(lessonId, out var parsedLessonId))
            return BadRequest(new { Message = "Invalid lesson ID format." });

        try
        {
            var item = await _contentService.AddContentItemAsync(parsedLessonId, dto);
            return Ok(item);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("content/{id}")]
    public async Task<IActionResult> RemoveContentItem(string id)
    {
        if (!Guid.TryParse(id, out var contentItemId))
            return BadRequest(new { Message = "Invalid content item ID format." });

        var success = await _contentService.RemoveContentItemAsync(contentItemId);
        if (!success)
            return NotFound(new { Message = "Content item not found." });

        return Ok(new { Message = "Content item removed successfully." });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("lessons/{lessonId}/reorder")]
    public async Task<IActionResult> ReorderContent(string lessonId, [FromBody] List<Guid> contentItemIds)
    {
        if (!Guid.TryParse(lessonId, out var parsedLessonId))
            return BadRequest(new { Message = "Invalid lesson ID format." });

        var success = await _contentService.ReorderContentAsync(parsedLessonId, contentItemIds);
        if (!success)
            return BadRequest(new { Message = "Failed to reorder content." });

        return Ok(new { Message = "Content reordered successfully." });
    }
}
