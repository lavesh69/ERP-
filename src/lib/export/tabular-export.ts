/**
 * Tabular Data Export Engine
 * Generates secure CSV and Microsoft SpreadsheetML XML formats with
 * automatic defense against CSV Formula Injection (CWE-1236).
 */

export interface ExportColumnDefinition {
  key: string;
  label: string;
  type?: "string" | "number" | "currency" | "date";
}

/**
 * Escapes and sanitizes a cell value to prevent CSV Formula Injection.
 * Prepends a single quote if the value begins with dangerous formula triggers (=, +, -, @, \t, \r).
 */
export function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = String(value);

  // CSV Formula Injection Defense (CWE-1236)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // If cell contains commas, quotes, or newlines, wrap in quotes and escape internal quotes
  if (/[",\r\n]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generates a standard RFC 4180 compliant CSV string from an array of objects
 */
export function exportToCsv(
  rows: Record<string, any>[],
  columns?: ExportColumnDefinition[]
): string {
  if (!rows || rows.length === 0) {
    if (columns && columns.length > 0) {
      return columns.map((c) => sanitizeCsvCell(c.label)).join(",") + "\r\n";
    }
    return "";
  }

  const effectiveCols: ExportColumnDefinition[] =
    columns ||
    Object.keys(rows[0]).map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
    }));

  const headerLine = effectiveCols.map((c) => sanitizeCsvCell(c.label)).join(",");
  const dataLines = rows.map((row) =>
    effectiveCols.map((c) => sanitizeCsvCell(row[c.key])).join(",")
  );

  return [headerLine, ...dataLines].join("\r\n") + "\r\n";
}

/**
 * Generates Microsoft SpreadsheetML XML (Excel format) natively without third-party binary dependencies
 */
export function exportToExcelXml(
  rows: Record<string, any>[],
  sheetName: string = "ERP Export",
  columns?: ExportColumnDefinition[]
): string {
  const effectiveCols: ExportColumnDefinition[] =
    columns ||
    (rows.length > 0
      ? Object.keys(rows[0]).map((key) => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
        }))
      : []);

  const cleanSheetName = sheetName.replace(/[:\\/?*\[\]]/g, "_").slice(0, 31);

  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#242124"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Vertical="Center" ss:Horizontal="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C9829B"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#8E5368" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${cleanSheetName}">
  <Table>`;

  // Header Row
  xml += "\n   <Row ss:StyleID=\"Header\">";
  for (const col of effectiveCols) {
    const safeLabel = String(col.label).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    xml += `\n    <Cell><Data ss:Type="String">${safeLabel}</Data></Cell>`;
  }
  xml += "\n   </Row>";

  // Data Rows
  for (const row of rows) {
    xml += "\n   <Row>";
    for (const col of effectiveCols) {
      const val = row[col.key];
      if (val === null || val === undefined) {
        xml += "\n    <Cell><Data ss:Type=\"String\"></Data></Cell>";
      } else if (typeof val === "number") {
        xml += `\n    <Cell><Data ss:Type="Number">${val}</Data></Cell>`;
      } else {
        const safeVal = String(val).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        xml += `\n    <Cell><Data ss:Type="String">${safeVal}</Data></Cell>`;
      }
    }
    xml += "\n   </Row>";
  }

  xml += `
  </Table>
 </Worksheet>
</Workbook>`;

  return xml;
}
