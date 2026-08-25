using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PublicFeedbackController : ControllerBase
{
    private readonly IPublicFeedbackService _service;
    public PublicFeedbackController(IPublicFeedbackService service) => _service = service;

    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePublicFeedbackDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new { Message = "الاسم والرسالة مطلوبان." });

        await _service.SubmitAsync(dto);
        return Ok(new { Message = "تم إرسال رسالتك بنجاح." });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _service.GetAllAsync();
        return Ok(items);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
