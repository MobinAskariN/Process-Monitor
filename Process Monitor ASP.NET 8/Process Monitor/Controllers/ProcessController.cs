using System;
using System.Collections.Generic;
using System.Linq;
using Process_Monitor.Models;
using Microsoft.AspNetCore.Mvc;

namespace Process_Monitor.Controllers
{
    public class ProcessController : Controller
    {
        private readonly DatabaseMethods _context;
        private readonly ApplicationDbContext _db;

        public ProcessController(DatabaseMethods context, ApplicationDbContext db)
        {
            _context = context;
            _db = db;
        }

        public IActionResult Index()
        {
            // getting all ProcessData, Grouping, & Relations
            List<ProcessData> processDatas = _context.getProcessData();
            List<Grouping> groupings = _context.getGrouping();
            List<Relations> relations = _context.getRelations();
            List<Coloring> colorings = _context.getColoring();


            foreach (Relations r in relations)
                r.ExtractParameters();
            foreach (ProcessData p in processDatas)
                p.Edit_start_method();


            // setting all things we need in our page
            ViewBag.processData = processDatas;
            ViewBag.grouping = groupings;
            ViewBag.relation = relations;
            ViewBag.coloring = colorings;
            return View();
        }

        // update infos recieved by Ajax
        [HttpPost]
        public IActionResult UpdateCoordinates([FromBody] CoordinateUpdateRequest request)
        {
            var processData = request.ProcessData ?? new();
            var groupData = request.GroupData ?? new();

            foreach (var data in processData)
            {
                var process = _db.ProcessData.Find(data.process_id);
                if (process != null)
                {
                    process.previous_process_group = data.process_group;
                    process.x = data.x;
                    process.y = data.y;
                }
            }

            foreach (var data in groupData)
            {
                var group = _db.Grouping.Find(data.group_id);
                if (group != null)
                {
                    group.x = data.x;
                    group.y = data.y;
                    group.width = data.width;
                    group.height = data.height;
                }
            }

            _db.SaveChanges();
            return Json(new { success = true });
        }
    }


}

public class CoordinateUpdateRequest
{
    public List<ProcessUpdates> ProcessData { get; set; }
    public List<GroupUpdates> GroupData { get; set; }
}

