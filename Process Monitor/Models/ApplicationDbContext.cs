using System.Data.Entity;

namespace Process_Monitor.Models
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext() : base("DefaultConnection")
        {
            this.Configuration.LazyLoadingEnabled = false;
        }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // You can configure relationships or keys here if necessary
            modelBuilder.Entity<Relations>()
                 .HasKey(r => new { r.beginning_process_id, r.ending_process_id }); // 👈 composite key

        }



        public DbSet<ProcessData> ProcessData { get; set; }
        public DbSet<Grouping> Grouping { get; set; }
        public DbSet<Relations> Relation { get; set; }
        public DbSet<Coloring> Coloring { get; set; }
    }
}
