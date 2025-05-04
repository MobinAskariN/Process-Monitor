using Microsoft.EntityFrameworkCore;


namespace Process_Monitor.Models
{

    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<ProcessData> ProcessData { get; set; }
        public DbSet<Grouping> Grouping { get; set; }
        public DbSet<Relations> Relation { get; set; }


    }
}
