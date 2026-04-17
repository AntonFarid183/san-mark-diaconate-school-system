namespace DiaconateSchool.Application.DTOs;

public class LoginDto
{
    public required string UserName { get; set; }
    public required string Password { get; set; }
}

public class AuthResultDto
{
    public string? Token { get; set; }
    public bool RequiresPasswordChange { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
}
