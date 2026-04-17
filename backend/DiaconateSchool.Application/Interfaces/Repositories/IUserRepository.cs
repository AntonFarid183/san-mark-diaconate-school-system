using DiaconateSchool.Domain.Entities;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task AddAsync(ApplicationUser user);
    Task<ApplicationUser?> GetByUserNameAsync(string userName);
}
