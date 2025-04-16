using Newtonsoft.Json;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System;

namespace Process_Monitor.Models
{

    [Table("داده های فرآیندی")] 
    public class ProcessData
    {
        [Key]
        [Column("شناسه فرآیند")]
        public int process_id { get; set; }

        [Column("عنوان فرآیند")]
        public string process_title { get; set; }

        [Column("گروه فرآیند")]
        public int process_group { get; set; }

        [Column("تعداد دفعات تکرار")]
        public int repetition_num { get; set; }

        [Column("متوسط زمانبری")]
        public double average_duration { get; set; }

        [Column("انحراف از معیار")]
        public int standard_deviation { get; set; }

        [Column("روش آغاز")]
        public string start_method { get; set; }

        [Column("وضعیت")]
        public string status { get; set; }

        [Column("توضیحات نوع اول")]
        public string description_type1 { get; set; }

        [Column("توضیحات نوع دوم")]
        public string description_type2 { get; set; }

    }

    [Table("گروه بندی")] 
    public class Grouping
    {
        [Key]
        [Column("شناسه گروه")]
        public int group_id { get; set; }

        [Column("عنوان گروه")]
        public string group_title { get; set; }

        [Column("شناسه والد")]
        public int? parent_id { get; set; }
    }

    
    [Table("ارتباطات")] 
    public class Relations
    {
        [Column("شناسه فرآیند مبدا")]
        public int beginning_process_id { get; set; }

        [Column("شناسه فرآیند مقصد")]
        public int ending_process_id { get; set; }

        [Column("متغیرها")]
        public string parameters { get; set; }
    }


}