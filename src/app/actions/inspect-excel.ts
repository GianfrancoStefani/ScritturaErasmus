"use server";

import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

export async function inspectExcel() {
  const filePath = path.join(process.cwd(), "KA220-E_AppForm.xlsx");
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });

  let logs = [];
  logs.push("Sheet Names: " + workbook.SheetNames.join(", "));

  const formSheet = workbook.Sheets["Form"];
  if (formSheet) {
    logs.push("--- Form Sheet Rows 1-20 ---");
    const json = XLSX.utils.sheet_to_json(formSheet, { header: "A", range: 0, defval: "" }); 
    logs.push(JSON.stringify(json.slice(0, 5), null, 2)); // Reduced logs
  }

  const wp1Sheet = workbook.Sheets["WP1"];
  if (wp1Sheet) {
      logs.push("--- WP1 Sheet Rows 1-20 ---");
      const jsonWP1 = XLSX.utils.sheet_to_json(wp1Sheet, { header: "A", range: 0, defval: "" });
      logs.push(JSON.stringify(jsonWP1.slice(0, 15), null, 2));
      
      const wp1Modules = jsonWP1.filter((row: any) => row["D"] && !isNaN(parseInt(row["D"])));
      logs.push(`Found ${wp1Modules.length} modules in WP1`);
      logs.push(JSON.stringify(wp1Modules.slice(0, 3), null, 2));
  }
  return { logs: logs.join("\n") };
}
