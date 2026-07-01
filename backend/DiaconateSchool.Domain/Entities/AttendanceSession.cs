using System;
using System.Collections.Generic;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class AttendanceSession
{
    public Guid Id { get; set; }
    public required string Title { get; set; }

    public Guid GradeId { get; set; }
    public Grade Grade { get; set; } = null!;

    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public int LateAfterMinutes { get; set; } = 15;

    public required string Pin { get; set; }
    public AttendanceSessionStatus Status { get; set; } = AttendanceSessionStatus.Scheduled;

    public Guid CreatedByUserId { get; set; }
    public ApplicationUser CreatedByUser { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<AttendanceRecord> Records { get; set; } = new List<AttendanceRecord>();
}
