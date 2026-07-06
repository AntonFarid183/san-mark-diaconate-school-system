using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/students/{studentId}/account")]
[Authorize(Policy = "AdminOnly")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _service;

    public PaymentsController(IPaymentService service)
    {
        _service = service;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAccount(Guid studentId)
    {
        var (success, error, result) = await _service.GetAccountAsync(studentId);
        return success ? Ok(result) : NotFound(new { Message = error });
    }

    [HttpPut("total-required")]
    public async Task<IActionResult> SetTotalRequired(Guid studentId, [FromBody] SetTotalRequiredDto dto)
    {
        var (success, error, result) = await _service.SetTotalRequiredAsync(studentId, dto);
        if (!success) return error!.Contains("غير موجود") ? NotFound(new { Message = error }) : BadRequest(new { Message = error });
        return Ok(result);
    }

    [HttpPost("transactions")]
    public async Task<IActionResult> AddTransaction(Guid studentId, [FromBody] CreateTransactionDto dto)
    {
        var (success, error, result) = await _service.AddTransactionAsync(studentId, dto, GetUserId());
        if (!success) return error!.Contains("غير موجود") ? NotFound(new { Message = error }) : BadRequest(new { Message = error });
        return Ok(result);
    }

    [HttpPut("transactions/{transactionId}")]
    public async Task<IActionResult> UpdateTransaction(Guid studentId, Guid transactionId, [FromBody] UpdateTransactionDto dto)
    {
        var (success, error, result) = await _service.UpdateTransactionAsync(transactionId, dto);
        if (!success) return error!.Contains("غير موجود") ? NotFound(new { Message = error }) : BadRequest(new { Message = error });
        return Ok(result);
    }

    [HttpPost("transactions/{transactionId}/void")]
    public async Task<IActionResult> VoidTransaction(Guid studentId, Guid transactionId, [FromBody] VoidTransactionDto dto)
    {
        var (success, error, result) = await _service.VoidTransactionAsync(transactionId, dto, GetUserId());
        if (!success) return error!.Contains("غير موجود") ? NotFound(new { Message = error }) : BadRequest(new { Message = error });
        return Ok(result);
    }
}
