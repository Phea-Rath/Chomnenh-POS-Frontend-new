import * as XLSX from "xlsx";

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const resolveMappedValue = (row, mapping, normalizedRow) => {
  if (typeof mapping === "string") {
    return row[mapping] ?? normalizedRow[normalizeHeader(mapping)] ?? null;
  }

  const sourceKeys = [
    mapping?.from,
    mapping?.source,
    mapping?.header,
    mapping?.label,
    mapping?.name,
    mapping?.key,
    mapping?.to,
    mapping?.field,
  ].filter(Boolean);

  for (let i = 0; i < sourceKeys.length; i += 1) {
    const sourceKey = sourceKeys[i];
    const value = row[sourceKey] ?? normalizedRow[normalizeHeader(sourceKey)];
    if (value !== undefined) {
      return value;
    }
  }

  if ("defaultValue" in (mapping || {})) {
    return mapping.defaultValue;
  }

  return null;
};

const mapRow = (row, keyField) => {
  if (!Array.isArray(keyField) || keyField.length === 0) {
    return row;
  }

  const normalizedRow = {};
  for (const [key, value] of Object.entries(row)) {
    normalizedRow[normalizeHeader(key)] = value;
  }

  const mappedRow = {};

  keyField.forEach((mapping) => {
    if (typeof mapping === "string") {
      mappedRow[mapping] = resolveMappedValue(row, mapping, normalizedRow);
      return;
    }

    const targetKey =
      mapping?.to ||
      mapping?.key ||
      mapping?.field ||
      mapping?.name ||
      mapping?.header;

    if (!targetKey) {
      return;
    }

    const value = resolveMappedValue(row, mapping, normalizedRow);
    mappedRow[targetKey] =
      typeof mapping?.transform === "function" ? mapping.transform(value, row) : value;
  });

  return mappedRow;
};

const isEmptyRow = (row) =>
  Object.values(row).every(
    (value) => value === null || value === undefined || String(value).trim() === ""
  );

async function readFormFile(file, keyField = []) {
  if (!file) {
    return [];
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: null,
    raw: false,
  });

  return rows.map((row) => mapRow(row, keyField)).filter((row) => !isEmptyRow(row));
}

export default readFormFile;

//how to use it
//readFormFile(file, keyField)
//file: file object
//keyField: array of objects
//example:
//const keyField = [
//  { to: "name", from: "Item Name" },
//  { to: "code", from: "Code" },
//  { to: "price", from: "Price" },
//];
//readFormFile(file, keyField)
