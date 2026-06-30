using System.ComponentModel.DataAnnotations;

namespace DiaconateSchool.Application.DTOs;

public class ChangePasswordDto
{
    public required string UserName { get; set; }
    public required string CurrentPassword { get; set; }

    [MinLength(8, ErrorMessage = "كلمة المرور يجب أن تكون 8 أحرف على الأقل.")]
    public required string NewPassword { get; set; }
}
