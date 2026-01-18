using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using NFK.Domain.Entities.Analytics;
using NFK.Domain.Entities.Audit;
using NFK.Domain.Entities.Clients;
using NFK.Domain.Entities.DATEV;
using NFK.Domain.Entities.Documents;
using NFK.Domain.Entities.Messaging;
using NFK.Domain.Entities.Other;
using NFK.Domain.Entities.Users;

namespace NFK.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // Users
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<RolePermission> RolePermissions { get; set; }
    public DbSet<UserPermission> UserPermissions { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<UserSession> UserSessions { get; set; }
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
    public DbSet<PasswordHistory> PasswordHistories { get; set; }
    public DbSet<MfaSecret> MfaSecrets { get; set; }

    // Clients
    public DbSet<Client> Clients { get; set; }
    public DbSet<Case> Cases { get; set; }
    public DbSet<CaseNote> CaseNotes { get; set; }
    public DbSet<CaseStatusHistory> CaseStatusHistories { get; set; }

    // Documents
    public DbSet<Document> Documents { get; set; }
    public DbSet<DocumentFolder> DocumentFolders { get; set; }
    public DbSet<DocumentComment> DocumentComments { get; set; }
    public DbSet<DocumentVersion> DocumentVersions { get; set; }

    // Messaging
    public DbSet<Message> Messages { get; set; }
    public DbSet<MessageAttachment> MessageAttachments { get; set; }

    // DATEV
    public DbSet<DATEVJob> DATEVJobs { get; set; }
    public DbSet<DATEVJobFile> DATEVJobFiles { get; set; }
    public DbSet<DATEVLog> DATEVLogs { get; set; }

    // Audit
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<LoginAttempt> LoginAttempts { get; set; }
    
    // Analytics
    public DbSet<PageVisit> PageVisits { get; set; }

    // Other
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User entity configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(256);
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
            
            // Add indexes for performance
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.CreatedAt);
        });
        
        // PasswordHistory entity configuration
        modelBuilder.Entity<PasswordHistory>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.CreatedAtUtc });
        });
        
        // MfaSecret entity configuration
        modelBuilder.Entity<MfaSecret>(entity =>
        {
            entity.HasIndex(e => e.UserId).IsUnique();
        });
        
        // Client entity configuration - Add indexes
        modelBuilder.Entity<Client>(entity =>
        {
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.IsActive);
        });
        
        // Case entity configuration - Add indexes
        modelBuilder.Entity<Case>(entity =>
        {
            entity.HasIndex(e => e.ClientId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.DueDate);
        });
        
        // Document entity configuration - Add indexes
        modelBuilder.Entity<Document>(entity =>
        {
            entity.HasIndex(e => e.CaseId);
            entity.HasIndex(e => e.UploadedByUserId);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Message entity configuration
        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasOne(e => e.SenderUser)
                .WithMany()
                .HasForeignKey(e => e.SenderUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.RecipientUser)
                .WithMany()
                .HasForeignKey(e => e.RecipientUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Apply global query filter for soft deletes
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(Domain.Common.BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(GetSoftDeleteFilter(entityType.ClrType));
            }
        }
    }

    private static readonly System.Collections.Concurrent.ConcurrentDictionary<Type, LambdaExpression> _filterCache = new();

    private static LambdaExpression GetSoftDeleteFilter(Type entityType)
    {
        return _filterCache.GetOrAdd(entityType, type =>
        {
            var parameter = Expression.Parameter(type, "e");
            var property = Expression.Property(parameter, nameof(Domain.Common.BaseEntity.IsDeleted));
            var falseConstant = Expression.Constant(false);
            var equality = Expression.Equal(property, falseConstant);
            return Expression.Lambda(equality, parameter);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<Domain.Common.BaseEntity>();

        foreach (var entry in entries)
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
