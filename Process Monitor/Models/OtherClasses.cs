using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Process_Monitor.Models
{
    // these classes contain required informations for saving last status of process data
    public class ProcessUpdates
    {
        public int process_id { get; set; }
        public int process_group { get; set; }
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