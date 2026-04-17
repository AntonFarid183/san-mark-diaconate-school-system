using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class StudentRepository : IStudentRepository
{
    private readonly ApplicationDbContext _context;

    public StudentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Student student)
    {
        await _context.Students.AddAsync(student);
        // Note: SaveChangesAsync will be called by our Service layer, not the repository.
    }

    public async Task<bool> ExistsAsync(string firstName, string secondName, string thirdName, string lastName, DateOnly dateOfBirth)
    {
        return await _context.Students.AnyAsync(s => 
            s.FirstName == firstName && 
            s.SecondName == secondName && 
            s.ThirdName == thirdName && 
            s.LastName == lastName && 
            s.DateOfBirth == dateOfBirth);
    }

    public async Task<int> GetTotalCountAsync()
    {
        return await _context.Students.CountAsync();
    }

    public async Task<IEnumerable<Grade>> GetGradesByStageAsync(DiaconateSchool.Domain.Enums.Stage stage)
    {
        return await _context.Grades
            .Where(g => g.Stage == stage)
            .OrderBy(g => g.Level)
            .ToListAsync();
    }
}
