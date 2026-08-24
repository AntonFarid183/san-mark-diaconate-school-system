using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Services;
using DiaconateSchool.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentsController : ControllerBase
{
    private readonly IStudentRegistrationService _registrationService;
    private readonly IStudentQueryService _queryService;
    private readonly IPromotionService _promotionService;
    private readonly IStudentPerformanceService _performanceService;
    private readonly IPaymentService _paymentService;

    public StudentsController(
        IStudentRegistrationService registrationService,
        IStudentQueryService queryService,
        IPromotionService promotionService,
        IStudentPerformanceService performanceService,
        IPaymentService paymentService)
    {
        _registrationService = registrationService;
        _queryService = queryService;
        _promotionService = promotionService;
        _performanceService = performanceService;
        _paymentService = paymentService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // /register is [AllowAnonymous] (public self-registration reuses it), so unlike
    // GetUserId() this must tolerate there being no authenticated caller at all.
    private Guid? TryGetUserId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    // ── Lookup endpoints ──────────────────────────────────────────────

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("stages")]
    public async Task<IActionResult> GetStages()
    {
        var stages = await _registrationService.GetAllStagesAsync();
        return Ok(stages.Select(s => new { s.Id, s.Name, s.DisplayOrder }));
    }

    [AllowAnonymous]
    [HttpGet("grades/{stageId}")]
    public async Task<IActionResult> GetGrades(string stageId)
    {
        if (!Guid.TryParse(stageId, out var parsedStageId))
            return BadRequest(new { Message = "Invalid stage ID format." });

        var grades = await _registrationService.GetGradesByStageAsync(parsedStageId);
        var gradeList = grades.ToList();

        if (!gradeList.Any())
            return NotFound(new { Message = "No grades found for the specified stage." });

        return Ok(gradeList.Select(g => new { g.Id, g.Name, g.Level }));
    }

    // ── Student list / detail ─────────────────────────────────────────

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingStudents()
    {
        var result = await _queryService.GetPendingStudentsAsync();
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet]
    public async Task<IActionResult> GetStudents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? name = null,
        [FromQuery] Guid? gradeId = null,
        [FromQuery] Guid? stageId = null,
        [FromQuery] Guid? classId = null,
        [FromQuery] StudentLevel? level = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 1000) pageSize = 1000;

        var result = await _queryService.GetStudentsAsync(page, pageSize, name, gradeId, stageId, classId, level);
        return Ok(result);
    }

    // Admin dashboard "أعياد الميلاد" card — active students whose birthday falls in the current month.
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("birthdays-this-month")]
    public async Task<IActionResult> GetBirthdaysThisMonth()
    {
        var result = await _queryService.GetBirthdaysThisMonthAsync();
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("performance")]
    public async Task<IActionResult> GetPerformance(
        [FromQuery] Guid? stageId = null,
        [FromQuery] Guid? gradeId = null,
        [FromQuery] StudentLevel? level = null,
        [FromQuery] Guid? classId = null,
        [FromQuery] string? name = null)
    {
        var result = await _performanceService.GetPerformanceAsync(stageId, gradeId, level, classId, name);
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("grades")]
    public async Task<IActionResult> GetAllGrades()
    {
        var grades = await _queryService.GetAllGradesAsync();
        return Ok(grades);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("payment-report")]
    public async Task<IActionResult> GetPaymentReport([FromQuery] string? name, [FromQuery] Guid? stageId, [FromQuery] Guid? gradeId,
        [FromQuery] string? paymentStatus, [FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo)
    {
        var filter = new PaymentReportFilterDto
        {
            NameFilter = name,
            StageId = stageId,
            GradeId = gradeId,
            PaymentStatus = paymentStatus,
            DateFrom = dateFrom,
            DateTo = dateTo
        };
        var result = await _queryService.GetPaymentReportAsync(filter);
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetStudent(string id)
    {
        if (!Guid.TryParse(id, out var parsedId))
            return BadRequest(new { Message = "Invalid student ID format." });

        var student = await _queryService.GetStudentByIdAsync(parsedId);
        if (student == null)
            return NotFound(new { Message = "Student not found." });

        return Ok(student);
    }

    // ── Registration ──────────────────────────────────────────────────

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> RegisterStudent([FromBody] RegisterStudentDto dto)
    {
        try
        {
            var result = await _registrationService.RegisterStudentAsync(dto, TryGetUserId());
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An unexpected error occurred on the server." });
        }
    }

    // ── Edit / Admin actions ──────────────────────────────────────────

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStudent(string id, [FromBody] UpdateStudentDto dto)
    {
        if (!Guid.TryParse(id, out var parsedId))
            return BadRequest(new { Message = "Invalid student ID format." });

        var result = await _queryService.UpdateStudentAsync(parsedId, dto);
        if (result == null)
            return NotFound(new { Message = "Student not found." });

        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStudent(string id)
    {
        if (!Guid.TryParse(id, out var parsedId))
            return BadRequest(new { Message = "Invalid student ID format." });

        try
        {
            await _registrationService.DeleteStudentAsync(parsedId);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("level")]
    public async Task<IActionResult> SetStudentsLevel([FromBody] SetStudentsLevelDto dto)
    {
        var (success, error) = await _queryService.SetStudentsLevelAsync(dto.StudentIds, dto.Level);
        return success ? Ok() : BadRequest(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(string id, [FromBody] ResetStudentPasswordDto dto)
    {
        if (!Guid.TryParse(id, out var parsedId))
            return BadRequest(new { Message = "Invalid student ID format." });

        if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 8)
            return BadRequest(new { Message = "كلمة المرور يجب أن تكون 8 أحرف على الأقل." });

        var success = await _queryService.ResetPasswordAsync(parsedId, dto.NewPassword);
        if (!success)
            return NotFound(new { Message = "Student not found." });

        return Ok(new { Message = "تم إعادة تعيين كلمة المرور." });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/deactivate")]
    public async Task<IActionResult> Deactivate(string id)
    {
        if (!Guid.TryParse(id, out var parsedId))
            return BadRequest(new { Message = "Invalid student ID format." });

        var success = await _queryService.SetActiveStatusAsync(parsedId, false);
        return success ? Ok(new { Message = "تم إيقاف تفعيل الحساب." }) : NotFound(new { Message = "Student not found." });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/activate")]
    public async Task<IActionResult> Activate(string id, [FromBody] ActivateStudentDto? dto = null)
    {
        if (!Guid.TryParse(id, out var parsedId))
            return BadRequest(new { Message = "Invalid student ID format." });

        var success = await _queryService.SetActiveStatusAsync(parsedId, true, dto?.WithFees ?? false, dto?.PaidAmount, GetUserId());
        return success ? Ok(new { Message = "تم تفعيل الحساب." }) : NotFound(new { Message = "Student not found." });
    }

    // ── Promotion ─────────────────────────────────────────────────────

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/promote")]
    public async Task<IActionResult> Promote(string id, [FromBody] PromoteStudentDto dto)
    {
        if (!Guid.TryParse(id, out var parsedId))
            return BadRequest(new { Message = "Invalid student ID format." });

        try
        {
            var result = await _promotionService.PromoteStudentAsync(parsedId, dto, GetUserId());
            if (result == null)
                return NotFound(new { Message = "Student not found." });
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("{id}/grade-history")]
    public async Task<IActionResult> GetGradeHistory(string id)
    {
        if (!Guid.TryParse(id, out var parsedId))
            return BadRequest(new { Message = "Invalid student ID format." });

        var history = await _promotionService.GetHistoryAsync(parsedId);
        return Ok(history);
    }

    // ── Student self-endpoints ────────────────────────────────────────

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        if (role != nameof(Role.Student))
            return BadRequest(new { Message = "This endpoint is for students only." });

        var student = await _queryService.GetStudentByUserIdAsync(GetUserId());
        if (student == null)
            return NotFound(new { Message = "Student profile not found." });

        return Ok(student);
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpPatch("me/picture")]
    public async Task<IActionResult> UpdateMyPicture([FromBody] UpdatePictureDto dto)
    {
        var student = await _queryService.GetStudentByUserIdAsync(GetUserId());
        if (student == null)
            return NotFound(new { Message = "Student profile not found." });

        var updated = await _queryService.UpdateStudentAsync(student.Id, new UpdateStudentDto { ProfilePictureUrl = dto.Url });
        return Ok(updated);
    }

    // Deliberately its own minimal endpoint, not a redirect to the admin
    // /students/{id}/account route -- that one returns the total fee, any
    // discount, and the full transaction history, none of which a student
    // is meant to see about their own record.
    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("me/balance")]
    public async Task<IActionResult> GetMyBalance()
    {
        var student = await _queryService.GetStudentByUserIdAsync(GetUserId());
        if (student == null)
            return NotFound(new { Message = "Student profile not found." });

        var balance = await _paymentService.GetMyBalanceAsync(student.Id);
        return Ok(balance);
    }
}

public class ResetStudentPasswordDto
{
    public string NewPassword { get; set; } = string.Empty;
}

public class UpdatePictureDto
{
    public string Url { get; set; } = string.Empty;
}
