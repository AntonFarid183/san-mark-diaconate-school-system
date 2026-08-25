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
    private readonly IUserRepository _userRepo;
    private readonly IHymnSubmissionRepository _hymnSubmissionRepo;
    private readonly IPaymentRepository _paymentRepo;
    private readonly IHomeworkRepository _homeworkRepo;
    private readonly IAttendanceRepository _attendanceRepo;
    private readonly IUnitOfWork _uow;

    public NotificationService(
        INotificationRepository repo,
        IStudentRepository studentRepo,
        IUserRepository userRepo,
        IHymnSubmissionRepository hymnSubmissionRepo,
        IPaymentRepository paymentRepo,
        IHomeworkRepository homeworkRepo,
        IAttendanceRepository attendanceRepo,
        IUnitOfWork uow)
    {
        _repo = repo;
        _studentRepo = studentRepo;
        _userRepo = userRepo;
        _hymnSubmissionRepo = hymnSubmissionRepo;
        _paymentRepo = paymentRepo;
        _homeworkRepo = homeworkRepo;
        _attendanceRepo = attendanceRepo;
        _uow = uow;
    }

    // ── Summaries ────────────────────────────────────────────────────────

    public async Task<NotificationSummaryDto> GetAdminSummaryAsync(Guid adminUserId)
    {
        var dynamicItems = new List<DynamicNotificationDto>();

        var pendingApprovals = (await _studentRepo.GetPendingAsync()).Count;
        if (pendingApprovals > 0)
            dynamicItems.Add(new DynamicNotificationDto { Key = "pending-approvals", Title = "طلبات تسجيل بانتظار الموافقة", Count = pendingApprovals });

        var pendingHymnReviews = await _hymnSubmissionRepo.GetPendingCountAsync();
        if (pendingHymnReviews > 0)
        {
            var filters = new Dictionary<string, string>();
            var firstPending = await _hymnSubmissionRepo.GetFirstPendingAsync();
            if (firstPending != null)
            {
                filters["stageId"] = firstPending.HymnLesson.StageId.ToString();
                if (firstPending.HymnLesson.GradeId.HasValue)
                    filters["gradeId"] = firstPending.HymnLesson.GradeId.Value.ToString();
                filters["hymnLessonId"] = firstPending.HymnLessonId.ToString();
            }
            dynamicItems.Add(new DynamicNotificationDto { Key = "pending-hymn-reviews", Title = "تسجيلات ألحان بانتظار المراجعة", Count = pendingHymnReviews, Filters = filters });
        }

        var outstandingAccounts = await _paymentRepo.GetOutstandingAccountsAsync();
        if (outstandingAccounts.Count > 0)
        {
            // One line per student with the exact amount they still owe — not just an
            // aggregate count — so the admin knows precisely who owes how much.
            const int MaxOutstandingItems = 10;
            var byRemaining = outstandingAccounts
                .Select(a => new
                {
                    Account = a,
                    Paid = a.Transactions.Where(t => !t.IsVoided).Sum(t => t.Amount),
                })
                .Select(x => new { x.Account, Remaining = x.Account.TotalRequired - x.Paid })
                .OrderByDescending(x => x.Remaining)
                .ToList();

            foreach (var x in byRemaining.Take(MaxOutstandingItems))
            {
                var student = x.Account.Student;
                var fullName = $"{student.User.FirstName} {student.User.MiddleName} {student.User.ThirdName} {student.User.LastName}".Trim();
                dynamicItems.Add(new DynamicNotificationDto
                {
                    Key = $"outstanding-balance-{student.Id}",
                    Title = $"{fullName} — متبقي {x.Remaining:N0} ج.م",
                    Message = x.Account.Description,
                    Count = 1,
                    // School-wide, not narrowed to this one student — clicking any of these
                    // items should land on the full list of every unpaid student.
                    Filters = new Dictionary<string, string> { ["paymentStatus"] = "not_paid" }
                });
            }

            if (byRemaining.Count > MaxOutstandingItems)
            {
                dynamicItems.Add(new DynamicNotificationDto
                {
                    Key = "outstanding-balances-more",
                    Title = $"و {byRemaining.Count - MaxOutstandingItems} طالب آخر لديهم مبالغ مستحقة",
                    Count = byRemaining.Count - MaxOutstandingItems,
                    Filters = new Dictionary<string, string> { ["paymentStatus"] = "not_paid" }
                });
            }
        }

        var draftHomework = await _homeworkRepo.GetDraftCountAsync();
        if (draftHomework > 0)
        {
            var filters = new Dictionary<string, string>();
            var firstDraft = await _homeworkRepo.GetFirstDraftAsync();
            if (firstDraft != null)
                filters["stageId"] = firstDraft.StageId.ToString();
            dynamicItems.Add(new DynamicNotificationDto { Key = "draft-homework", Title = "واجبات لم تُنشر بعد", Count = draftHomework, Filters = filters });
        }

        var openSessions = await _attendanceRepo.GetOpenSessionsCountAsync();
        if (openSessions > 0)
        {
            var filters = new Dictionary<string, string>();
            var firstSession = await _attendanceRepo.GetFirstOpenSessionAsync();
            if (firstSession != null)
            {
                filters["academicYearId"] = firstSession.Class.AcademicYearId.ToString();
                filters["stageId"] = firstSession.Grade.StageId.ToString();
                filters["gradeId"] = firstSession.GradeId.ToString();
                filters["classId"] = firstSession.ClassId.ToString();
            }
            dynamicItems.Add(new DynamicNotificationDto { Key = "open-attendance-sessions", Title = "جلسات حضور مفتوحة لم تُغلق", Count = openSessions, Filters = filters });
        }

        // Persistent, per-event admin notifications (new self-registration, new hymn
        // submission, new homework submission, new feedback) — same bell/history
        // surface a student gets, so the dynamic action counts aren't the only view.
        var recent = await _repo.GetForUserAsync(adminUserId, null, 1, PreviewCount);
        var unreadCount = await _repo.GetCountForUserAsync(adminUserId, false);

        return new NotificationSummaryDto
        {
            DynamicItems = dynamicItems,
            RecentPersistent = recent.Select(Map).ToList(),
            UnreadPersistentCount = unreadCount
        };
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
            {
                dynamicItems.Add(new DynamicNotificationDto
                {
                    Key = "outstanding-balance",
                    Title = $"لديك مبلغ مستحق للسداد: {remaining:N0} ج.م",
                    Message = account.Description,
                    Count = 1
                });
            }
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

    // remainingBalance/accountDescription are only passed for a "سداد لاحقاً" (pay
    // later) activation — the student is billed but nothing has been collected
    // yet, so they need to be told plainly, respectfully, and up front what's owed.
    public async Task NotifyAccountActivatedAsync(Guid studentUserId, decimal? remainingBalance = null, string? accountDescription = null)
    {
        var message = "يمكنك الآن الدخول واستخدام جميع خدمات المنصة.";
        if (remainingBalance.HasValue && remainingBalance.Value > 0)
        {
            var desc = string.IsNullOrWhiteSpace(accountDescription) ? "" : $" ({accountDescription})";
            message += $" يوجد مبلغ مستحق عليك قدره {remainingBalance.Value:N0} ج.م{desc} — برجاء سداده في أقرب وقت ممكن.";
        }

        await _repo.AddAsync(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = studentUserId,
            Type = NotificationType.AccountActivated,
            Title = "تم تفعيل حسابك",
            Message = message,
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

    public async Task NotifyPaymentRecordedAsync(Guid studentUserId, decimal amount, PaymentTransactionKind kind, decimal remainingBalance, string? accountDescription)
    {
        var desc = string.IsNullOrWhiteSpace(accountDescription) ? "" : $" ({accountDescription})";
        var action = kind == PaymentTransactionKind.Discount ? "تسجيل خصم" : "تسجيل دفعة";
        var message = $"تم {action} بقيمة {amount:N0} ج.م{desc}.";
        message += remainingBalance > 0
            ? $" المتبقي عليك: {remainingBalance:N0} ج.م."
            : " تم سداد المبلغ بالكامل.";

        await _repo.AddAsync(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = studentUserId,
            Type = NotificationType.PaymentRecorded,
            Title = kind == PaymentTransactionKind.Discount ? "تم تسجيل خصم على حسابك" : "تم تسجيل دفعة على حسابك",
            Message = message,
            ReferenceId = null,
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

    public Task NotifyAdminsNewSelfRegistrationAsync(Guid studentId, string studentName) =>
        BroadcastToAdminsAsync(NotificationType.NewSelfRegistration, "طلب تسجيل جديد", $"{studentName} سجّل نفسه وبانتظار موافقتك على قبوله.", studentId);

    public Task NotifyAdminsNewHymnSubmissionAsync(Guid submissionId, string studentName, string hymnTitle) =>
        BroadcastToAdminsAsync(NotificationType.NewHymnSubmission, "تسجيل لحن جديد بانتظار المراجعة", $"{studentName} — {hymnTitle}", submissionId);

    public Task NotifyAdminsNewFeedbackAsync(Guid feedbackId, string senderName) =>
        BroadcastToAdminsAsync(NotificationType.NewFeedback, "اقتراح أو تعليق جديد", $"وصل اقتراح جديد من {senderName}.", feedbackId);

    private async Task BroadcastToAdminsAsync(NotificationType type, string title, string message, Guid? referenceId)
    {
        var adminIds = await _userRepo.GetAdminUserIdsAsync();
        if (adminIds.Count == 0) return;

        var notifications = adminIds.Select(id => new Notification
        {
            Id = Guid.NewGuid(),
            UserId = id,
            Type = type,
            Title = title,
            Message = message,
            ReferenceId = referenceId,
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
