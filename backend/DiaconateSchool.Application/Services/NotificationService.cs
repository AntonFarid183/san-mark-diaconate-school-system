using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

public class NotificationService : INotificationService
{
    private const int PreviewCount = 5;

    private readonly INotificationRepository _repo;
    private readonly IStudentRepository _studentRepo;
    private readonly IHymnSubmissionRepository _hymnSubmissionRepo;
    private readonly IPaymentRepository _paymentRepo;
    private readonly IHomeworkRepository _homeworkRepo;
    private readonly IAttendanceRepository _attendanceRepo;
    private readonly IUnitOfWork _uow;

    public NotificationService(
        INotificationRepository repo,
        IStudentRepository studentRepo,
        IHymnSubmissionRepository hymnSubmissionRepo,
        IPaymentRepository paymentRepo,
        IHomeworkRepository homeworkRepo,
        IAttendanceRepository attendanceRepo,
        IUnitOfWork uow)
    {
        _repo = repo;
        _studentRepo = studentRepo;
        _hymnSubmissionRepo = hymnSubmissionRepo;
        _paymentRepo = paymentRepo;
        _homeworkRepo = homeworkRepo;
        _attendanceRepo = attendanceRepo;
        _uow = uow;
    }

    // ── Summaries ────────────────────────────────────────────────────────

    public async Task<NotificationSummaryDto> GetAdminSummaryAsync()
    {
        var dynamicItems = new List<DynamicNotificationDto>();

        var pendingApprovals = (await _studentRepo.GetPendingAsync()).Count;
        if (pendingApprovals > 0)
            dynamicItems.Add(new DynamicNotificationDto { Key = "pending-approvals", Title = "طلبات تسجيل بانتظار الموافقة", Count = pendingApprovals });

        var pendingHymnReviews = await _hymnSubmissionRepo.GetPendingCountAsync();
        if (pendingHymnReviews > 0)
            dynamicItems.Add(new DynamicNotificationDto { Key = "pending-hymn-reviews", Title = "تسجيلات ألحان بانتظار المراجعة", Count = pendingHymnReviews });

        var outstandingBalances = await _paymentRepo.GetOutstandingBalanceCountAsync();
        if (outstandingBalances > 0)
            dynamicItems.Add(new DynamicNotificationDto { Key = "outstanding-balances", Title = "طلاب لديهم مبالغ مستحقة", Count = outstandingBalances });

        var draftHomework = await _homeworkRepo.GetDraftCountAsync();
        if (draftHomework > 0)
            dynamicItems.Add(new DynamicNotificationDto { Key = "draft-homework", Title = "واجبات لم تُنشر بعد", Count = draftHomework });

        var openSessions = await _attendanceRepo.GetOpenSessionsCountAsync();
        if (openSessions > 0)
            dynamicItems.Add(new DynamicNotificationDto { Key = "open-attendance-sessions", Title = "جلسات حضور مفتوحة لم تُغلق", Count = openSessions });

        return new NotificationSummaryDto { DynamicItems = dynamicItems };
    }

    public async Task<NotificationSummaryDto> GetStudentSummaryAsync(Guid studentId, Guid userId)
    {
        var dynamicItems = new List<DynamicNotificationDto>();

        var account = await _paymentRepo.GetAccountByStudentIdAsync(studentId);
        if (account != null)
        {
            var paid = account.Transactions.Where(t => !t.IsVoided).Sum(t => t.Amount);
            var remaining = account.TotalRequired - paid;
            if (remaining > 0)
                dynamicItems.Add(new DynamicNotificationDto { Key = "outstanding-balance", Title = "لديك مبلغ مستحق للسداد", Count = 1 });
        }

        var recent = await _repo.GetForUserAsync(userId, null, 1, PreviewCount);
        var unreadCount = await _repo.GetCountForUserAsync(userId, false);

        return new NotificationSummaryDto
        {
            DynamicItems = dynamicItems,
            RecentPersistent = recent.Select(Map).ToList(),
            UnreadPersistentCount = unreadCount
        };
    }

    // ── History page ─────────────────────────────────────────────────────

    public async Task<NotificationListDto> GetPersistentAsync(Guid userId, bool? isRead, int page, int pageSize)
    {
        var items = await _repo.GetForUserAsync(userId, isRead, page, pageSize);
        var totalCount = await _repo.GetCountForUserAsync(userId, isRead);

        return new NotificationListDto
        {
            Items = items.Select(Map).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<bool> MarkReadAsync(Guid notificationId, Guid userId)
    {
        var notification = await _repo.GetByIdAsync(notificationId);
        if (notification == null || notification.UserId != userId) return false;

        notification.IsRead = true;
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task MarkAllReadAsync(Guid userId)
    {
        var unread = await _repo.GetUnreadForUserAsync(userId);
        foreach (var n in unread) n.IsRead = true;
        await _uow.SaveChangesAsync();
    }

    // ── Creation hooks ───────────────────────────────────────────────────

    public async Task NotifyAccountActivatedAsync(Guid studentUserId)
    {
        await _repo.AddAsync(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = studentUserId,
            Type = NotificationType.AccountActivated,
            Title = "تم تفعيل حسابك",
            Message = "يمكنك الآن الدخول واستخدام جميع خدمات المنصة.",
            ReferenceId = null,
            CreatedAt = DateTime.UtcNow
        });
        await _uow.SaveChangesAsync();
    }

    public async Task NotifyHomeworkPublishedAsync(Guid homeworkId, Guid gradeId, string title)
    {
        var students = await _studentRepo.GetActiveStudentsForNotificationAsync(null, gradeId);
        var notifications = students.Select(s => new Notification
        {
            Id = Guid.NewGuid(),
            UserId = s.UserId,
            Type = NotificationType.HomeworkPublished,
            Title = "واجب جديد",
            Message = title,
            ReferenceId = homeworkId,
            CreatedAt = DateTime.UtcNow
        });

        await _repo.AddRangeAsync(notifications);
        await _uow.SaveChangesAsync();
    }

    public async Task NotifyHymnReviewedAsync(Guid studentUserId, Guid hymnLessonId, string hymnTitle, bool approved)
    {
        await _repo.AddAsync(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = studentUserId,
            Type = NotificationType.HymnReviewed,
            Title = approved ? "تمت مراجعة تسجيلك" : "مطلوب إعادة تسجيل اللحن",
            Message = hymnTitle,
            ReferenceId = hymnLessonId,
            CreatedAt = DateTime.UtcNow
        });
        await _uow.SaveChangesAsync();
    }

    public async Task NotifyAnnouncementPostedAsync(Guid announcementId, Guid? targetStageId, string title)
    {
        var students = await _studentRepo.GetActiveStudentsForNotificationAsync(targetStageId, null);
        var notifications = students.Select(s => new Notification
        {
            Id = Guid.NewGuid(),
            UserId = s.UserId,
            Type = NotificationType.AnnouncementPosted,
            Title = "إعلان جديد",
            Message = title,
            ReferenceId = announcementId,
            CreatedAt = DateTime.UtcNow
        });

        await _repo.AddRangeAsync(notifications);
        await _uow.SaveChangesAsync();
    }

    public async Task NotifyCurriculumPublishedAsync(Guid curriculumId, Guid stageId, Guid? gradeId, string title)
    {
        var students = await _studentRepo.GetActiveStudentsForNotificationAsync(stageId, gradeId);
        var notifications = students.Select(s => new Notification
        {
            Id = Guid.NewGuid(),
            UserId = s.UserId,
            Type = NotificationType.CurriculumPublished,
            Title = "منهج جديد متاح",
            Message = title,
            ReferenceId = curriculumId,
            CreatedAt = DateTime.UtcNow
        });

        await _repo.AddRangeAsync(notifications);
        await _uow.SaveChangesAsync();
    }

    public async Task NotifyHymnLessonPublishedAsync(Guid hymnLessonId, Guid stageId, Guid? gradeId, string title)
    {
        var students = await _studentRepo.GetActiveStudentsForNotificationAsync(stageId, gradeId);
        var notifications = students.Select(s => new Notification
        {
            Id = Guid.NewGuid(),
            UserId = s.UserId,
            Type = NotificationType.HymnLessonPublished,
            Title = "درس لحن جديد",
            Message = title,
            ReferenceId = hymnLessonId,
            CreatedAt = DateTime.UtcNow
        });

        await _repo.AddRangeAsync(notifications);
        await _uow.SaveChangesAsync();
    }

    private static NotificationDto Map(Notification n) => new()
    {
        Id = n.Id,
        Type = n.Type,
        Title = n.Title,
        Message = n.Message,
        ReferenceId = n.ReferenceId,
        IsRead = n.IsRead,
        CreatedAt = n.CreatedAt
    };
}
