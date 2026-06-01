using Microsoft.EntityFrameworkCore;
using TuristGo.DataAccess.Context;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;

namespace TuristGo.DataAccess.Seeders;

public static class DataSeeder
{
    public static async Task SeedAsync(TuristGoDbContext context)
    {
        if (await context.Users.AnyAsync()) return;

        var admin = new Admin
        {
            Email = "admin@turistgo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            Role = UserRole.Admin,
            Status = UserStatus.Active,
        };

        var agency1 = new Agency
        {
            Email = "andes@turistgo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Agency123!"),
            Role = UserRole.Agency,
            Status = UserStatus.Active,
            CommercialName = "Andes Tours Medellin",
            NIT = "900123456-7",
            CorporatePhone = "3001234567",
            CommissionPercentage = 10m,
        };

        var agency2 = new Agency
        {
            Email = "paisa@turistgo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Agency123!"),
            Role = UserRole.Agency,
            Status = UserStatus.Active,
            CommercialName = "Paisa Experience",
            NIT = "900987654-3",
            CorporatePhone = "3009876543",
            CommissionPercentage = 12m,
        };

        context.Users.AddRange(admin, agency1, agency2);
        await context.SaveChangesAsync();

        var guides = new List<Guide>();
        foreach (var agency in new[] { agency1, agency2 })
        {
            for (var i = 1; i <= 3; i++)
            {
                guides.Add(new Guide
                {
                    Email = $"guide{i}.{agency.Id}@turistgo.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guide123!"),
                    Role = UserRole.Guide,
                    Status = UserStatus.Active,
                    FullName = $"Guia {i} - {agency.CommercialName}",
                    DocumentNumber = $"DOC{agency.Id}{i:000}",
                    CertificateNumber = $"CERT-{agency.Id}-{i:000}",
                    CertificateExpiryDate = new DateTime(2028, 6, 1, 0, 0, 0, DateTimeKind.Utc),
                    AgencyId = agency.Id,
                });
            }
        }

        var tourists = new[]
        {
            new Tourist { Email = "tourist@turistgo.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tourist123!"), Role = UserRole.Tourist, Status = UserStatus.Active, FullName = "Turista Demo", Phone = "3001111111" },
            new Tourist { Email = "maria@turistgo.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tourist123!"), Role = UserRole.Tourist, Status = UserStatus.Active, FullName = "Maria Lopez", Phone = "3002222222" },
            new Tourist { Email = "carlos@turistgo.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tourist123!"), Role = UserRole.Tourist, Status = UserStatus.Active, FullName = "Carlos Ruiz", Phone = "3003333333" },
            new Tourist { Email = "ana@turistgo.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tourist123!"), Role = UserRole.Tourist, Status = UserStatus.Active, FullName = "Ana Gomez", Phone = "3004444444" },
        };

        context.Users.AddRange(guides);
        context.Users.AddRange(tourists);
        await context.SaveChangesAsync();

        var vehicles = new List<Vehicle>();
        foreach (var agency in new[] { agency1, agency2 })
        {
            vehicles.Add(new Vehicle
            {
                AgencyId = agency.Id,
                LicensePlate = $"TG-{agency.Id}01",
                Brand = "Toyota",
                Model = "Hiace",
                Year = 2022,
                PassengerCapacity = 25,
                Status = VehicleStatus.Available,
            });
            vehicles.Add(new Vehicle
            {
                AgencyId = agency.Id,
                LicensePlate = $"TG-{agency.Id}02",
                Brand = "Mercedes",
                Model = "Sprinter",
                Year = 2023,
                PassengerCapacity = 30,
                Status = VehicleStatus.Available,
            });
        }

        context.Vehicles.AddRange(vehicles);
        await context.SaveChangesAsync();

        var agency1Guides = guides.Where(g => g.AgencyId == agency1.Id).ToList();
        var agency2Guides = guides.Where(g => g.AgencyId == agency2.Id).ToList();
        var agency1Vehicles = vehicles.Where(v => v.AgencyId == agency1.Id).ToList();
        var agency2Vehicles = vehicles.Where(v => v.AgencyId == agency2.Id).ToList();

        var tours = new List<Tour>
        {
            CreateTour(agency1.Id, "TG-AND001", "Comuna 13 Graffiti Tour", "Cultura", 85000, 20, agency1Guides[0].Id, agency1Vehicles[0].Id, TourStatus.Active),
            CreateTour(agency1.Id, "TG-AND002", "Guatape Piedra del Penol", "Naturaleza", 120000, 15, null, null, TourStatus.Inactive),
            CreateTour(agency1.Id, "TG-AND003", "Tour Gastronomico Poblado", "Gastronomía", 95000, 12, null, null, TourStatus.Inactive),
            CreateTour(agency2.Id, "TG-PAI001", "City Tour Centro Medellin", "Cultura", 70000, 18, agency2Guides[0].Id, agency2Vehicles[0].Id, TourStatus.Active),
            CreateTour(agency2.Id, "TG-PAI002", "Paragliding San Felix", "Aventura", 180000, 10, null, null, TourStatus.Inactive),
            CreateTour(agency2.Id, "TG-PAI003", "Coffee Farm Experience", "Naturaleza", 110000, 14, null, null, TourStatus.Inactive),
        };

        context.Tours.AddRange(tours);
        await context.SaveChangesAsync();

        foreach (var tour in tours.Where(t => t.Status == TourStatus.Active))
        {
            context.TourSchedules.Add(new TourSchedule
            {
                TourId = tour.Id,
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(13, 0),
                MaxCapacity = tour.TotalCapacity,
                AvailableSpots = tour.AvailableCapacity,
            });
        }

        await context.SaveChangesAsync();

        var activeTour1 = tours[0];
        var activeTour2 = tours[3];
        var tourist = tourists[0];

        var reservation1 = new Reservation
        {
            TouristId = tourist.Id,
            TourId = activeTour1.Id,
            TourDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14)),
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(13, 0),
            Status = ReservationStatus.Confirmed,
        };

        var reservation2 = new Reservation
        {
            TouristId = tourists[1].Id,
            TourId = activeTour2.Id,
            TourDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(21)),
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(13, 0),
            Status = ReservationStatus.Confirmed,
        };

        context.Reservations.AddRange(reservation1, reservation2);
        await context.SaveChangesAsync();

        activeTour1.AvailableCapacity = Math.Max(0, activeTour1.AvailableCapacity - 1);
        activeTour2.AvailableCapacity = Math.Max(0, activeTour2.AvailableCapacity - 1);

        var amount1 = activeTour1.Price * (1 - agency1.CommissionPercentage / 100m);
        var amount2 = activeTour2.Price * (1 - agency2.CommissionPercentage / 100m);

        context.Invoices.AddRange(
            new Invoice { ReservationId = reservation1.Id, Amount = amount1, Status = InvoiceStatus.Active },
            new Invoice { ReservationId = reservation2.Id, Amount = amount2, Status = InvoiceStatus.Active });

        await context.SaveChangesAsync();
    }

    private static Tour CreateTour(
        int agencyId,
        string code,
        string name,
        string category,
        decimal price,
        int capacity,
        int? guideId,
        int? vehicleId,
        TourStatus status) => new()
    {
        AgencyId = agencyId,
        Code = code,
        Name = name,
        Description = $"Experiencia turistica en Medellin: {name}",
        Category = category,
        City = "Medellin",
        Price = price,
        TotalCapacity = capacity,
        AvailableCapacity = capacity,
        StartTime = DateTime.UtcNow.Date.AddHours(9),
        DurationMinutes = 240,
        MeetingPoint = "Parque del Poblado",
        Status = status,
        GuideId = guideId,
        VehicleId = vehicleId,
    };
}
