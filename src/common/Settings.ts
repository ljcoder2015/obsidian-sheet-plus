export interface ExcelProSettings {
	folder: string;
	excelFilenamePrefix: string,
	excelFilenameDateTime: string,
	sheetHeight: string,
	rowHeight: string,
	colWidth: string
}

export const DEFAULT_SETTINGS: ExcelProSettings = {
	folder: "/",
	excelFilenamePrefix: "Excel ",
	excelFilenameDateTime: "YYYY-MM-DD HH.mm.ss",
	sheetHeight: "300",
	rowHeight: "25",
	colWidth: "100"
};
