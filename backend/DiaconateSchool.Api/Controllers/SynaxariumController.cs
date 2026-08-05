using DiaconateSchool.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/synaxarium")]
public class SynaxariumController : ControllerBase
{
    private readonly ISynaxariumService _service;
    public SynaxariumController(ISynaxariumService service) => _service = service;

    // Public — shown on the landing page, no login required.
    [AllowAnonymous]
    [HttpGet("today")]
    public async Task<IActionResult> GetToday()
    {
        var day = await _service.GetTodayAsync();
        return day == null ? NotFound(new { Message = "تعذر تحميل السنكسار اليوم." }) : Ok(day);
    }
}
