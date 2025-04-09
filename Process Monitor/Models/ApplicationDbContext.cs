using System.Data.Entity;

namespace Process_Monitor.Models
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext() : base("DefaultConnection")
        {
            this.Configuration.LazyLoadingEnabled = false;
        }

        // If you need to use a custom configuration, use the OnModelCreating method
        // to configure entity mappings.
        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // You can configure relationships or keys here if necessary
        }

        public DbSet<ProcessData> ProcessData { get; set; }
        public DbSet<Grouping> Grouping { get; set; }
        public DbSet<Relations> Relation { get; set; }
    }
}
