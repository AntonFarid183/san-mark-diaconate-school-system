using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IContentItemRepository
{
    Task<ContentItem?> GetByIdAsync(Guid id);
    Task<List<ContentItem>> GetByLessonAsync(Guid lessonId);
    Task AddAsync(ContentItem item);
    void Update(ContentItem item);
    void Remove(ContentItem item);
}
