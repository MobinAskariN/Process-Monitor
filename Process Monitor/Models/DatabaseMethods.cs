using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Process_Monitor.Models
{
    public class DatabaseMethods
    {
        // methods for reading from database

        private readonly ApplicationDbContext _context;

        public DatabaseMethods(ApplicationDbContext context)
        {
            _context = context;
        }

        public List<ProcessData> getProcessData()
        {
            List<ProcessData> p = _context.ProcessData.AsNoTracking().ToList();
            return p;
        }
        public List<Grouping> getGrouping()
        {
            List<Grouping> g = _context.Grouping.AsNoTracking().ToList();
            return g;
        }
        public List<Relations> getRelations()
        {
            List<Relations> r = _context.Relation.AsNoTracking().ToList();
            return r;
        }
        public List<Coloring> getColoring()
        {
            List<Coloring> c = _context.Coloring.AsNoTracking().ToList();
            return c;
        }

    }
}