using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface IUnitOfWork
{
    // Saves all changes made in the repositories in a single database transaction.
    Task<int> SaveChangesAsync();
}
