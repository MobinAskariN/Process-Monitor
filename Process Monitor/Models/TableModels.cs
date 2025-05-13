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

        [Column("X_Coor")]
        public int? x { get; set; }

        [Column("Y_Coor")]
        public int? y { get; set; }

        [Column("Previous_Parent")]
        public int? previous_process_group { get; set; }

        public void Edit_start_method()
        {
            if (this.start_method == "کاربر")
            {
                this.start_method = "user";
            }
            else if (this.start_method == "زیرفرآیند")
            {
                this.start_method = "subprocess";
            }
            else if (this.start_method == "دوره ای")
            {
                this.start_method = "periodic";
            }
        }
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

        [Column("X_Coor")]
        public int? x { get; set; }

        [Column("Y_Coor")]
        public int? y { get; set; }

        [Column("Width")]
        public float? width { get; set; }

        [Column("Height")]
        public float? height { get; set; }

    }


    [Table("ارتباطات")] 
    public class Relations
    {
        [Column("شناسه فرآیند مبدا")]
        public int beginning_process_id { get; set; }

        [Column("شناسه فرآیند مقصد")]
        public int ending_process_id { get; set; }

        [Column("متغیرها")]
        public string parameters_str { get; set; }

        [NotMapped] 
        public Dictionary<string, string> parameters { get; set; }

        public void ExtractParameters()
        {
            string input = this.parameters_str;
            var result = new Dictionary<string, string>();

            // Remove curly braces and split by "), (" to get individual pairs
            string cleanedInput = input.Trim('{', '}');
            if (string.IsNullOrEmpty(cleanedInput))
            {
                this.parameters = result;
                return;
            }

            var pairs = cleanedInput.Split(new string[] { "), (" }, StringSplitOptions.None);

            foreach (var pair in pairs)
            {
                // Clean up parentheses and split by colon
                string cleanedPair = pair.Trim('(', ')');
                var keyValue = cleanedPair.Split(':');

                if (keyValue.Length == 2)
                {
                    string key = keyValue[0].Trim();
                    string value = keyValue[1].Trim();
                    result[key] = value;
                }
            }

            this.parameters = result;
        }
    }

    [Table("رنگ بندی")]
    public class Coloring
    {
        [Key]
        [Column("سطح")]
        public int depth { get; set; }

        [Column("رنگ")]
        public string color { get; set; }
    }



}