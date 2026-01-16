using Microsoft.EntityFrameworkCore;
using NFK.Domain.Entities.Clients;
using NFK.Domain.Entities.Documents;
using NFK.Domain.Entities.Messaging;
using NFK.Domain.Entities.Other;
using NFK.Domain.Entities.DATEV;
using NFK.Domain.Entities.Users;
using NFK.Domain.Enums;
using NFK.Infrastructure.Security;
using UserRoleEntity = NFK.Domain.Entities.Users.UserRole;

namespace NFK.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, PasswordHasher passwordHasher)
    {
        // Check if already seeded
        if (await context.Users.AnyAsync())
        {
            return; // Database already has data
        }

        // Seed Roles first
        var roles = new List<Role>
        {
            new Role { Name = "SuperAdmin", Description = "Full system access", IsSystemRole = true },
            new Role { Name = "Consultant", Description = "Client and case management", IsSystemRole = true },
            new Role { Name = "Receptionist", Description = "Scheduling and basic client info", IsSystemRole = true },
            new Role { Name = "Client", Description = "Own dossier and documents", IsSystemRole = true },
            new Role { Name = "DATEVManager", Description = "DATEV export management", IsSystemRole = true }
        };

        context.Roles.AddRange(roles);
        await context.SaveChangesAsync();

        // Seed Users
        var suheylUser = new User
        {
            Email = "karatas@nfk-buchhaltung.de",
            PasswordHash = passwordHasher.HashPassword("Test123!"),
            FirstName = "Suheyl",
            LastName = "Karatas",
            FullLegalName = "Süheyl Faruk Kataş",
            PhoneNumber = "+49 221 1234567",
            IsActive = true,
            IsEmailConfirmed = true
        };

        var testUser = new User
        {
            Email = "test@nfk.de",
            PasswordHash = passwordHasher.HashPassword("Test123!"),
            FirstName = "Max",
            LastName = "Berater",
            FullLegalName = "Max Berater",
            PhoneNumber = "+49 30 12345678",
            IsActive = true,
            IsEmailConfirmed = true
        };

        var testUser2 = new User
        {
            Email = "anna@nfk.de",
            PasswordHash = passwordHasher.HashPassword("Test123!"),
            FirstName = "Anna",
            LastName = "Schmidt",
            FullLegalName = "Anna Schmidt",
            PhoneNumber = "+49 40 23456789",
            IsActive = true,
            IsEmailConfirmed = true
        };

        context.Users.AddRange(suheylUser, testUser, testUser2);
        await context.SaveChangesAsync();

        // Assign roles
        var superAdminRole = roles.First(r => r.Name == "SuperAdmin");
        var consultantRole = roles.First(r => r.Name == "Consultant");

        var userRoles = new List<UserRoleEntity>
        {
            new UserRoleEntity { UserId = suheylUser.Id, RoleId = superAdminRole.Id },
            new UserRoleEntity { UserId = testUser.Id, RoleId = superAdminRole.Id },
            new UserRoleEntity { UserId = testUser2.Id, RoleId = consultantRole.Id }
        };

        context.UserRoles.AddRange(userRoles);
        await context.SaveChangesAsync();

        // Seed Clients
        var clients = new List<Client>
        {
            new Client
            {
                UserId = testUser.Id,
                CompanyName = "Schmidt GmbH",
                PhoneNumber = "+49 30 123456",
                TaxNumber = "M-1001",
                Address = "Hauptstraße 1",
                City = "Berlin",
                PostalCode = "10115",
                IsActive = true
            },
            new Client
            {
                UserId = testUser2.Id,
                CompanyName = "Müller & Partner",
                PhoneNumber = "+49 40 234567",
                TaxNumber = "M-1002",
                Address = "Hafenstraße 12",
                City = "Hamburg",
                PostalCode = "20095",
                IsActive = true
            },
            new Client
            {
                UserId = testUser.Id,
                CompanyName = "Weber Trading GmbH",
                PhoneNumber = "+49 89 345678",
                TaxNumber = "M-1003",
                Address = "Marienplatz 5",
                City = "München",
                PostalCode = "80331",
                IsActive = false
            },
            new Client
            {
                UserId = testUser.Id,
                CompanyName = "Koch Consulting",
                PhoneNumber = "+49 69 456789",
                TaxNumber = "M-1004",
                Address = "Zeil 100",
                City = "Frankfurt",
                PostalCode = "60313",
                IsActive = true
            },
            new Client
            {
                UserId = testUser.Id,
                CompanyName = "Becker Handels AG",
                PhoneNumber = "+49 221 567890",
                TaxNumber = "M-1005",
                Address = "Domstraße 8",
                City = "Köln",
                PostalCode = "50667",
                IsActive = true
            }
        };

        context.Clients.AddRange(clients);
        await context.SaveChangesAsync();

        // Seed Cases
        var cases = new List<Case>
        {
            new Case
            {
                ClientId = clients[0].Id,
                Title = "Umsatzsteuervoranmeldung Q4",
                Description = "Quartalsmäßige Umsatzsteuervoranmeldung für Q4 2024",
                Status = CaseStatus.InProgress,
                Priority = 3,
                DueDate = new DateTime(2025, 1, 20)
            },
            new Case
            {
                ClientId = clients[1].Id,
                Title = "Jahresabschluss 2024",
                Description = "Erstellung des Jahresabschlusses für das Geschäftsjahr 2024",
                Status = CaseStatus.New,
                Priority = 2,
                DueDate = new DateTime(2025, 1, 30)
            },
            new Case
            {
                ClientId = clients[3].Id,
                Title = "Lohnsteueranmeldung",
                Description = "Monatliche Lohnsteueranmeldung für Januar 2025",
                Status = CaseStatus.InProgress,
                Priority = 3,
                DueDate = new DateTime(2025, 1, 15)
            },
            new Case
            {
                ClientId = clients[0].Id,
                Title = "Betriebsprüfung Vorbereitung",
                Description = "Vorbereitung aller Unterlagen für anstehende Betriebsprüfung",
                Status = CaseStatus.New,
                Priority = 3,
                DueDate = new DateTime(2025, 1, 25)
            },
            new Case
            {
                ClientId = clients[4].Id,
                Title = "Quartalsabschluss Q1",
                Description = "Quartalsabschluss für Q1 2025",
                Status = CaseStatus.New,
                Priority = 1,
                DueDate = new DateTime(2025, 3, 31)
            },
            new Case
            {
                ClientId = clients[1].Id,
                Title = "Steuerliche Beratung Investition",
                Description = "Beratung zur steuerlichen Optimierung einer geplanten Investition",
                Status = CaseStatus.Completed,
                Priority = 2,
                CompletedAt = new DateTime(2025, 1, 5)
            }
        };

        context.Cases.AddRange(cases);
        await context.SaveChangesAsync();

        // Seed Documents
        var documents = new List<Document>
        {
            new Document
            {
                FileName = "Umsatzsteuerbericht_Q4_2024.pdf",
                FilePath = "/uploads/umsatzsteuerbericht_q4.pdf",
                FileType = "application/pdf",
                FileSize = 245760,
                CaseId = cases[0].Id,
                UploadedByUserId = testUser.Id,
                Status = DocumentStatus.Approved
            },
            new Document
            {
                FileName = "Jahresabschluss_Entwurf_2024.xlsx",
                FilePath = "/uploads/jahresabschluss_entwurf.xlsx",
                FileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                FileSize = 512000,
                CaseId = cases[1].Id,
                UploadedByUserId = testUser2.Id,
                Status = DocumentStatus.Draft
            },
            new Document
            {
                FileName = "Lohnabrechnung_Januar_2025.pdf",
                FilePath = "/uploads/lohnabrechnung_jan.pdf",
                FileType = "application/pdf",
                FileSize = 156800,
                CaseId = cases[2].Id,
                UploadedByUserId = testUser.Id,
                Status = DocumentStatus.Approved
            },
            new Document
            {
                FileName = "Belege_Q4_2024.zip",
                FilePath = "/uploads/belege_q4.zip",
                FileType = "application/zip",
                FileSize = 3145728,
                CaseId = cases[0].Id,
                UploadedByUserId = testUser.Id,
                Status = DocumentStatus.Approved
            },
            new Document
            {
                FileName = "Investitionsplan_2025.pdf",
                FilePath = "/uploads/investitionsplan.pdf",
                FileType = "application/pdf",
                FileSize = 204800,
                CaseId = cases[5].Id,
                UploadedByUserId = testUser.Id,
                Status = DocumentStatus.Approved
            }
        };

        context.Documents.AddRange(documents);
        await context.SaveChangesAsync();

        // Seed Messages
        var messages = new List<Message>
        {
            new Message
            {
                SenderUserId = testUser2.Id,
                RecipientUserId = testUser.Id,
                Subject = "Dokumente für Jahresabschluss",
                Content = "Sehr geehrter Herr Berater,\n\nanbei sende ich Ihnen die angeforderten Unterlagen für den Jahresabschluss 2024. Bitte prüfen Sie die Vollständigkeit.\n\nMit freundlichen Grüßen\nAnna Schmidt",
                IsRead = false
            },
            new Message
            {
                SenderUserId = testUser.Id,
                RecipientUserId = testUser2.Id,
                Subject = "Rückfrage zu Belegen Q4",
                Content = "Guten Tag,\n\nich habe eine Frage zu den eingereichten Belegen für Q4 2024. Könnten Sie bitte die Rechnung #12345 nochmals prüfen?\n\nEs scheint eine Unstimmigkeit bei der MwSt. zu geben.\n\nBeste Grüße\nMax Berater",
                IsRead = true,
                ReadAt = DateTime.UtcNow.AddHours(-2)
            },
            new Message
            {
                SenderUserId = testUser.Id,
                RecipientUserId = testUser.Id,
                Subject = "Fall-Update: Umsatzsteuervoranmeldung Q4",
                Content = "Automatische Benachrichtigung:\n\nDer Status Ihres Falls 'Umsatzsteuervoranmeldung Q4' wurde auf 'In Bearbeitung' geändert.\n\nBearbeiter: M. Berater\nZeitpunkt: " + DateTime.UtcNow.ToString("dd.MM.yyyy HH:mm"),
                IsRead = false
            }
        };

        context.Messages.AddRange(messages);
        await context.SaveChangesAsync();

        // Seed Appointments (Events)
        var appointments = new List<Appointment>
        {
            new Appointment
            {
                ClientId = clients[0].Id,
                ConsultantUserId = testUser.Id,
                Title = "Jahresabschluss Besprechung",
                Description = "Besprechung der vorläufigen Zahlen für den Jahresabschluss",
                StartTime = DateTime.UtcNow.AddDays(5).Date.AddHours(10),
                EndTime = DateTime.UtcNow.AddDays(5).Date.AddHours(11),
                Status = "Scheduled",
                Location = "Büro Berlin"
            },
            new Appointment
            {
                ClientId = clients[1].Id,
                ConsultantUserId = testUser.Id,
                Title = "Frist: Umsatzsteuervoranmeldung",
                Description = "Abgabefrist für Umsatzsteuervoranmeldung Q4 2024",
                StartTime = DateTime.UtcNow.AddDays(10).Date.AddHours(23).AddMinutes(59),
                EndTime = DateTime.UtcNow.AddDays(10).Date.AddHours(23).AddMinutes(59),
                Status = "Scheduled"
            },
            new Appointment
            {
                ClientId = clients[3].Id,
                ConsultantUserId = testUser.Id,
                Title = "Beratungsgespräch Investition",
                Description = "Beratung zur geplanten Investition in neue Produktionsanlagen",
                StartTime = DateTime.UtcNow.AddDays(8).Date.AddHours(14).AddMinutes(30),
                EndTime = DateTime.UtcNow.AddDays(8).Date.AddHours(15).AddMinutes(30),
                Status = "Confirmed",
                Location = "Büro Frankfurt"
            },
            new Appointment
            {
                ClientId = clients[4].Id,
                ConsultantUserId = testUser.Id,
                Title = "Betriebsprüfung Vorbereitung",
                Description = "Vorbesprechung für anstehende Betriebsprüfung",
                StartTime = DateTime.UtcNow.AddDays(15).Date.AddHours(9),
                EndTime = DateTime.UtcNow.AddDays(15).Date.AddHours(11),
                Status = "Scheduled",
                Location = "Büro Köln"
            },
            new Appointment
            {
                ClientId = clients[0].Id,
                ConsultantUserId = testUser.Id,
                Title = "Quartalsabschluss Deadline",
                Description = "Frist für Quartalsabschluss Q1 2025",
                StartTime = DateTime.UtcNow.AddDays(20).Date.AddHours(23).AddMinutes(59),
                EndTime = DateTime.UtcNow.AddDays(20).Date.AddHours(23).AddMinutes(59),
                Status = "Scheduled"
            }
        };

        context.Appointments.AddRange(appointments);
        await context.SaveChangesAsync();

        // Seed DATEV Jobs
        var datevJobs = new List<DATEVJob>
        {
            new DATEVJob
            {
                JobName = "DATEV Export - Dezember 2024",
                JobType = "EXTF",
                Status = "Completed",
                ClientId = clients[0].Id,
                StartedAt = DateTime.UtcNow.AddDays(-2).AddHours(-3),
                CompletedAt = DateTime.UtcNow.AddDays(-2).AddHours(-2).AddMinutes(-45),
                OutputFilePath = "/exports/datev_dez_2024.xml"
            },
            new DATEVJob
            {
                JobName = "DATEV Export - Q4 2024 Gesamt",
                JobType = "EXTF",
                Status = "Processing",
                ClientId = clients[1].Id,
                StartedAt = DateTime.UtcNow.AddMinutes(-30)
            },
            new DATEVJob
            {
                JobName = "DATEV Export - November 2024",
                JobType = "dxso",
                Status = "Failed",
                ClientId = clients[0].Id,
                StartedAt = DateTime.UtcNow.AddDays(-5).AddHours(-2),
                CompletedAt = DateTime.UtcNow.AddDays(-5).AddHours(-1).AddMinutes(-55),
                ErrorMessage = "Verbindung zum DATEV Server fehlgeschlagen",
                RetryCount = 2
            },
            new DATEVJob
            {
                JobName = "DATEV Export - Januar 2025",
                JobType = "EXTF",
                Status = "Pending",
                ClientId = clients[3].Id
            },
            new DATEVJob
            {
                JobName = "DATEV Export - Jahresabschluss 2024",
                JobType = "EXTF",
                Status = "Completed",
                ClientId = clients[1].Id,
                StartedAt = DateTime.UtcNow.AddDays(-7).AddHours(-4),
                CompletedAt = DateTime.UtcNow.AddDays(-7).AddHours(-3).AddMinutes(-20),
                OutputFilePath = "/exports/jahresabschluss_2024.xml"
            }
        };

        context.DATEVJobs.AddRange(datevJobs);
        await context.SaveChangesAsync();
    }
}
