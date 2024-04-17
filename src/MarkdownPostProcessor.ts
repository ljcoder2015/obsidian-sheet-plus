import {
	MarkdownPostProcessorContext,
	MetadataCache,
	TFile,
	Vault,
} from "obsidian";
import ExcelProPlugin from "./main";

let plugin: ExcelProPlugin;
let vault: Vault;
let metadataCache: MetadataCache;

export const initializeMarkdownPostProcessor = (p: ExcelProPlugin) => {
	plugin = p;
	vault = p.app.vault;
	metadataCache = p.app.metadataCache;
};

// 编辑模式
const tmpObsidianWYSIWYG = async (
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext
) => {
	const file = plugin.app.vault.getAbstractFileByPath(ctx.sourcePath);
	// console.log("tmpObsidianWYSIWYG");
	if (!(file instanceof TFile)) return;
	if (!plugin.isExcelFile(file)) return;

	//@ts-ignore
	if (ctx.remainingNestLevel < 4) {
		return;
	}

	//internal-embed: Excalidraw is embedded into a markdown document
	//markdown-reading-view: we are processing the markdown reading view of an actual Excalidraw file
	//markdown-embed: we are processing the hover preview of a markdown file
	//alt, width, and height attributes of .internal-embed to size and style the image

	//@ts-ignore
	const containerEl = ctx.containerEl;
	let internalEmbedDiv: HTMLElement = containerEl;
	while (
		!internalEmbedDiv.hasClass("dataview") &&
		!internalEmbedDiv.hasClass("cm-preview-code-block") &&
		!internalEmbedDiv.hasClass("cm-embed-block") &&
		!internalEmbedDiv.hasClass("internal-embed") &&
		!internalEmbedDiv.hasClass("markdown-reading-view") &&
		!internalEmbedDiv.hasClass("markdown-embed") &&
		internalEmbedDiv.parentElement
	) {
		internalEmbedDiv = internalEmbedDiv.parentElement;
	}

	if (
		internalEmbedDiv.hasClass("dataview") ||
		internalEmbedDiv.hasClass("cm-preview-code-block") ||
		internalEmbedDiv.hasClass("cm-embed-block")
	) {
		return; //https://github.com/zsviczian/obsidian-excalidraw-plugin/issues/835
	}

	const markdownEmbed = internalEmbedDiv.hasClass("markdown-embed");
	const markdownReadingView = internalEmbedDiv.hasClass(
		"markdown-reading-view"
	);
	if (
		!internalEmbedDiv.hasClass("internal-embed") &&
		(markdownEmbed || markdownReadingView)
	) {
		//We are processing the markdown preview of an actual Excalidraw file
		//the excalidraw file in markdown preview mode
		const isFrontmatterDiv = Boolean(el.querySelector(".frontmatter"));
		el.empty();
		if (!isFrontmatterDiv) {
			if (el.parentElement === containerEl) containerEl.removeChild(el);
			return;
		}
		internalEmbedDiv.empty();

		const data = await vault.read(file);
		var src = internalEmbedDiv.getAttribute("src") ?? "";
		// 是否转换成HTML
		var toHTML = false;
		if (src.includes("{html}")) {
			toHTML = true;
			src = src.replace("{html}", "");
		}

		alt = internalEmbedDiv.getAttribute("alt") ?? "";
		if (alt.includes("{html}")) {
			// 单 sheet 中的某一区域
			toHTML = true;
			alt = alt.replace("{html}", "");
		}

		const split = src.split("#");
		var excelData = getExcelData(data);
		if (split.length > 1) {
			excelData = getExcelAreaData(data, split[1], alt);
		}
		
		// 生成内容
		if (toHTML) {
			const table = createEditSheetHtml(data, file, split[1], alt)
			internalEmbedDiv.appendChild(table);
		} else {
			const sheetDiv = createSheetEl(
				excelData,
				file,
				internalEmbedDiv.clientWidth
			);
			internalEmbedDiv.appendChild(sheetDiv);
		}

		if (markdownEmbed) {
			//display image on canvas without markdown frame
			internalEmbedDiv.removeClass("markdown-embed");
			internalEmbedDiv.removeClass("inline-embed");
		}
	}

	el.empty();

	if (internalEmbedDiv.hasAttribute("ready")) {
		return;
	}
	internalEmbedDiv.setAttribute("ready", "");

	internalEmbedDiv.empty();

	const data = await vault.read(file);
	var src = internalEmbedDiv.getAttribute("src") ?? "";

	// 是否转换成HTML
	var toHTML = false;
	if (src.includes("{html}")) {
		// 单 sheet 
		toHTML = true;
		src = src.replace("{html}", "");
	}

	var alt = internalEmbedDiv.getAttribute("alt") ?? "";
	if (alt.includes("{html}")) {
		// 单 sheet 中的某一区域
		toHTML = true;
		alt = alt.replace("{html}", "");
	}

	var heigh = parseInt(plugin.settings.sheetHeight);
	const matchResult = alt.match(/<(\d+)>/);

	if (matchResult && matchResult.length > 1) {
		const extractedValue = matchResult[1]; // 获取匹配到的数字
		//   console.log("Extracted value:", extractedValue);
		heigh = parseInt(extractedValue);
		alt = alt.replace(/<\d+>/, "");
	} else {
		//   console.log("No match found.");
	}

	const split = src.split("#");
	var excelData = getExcelData(data);
	if (split.length > 1) {
		excelData = getExcelAreaData(data, split[1], alt);
	}

	// console.log('internalEmbedDiv', excelData, src, alt)
	if (toHTML) {
		const table = createEditSheetHtml(data, file, split[1], alt)
		internalEmbedDiv.appendChild(table);
	} else {
		const sheetDiv = createSheetEl(
			excelData,
			file,
			internalEmbedDiv.clientWidth,
			heigh
		);
		internalEmbedDiv.appendChild(sheetDiv);
	}
	if (markdownEmbed) {
		//display image on canvas without markdown frame
		internalEmbedDiv.removeClass("markdown-embed");
		internalEmbedDiv.removeClass("inline-embed");
	}
};


/**
 * 编辑模式下转换成 HTML 显示
 * @param data markdown 文件原始data
 * @param sheet sheet 名称
 * @param cells 选中的cells 格式为: sri-sci:eri-eci 例如 6-6:7-8
 * @returns
 */
const createEditSheetHtml = (
	excelData: string,
	file: TFile,
	sheet: string,
	cells: string
): HTMLDivElement => {
	const sheetDiv = createDiv();
	
	if (plugin.settings.showSheetButton == "true") {
		const fileEmbed = sheetDiv.createDiv({
			cls: "internal-embed file-embed mod-generic is-loaded",
			text: file.basename,
			attr: {
				src: file.basename,
				alt: file.basename,
				contenteditable: false,
				tabindex: -1,
			},
		});
	
		// 点击按钮打开 sheet
		fileEmbed.onClickEvent((e) => {
			e.stopPropagation();
			plugin.app.workspace.getLeaf().openFile(file);
		});
	}

	var table = getExcelAreaHtml(excelData, sheet, cells);
		
	var div = createDiv({
		cls: "sheet-html",
		attr: {
			tabindex: "-1",
			contenteditable: "false"
		}
	})
	div.appendChild(table)
	sheetDiv.appendChild(div);
	return sheetDiv;
};

/**
 * 预览模式下转换成 HTML 显示
 * @param data markdown 文件原始data
 * @param sheet sheet 名称
 * @param cells 选中的cells 格式为: sri-sci:eri-eci 例如 6-6:7-8
 * @returns
 */
const createSheetHtml = (
	data: string,
	file: TFile,
	sheet: string,
	cells: string
): HTMLDivElement => {
	const sheetDiv = createDiv();

	if (plugin.settings.showSheetButton == "true") {
		const fileEmbed = sheetDiv.createDiv({
			cls: "internal-embed file-embed mod-generic is-loaded",
			text: file.basename,
			attr: {
				src: file.basename,
				alt: file.basename,
				contenteditable: false,
				tabindex: -1,
			},
		});
	
		// 点击按钮打开 sheet
		fileEmbed.onClickEvent((e) => {
			e.stopPropagation();
			plugin.app.workspace.getLeaf().openFile(file);
		});
	}

	const sheetEl = createDiv({
		attr: {
			style: "overflow-x: auto;"
		},
	});

	const table = getExcelAreaHtml(data, sheet, cells);
	sheetEl.appendChild(table);
	sheetDiv.appendChild(sheetEl);
	return sheetDiv;
};

/**
 *  bembed link 显示
 */
const createSheetEl = (
	data: string,
	file: TFile,
	width: number,
	height: number = 300
): HTMLDivElement => {
	const sheetDiv = createDiv();

	if (plugin.settings.showSheetButton == "true") {
		const fileEmbed = sheetDiv.createDiv({
			cls: "internal-embed file-embed mod-generic is-loaded",
			text: file.basename,
			attr: {
				src: file.basename,
				alt: file.basename,
				contenteditable: false,
				tabindex: -1,
			},
		});
	
		// 点击按钮打开 sheet
		fileEmbed.onClickEvent((e) => {
			e.stopPropagation();
			plugin.app.workspace.getLeaf().openFile(file);
		});
	}
	// <div class="internal-embed file-embed mod-generic is-loaded" tabindex="-1" src="Excel 2023-09-07 17.18.19.sheet" alt="Excel 2023-09-07 17.18.19.sheet" contenteditable="false"><div class="file-embed-title"><span class="file-embed-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-file"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></span> Excel 2023-09-07 17.18.19.sheet</div></div>
	

	const sheetEl = createDiv({
		cls: "sheet-iframe",
		attr: {
			id: `x-spreadsheet-${new Date().getTime()}`,
			style: `height: ${height}px`,
		},
	});

	const jsonData = JSON.parse(data || "{}") || {};
	// console.log("createSheetEl", jsonData, data)

	// 设置 sheet 样式
	var style = {
		bgcolor: "#ffffff",
		align: "left",
		valign: "middle",
		textwrap: false,
		strike: false,
		underline: false,
		color: "#0a0a0a",
		font: {
			name: "Helvetica",
			size: 10,
			bold: false,
			italic: false,
		},
	};

	if (plugin.settings.theme === "dark") {
		style = {
			bgcolor: "#363636",
			align: "left",
			valign: "middle",
			textwrap: false,
			strike: false,
			underline: false,
			color: "#e6e6e6",
			font: {
				name: "Helvetica",
				size: 10,
				bold: false,
				italic: false,
			},
		};
	}

	//@ts-ignore
	const sheet = new Spreadsheet(sheetEl, {
		mode: "read",
		showToolbar: false,
		showBottomBar: true,
		view: {
			height: () => height,
			width: () => width - 10,
		},
		row: {
			len: parseInt(plugin.settings.defaultRowsLen),
			height: parseInt(plugin.settings.rowHeight),
		},
		col: {
			len: parseInt(plugin.settings.defaultColsLen),
			width: parseInt(plugin.settings.colWidth),
			indexWidth: 60,
			minWidth: 60,
		},
		// @ts-ignore
		style: style,
		isDark: plugin.settings.theme === "dark",
	}).loadData(jsonData); // load data

	updateSheetTheme(plugin.settings.theme === "dark");

	// @ts-ignore
	sheet.validate();
	sheetDiv.appendChild(sheetEl);
	return sheetDiv;
};

/**
 *
 * @param el
 * @param ctx
 */
export const markdownPostProcessor = async (
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext
) => {
	//check to see if we are rendering in editing mode or live preview
	//if yes, then there should be no .internal-embed containers
	const embeddedItems = el.querySelectorAll(".internal-embed");
	// console.log("markdownPostProcessor", embeddedItems.length);
	if (embeddedItems.length === 0) {
		tmpObsidianWYSIWYG(el, ctx);
		return;
	}

	await processReadingMode(embeddedItems, ctx);
};

const processReadingMode = async (
	embeddedItems: NodeListOf<Element> | [HTMLElement],
	ctx: MarkdownPostProcessorContext
) => {
	// console.log("processReadingMode");
	//We are processing a non-excalidraw file in reading mode
	//Embedded files will be displayed in an .internal-embed container

	//Iterating all the containers in the file to check which one is an excalidraw drawing
	//This is a for loop instead of embeddedItems.forEach() because processInternalEmbed at the end
	//is awaited, otherwise excalidraw images would not display in the Kanban plugin
	embeddedItems.forEach(async (maybeDrawing, index) => {
		//check to see if the file in the src attribute exists
		// console.log(maybeDrawing);
		const fname = maybeDrawing.getAttribute("src")?.split("#")[0];
		if (!fname) return true;

		const file = metadataCache.getFirstLinkpathDest(fname, ctx.sourcePath);
		// console.log("forEach", file, ctx.sourcePath);

		//if the embeddedFile exits and it is an Excalidraw file
		//then lets replace the .internal-embed with the generated PNG or SVG image
		if (file && file instanceof TFile && plugin.isExcelFile(file)) {
			maybeDrawing.parentElement?.replaceChild(
				await processInternalEmbed(maybeDrawing, file),
				maybeDrawing
			);
		}
	});
};

const processInternalEmbed = async (
	internalEmbedEl: Element,
	file: TFile
): Promise<HTMLDivElement> => {
	var src = internalEmbedEl.getAttribute("src");
	//@ts-ignore
	if (!src) return;

	//https://github.com/zsviczian/obsidian-excalidraw-plugin/issues/1059
	internalEmbedEl.removeClass("markdown-embed");
	internalEmbedEl.removeClass("inline-embed");

	const data = await vault.read(file);

	
	// 是否转换成HTML
	var toHTML = false;
	if (src.includes("{html}")) {
		toHTML = true;
		src = src.replace("{html}", "");
	}

	var alt = internalEmbedEl.getAttribute("alt") ?? "";
	if (alt.includes("{html}")) {
		// 单 sheet 中的某一区域
		toHTML = true;
		alt = alt.replace("{html}", "");
	}
	
	const split = src.split("#");
	var excelData = getExcelData(data);
	if (split.length > 1) {
		excelData = getExcelAreaData(data, split[1], alt);
	}


	// console.log('internalEmbedDiv', excelData, src, alt, toHTML)
	if (toHTML) {
		return await createSheetHtml(data, file, split[1], alt);
	} else {
		return await createSheetEl(
			excelData,
			file,
			internalEmbedEl.clientWidth
		);
	}
};
