using DiaconateSchool.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/public/stats")]
public class PublicStatsController : ControllerBase
{
    private readonly IPublicStatsService _service;
    public PublicStatsController(IPublicStatsService service) => _service = service;

    // Public — feeds the "بالأرقام" strip on the landing page. Counts only, nothing personal.
    [AllowAnonymous]
    [HttpGet]
    [ResponseCache(Duration = 300)]
    public async Task<IActionResult> Get() => Ok(await _service.GetAsync());
}
