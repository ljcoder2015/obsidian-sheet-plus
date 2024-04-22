import { App, PluginSettingTab, Setting } from "obsidian";
import { t } from "./lang/helpers"
import ExcelProPlugin from "./main";

export class ExcelProSettingTab extends PluginSettingTab {
	plugin: ExcelProPlugin;

	constructor(app: App, plugin: ExcelProPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

    display() {
        const { containerEl } = this

        containerEl.empty()

        containerEl.createEl("h1", { text: t("FILE_SETTING") });

        new Setting(containerEl)
            .setName(t("FOLDER"))
            .setDesc(t("FOLDER_DESC"))
            .addText((text) => 
                text
                    .setPlaceholder("/")
                    .setValue(this.plugin.settings.folder)
                    .onChange(async (value) => {
                        this.plugin.settings.folder = value
                        this.plugin.saveSettings()
                    })
            )

        new Setting(containerEl)
            .setName(t("FILENAME_PREFIX"))
            .setDesc(t("FILENAME_PREFIX_DESC"))
            .addText((text) => 
                text
                    .setPlaceholder("Excel")
                    .setValue(this.plugin.settings.excelFilenamePrefix)
                    .onChange(async (value) => {
                        this.plugin.settings.excelFilenamePrefix = value
                        this.plugin.saveSettings()
                    })
            )

        new Setting(containerEl)
            .setName(t("FILENAME_DATE_TIME"))
            .setDesc(t("FILENAME_DATE_TIME_DESC"))
            .addText((text) => 
                text
                    .setPlaceholder("YYYY-MM-DD HH.mm.ss")
                    .setValue(this.plugin.settings.excelFilenameDateTime)
                    .onChange(async (value) => {
                        this.plugin.settings.excelFilenameDateTime = value
                        this.plugin.saveSettings()
                    })
            )

        containerEl.createEl("h1", { text: t("EMBED_LINK_SETTING") });
                    
        new Setting(containerEl)
            .setName(t("SHEET_HEIGHT"))
            .setDesc(t("SHEET_HEIGHT_DESC"))
            .addText((text) => 
                text
                    .setPlaceholder("300")
                    .setValue(this.plugin.settings.sheetHeight)
                    .onChange(async (value) => {
                        this.plugin.settings.sheetHeight = value
                        this.plugin.saveSettings()
                    })
            )
    }
}
