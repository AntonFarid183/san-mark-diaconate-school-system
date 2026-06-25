using DiaconateSchool.Application.Services;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace DiaconateSchool.Infrastructure.Security;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly string _secretKey;
    private readonly int _expiryHours;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        _secretKey = jwtSettings["SecretKey"] ?? "SuperSecretKeyThatMustBeAtLeast32BytesLongForSHA256";
        _expiryHours = int.TryParse(jwtSettings["ExpiryHours"], out var hours) ? hours : 8;
    }

    public string GenerateToken(ApplicationUser user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_secretKey);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.UserName),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("fullName", $"{user.FirstName} {user.MiddleName} {user.ThirdName} {user.LastName}"),
            new("firstName", user.FirstName)
        };

        if (user.Role == Role.Student && user.Student != null)
        {
            claims.Add(new Claim("StudentId", user.Student.Id.ToString()));
            claims.Add(new Claim("GradeId", user.Student.GradeId.ToString()));
            claims.Add(new Claim("StudentCode", user.Student.StudentCode));
            if (user.Student.Grade != null)
                claims.Add(new Claim("StageId", user.Student.Grade.StageId.ToString()));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(_expiryHours),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
