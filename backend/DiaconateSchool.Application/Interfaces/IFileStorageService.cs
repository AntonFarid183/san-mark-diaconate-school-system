using System.IO;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveAsync(Stream fileStream, string fileName, string category);
    void Delete(string relativePath);
}
