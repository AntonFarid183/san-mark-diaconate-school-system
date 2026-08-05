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

        var allowedCategories = new[] { "profiles", "lessons", "hymns", "homework", "general" };
        if (!Array.Exists(allowedCategories, c => c == category))
            return BadRequest(new { Message = "Invalid category." });

        var url = await _storage.SaveAsync(file.OpenReadStream(), file.FileName, category);
        return Ok(new { Url = url });
    }

    // Deliberately narrow anonymous endpoint — self-registration happens before
    // any account exists, so it has no bearer token to use the endpoint above.
    // Unlike it, this one can't be pointed at an arbitrary category, only
    // accepts image content-types, and caps well below the authenticated
    // limit — an open anonymous upload with a free-form category would be a
    // much bigger abuse surface than "small images into /profiles" is.
    private static readonly string[] AllowedImageTypes = { "image/jpeg", "image/png", "image/webp" };

    [AllowAnonymous]
    [HttpPost("upload-registration-photo")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> UploadRegistrationPhoto()
    {
        var file = Request.Form.Files.GetFile("file");
        if (file == null || file.Length == 0)
            return BadRequest(new { Message = "No file provided." });
        if (file.Length > 5_000_000)
            return BadRequest(new { Message = "حجم الصورة يتجاوز الحد الأقصى (5 ميغابايت)." });
        if (!Array.Exists(AllowedImageTypes, t => t.Equals(file.ContentType, StringComparison.OrdinalIgnoreCase)))
            return BadRequest(new { Message = "يجب أن تكون الصورة بصيغة JPEG أو PNG أو WEBP." });

        var url = await _storage.SaveAsync(file.OpenReadStream(), file.FileName, "profiles");
        return Ok(new { Url = url });
    }
}
