// English
export default {
  // Main.ts
  CREATE_EXCEL: 'Create excel file',
  OPEN_AS_EXCEL: 'Open as excel',

  // ExcelView.ts
  GET_FILE_FAILED: 'Failed to get file',
  READ_FILE_FAILED: 'Read file error',
  DATA_PARSING_ERROR: 'Data parsing error',
  COPY_EMBED_LINK: 'copy embed link',
  COPY_EMBED_LINK_SUCCESS: 'Copy embed link to clipboard',
  COPY_EMBED_LINK_FAILED: 'Copy embed link failed',

  COPY_TO_HTML_FAILED: 'Copy embed link failed',
  COPY_TO_HTML_SUCCESS: 'copy to HTML',
  COPY_TO_HTML: 'copy to HTML',

  PLEASE_SELECT_DATA: 'Please first select the data to copy',

  IMPORT_XLSX_FILE: 'import xlsx file',
  EXPORT_XLSX_FILE: 'export xlsx file',

  SAVE_DATA_ERROR: 'save data error',

  // ExcelSettingTab.ts
  BASE_COLOR: 'Base color scheme',
  BASE_COLOR_DESC: 'Choose default color scheme',
  FILE_SETTING: 'File',
  FOLDER: 'Folder',
  FOLDER_DESC: 'Create files in this folder by default',
  FILENAME_PREFIX: 'Filename prefix',
  FILENAME_PREFIX_DESC: 'Filename prefix',
  FILENAME_DATE_TIME: 'Filename date time',
  FILENAME_DATE_TIME_DESC: 'Filename date time',
  EMBED_LINK_SETTING: 'Embed link',
  SHEET_HEIGHT: 'Sheet height',
  SHEET_HEIGHT_DESC: 'Default height for rendering spreadsheets',
  SHEET_SETTING: 'Sheet',
  ROW_HEIGHT: 'Row height',
  ROW_HEIGHT_DESC: 'Default row height',
  COLUMN_WIDTH: 'Column width',
  COLUMN_WIDTH_DESC: 'Default column width',
  DEFAULT_ROWS_LEN: 'Default render rows',
  DEFAULT_ROWS_LEN_DESC: 'Default number of render rows',
  DEFAULT_COLS_LEN: 'Default render columns',
  DEFAULT_COLS_LEN_DESC: 'Default number of rendered columns',
  SHOW_SHEET_BUTTON: 'Jump to Original Text Button',
  SHOW_SHEET_BUTTON_DESC: 'This option determines whether to display a button for jumping to the original content via an embedded link.',
  SHOW_SHEET_FOOTER: 'Enable Sheet Footer Display',
  SHOW_SHEET_FOOTER_DESC: 'When this option is enabled, the embedded table link will automatically display content at the bottom of the Sheet.',

  UNIVER_SETTING: 'Univer Setting',

  MOBILE_RENDER_MODE: 'Mobile Render Mode',
  MOBILE_RENDER_MODE_DESC: 'Mobile rendering mode: select mobile to render in mobile style, and desktop to render in desktop client style.',

  NUMBER_FORMAT_LOCALE: 'Number format locale settings',
  NUMBER_FORMAT_LOCALE_DESC: 'Set the locale for number formatting',

  AUTHORIZATION_CODE: 'Authorization code',
  AUTHORIZATION_CODE_GET: 'Get Authorization code',
  AUTHORIZATION_CODE_DESC: 'Enter the authorization code to activate advanced functions',
  AUTHORIZATION_CODE_SUBMIT: 'Submit',
  AUTHORIZATION_CODE_SUCCESS: 'Successful activation',
  AUTHORIZATION_CODE_FAILED: 'Activation failed. Please check whether the activation code is correct',

  COMMAND_LINK_UNIVER: 'Generate spreadsheet embed links',
  COMMAND_LINK_HTML: 'Generate HTML embed links',
  COMMAND_LINK_CHARTS_BAR: 'Generate Bar Chart embed links',
  COMMAND_LINK_CHARTS_BAR_RACING: 'Generate Bar Racing Chart embed links',
  COMMAND_LINK_CHARTS_LINE: 'Generate Line Chart embed links',
  COMMAND_LINK_CHARTS_AREA: 'Generate Line Area Chart embed links',
  COMMAND_LINK_CHARTS_PIE: 'Generate Pie Chart embed links',
  COMMAND_LINK_CHARTS_RING_PIE: 'Generate Ring Pie Chart embed links',

  LOADING: 'Loading...',

  TAB_TYPE_SHEET: 'Sheet',
  TAB_TYPE_KANBAN: 'Kanban',
  TAB_TYPE_GROUP: 'Group',
  TAB_TYPE_BI: 'BI',
  TAB_TYPE_PIVOT: 'Pivot',

  TAB_MENU_DEFAULT: 'Default',
  TAB_MENU_DELETE: 'Delete',
  TAB_MENU_RENAME: 'Rename',
  CANNOT_DELETE_SHEET: 'Cannot delete default sheet',

  TAB_HELP_TITLE: 'Help Center',
  TAB_HELP_CONTENT: 'User Guide',

  TAB_RENAME_CANCEL: 'Cancel',
  TAB_RENAME_OK: 'OK',
  TAB_RENAME_TITLE: 'Rename',
  TAB_RENAME_PLACEHOLDER: 'Please input rename',

  KANBAN_NOT_GROUP: 'Not grouped',
  KANBAN_SETTING: 'Kanban Settings',
  KANBAN_SETTING_SHEET_ID: 'Data source',
  KANBAN_SETTING_SHEET_ID_DESC: 'Select the data source for the kanban',
  KANBAN_SETTING_GROUP_BY: 'Grouping field',
  KANBAN_SETTING_GROUP_BY_DESC: 'Select the grouping field for the kanban',
  KANBAN_SETTING_SUBMIT: 'OK',

  SHEET_NAME_NOT_MATCH: 'Auto-save file failed',
  SAVING_DATA: 'Saving data...',
  SAVE_IS_TAKING_LONG: 'Saving your previous file took a long time, please wait...',
  SAVE_IS_TAKING_VERY_LONG: 'For better performance, please consider splitting large files into smaller ones.',

  BIG_SHEET: 'Large Sheet',
  BIG_SHEET_DESC: 'When enabled, it can solve the issue of Obsidian indexing failure caused by large files, but it will affect search functionality and automatic updates of external links. <a href="https://github.com/ljcoder2015/obsidian-sheet-plus/wiki/What-is-Big-Sheet%3F">More Details</a>',

  IMPORTING: 'Importing...',

  FONT_FOLDER_NOT_FOUND: 'Font folder not found',
  FONT_FOLDER: 'Font folder',
  FONT_FOLDER_DESC: 'Scan all .woff/.woff2/.ttf fonts in this folder',

  // AI Assistant settings
  AI_ASSISTANT_SETTINGS: 'AI Assistant Settings',
  AI_PLATFORM: 'AI Platform',
  AI_PLATFORM_DESC: 'Select the AI platform to use',
  AI_MODEL: 'Model',
  AI_MODEL_DESC: 'Select the model to use',
  AI_API_KEY: 'API Key',
  AI_API_KEY_DESC: 'Enter your AI model API Key',
  AI_BASE_URL: 'Base URL',
  AI_BASE_URL_DESC: 'Enter the base URL for the AI model',
  AI_OPENAI: 'OpenAI',
  AI_QWEN_CHINA: 'QWen(China)',
  AI_QWEN: 'QWen(Singapore)',
  AI_GPT_5: 'GPT-5',
  AI_GPT_5_MINI: 'GPT-5 mini',
  AI_GPT_5_NANO: 'GPT-5 nano',
  AI_QWEN3_MAX: 'qwen3-max',
  AI_QWEN_PLUS: 'qwen-plus',
  AI_QWEN_FLASH: 'qwen-flash',
}
