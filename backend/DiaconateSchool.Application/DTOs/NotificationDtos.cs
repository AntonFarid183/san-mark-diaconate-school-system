using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;

namespace DiaconateSchool.Application.DTOs;

public class NotificationDto
{
    public Guid Id { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Message { get; set; }
    public Guid? ReferenceId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

// A live-computed action item — never stored, recalculated on every request
public class DynamicNotificationDto
{
    public string Key { get; set; } = string.Empty; // e.g. "pending-approvals" — stable id for the frontend to route on
    public string Title { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class NotificationSummaryDto
{
    public List<DynamicNotificationDto> DynamicItems { get; set; } = new();
    public List<NotificationDto> RecentPersistent { get; set; } = new();
    public int UnreadPersistentCount { get; set; }
}

public class NotificationListDto
{
    public List<NotificationDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
