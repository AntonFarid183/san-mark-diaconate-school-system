using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Application.Interfaces.Services;
using DiaconateSchool.Application.Services;
using DiaconateSchool.Domain.Enums;
using DiaconateSchool.Infrastructure.Data;
using DiaconateSchool.Infrastructure.Repositories;
using DiaconateSchool.Infrastructure.Security;
using DiaconateSchool.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Uploaded files must NOT live inside the deployable folder. On App Service a
// deploy replaces /home/site/wwwroot wholesale, so an uploads/ directory
// underneath it is one deploy away from being erased. /home itself is a
// persistent share, so production sets UploadsPath=/home/data/uploads, which
// survives both deploys and restarts.
//
// Resolved once, here, and written back into configuration so the storage
// service (which writes files) and the /uploads static-file route (which serves
// them) read the same value and cannot drift apart. Left unset -- local dev --
// it falls back to the original {ContentRoot}/uploads, so nothing changes there.
var legacyUploadsPath = Path.Combine(builder.Environment.ContentRootPath, "uploads");
var configuredUploadsPath = builder.Configuration["UploadsPath"];
var uploadsPath = Path.GetFullPath(
    string.IsNullOrWhiteSpace(configuredUploadsPath) ? legacyUploadsPath : configuredUploadsPath);
builder.Configuration["UploadsPath"] = uploadsPath;

// Marker recording which schema was last applied (see DbInitializer). It must
// survive restarts, so it sits on the same persistent storage as the uploads --
// but one level up, since everything under uploadsPath is served publicly at
// /uploads. Derived rather than configured so production needs no extra setting.
var migrationStatePath = builder.Configuration["MigrationStatePath"];
if (string.IsNullOrWhiteSpace(migrationStatePath))
{
    var persistentRoot = Directory.GetParent(uploadsPath)?.FullName ?? uploadsPath;
    migrationStatePath = Path.Combine(persistentRoot, ".migrations-applied");
}

// 1. Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

// EnableRetryOnFailure: Azure SQL serverless auto-pauses when idle and takes
// a few seconds to resume on the next connection -- that resume routinely
// surfaces as SQL error 40613 ("Database ... is not currently available")
// on the very first request after a pause. Without retry, EF Core treats
// that as fatal and the app crashes on startup instead of just waiting out
// a normal, expected cold-start.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure(
        maxRetryCount: 5,
        maxRetryDelay: TimeSpan.FromSeconds(10),
        errorNumbersToAdd: null)));

// 2. JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JwtSettings:SecretKey not configured.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secretKey)),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

// 3. Authorization policies (Admin and Student only — no Servant role)
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole(nameof(Role.Admin)));
    options.AddPolicy("AllAuthenticated", policy => policy.RequireAuthenticatedUser());
});

// 4. Dependency Injection — repositories
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IStudentRepository, StudentRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ILessonRepository, LessonRepository>();
builder.Services.AddScoped<IContentItemRepository, ContentItemRepository>();
builder.Services.AddScoped<IContentAccessRepository, ContentAccessRepository>();
builder.Services.AddScoped<ICurriculumRepository, CurriculumRepository>();
builder.Services.AddScoped<IHymnLessonRepository, HymnLessonRepository>();
builder.Services.AddScoped<IHymnLessonProgressRepository, HymnLessonProgressRepository>();
builder.Services.AddScoped<IExamRepository, ExamRepository>();
builder.Services.AddScoped<IExamResultRepository, ExamResultRepository>();
builder.Services.AddScoped<ICertificateRepository, CertificateRepository>();
builder.Services.AddScoped<IAnnouncementRepository, AnnouncementRepository>();
builder.Services.AddScoped<IGradeHistoryRepository, GradeHistoryRepository>();
builder.Services.AddScoped<IAttendanceRepository, AttendanceRepository>();
builder.Services.AddScoped<IAcademicYearRepository, AcademicYearRepository>();
builder.Services.AddScoped<ISchoolClassRepository, SchoolClassRepository>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IHymnSubmissionRepository, HymnSubmissionRepository>();
builder.Services.AddScoped<IHomeworkRepository, HomeworkRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IPublicFeedbackRepository, PublicFeedbackRepository>();

// 5. Dependency Injection — services
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IStudentCodeGenerator, StudentCodeGenerator>();
builder.Services.AddScoped<IStudentFeeService, StudentFeeService>();
builder.Services.AddScoped<IStudentRegistrationService, StudentRegistrationService>();
builder.Services.AddScoped<IStudentQueryService, StudentQueryService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IContentService, ContentService>();
builder.Services.AddScoped<IProgressService, ProgressService>();
builder.Services.AddScoped<ICurriculumService, CurriculumService>();
builder.Services.AddScoped<IHymnLessonService, HymnLessonService>();
builder.Services.AddScoped<IHymnLessonProgressService, HymnLessonProgressService>();
builder.Services.AddScoped<IExamService, ExamService>();
builder.Services.AddScoped<ICertificateService, CertificateService>();
builder.Services.AddScoped<IAnnouncementService, AnnouncementService>();
builder.Services.AddScoped<IPromotionService, PromotionService>();
builder.Services.AddScoped<IAttendanceService, AttendanceService>();
builder.Services.AddScoped<IAcademicYearService, AcademicYearService>();
builder.Services.AddScoped<ISchoolClassService, SchoolClassService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IHymnSubmissionService, HymnSubmissionService>();
builder.Services.AddScoped<IHomeworkService, HomeworkService>();
builder.Services.AddScoped<IPublicFeedbackService, PublicFeedbackService>();
builder.Services.AddScoped<IStudentPerformanceService, StudentPerformanceService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
builder.Services.AddScoped<ISynaxariumService, SynaxariumService>();
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();

// 6. CORS for React
// Localhost stays allowed unconditionally (dev). Production origins come
// from the AllowedOrigins app setting (comma-separated) — App Service env
// vars use __ for nesting, but this one's a flat CSV string, not a section.
var configuredOrigins = (builder.Configuration["AllowedOrigins"] ?? string.Empty)
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
                  origin.StartsWith("http://localhost:") ||
                  configuredOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Allow large video uploads (200 MB)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 200_000_000;
});
builder.WebHost.ConfigureKestrel(k =>
{
    k.Limits.MaxRequestBodySize = 200_000_000;
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseStaticFiles();

// Serve uploaded files from the resolved uploads root (see the top of this file)
// at /uploads/. Stored URLs stay "/uploads/{category}/{name}", so moving the
// physical directory does not invalidate anything already in the database.
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

// Rescues files still sitting in the pre-fix location inside the deployable
// folder. No-op once they have been copied, and a no-op locally where both
// paths are the same.
UploadsLocationMigrator.MigrateLegacyUploads(legacyUploadsPath, uploadsPath, app.Logger);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Warm-up probe. Deliberately touches NOTHING -- no database, no auth, no
// external call -- so an external pinger can keep the App Service process
// loaded without waking the serverless SQL database. Keeping the app warm
// is free; keeping the database warm is not (the free SQL offer is
// 100,000 vCore-seconds/month, and holding it awake around the clock would
// need well over ten times that).
app.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();

// Migrations and seeding run only when the compiled schema differs from what was
// last applied, so an ordinary restart does not wake the serverless database.
// Set ForceMigrationsOnStartup=true for one boot to override the marker.
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<ApplicationDbContext>();
    var hasher = services.GetRequiredService<IPasswordHasher>();
    var forceMigrations = string.Equals(
        builder.Configuration["ForceMigrationsOnStartup"], "true", StringComparison.OrdinalIgnoreCase);

    await DbInitializer.SeedIfSchemaChangedAsync(
        context, hasher, migrationStatePath, forceMigrations, app.Logger);
}

app.Run();
