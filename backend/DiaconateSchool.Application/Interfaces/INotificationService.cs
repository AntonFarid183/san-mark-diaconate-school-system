using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Domain.Enums;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface INotificationService
{
    // Bell dropdown — role-aware summary (dynamic action items + latest unread persistent)
    Task<NotificationSummaryDto> GetAdminSummaryAsync();
    Task<NotificationSummaryDto> GetStudentSummaryAsync(Guid studentId, Guid userId);

    // "View All" page — persistent history only, filterable by read state
    Task<NotificationListDto> GetPersistentAsync(Guid userId, bool? isRead, int page, int pageSize);

    Task<bool> MarkReadAsync(Guid notificationId, Guid userId);
    Task MarkAllReadAsync(Guid userId);

    // Creation hooks — called by other services at the moment the underlying event happens
    Task NotifyAccountActivatedAsync(Guid studentUserId, decimal? remainingBalance = null, string? accountDescription = null);
    Task NotifyHomeworkPublishedAsync(Guid homeworkId, Guid gradeId, string title);
    Task NotifyHymnReviewedAsync(Guid studentUserId, Guid hymnLessonId, string hymnTitle, bool approved);
    Task NotifyAnnouncementPostedAsync(Guid announcementId, Guid? targetStageId, string title);
    Task NotifyCurriculumPublishedAsync(Guid curriculumId, Guid stageId, Guid? gradeId, string title);
    Task NotifyHymnLessonPublishedAsync(Guid hymnLessonId, Guid stageId, Guid? gradeId, string title);

    // Fires whenever a Payment or Discount transaction is recorded against a
    // student's account — the counterpart to NotifyAccountActivatedAsync's
    // "you owe X" message, telling them what just got settled instead.
    Task NotifyPaymentRecordedAsync(Guid studentUserId, decimal amount, PaymentTransactionKind kind, decimal remainingBalance, string? accountDescription);
}
