using System;
using System.Collections.Generic;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class AttendanceRecord
{
    public Guid Id { get; set; }

    public Guid SessionId { get; set; }
    public AttendanceSession Session { get; set; } = null!;

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public AttendanceStatus Status { get; set; }
    public AttendanceMethod Method { get; set; }
    public string? Notes { get; set; }

    public Guid? RecordedByUserId { get; set; }
    public ApplicationUser? RecordedByUser { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    public ICollection<AttendanceAuditLog> AuditLogs { get; set; } = new List<AttendanceAuditLog>();
}
