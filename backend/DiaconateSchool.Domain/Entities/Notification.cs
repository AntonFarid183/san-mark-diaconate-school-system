using DiaconateSchool.Domain.Enums;
using System;

namespace DiaconateSchool.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public NotificationType Type { get; set; }
    public required string Title { get; set; }
    public string? Message { get; set; }

    // The entity this notification refers to — frontend derives the route from (Type, ReferenceId)
    public Guid? ReferenceId { get; set; }

    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
