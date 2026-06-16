using System.Collections.Generic;

namespace DiaconateSchool.Domain.Entities;

public class Stage
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public int DisplayOrder { get; set; }

    public ICollection<Grade> Grades { get; set; } = new List<Grade>();
}
