using System;

namespace DiaconateSchool.Domain.Entities;

public class HomeworkSubject
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public int DisplayOrder { get; set; }
}
