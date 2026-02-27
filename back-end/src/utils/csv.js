exports.toCSV = (header, dataRows) => {
    if (!Array.isArray(header) || header.length === 0) {
      throw new Error("CSV header must be a non-empty array");
    }
  
    if (!Array.isArray(dataRows) || dataRows.length === 0) {
      // caller can decide to return 204; here we just return empty string
      return "";
    }
  
    const escape = (value) => {
      if (value === null || value === undefined) return "";
      const s = String(value);
  
      // If value contains comma, quote, or newline, wrap in quotes and escape quotes
      if (/[,"\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
  
    const headerLine = header.join(",");
  
    const dataLines = dataRows.map((row) =>
      header.map((col) => escape(row[col])).join(",")
    );
  
    return [headerLine, ...dataLines].join("\n");
  };
  