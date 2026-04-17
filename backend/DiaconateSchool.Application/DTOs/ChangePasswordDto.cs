namespace DiaconateSchool.Application.DTOs;

public class ChangePasswordDto
{
    public required string UserName { get; set; }
    public required string CurrentPassword { get; set; }
    public required string NewPassword { get; set; }
}
