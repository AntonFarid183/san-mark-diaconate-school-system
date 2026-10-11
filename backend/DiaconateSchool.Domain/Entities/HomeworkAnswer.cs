using System;

namespace DiaconateSchool.Domain.Entities;

public class HomeworkAnswer
{
    public Guid Id { get; set; }

    public Guid HomeworkSubmissionId { get; set; }
    public HomeworkSubmission HomeworkSubmission { get; set; } = null!;

    public Guid HomeworkQuestionId { get; set; }
    public HomeworkQuestion HomeworkQuestion { get; set; } = null!;

    // 0=A, 1=B, 2=C, 3=D
    public int SelectedOption { get; set; }
    public bool IsCorrect { get; set; }

    // Essay questions: what the student typed and/or the image/PDF they uploaded, and the
    // mark the admin gave (null until reviewed).
    public string? AnswerText { get; set; }
    public string? AnswerFileUrl { get; set; }
    public string? AnswerFileName { get; set; }
    public decimal? EssayScore { get; set; }
}
