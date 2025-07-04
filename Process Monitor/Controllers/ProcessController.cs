﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc; // Use System.Web.Mvc for MVC in .NET 4.5
using Process_Monitor.Models;
using System.Drawing;
using System.Diagnostics;

namespace Process_Monitor.Controllers
{
    public class ProcessController : Controller
    {
        // necessary code, no idea what is its use
        private readonly DatabaseMethods _context;
        public ProcessController(DatabaseMethods context)
        {
            _context = context;
        }

        public ActionResult Index()
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
        public ActionResult UpdateCoordinates(List<ProcessUpdates> processData, List<GroupUpdates> groupData)
        {
            using (var db = new ApplicationDbContext())
            {
                foreach (var data in processData)
                {
                    var process = db.ProcessData.Find(data.process_id);
                    if (process != null)
                    {
                        process.previous_process_group = data.process_group;
                        process.x = data.x;
                        process.y = data.y;
                    }
                }

                db.SaveChanges(); // Save all the changes at once
            }

            using (var db = new ApplicationDbContext())
            {
                foreach (var data in groupData)
                {
                    var group = db.Grouping.Find(data.group_id);
                    if (group != null)
                    {
                        group.x = data.x;
                        group.y = data.y;
                        group.width = data.width;
                        group.height = data.height;

                    }
                }

                db.SaveChanges(); // Save all the changes at once
            }

            return Json(new { success = true });
        }
    }
}
