using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using TuristGo.API.Mappings;
using TuristGo.API.Middlewares;
using TuristGo.DataAccess.Context;
using TuristGo.DataAccess.Repositories;
using TuristGo.DataAccess.Seeders;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;
using TuristGo.Domain.Interfaces.Repositories;
using TuristGo.Domain.Interfaces.Services;
using TuristGo.Domain.Services;
using TuristGo.Domain.Services.Builders;
using TuristGo.Domain.Services.Facades;
using TuristGo.Domain.Services.Factories;
using TuristGo.Domain.Services.Observers;
using TuristGo.Domain.Services.Strategies;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<TuristGoDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ITourRepository, TourRepository>();
builder.Services.AddScoped<IReservationRepository, ReservationRepository>();
builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();

builder.Services.AddScoped<TouristFactory>();
builder.Services.AddScoped<AgencyFactory>();
builder.Services.AddScoped<GuideFactory>();
builder.Services.AddScoped<Dictionary<UserRole, IUsuarioFactory>>(sp => new()
{
    [UserRole.Tourist] = sp.GetRequiredService<TouristFactory>(),
    [UserRole.Agency] = sp.GetRequiredService<AgencyFactory>(),
    [UserRole.Guide] = sp.GetRequiredService<GuideFactory>(),
});

builder.Services.AddScoped<TouristAuthStrategy>();
builder.Services.AddScoped<AgencyAuthStrategy>();
builder.Services.AddScoped<GuideAuthStrategy>();
builder.Services.AddScoped<AdminAuthStrategy>();
builder.Services.AddScoped<Dictionary<UserRole, IAuthStrategy>>(sp => new()
{
    [UserRole.Tourist] = sp.GetRequiredService<TouristAuthStrategy>(),
    [UserRole.Agency] = sp.GetRequiredService<AgencyAuthStrategy>(),
    [UserRole.Guide] = sp.GetRequiredService<GuideAuthStrategy>(),
    [UserRole.Admin] = sp.GetRequiredService<AdminAuthStrategy>(),
});

builder.Services.AddScoped<IReservationObserver, InvoiceObserver>();
builder.Services.AddScoped<IReservationObserver, NotificationObserver>();
builder.Services.AddScoped<IReservationObserver, CapacityObserver>();
builder.Services.AddScoped<IAgencyObserver, TourStatusObserver>();

builder.Services.AddScoped<IReservationFacade, ReservationFacade>();
builder.Services.AddScoped<BillingReportDirector>();
builder.Services.AddScoped<IBillingReportBuilder, BillingReportBuilder>();

builder.Services.AddScoped<Func<User, string>>(sp => user =>
{
    var cfg = builder.Configuration;
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:SecretKey"]!));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var claims = new[]
    {
        new System.Security.Claims.Claim("UserId", user.Id.ToString()),
        new System.Security.Claims.Claim("Email", user.Email),
        new System.Security.Claims.Claim("Role", user.Role.ToString()),
        new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, user.Role.ToString()),
    };
    var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
        cfg["Jwt:Issuer"],
        cfg["Jwt:Audience"],
        claims,
        expires: DateTime.UtcNow.AddHours(int.Parse(cfg["Jwt:ExpirationHours"]!)),
        signingCredentials: creds);
    return new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token);
});

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AdminService>();
// B.3: ReservationFacade ahora requiere IGenericRepository<Invoice> — ya registrado via AddScoped<IGenericRepository<>>

builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);
builder.Services.AddControllers();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"]!)),
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy("TuristGoCors", policy =>
        policy.WithOrigins("http://localhost:3000", "http://localhost:4200", "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "TuristGo API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT Authorization header using the Bearer scheme.",
    });
    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = [],
    });
});

var app = builder.Build();
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<TuristGoDbContext>();
    await context.Database.MigrateAsync();
    await DataSeeder.SeedAsync(context);
}

app.UseHttpsRedirection();
app.UseCors("TuristGoCors");
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapControllers();
app.Run();
