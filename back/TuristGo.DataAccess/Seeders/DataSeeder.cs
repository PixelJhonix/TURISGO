using Microsoft.EntityFrameworkCore;
using TuristGo.DataAccess.Context;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;

namespace TuristGo.DataAccess.Seeders;

/// <summary>
/// Seed de escenarios completos para pruebas exhaustivas.
/// Cubre todos los casos límite definidos en las Historias de Usuario.
/// </summary>
public static class DataSeeder
{
    // Ancla de tiempo fija para que los escenarios sean reproducibles
    private static readonly DateTime Now = DateTime.UtcNow;
    private static readonly DateOnly Today = DateOnly.FromDateTime(Now);

    public static async Task SeedAsync(TuristGoDbContext context)
    {
        if (await context.Users.AnyAsync()) return;

        // ── USUARIOS ──────────────────────────────────────────────────────────

        var admin = new Admin
        {
            Email = "admin@turistgo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            Role = UserRole.Admin,
            Status = UserStatus.Active,
        };

        // Agencia activa con comisión normal
        var agency1 = new Agency
        {
            Email = "andes@turistgo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Agency123!"),
            Role = UserRole.Agency,
            Status = UserStatus.Active,
            CommercialName = "Andes Tours Medellín",
            NIT = "900123456-7",
            CorporatePhone = "3001234567",
            Description = "Agencia líder en tours culturales y de naturaleza.",
            CommissionPercentage = 10m,
        };

        // Agencia activa con comisión más alta
        var agency2 = new Agency
        {
            Email = "paisa@turistgo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Agency123!"),
            Role = UserRole.Agency,
            Status = UserStatus.Active,
            CommercialName = "Paisa Experience",
            NIT = "900987654-3",
            CorporatePhone = "3009876543",
            Description = "Tours de aventura y gastronomía auténtica.",
            CommissionPercentage = 15m,
        };

        // Agencia pendiente de aprobación — para probar flujo de aprobación del admin
        var agency3 = new Agency
        {
            Email = "nueva@turistgo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Agency123!"),
            Role = UserRole.Agency,
            Status = UserStatus.Pending,
            CommercialName = "Nueva Aventura SAS",
            NIT = "901112233-1",
            CorporatePhone = "3011223344",
            CommissionPercentage = 0m,
        };

        // Agencia suspendida — para probar reactivación
        var agency4 = new Agency
        {
            Email = "suspendida@turistgo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Agency123!"),
            Role = UserRole.Agency,
            Status = UserStatus.Suspended,
            CommercialName = "Tours Suspendidos SA",
            NIT = "902334455-2",
            CommissionPercentage = 10m,
            SuspensionReason = "Incumplimiento de contrato de calidad.",
        };

        context.Users.AddRange(admin, agency1, agency2, agency3, agency4);
        await context.SaveChangesAsync();

        // ── GUÍAS ─────────────────────────────────────────────────────────────
        // Escenarios: certificado vigente, próximo a vencer (<30 días), vencido, ya vencido hace tiempo

        var guides = new List<Guide>
        {
            // agency1 — guía 1: certificado vigente largo plazo (2028)
            new() {
                Email = "guide1.1@turistgo.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guide123!"),
                Role = UserRole.Guide, Status = UserStatus.Active,
                FullName = "Juan Pérez Vargas",
                DocumentNumber = "1001001001",
                CertificateNumber = "CERT-AND-001",
                CertificateExpiryDate = Now.AddYears(2),
                AgencyId = agency1.Id,
            },
            // agency1 — guía 2: certificado próximo a vencer (15 días) — GUIDE-01 borde
            new() {
                Email = "guide2.1@turistgo.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guide123!"),
                Role = UserRole.Guide, Status = UserStatus.Active,
                FullName = "Camila Ríos Ospina",
                DocumentNumber = "1002002002",
                CertificateNumber = "CERT-AND-002",
                CertificateExpiryDate = Now.AddDays(15),
                AgencyId = agency1.Id,
            },
            // agency1 — guía 3: certificado vence mañana — extremo límite GUIDE-01
            new() {
                Email = "guide3.1@turistgo.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guide123!"),
                Role = UserRole.Guide, Status = UserStatus.Active,
                FullName = "Andrés Mejía Cano",
                DocumentNumber = "1003003003",
                CertificateNumber = "CERT-AND-003",
                CertificateExpiryDate = Now.AddDays(1),
                AgencyId = agency1.Id,
            },
            // agency1 — guía 4: certificado vencido (ayer) — falla GUIDE-01
            new() {
                Email = "guide4.1@turistgo.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guide123!"),
                Role = UserRole.Guide, Status = UserStatus.Active,
                FullName = "Sofía Herrera Duque",
                DocumentNumber = "1004004004",
                CertificateNumber = "CERT-AND-004",
                CertificateExpiryDate = Now.AddDays(-1),
                AgencyId = agency1.Id,
            },
            // agency1 — guía 5: certificado vencido hace 1 año — claramente inválido
            new() {
                Email = "guide5.1@turistgo.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guide123!"),
                Role = UserRole.Guide, Status = UserStatus.Active,
                FullName = "Miguel Torres Salcedo",
                DocumentNumber = "1005005005",
                CertificateNumber = "CERT-AND-005",
                CertificateExpiryDate = Now.AddYears(-1),
                AgencyId = agency1.Id,
            },
            // agency1 — guía 6: suspendido
            new() {
                Email = "guide6.1@turistgo.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guide123!"),
                Role = UserRole.Guide, Status = UserStatus.Suspended,
                FullName = "Lorena Castro Betancur",
                DocumentNumber = "1006006006",
                CertificateNumber = "CERT-AND-006",
                CertificateExpiryDate = Now.AddYears(1),
                AgencyId = agency1.Id,
                SuspensionReason = "Queja de usuarios reiterada.",
            },
            // agency2 — guía 1: vigente
            new() {
                Email = "guide1.2@turistgo.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guide123!"),
                Role = UserRole.Guide, Status = UserStatus.Active,
                FullName = "Valentina Gómez Arango",
                DocumentNumber = "2001001001",
                CertificateNumber = "CERT-PAI-001",
                CertificateExpiryDate = Now.AddMonths(18),
                AgencyId = agency2.Id,
            },
            // agency2 — guía 2: certificado vence en 29 días (borde de "próximo a vencer")
            new() {
                Email = "guide2.2@turistgo.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guide123!"),
                Role = UserRole.Guide, Status = UserStatus.Active,
                FullName = "Santiago Morales Vélez",
                DocumentNumber = "2002002002",
                CertificateNumber = "CERT-PAI-002",
                CertificateExpiryDate = Now.AddDays(29),
                AgencyId = agency2.Id,
            },
            // agency2 — guía 3: vencido hace 6 meses
            new() {
                Email = "guide3.2@turistgo.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guide123!"),
                Role = UserRole.Guide, Status = UserStatus.Active,
                FullName = "Isabel Patiño Londoño",
                DocumentNumber = "2003003003",
                CertificateNumber = "CERT-PAI-003",
                CertificateExpiryDate = Now.AddMonths(-6),
                AgencyId = agency2.Id,
            },
        };

        // ── TURISTAS ──────────────────────────────────────────────────────────
        var tourists = new List<Tourist>
        {
            // Turista principal de pruebas
            new() { Email = "tourist@turistgo.com",  PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tourist123!"), Role = UserRole.Tourist, Status = UserStatus.Active,    FullName = "Turista Demo",       Phone = "3001111111" },
            new() { Email = "maria@turistgo.com",    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tourist123!"), Role = UserRole.Tourist, Status = UserStatus.Active,    FullName = "María López Reyes",  Phone = "3002222222" },
            new() { Email = "carlos@turistgo.com",   PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tourist123!"), Role = UserRole.Tourist, Status = UserStatus.Active,    FullName = "Carlos Ruiz Mesa",   Phone = "3003333333" },
            new() { Email = "ana@turistgo.com",      PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tourist123!"), Role = UserRole.Tourist, Status = UserStatus.Active,    FullName = "Ana Gómez Castro",   Phone = "3004444444" },
            // Turista pendiente — nunca ha podido iniciar sesión aún
            new() { Email = "pendiente@turistgo.com",PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tourist123!"), Role = UserRole.Tourist, Status = UserStatus.Pending,   FullName = "Pedro Pending",      Phone = "3005555555" },
            // Turista suspendido — para probar bloqueo de acceso
            new() { Email = "suspend@turistgo.com",  PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tourist123!"), Role = UserRole.Tourist, Status = UserStatus.Suspended, FullName = "Elena Suspendida",   Phone = "3006666666", SuspensionReason = "Cancelaciones abusivas reiteradas." },
        };

        context.Users.AddRange(guides);
        context.Users.AddRange(tourists);
        await context.SaveChangesAsync();

        // ── VEHÍCULOS ─────────────────────────────────────────────────────────
        var vehicles = new List<Vehicle>
        {
            // agency1
            new() { AgencyId = agency1.Id, LicensePlate = "AND-001", Brand = "Toyota",   Model = "Hiace",    Year = 2022, PassengerCapacity = 25, Status = VehicleStatus.Available },
            new() { AgencyId = agency1.Id, LicensePlate = "AND-002", Brand = "Mercedes", Model = "Sprinter", Year = 2023, PassengerCapacity = 30, Status = VehicleStatus.Available },
            new() { AgencyId = agency1.Id, LicensePlate = "AND-003", Brand = "Ford",     Model = "Transit",  Year = 2021, PassengerCapacity = 15, Status = VehicleStatus.InMaintenance },
            new() { AgencyId = agency1.Id, LicensePlate = "AND-004", Brand = "Chevrolet",Model = "Express",  Year = 2020, PassengerCapacity = 12, Status = VehicleStatus.Available },
            // agency2
            new() { AgencyId = agency2.Id, LicensePlate = "PAI-001", Brand = "Nissan",   Model = "NV350",    Year = 2022, PassengerCapacity = 20, Status = VehicleStatus.Available },
            new() { AgencyId = agency2.Id, LicensePlate = "PAI-002", Brand = "Hyundai",  Model = "H350",     Year = 2023, PassengerCapacity = 18, Status = VehicleStatus.Available },
            new() { AgencyId = agency2.Id, LicensePlate = "PAI-003", Brand = "Volvo",    Model = "B7R",      Year = 2019, PassengerCapacity = 45, Status = VehicleStatus.Available },
        };

        context.Vehicles.AddRange(vehicles);
        await context.SaveChangesAsync();

        var a1g = guides.Where(g => g.AgencyId == agency1.Id).ToList(); // índices 0-5
        var a2g = guides.Where(g => g.AgencyId == agency2.Id).ToList(); // índices 0-2
        var a1v = vehicles.Where(v => v.AgencyId == agency1.Id).ToList();
        var a2v = vehicles.Where(v => v.AgencyId == agency2.Id).ToList();

        // ── PERIODOS DE NO DISPONIBILIDAD DE GUÍAS ────────────────────────────
        context.Set<GuideUnavailability>().AddRange(
            // guía 2 de agency1 (cert próximo a vencer): no disponible semana que viene
            new GuideUnavailability { GuideId = a1g[1].Id, StartDateTime = Now.AddDays(7), EndDateTime = Now.AddDays(10) },
            // guía 1 de agency2: vacaciones mes que viene
            new GuideUnavailability { GuideId = a2g[0].Id, StartDateTime = Now.AddDays(35), EndDateTime = Now.AddDays(42) }
        );
        await context.SaveChangesAsync();

        // ── TOURS ─────────────────────────────────────────────────────────────
        // Escenarios: activo, inactivo, con y sin guía/vehículo, capacidad llena,
        //             fecha pasada, hoy, <24h, mañana, próximo, lejano.

        var tours = new List<Tour>();

        // ─── AGENCIA 1 ───────────────────────────────────────────────────────

        // T01: ACTIVO — tour futuro lejano (30 días), con guía cert vigente y vehículo — caso feliz completo
        var t01 = MkTour(agency1.Id, "TG-AND-001", "Comuna 13 Graffiti Tour",
            "Cultura", 85_000, 20, Now.AddDays(30).Date.AddHours(9), 240,
            "Parque de El Poblado", TourStatus.Active, a1g[0].Id, a1v[0].Id,
            "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80");

        // T02: ACTIVO — tour en 3 días (>24h, cancelable), capacidad 5
        var t02 = MkTour(agency1.Id, "TG-AND-002", "Guatapé y Piedra del Peñol",
            "Naturaleza", 120_000, 5, Now.AddDays(3).Date.AddHours(7), 480,
            "Terminal del Norte", TourStatus.Active, a1g[0].Id, a1v[1].Id,
            "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80");

        // T03: ACTIVO — tour mañana (>24h exacto borde)
        var t03 = MkTour(agency1.Id, "TG-AND-003", "Tour Gastronómico El Poblado",
            "Gastronomía", 95_000, 12, Now.Date.AddDays(1).AddHours(11), 180,
            "Parque Lleras", TourStatus.Active, a1g[0].Id, a1v[0].Id,
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80");

        // T04: ACTIVO — tour en menos de 24h (no cancelable, no asignable) — borde crítico
        var t04 = MkTour(agency1.Id, "TG-AND-004", "Noche de Tango en Medellín",
            "Cultura", 75_000, 15, Now.AddHours(18), 180,
            "Teatro Metropolitano", TourStatus.Active, a1g[0].Id, a1v[1].Id,
            "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80");

        // T05: ACTIVO — tour HOY, empezó hace 2 horas (en curso), no reservable
        var t05 = MkTour(agency1.Id, "TG-AND-005", "Recorrido Histórico Centro",
            "Cultura", 65_000, 18, Now.Date.AddHours(8), 240,
            "Plazuela Nutibara", TourStatus.Active, a1g[1].Id, a1v[0].Id,
            "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80");

        // T06: ACTIVO — capacidad LLENA (para probar "Sin cupos")
        var t06 = MkTour(agency1.Id, "TG-AND-006", "Parapente San Félix AGOTADO",
            "Aventura", 180_000, 2, Now.AddDays(5).Date.AddHours(7), 120,
            "Finca El Cielo - San Félix", TourStatus.Active, a1g[0].Id, a1v[3].Id,
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80");

        // T07: ACTIVO — tour en 60 días, guía con cert próximo a vencer (15 días) — GUIDE-01 falla
        var t07 = MkTour(agency1.Id, "TG-AND-007", "Finca Cafetera Jericó",
            "Naturaleza", 135_000, 10, Now.AddDays(60).Date.AddHours(6), 360,
            "Terminal Sur", TourStatus.Active, a1g[1].Id, a1v[1].Id,
            "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80");

        // T08: INACTIVO — sin guía ni vehículo asignado
        var t08 = MkTour(agency1.Id, "TG-AND-008", "Ruta de las Orquídeas",
            "Naturaleza", 90_000, 8, Now.AddDays(45).Date.AddHours(8), 300,
            "Parque Arví", TourStatus.Inactive, null, null, null);

        // T09: INACTIVO — tiene guía (con cert vencido ayer) pero no vehículo
        var t09 = MkTour(agency1.Id, "TG-AND-009", "Tour Nocturno Barrio Laureles",
            "Cultura", 55_000, 16, Now.AddDays(20).Date.AddHours(20), 180,
            "Estadio Metro", TourStatus.Inactive, a1g[3].Id, null, null);

        // T10: INACTIVO — tiene vehículo pero guía con cert vencido hace 1 año
        var t10 = MkTour(agency1.Id, "TG-AND-010", "Cañón del Río Claro",
            "Aventura", 220_000, 12, Now.AddDays(25).Date.AddHours(5), 600,
            "Mall Aventura", TourStatus.Inactive, a1g[4].Id, a1v[2].Id, null);

        // ─── AGENCIA 2 ───────────────────────────────────────────────────────

        // T11: ACTIVO — tour en 7 días, guía vigente, múltiples horarios
        var t11 = MkTour(agency2.Id, "TG-PAI-001", "City Tour Centro Histórico",
            "Cultura", 70_000, 20, Now.AddDays(7).Date.AddHours(9), 240,
            "Plaza Botero", TourStatus.Active, a2g[0].Id, a2v[0].Id,
            "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80");

        // T12: ACTIVO — tour en 14 días, muchos cupos disponibles
        var t12 = MkTour(agency2.Id, "TG-PAI-002", "Coffee Farm Experience Salento",
            "Naturaleza", 150_000, 25, Now.AddDays(14).Date.AddHours(6), 420,
            "Terminal del Norte", TourStatus.Active, a2g[0].Id, a2v[2].Id,
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80");

        // T13: ACTIVO — tour en 2 días con guía cert venciendo en 29 días (borde)
        var t13 = MkTour(agency2.Id, "TG-PAI-003", "Rapel Cañón Las Palmas",
            "Aventura", 160_000, 8, Now.AddDays(2).Date.AddHours(7), 300,
            "CC Santafé", TourStatus.Active, a2g[1].Id, a2v[1].Id,
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80");

        // T14: ACTIVO — tour en 10 días, precio alto, 1 cupo restante
        var t14 = MkTour(agency2.Id, "TG-PAI-004", "Glamping Río Arví",
            "Naturaleza", 380_000, 4, Now.AddDays(10).Date.AddHours(15), 720,
            "Estación Metro Acevedo", TourStatus.Active, a2g[0].Id, a2v[2].Id,
            "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80");

        // T15: ACTIVO — en 20 días, guía con cert vencido (no debería poder asignarse — error en datos legacy)
        var t15 = MkTour(agency2.Id, "TG-PAI-005", "Visita Pueblito Paisa",
            "Cultura", 45_000, 30, Now.AddDays(20).Date.AddHours(10), 180,
            "Cerro Nutibara entrada", TourStatus.Active, a2g[2].Id, a2v[0].Id,
            "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80");

        // T16: INACTIVO — sin asignaciones
        var t16 = MkTour(agency2.Id, "TG-PAI-006", "Kayak Embalse El Peñol",
            "Aventura", 95_000, 10, Now.AddDays(50).Date.AddHours(8), 240,
            "Muelle El Peñol", TourStatus.Inactive, null, null, null);

        // T17: ACTIVO — tour con precio mínimo para probar borde TOUR-02
        var t17 = MkTour(agency2.Id, "TG-PAI-007", "Selfie Tour Instagram Medellín",
            "Cultura", 25_000, 20, Now.AddDays(4).Date.AddHours(14), 120,
            "Parque de las Luces", TourStatus.Active, a2g[0].Id, a2v[1].Id,
            "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80");

        tours.AddRange(new[] { t01, t02, t03, t04, t05, t06, t07, t08, t09, t10,
                                t11, t12, t13, t14, t15, t16, t17 });
        context.Tours.AddRange(tours);
        await context.SaveChangesAsync();

        // Marcar vehículos asignados a tours activos
        var usedVehicleIds = tours
            .Where(t => t.Status == TourStatus.Active && t.VehicleId.HasValue)
            .Select(t => t.VehicleId!.Value)
            .Distinct();
        foreach (var v in vehicles.Where(v => usedVehicleIds.Contains(v.Id)))
            v.Status = VehicleStatus.Assigned;
        await context.SaveChangesAsync();

        // ── HORARIOS DE TOUR ──────────────────────────────────────────────────
        // Tours activos con más de un horario disponible para probar selección y conflictos

        var schedules = new List<TourSchedule>();

        void AddSchedules(Tour t, params (int startH, int endH, int cap)[] slots)
        {
            foreach (var (sh, eh, cap) in slots)
                schedules.Add(new TourSchedule
                {
                    TourId = t.Id,
                    StartTime = new TimeOnly(sh, 0),
                    EndTime = new TimeOnly(eh, 0),
                    MaxCapacity = cap,
                    AvailableSpots = cap,
                });
        }

        AddSchedules(t01, (9, 13, 20));
        AddSchedules(t02, (7, 15, 5), (14, 22, 5));          // dos turnos, capacidad baja
        AddSchedules(t03, (11, 14, 12), (17, 20, 12));        // almuerzo y cena
        AddSchedules(t04, (20, 23, 15));                      // nocturno
        AddSchedules(t05, (8, 12, 18));
        AddSchedules(t06, (7, 9, 2), (10, 12, 2));            // 2 cupos por turno
        AddSchedules(t07, (6, 12, 10));
        AddSchedules(t11, (9, 13, 20), (14, 18, 20));         // mañana y tarde
        AddSchedules(t12, (6, 13, 25));
        AddSchedules(t13, (7, 12, 8));
        AddSchedules(t14, (15, 21, 4));
        AddSchedules(t15, (10, 13, 30));
        AddSchedules(t17, (14, 16, 20), (16, 18, 20));        // dos tandas tarde

        context.TourSchedules.AddRange(schedules);
        await context.SaveChangesAsync();

        // ── RESERVAS ─────────────────────────────────────────────────────────
        // Cubre: Confirmed futuro, Confirmed <24h, Completed (tour ya pasó), Cancelled

        var tourist0 = tourists[0]; // tourist@turistgo.com — turista principal
        var tourist1 = tourists[1]; // maria@
        var tourist2 = tourists[2]; // carlos@
        var tourist3 = tourists[3]; // ana@

        var reservations = new List<Reservation>();

        // R01: Confirmed — tour en 30 días — cancelable, cambio de fecha posible
        var r01 = new Reservation { TouristId = tourist0.Id, TourId = t01.Id, TourDate = Today.AddDays(30), StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(13, 0), Status = ReservationStatus.Confirmed };

        // R02: Confirmed — tour en 3 días — cancelable (>24h)
        var r02 = new Reservation { TouristId = tourist0.Id, TourId = t02.Id, TourDate = Today.AddDays(3), StartTime = new TimeOnly(7, 0), EndTime = new TimeOnly(15, 0), Status = ReservationStatus.Confirmed };

        // R03: Confirmed — tour <24h — NO cancelable, NO reschedule posible
        var r03 = new Reservation { TouristId = tourist0.Id, TourId = t04.Id, TourDate = Today, StartTime = new TimeOnly(20, 0), EndTime = new TimeOnly(23, 0), Status = ReservationStatus.Confirmed };

        // R04: Completed — tour ya pasó — calificable
        var r04 = new Reservation { TouristId = tourist0.Id, TourId = t01.Id, TourDate = Today.AddDays(-10), StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(13, 0), Status = ReservationStatus.Completed };

        // R05: Completed — otro tour completado — ya calificado (para probar "ya enviaste reseña")
        var r05 = new Reservation { TouristId = tourist0.Id, TourId = t11.Id, TourDate = Today.AddDays(-5), StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(13, 0), Status = ReservationStatus.Completed };

        // R06: Cancelled — para historial
        var r06 = new Reservation { TouristId = tourist0.Id, TourId = t12.Id, TourDate = Today.AddDays(-20), StartTime = new TimeOnly(6, 0), EndTime = new TimeOnly(13, 0), Status = ReservationStatus.Cancelled };

        // R07: Confirmed — maria en tour t11
        var r07 = new Reservation { TouristId = tourist1.Id, TourId = t11.Id, TourDate = Today.AddDays(7), StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(13, 0), Status = ReservationStatus.Confirmed };

        // R08: Confirmed — maria en tour t12
        var r08 = new Reservation { TouristId = tourist1.Id, TourId = t12.Id, TourDate = Today.AddDays(14), StartTime = new TimeOnly(6, 0), EndTime = new TimeOnly(13, 0), Status = ReservationStatus.Confirmed };

        // R09: Completed — carlos, sin reseña aún — calificable
        var r09 = new Reservation { TouristId = tourist2.Id, TourId = t03.Id, TourDate = Today.AddDays(-3), StartTime = new TimeOnly(11, 0), EndTime = new TimeOnly(14, 0), Status = ReservationStatus.Completed };

        // R10: Confirmed — ana en tour t13 (en 2 días)
        var r10 = new Reservation { TouristId = tourist3.Id, TourId = t13.Id, TourDate = Today.AddDays(2), StartTime = new TimeOnly(7, 0), EndTime = new TimeOnly(12, 0), Status = ReservationStatus.Confirmed };

        // R11: Confirmed — ana en t14 (en 10 días, precio alto)
        var r11 = new Reservation { TouristId = tourist3.Id, TourId = t14.Id, TourDate = Today.AddDays(10), StartTime = new TimeOnly(15, 0), EndTime = new TimeOnly(21, 0), Status = ReservationStatus.Confirmed };

        // R12: Confirmed — t06 (capacidad 2 — primer cupo)
        var r12 = new Reservation { TouristId = tourist1.Id, TourId = t06.Id, TourDate = Today.AddDays(5), StartTime = new TimeOnly(7, 0), EndTime = new TimeOnly(9, 0), Status = ReservationStatus.Confirmed };

        // R13: Confirmed — t06 (capacidad 2 — segundo cupo = LLENO)
        var r13 = new Reservation { TouristId = tourist2.Id, TourId = t06.Id, TourDate = Today.AddDays(5), StartTime = new TimeOnly(7, 0), EndTime = new TimeOnly(9, 0), Status = ReservationStatus.Confirmed };

        reservations.AddRange(new[] { r01, r02, r03, r04, r05, r06, r07, r08, r09, r10, r11, r12, r13 });
        context.Reservations.AddRange(reservations);
        await context.SaveChangesAsync();

        // Descontar capacidad según reservas Confirmed/Completed
        void DecrCapacity(Tour t, int n)
        {
            t.AvailableCapacity = Math.Max(0, t.AvailableCapacity - n);
            var sched = schedules.Where(s => s.TourId == t.Id).FirstOrDefault();
            if (sched != null) sched.AvailableSpots = Math.Max(0, sched.AvailableSpots - n);
        }

        DecrCapacity(t01, 2);  // r01 + r04 (r04 ya completada pero ocupó cupo)
        DecrCapacity(t02, 1);  // r02
        DecrCapacity(t04, 1);  // r03
        DecrCapacity(t11, 2);  // r05 (completed) + r07
        DecrCapacity(t12, 1);  // r08 (r06 cancelada no ocupa)
        DecrCapacity(t03, 1);  // r09 (completed)
        DecrCapacity(t13, 1);  // r10
        DecrCapacity(t14, 1);  // r11
        t06.AvailableCapacity = 0; // r12 + r13 = lleno
        var t06sched = schedules.FirstOrDefault(s => s.TourId == t06.Id);
        if (t06sched != null) t06sched.AvailableSpots = 0;

        await context.SaveChangesAsync();

        // ── FACTURAS ──────────────────────────────────────────────────────────
        // Solo reservas Confirmed/Completed tienen factura; Cancelled → Voided

        Invoice MkInvoice(Reservation r, Agency ag, InvoiceStatus st)
        {
            var tour = tours.First(t => t.Id == r.TourId);
            var amount = tour.Price * (1 - ag.CommissionPercentage / 100m);
            return new Invoice { ReservationId = r.Id, Amount = Math.Round(amount, 2), Status = st };
        }

        context.Invoices.AddRange(
            MkInvoice(r01, agency1, InvoiceStatus.Active),
            MkInvoice(r02, agency1, InvoiceStatus.Active),
            MkInvoice(r03, agency1, InvoiceStatus.Active),
            MkInvoice(r04, agency1, InvoiceStatus.Active),   // reserva completada — factura activa
            MkInvoice(r05, agency2, InvoiceStatus.Active),   // completada
            MkInvoice(r06, agency2, InvoiceStatus.Voided),   // cancelada → anulada
            MkInvoice(r07, agency2, InvoiceStatus.Active),
            MkInvoice(r08, agency2, InvoiceStatus.Active),
            MkInvoice(r09, agency1, InvoiceStatus.Active),   // completada
            MkInvoice(r10, agency2, InvoiceStatus.Active),
            MkInvoice(r11, agency2, InvoiceStatus.Active),
            MkInvoice(r12, agency1, InvoiceStatus.Active),
            MkInvoice(r13, agency1, InvoiceStatus.Active)
        );
        await context.SaveChangesAsync();

        // ── RESEÑAS ───────────────────────────────────────────────────────────
        // R04 y R05 completadas → tienen reseña (para probar "ya enviaste reseña")
        // R09 completada → sin reseña (para probar flujo de calificación)

        context.Set<Review>().AddRange(
            new Review { ReservationId = r04.Id, Rating = 5, Comment = "¡Increíble experiencia! El guía conoce cada rincón de la Comuna 13." },
            new Review { ReservationId = r05.Id, Rating = 4, Comment = "Muy buen tour, organizado y puntual. Recomendado." }
        );
        await context.SaveChangesAsync();

        // Actualizar AverageRating de tours con reseñas
        t01.AverageRating = 5.0m;
        t11.AverageRating = 4.0m;
        await context.SaveChangesAsync();
    }

    private static Tour MkTour(
        int agencyId, string code, string name, string category,
        decimal price, int capacity, DateTime startTime, int durationMinutes,
        string meetingPoint, TourStatus status,
        int? guideId, int? vehicleId, string? imageUrl) => new()
    {
        AgencyId = agencyId,
        Code = code,
        Name = name,
        Description = $"Vive la experiencia auténtica de Medellín: {name}. Tour diseñado para viajeros exigentes.",
        Category = category,
        City = "Medellín",
        Price = price,
        TotalCapacity = capacity,
        AvailableCapacity = capacity,
        StartTime = startTime,
        DurationMinutes = durationMinutes,
        MeetingPoint = meetingPoint,
        Status = status,
        GuideId = guideId,
        VehicleId = vehicleId,
        ImageUrl = imageUrl,
        AverageRating = 0m,
    };
}
