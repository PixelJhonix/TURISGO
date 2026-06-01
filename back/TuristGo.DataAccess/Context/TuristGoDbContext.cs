using Microsoft.EntityFrameworkCore;
using TuristGo.Domain.Entities;
using TuristGo.Domain.Enums;

namespace TuristGo.DataAccess.Context;

public class TuristGoDbContext(DbContextOptions<TuristGoDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Tourist> Tourists => Set<Tourist>();
    public DbSet<Agency> Agencies => Set<Agency>();
    public DbSet<Guide> Guides => Set<Guide>();
    public DbSet<Admin> Admins => Set<Admin>();
    public DbSet<Tour> Tours => Set<Tour>();
    public DbSet<TourSchedule> TourSchedules => Set<TourSchedule>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<CertificateHistory> CertificateHistories => Set<CertificateHistory>();
    public DbSet<GuideUnavailability> GuideUnavailability => Set<GuideUnavailability>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasDiscriminator(u => u.Role)
            .HasValue<Tourist>(UserRole.Tourist)
            .HasValue<Agency>(UserRole.Agency)
            .HasValue<Guide>(UserRole.Guide)
            .HasValue<Admin>(UserRole.Admin);

        modelBuilder.Entity<User>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<Agency>().HasIndex(x => x.NIT).IsUnique();
        modelBuilder.Entity<Guide>().HasIndex(x => x.CertificateNumber).IsUnique();
        modelBuilder.Entity<Vehicle>().HasIndex(x => x.LicensePlate).IsUnique();
        modelBuilder.Entity<Tour>().HasIndex(x => x.Code).IsUnique();

        modelBuilder.Entity<Agency>()
            .Property(x => x.CommissionPercentage)
            .HasPrecision(5, 2);

        modelBuilder.Entity<Tour>(entity =>
        {
            entity.Property(x => x.Price).HasPrecision(10, 2);
            entity.Property(x => x.AverageRating).HasPrecision(3, 2);
            entity.HasOne(x => x.Agency)
                .WithMany()
                .HasForeignKey(x => x.AgencyId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Guide)
                .WithMany()
                .HasForeignKey(x => x.GuideId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Vehicle)
                .WithMany()
                .HasForeignKey(x => x.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Guide>()
            .HasOne(x => x.Agency)
            .WithMany()
            .HasForeignKey(x => x.AgencyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Vehicle>()
            .HasOne(x => x.Agency)
            .WithMany()
            .HasForeignKey(x => x.AgencyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TourSchedule>()
            .HasOne(x => x.Tour)
            .WithMany(x => x.Schedules)
            .HasForeignKey(x => x.TourId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Reservation>(entity =>
        {
            entity.HasOne(x => x.Tourist).WithMany().HasForeignKey(x => x.TouristId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Tour).WithMany().HasForeignKey(x => x.TourId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.TourSchedule).WithMany().HasForeignKey(x => x.TourScheduleId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Review>()
            .HasIndex(x => x.ReservationId)
            .IsUnique();
        modelBuilder.Entity<Review>()
            .HasOne(x => x.Reservation)
            .WithMany()
            .HasForeignKey(x => x.ReservationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Invoice>()
            .HasIndex(x => x.ReservationId)
            .IsUnique();
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.Property(x => x.Amount).HasPrecision(10, 2);
            entity.HasOne(x => x.Reservation)
                .WithMany()
                .HasForeignKey(x => x.ReservationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CertificateHistory>()
            .HasOne(x => x.Guide)
            .WithMany()
            .HasForeignKey(x => x.GuideId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GuideUnavailability>()
            .HasOne(x => x.Guide)
            .WithMany()
            .HasForeignKey(x => x.GuideId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
