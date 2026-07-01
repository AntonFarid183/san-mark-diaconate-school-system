using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class AttendanceAuditLog
{
    public long Id { get; set; }

    public Guid RecordId { get; set; }
    public AttendanceRecord Record { get; set; } = null!;

    public Guid ChangedByUserId { get; set; }
    public ApplicationUser ChangedByUser { get; set; } = null!;

    public AttendanceStatus? OldStatus { get; set; }
    public AttendanceStatus NewStatus { get; set; }
    public string? Reason { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}
