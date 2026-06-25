using DiaconateSchool.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _basePath;

    public LocalFileStorageService(IConfiguration configuration)
    {
        var contentRoot = configuration["ContentRoot"]
            ?? AppContext.BaseDirectory;
        _basePath = Path.Combine(contentRoot, "uploads");
        Directory.CreateDirectory(_basePath);
    }

    public async Task<string> SaveAsync(Stream fileStream, string fileName, string category)
    {
        var categoryPath = Path.Combine(_basePath, category);
        Directory.CreateDirectory(categoryPath);

        var ext = Path.GetExtension(fileName);
        var uniqueName = $"{Guid.NewGuid()}{ext}";
        var fullPath = Path.Combine(categoryPath, uniqueName);

        await using var output = new FileStream(fullPath, FileMode.Create);
        await fileStream.CopyToAsync(output);

        return $"/uploads/{category}/{uniqueName}";
    }

    public void Delete(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return;
        var relative = relativePath.TrimStart('/').Replace("uploads/", "");
        var full = Path.Combine(_basePath, relative);
        if (File.Exists(full)) File.Delete(full);
    }
}
