namespace DiaconateSchool.Application.DTOs;

public class LoginDto
{
    public required string UserName { get; set; }
    public required string Password { get; set; }
}

public class AuthResultDto
{
    public string? Token { get; set; }
    public bool MustChangePassword { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
}

public class CurrentUserDto
{
    public required string Id { get; set; }
    public required string UserName { get; set; }
    public required string Role { get; set; }
    public required string FullName { get; set; }
    public bool MustChangePassword { get; set; }
    public string? StudentId { get; set; }
}
