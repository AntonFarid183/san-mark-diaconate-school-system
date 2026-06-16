namespace DiaconateSchool.Application.DTOs;

public class RegistrationResultDto
{
    public required string UserName { get; set; }
    public required string StudentCode { get; set; }
    public required string TemporaryPassword { get; set; }
}
