import ExcelProPlugin from "src/main";
import {
	TextFileView,
	WorkspaceLeaf,
	Platform,
	Notice,
	moment,
} from "obsidian";
import { VIEW_TYPE_EXCEL_PRO, FRONTMATTER } from "./constants";
import { t } from "src/lang/helpers";
import { FUniver } from "@univerjs/facade";
import { IDisposable } from '@wendellhu/redi';
import { createUniver } from "./setup-univer";
import { randomString } from "./utils/uuid";
import { Univer, IWorkbookData, Workbook, LocaleType } from "@univerjs/core";
import { extractYAML, splitYAML, rangeToRangeString, renderToHtml } from "./utils/data-util";

// import DataWorker from "web-worker:./workers/data.worker.ts";

export class ExcelProView extends TextFileView {
	public plugin: ExcelProPlugin;
	public ownerWindow: Window;
	public importEle: HTMLElement;
	public exportEle: HTMLElement;
	public embedLinkEle: HTMLElement;
	public copyHTMLEle: HTMLElement;
	public sheetEle: HTMLElement;
	public univerAPI: FUniver; // 表格操作对象
	public univer: Univer | null; // 表格对象
	public workbook: Workbook; // 工作簿
	public executedDisposable: IDisposable; // 执行命令后监听对象

	private lastWorkbookData: string; // 上次保存的数据
	// private dataWorker: Worker; // 用来异步解析数据

	constructor(leaf: WorkspaceLeaf, plugin: ExcelProPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	onload(): void {
		super.onload();
		console.log("Excel Pro View onload");
		this.ownerWindow = this.containerEl.win;

		// 添加顶部导入按钮
		// this.importEle = this.addAction(
		// 	"download",
		// 	t("IMPORT_XLSX_FILE"),
		// 	(ev) => this.handleImportClick(ev)
		// );

		// this.exportEle = this.addAction("upload", t("EXPORT_XLSX_FILE"), (ev) =>
		// 	this.handleExportClick(ev)
		// );

		this.embedLinkEle = this.addAction("link", t("COPY_EMBED_LINK"), (ev) =>
			this.handleEmbedLink(ev)
		);

		this.copyHTMLEle = this.addAction(
			"file-code",
			t("COPY_TO_HTML"),
			(ev) => this.copyToHTML()
		);

		// data worker 处理存储数据
		// this.dataWorker = new DataWorker();

		// this.dataWorker.onmessage = (e) => {
		// 	console.log("Message received from worker =======", e);

		// 	const { name, options } = e.data;
		// 	if (name === "save-data") {
		// 		this.saveDataToFile(options);
		// 	}
		// };
	}

	onunload(): void {
		console.log(`Excel Pro View onunload`);
		// 释放 univer 相关对象
		this.dispose();

		// 释放 worker 线程
		// if (this.dataWorker) {
		// 	this.dataWorker.terminate();
		// }

		super.onunload();
	}

	dispose() {
		// 释放工作簿
		if (this.workbook != null) {
			this.workbook.dispose();
		}

		// 释放 univer 事件监听
		if (this.executedDisposable != null) {
			this.executedDisposable.dispose();
		}

		// 释放 univer
		if (this.univer != null) {
			this.univer.__getInjector().dispose();
			this.univer.dispose();
			this.univer = null;
		}
	}

	getViewType(): string {
		return VIEW_TYPE_EXCEL_PRO;
	}

	setupUniver() {
		this.contentEl.empty();
		this.sheetEle = this.contentEl.createDiv({
			attr: {
				id: "sheet-box",
			},
		});

		const id = "univer-" + randomString(6);
		this.sheetEle.createDiv({
			attr: {
				id: id,
				class: "my-univer",
			},
		});

		this.dispose();

		// 设置多语言
		let locale = LocaleType.EN_US;
		if (moment.locale() === "zh-cn") {
			locale = LocaleType.ZH_CN;
		}
		const univer = createUniver(id, locale, true);
		this.univer = univer;
		this.univerAPI = FUniver.newAPI(this.univer);

		const markdown = splitYAML(this.data)?.rest;
		// const data = markdownToJSON(markdown);
		if (markdown) {
			const data = JSON.parse(markdown);
			if (data) {
				// workbookData 的内容都包含在 workbook 字段中
				const workbookData: IWorkbookData = data;
				this.workbook = this.univer.createUniverSheet(workbookData);
			} else {
				this.workbook = this.univer.createUniverSheet({});
			}
		} else {
			this.workbook = this.univer.createUniverSheet({});
		}

		this.executedDisposable = this.univerAPI.onCommandExecuted(
			(command) => {
				const blackList = [
					"sheet.operation.set-scroll",
					"sheet.command.set-scroll-relative",
					"sheet.operation.set-selections",
					"doc.operation.set-selections",
					"sheet.operation.set-activate-cell-edit",
					"sheet.operation.set-selections",
					"sheet.command.scroll-view",
					"formula-ui.operation.search-function",
					"formula-ui.operation.help-function",
					"formula.mutation.set-formula-calculation-start"
				];

				if (blackList.contains(command.id)) {
					return;
				}

				const activeWorkbook = this.univerAPI.getActiveWorkbook();
				if (!activeWorkbook)
					throw new Error("activeWorkbook is not defined");

				const activeWorkbookData = JSON.stringify(
					activeWorkbook.getSnapshot(),
					null,
					2
				);

				if (this.lastWorkbookData === null) {
					// 第一次加载不处理
					this.lastWorkbookData = activeWorkbookData;
					return;
				}

				if (this.lastWorkbookData === activeWorkbookData) {
					// 没变化不处理
					return;
				}

				console.log(command);

				// console.log("\n===onCommandExecuted===\n", activeWorkbookData, "\n===command===", command)

				this.lastWorkbookData = activeWorkbookData;

				this.saveDataToFile(activeWorkbookData);
			}
		);
	}

	getViewData(): string {
		return this.data;
	}

	headerData() {
		let header = extractYAML(this.data);

		if (header == null) {
			header = FRONTMATTER;
		} else {
			// 添加 --- 分隔符
			header = ["---", "", `${header}`, "", "---", "", ""].join("\n");
		}

		return header;
	}

	// 存储数据，把 workbook data 转换成 markdown 存储
	// saveData(data: string) {
	// 	this.dataWorker.postMessage({
	// 		name: "save-data",
	// 		options: data,
	// 	});
	// }

	saveDataToFile(data: string) {
		const yaml = this.headerData();

		this.data = yaml + data;

		this.save(false)
			.then(() => {
				console.log("save data success", this.file);
			})
			.catch((e) => {
				console.log("save data error", e);
			});
	}

	clear(): void {
		this.data = this.headerData();
	}

	setViewData(data: string, clear: boolean): void {
		this.data = data;

		this.app.workspace.onLayoutReady(async () => {
			// console.log("setViewData", data);
			this.setupUniver();
		});
	}

	// 处理顶部导入按钮点击事件
	handleImportClick(ev: MouseEvent) {
		const importEle = document.getElementById("import");
		importEle?.click();
	}

	handleFile(e: Event) {
		//@ts-ignore
		// const files = e.target?.files;
		// if (!files) {
		// 	new Notice(t("GET_FILE_FAILED"));
		// 	return;
		// }
		// const f = files[0];
		// const reader = new FileReader();
		// reader.onload = (e) => {
		// 	const data = e.target?.result;
		// 	if (data) {
		// 		this.process_wb(XLSX.read(data));
		// 	} else {
		// 		new Notice(t("READ_FILE_FAILED"));
		// 	}
		// };
		// reader.readAsArrayBuffer(f);
	}

	// process_wb(wb: XLSX.WorkBook) {
	// 	const sheetData = stox(wb);
	// 	if (sheetData) {
	// 		this.sheet.loadData(sheetData);
	// 		this.saveData(JSON.stringify(sheetData));
	// 	} else {
	// 		new Notice(t("DATA_PARSING_ERROR"));
	// 	}
	// }

	handleExportClick(ev: MouseEvent) {
		//@ts-ignore
		// const new_wb = xtos(this.sheet.getData()) as XLSX.WorkBook;
		// const title = this.file?.basename ?? "sheet";
		// /* write file and trigger a download */
		// XLSX.writeFile(new_wb, title + ".xlsx", {});
	}

	handleEmbedLink(e: Event) {
		const activeWorkbook = this.univerAPI.getActiveWorkbook();
		const activeSheet = activeWorkbook?.getActiveSheet();
		const selection = activeSheet?.getSelection();
		const range = selection?.getActiveRange();

		if (range) {
			const rangeString = rangeToRangeString(range)
			// 格式 ${sci}${sri}:${eci}${eri}
			if (this.file && activeSheet) {
				const link = `![[${this.file.basename}#${activeSheet?.getSheetId()}|${rangeString}]]`;
				console.log(range, link);
				navigator.clipboard.writeText(link);
				new Notice(t("COPY_EMBED_LINK_SUCCESS"));
			} else {
				new Notice(t("COPY_EMBED_LINK_FAILED"));
			}
		}
	}

	copyToHTML() {
		const workbook = this.univerAPI.getActiveWorkbook()

		const workbookData = workbook?.getSnapshot()
		if (workbookData == undefined) {
			return
		}

		const sheet = workbook?.getActiveSheet()
		if (sheet == null || sheet == undefined) {
			return
		}

		const range = sheet?.getSelection()?.getActiveRange()
		if (range == null || range == undefined) {
			return
		}

		const rangeString = rangeToRangeString(range)
		const html = renderToHtml(workbookData, sheet.getSheetId(), rangeString)
		const htmlString = html.outerHTML
		// console.log("htmlString", html, htmlString)
		navigator.clipboard.writeText(htmlString);
		new Notice(t("COPY_TO_HTML_SUCCESS"));
	}

	onResize() {
		if (Platform.isDesktopApp) {
			// this.refresh();
		}
		// console.log('resize')
		super.onResize();
	}
}
