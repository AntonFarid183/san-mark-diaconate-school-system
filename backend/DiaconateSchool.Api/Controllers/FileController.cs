using DiaconateSchool.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FileController : ControllerBase
{
    private readonly IFileStorageService _storage;

    public FileController(IFileStorageService storage)
    {
        _storage = storage;
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpPost("upload")]
    [RequestSizeLimit(50_000_000)]
    public async Task<IActionResult> Upload([FromQuery] string category = "general")
    {
        var file = Request.Form.Files.GetFile("file");
        if (file == null || file.Length == 0)
            return BadRequest(new { Message = "No file provided." });

        var allowedCategories = new[] { "profiles", "lessons", "hymns", "general" };
        if (!Array.Exists(allowedCategories, c => c == category))
            return BadRequest(new { Message = "Invalid category." });

        var url = await _storage.SaveAsync(file.OpenReadStream(), file.FileName, category);
        return Ok(new { Url = url });
    }
}
