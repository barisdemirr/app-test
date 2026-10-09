using Dersakis.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Database;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<IdempotencyKey> IdempotencyKeys => Set<IdempotencyKey>();
    public DbSet<CreditTransaction> CreditTransactions => Set<CreditTransaction>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configurations klasöründeki tüm IEntityTypeConfiguration sınıflarını otomatik bulur.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}