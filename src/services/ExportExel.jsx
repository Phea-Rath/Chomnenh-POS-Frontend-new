import * as XLSX from 'xlsx';
const ExportExel = ({ data, title }) => {
    const handleExport = () => {
        var wb = XLSX.utils.book_new();
        var ws = XLSX.utils.json_to_sheet(data);

        // Auto-size columns
        const colWidths = Object.keys(ws)
            .filter(key => key[0] !== "!")
            .reduce((widths, key) => {
                const col = key.replace(/[0-9]/g, "");
                const cellValue = ws[key].v ? ws[key].v.toString() : "";
                widths[col] = Math.max(widths[col] || 10, cellValue.length + 2); // add some padding
                return widths;
            }, {});
        ws["!cols"] = Object.values(colWidths).map(w => ({ wch: w }));

        // Find numeric columns
        const keys = Object.keys(data[0] || {});
        const numericTotals = {};
        keys.forEach(k => {
            if (typeof data[0][k] === "number") {
                numericTotals[k] = data.reduce((sum, row) => sum + (row[k] || 0), 0);
            }
        });

        // Add totals row (last row)
        const totalsRow = keys.map(k => {
            if (numericTotals[k] !== undefined) return numericTotals[k];
            if (k === keys[0]) return "Total"; // label in first column
            return "";
        });
        XLSX.utils.sheet_add_aoa(ws, [totalsRow], { origin: -1 });

        // Add footer with created date
        XLSX.utils.sheet_add_aoa(ws, [["Created " + new Date().toISOString()]], { origin: -1 });

        XLSX.utils.book_append_sheet(wb, ws, title || "Data");
        XLSX.writeFile(wb, (title || "Data") + ".xlsx");
    };


    return (
        <button onClick={handleExport} className="btn bg-[#03C755] text-white ml-5 border-[#00b544]">
            Export Excel
        </button>
    )

}
export default ExportExel;