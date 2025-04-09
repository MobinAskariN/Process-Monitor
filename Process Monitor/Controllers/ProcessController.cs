using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc; // Use System.Web.Mvc for MVC in .NET 4.5
using Process_Monitor.Models;
using System.Drawing;

namespace process_schematic_4._5.Controllers
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



            // setting all things we need in our page
            // ViewBag.elements = elements;
            return View();
        }

    }
}
