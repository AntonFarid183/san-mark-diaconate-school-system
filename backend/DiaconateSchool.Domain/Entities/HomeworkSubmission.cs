using System;
using System.Collections.Generic;

namespace DiaconateSchool.Domain.Entities;

public class HomeworkSubmission
{
    public Guid Id { get; set; }

    public Guid HomeworkId { get; set; }
    public Homework Homework { get; set; } = null!;

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public decimal Score { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public ICollection<HomeworkAnswer> Answers { get; set; } = new List<HomeworkAnswer>();
}
