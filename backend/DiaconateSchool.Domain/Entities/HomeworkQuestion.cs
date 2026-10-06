using System;

namespace DiaconateSchool.Domain.Entities;

public class HomeworkQuestion
{
    public Guid Id { get; set; }

    public Guid HomeworkId { get; set; }
    public Homework Homework { get; set; } = null!;

    // 1-based question number as it appears on the PDF/image
    public int QuestionNumber { get; set; }

    // Only set for Typed homeworks; PDF/image ones read the question off the file.
    public string? Text { get; set; }
    // JSON array of option strings (2..10, in display order).
    public string? OptionsJson { get; set; }

    // Zero-based index into the options (for PDF/image homeworks: 0=A .. 3=D)
    public int CorrectOption { get; set; }
}
