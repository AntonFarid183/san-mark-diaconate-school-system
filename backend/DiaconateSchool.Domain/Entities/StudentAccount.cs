using System;
using System.Collections.Generic;

namespace DiaconateSchool.Domain.Entities;

public class StudentAccount
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public decimal TotalRequired { get; set; }

    public ICollection<PaymentTransaction> Transactions { get; set; } = new List<PaymentTransaction>();
}
