import {
	TFile,
	Plugin,
	WorkspaceLeaf,
	normalizePath,
	ViewState,
	MarkdownView,
	Workspace,
	MenuItem,
	Menu,
} from "obsidian";

import { VIEW_TYPE_EXCEL_PRO, FRONTMATTER, FRONTMATTER_KEY } from "./constants";
import { around, dedupe } from "monkey-around";
import { ExcelProView } from "./excel-pro-view";
import { DEFAULT_SETTINGS, ExcelProSettings } from "./common/settings";
import { getExcelFilename, checkAndCreateFolder, getNewUniqueFilepath } from "./utils/file-utils";
import { PaneTarget } from "./common/modifierkey-helper";
import { t } from "./lang/helpers";
import { ExcelProSettingTab } from "./excel-pro-setting-tab";

export default class ExcelProPlugin extends Plugin {
	public settings: ExcelProSettings;
	private _loaded = false;

	async onload() {
		// 加载设置
		await this.loadSettings()

		this.addSettingTab(new ExcelProSettingTab(this.app, this))

		this.registerView(
			VIEW_TYPE_EXCEL_PRO,
			(leaf: WorkspaceLeaf) => new ExcelProView(leaf, this)
		);

		// This creates an icon in the left ribbon.
		this.addRibbonIcon("table", t("CREATE_EXCEL"), (e: MouseEvent) => {
			// Called when the user clicks the icon.
			this.createAndOpenExcel(
				getExcelFilename(this.settings),
				undefined,
				this.getBlackData()
			);
		});

		// markdwon后处理
		this.addMarkdownPostProcessor();

		//inspiration taken from kanban: https://github.com/mgmeyers/obsidian-kanban/blob/44118e25661bff9ebfe54f71ae33805dc88ffa53/src/main.ts#L267
		this.registerMonkeyPatches();

		this.switchToExcelAfterLoad();

		this.registerEventListeners();

		this.registerCommands();
	}

	onunload() {
		// 解决 Redi 重复注入报错
		//@ts-ignore
		window.RediContextCreated = false
		//@ts-ignore
		window.REDI_GLOBAL_LOCK = false
		console.log(window)
	}

	private getBlackData() {
		return FRONTMATTER;
	}

	private addMarkdownPostProcessor() {
		// initializeMarkdownPostProcessor(this);
		// this.registerMarkdownPostProcessor(markdownPostProcessor);
	}

	private registerEventListeners() {
		// const self = this;
		// //save Excalidraw leaf and update embeds when switching to another leaf
		// const activeLeafChangeEventHandler = async (leaf: WorkspaceLeaf) => {
		// 	console.log('activeLeafChangeEventHandler', leaf)
		// 	// this.switchToExcelAfterLoad()
		// };
		// self.registerEvent(
		// 	this.app.workspace.on(
		// 		"active-leaf-change",
		// 		activeLeafChangeEventHandler
		// 	)
		// );
	}

	private switchToExcelAfterLoad() {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;
		this.app.workspace.onLayoutReady(() => {
			let leaf: WorkspaceLeaf;
			const markdownLeaf = this.app.workspace.getLeavesOfType("markdown");
			console.log("switchToExcelAfterLoad", markdownLeaf);
			for (leaf of markdownLeaf) {
				if (
					leaf.view instanceof MarkdownView &&
					leaf.view.file &&
					self.isExcelFile(leaf.view.file)
				) {
					self.setExcelView(leaf);
				}
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private registerCommands() {
		const fileMenuHandlerCreateNew = (menu: Menu, file: TFile) => {
			menu.addItem((item: MenuItem) => {
				item.setTitle(t("CREATE_EXCEL")).onClick((e) => {
					let folderpath = file.path;
					if (file instanceof TFile) {
						folderpath = normalizePath(
							file.path.substr(
								0,
								file.path.lastIndexOf(file.name)
							)
						);
					}
					this.createAndOpenExcel(
						getExcelFilename(this.settings),
						folderpath
					);
				});
			});
		};

		this.registerEvent(
			this.app.workspace.on("file-menu", fileMenuHandlerCreateNew)
		);
	}

	private registerMonkeyPatches() {
		const key = "https://gitee.com/ljcoder2015/obsidian-excel-pro";
		this.register(
			around(Workspace.prototype, {
				getActiveViewOfType(old) {
					
					return dedupe(key, old, function (...args) {
						const result = old && old.apply(this, args);
						console.log("Workspace.prototype", result);

						const maybeSheetView = this.app?.workspace?.activeLeaf?.view;
						if (!maybeSheetView || !(maybeSheetView instanceof ExcelProView)) {
							return result;
						}
					});
				},
			})
		);
		
		//@ts-ignore
		if (!this.app.plugins?.plugins?.["obsidian-hover-editor"]) {
			this.register(
				//stolen from hover editor
				around(WorkspaceLeaf.prototype, {
					getRoot(old) {
						console.log("stolen from hover editor");
						return function () {
							const top = old.call(this);
							return top.getRoot === this.getRoot
								? top
								: top.getRoot();
						};
					},
				})
			);
		}

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;
		// Monkey patch WorkspaceLeaf to open Excel with ExcelProView by default
		this.register(
			around(WorkspaceLeaf.prototype, {
				// Excel can be viewed as markdown or Excalidraw, and we keep track of the mode
				// while the file is open. When the file closes, we no longer need to keep track of it.
				detach(next) {
					return function () {
						return next.apply(this);
					};
				},

				setViewState(next) {
					return function (state: ViewState, ...rest: any[]) {
						// console.log("setViewState state ===", state)
						if (
							// Don't force excalidraw mode during shutdown
							self._loaded &&
							// If we have a markdown file
							state.type === "markdown" &&
							state.state?.file
						) {
							
							// Then check for the excalidraw frontMatterKey
							const cache = self.app.metadataCache.getCache(state.state.file);

							// console.log("setViewState cache cccc", cache)
							if (
								cache?.frontmatter &&
								cache?.frontmatter[FRONTMATTER_KEY]
								|| state.state.file.contains(".univer.md")
							) {
								// console.log("setViewState --", cache)
								// If we have it, force the view type to excalidraw
								const newState = {
									...state,
									type: VIEW_TYPE_EXCEL_PRO,
								};

								return next.apply(this, [newState, ...rest]);
							}
						}

						return next.apply(this, [state, ...rest]);
					};
				},
			})
		);
	}

	public async setExcelView(leaf: WorkspaceLeaf) {
		await leaf.setViewState({
			type: VIEW_TYPE_EXCEL_PRO,
			state: leaf.view.getState(),
			popstate: true,
		} as ViewState);
	}

	public async createExcel(
		filename: string,
		foldername?: string,
		initData?: string
	): Promise<TFile> {
		const folderpath = normalizePath(
			foldername ? foldername : this.settings.folder
		);
		await checkAndCreateFolder(this.app.vault, folderpath);

		const fname = getNewUniqueFilepath(
			this.app.vault,
			filename,
			folderpath
		);
		const file = await this.app.vault.create(
			fname,
			initData ?? this.getBlackData()
		);

		return file;
	}

	public async createAndOpenExcel(
		filename: string,
		foldername?: string,
		initData?: string
	): Promise<string> {
		const file = await this.createExcel(filename, foldername, initData);
		this.openExcel(file, "new-pane", true, undefined);
		return file.path;
	}

	public openExcel(
		excelFile: TFile,
		location: PaneTarget,
		active = false,
		subpath?: string
	) {
		if (location === "md-properties") {
			location = "new-tab";
		}
		// eslint-disable-next-line no-var
		var leaf: WorkspaceLeaf | null = null;
		if (location === "popout-window") {
			leaf = this.app.workspace.openPopoutLeaf();
		}
		if (location === "new-tab") {
			leaf = this.app.workspace.getLeaf("tab");
		}
		if (!leaf) {
			leaf = this.app.workspace.getLeaf(false);
			if (
				leaf.view.getViewType() !== "empty" &&
				location === "new-pane"
			) {
				leaf = this.app.workspace.getMostRecentLeaf();
			}
		}

		leaf?.openFile(
			excelFile,
			!subpath || subpath === ""
				? { active, state: { type: VIEW_TYPE_EXCEL_PRO } }
				: {
						active,
						eState: { subpath },
						state: { type: VIEW_TYPE_EXCEL_PRO },
				}
		).then(() => {
			if (leaf) {
				this.setExcelView(leaf);
			}
		});
	}

	public isExcelFile(f: TFile) {
		if (!f) return false;
		if (f.extension === "univer") {
			return true;
		}
		const fileCache = f ? this.app.metadataCache.getFileCache(f) : null;
		console.log("isExcelFile", fileCache?.frontmatter, f)
		return (
			!!fileCache?.frontmatter &&
			!!fileCache?.frontmatter[FRONTMATTER_KEY]
		);
	}
}
