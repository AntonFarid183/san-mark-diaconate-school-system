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
}
