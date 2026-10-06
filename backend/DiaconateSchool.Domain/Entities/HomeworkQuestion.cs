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
    public string? OptionA { get; set; }
    public string? OptionB { get; set; }
    public string? OptionC { get; set; }
    public string? OptionD { get; set; }

    // 0=A, 1=B, 2=C, 3=D
    public int CorrectOption { get; set; }
}
