using System;
using System.Collections.Generic;

namespace DiaconateSchool.Domain.Entities;

public class StudentAccount
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public decimal TotalRequired { get; set; }

    // What the required amount is for (e.g. "رسوم الفصل الدراسي الثاني") — shown to the
    // student alongside the amount so they know what they're being asked to pay for.
    public string? Description { get; set; }

    public ICollection<PaymentTransaction> Transactions { get; set; } = new List<PaymentTransaction>();
}
