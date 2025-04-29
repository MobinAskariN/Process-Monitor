using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Process_Monitor.Models
{
    public class ProcessUpdates
    {
        public int process_id { get; set; }
        public int? x { get; set; }
        public int? y { get; set; }

    }

    public class GroupUpdates
    {
        public int group_id { get; set; }
        public int? x { get; set; }
        public int? y { get; set; }
        public float? width { get; set; }
        public float? height { get; set; }

    }

}