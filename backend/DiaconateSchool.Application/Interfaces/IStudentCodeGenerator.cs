using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface IStudentCodeGenerator
{
    Task<string> GenerateNextAsync(int year);
}
