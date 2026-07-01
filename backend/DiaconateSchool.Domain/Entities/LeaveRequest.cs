using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class LeaveRequest
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public required string Reason { get; set; }

    public LeaveStatus Status { get; set; } = LeaveStatus.Pending;
    public Guid? DecidedByUserId { get; set; }
    public ApplicationUser? DecidedByUser { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DecidedAt { get; set; }
}
