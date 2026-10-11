namespace DiaconateSchool.Application.DTOs;

public class PublicStatsDto
{
    public int ActiveStudents { get; set; }
    public int Classes { get; set; }          // classes of the current academic year
    public int PublishedCurricula { get; set; }
    public int PublishedHymnLessons { get; set; }
}
