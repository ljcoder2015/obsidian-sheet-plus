// 简体中文
export default {
  // Main.ts
  CREATE_EXCEL: '创建 Excel 文件',
  OPEN_AS_EXCEL: '作为 Excel 文件打开',

  // ExcelView.ts
  GET_FILE_FAILED: '获取文件失败',
  READ_FILE_FAILED: '读取文件失败',
  DATA_PARSING_ERROR: '文件数据解析失败',
  COPY_EMBED_LINK: '拷贝内嵌链接',
  COPY_EMBED_LINK_SUCCESS: '已拷贝内嵌链接到剪切板',
  COPY_EMBED_LINK_FAILED: '拷贝内嵌链接失败',

  COPY_TO_HTML_FAILED: '拷贝为 HTML 失败',
  COPY_TO_HTML_SUCCESS: '拷贝为 HTML 成功',
  COPY_TO_HTML: '拷贝选中数据为 HTML',

  PLEASE_SELECT_DATA: '请选择要拷贝的数据',

  IMPORT_XLSX_FILE: '导入 xlsx 文件',
  EXPORT_XLSX_FILE: '导出 xlsx 文件',

  SAVE_DATA_ERROR: '保存数据错误',

  // ExcelSettingTab.ts
  BASE_COLOR: '基础颜色',
  BASE_COLOR_DESC: '选择默认基础色',
  FILE_SETTING: '文件设置',
  FOLDER: '文件夹',
  FOLDER_DESC: '新建文件将放在此文件夹下',
  FILENAME_PREFIX: '文件名前缀',
  FILENAME_PREFIX_DESC: '设置文件名前缀',
  FILENAME_DATE_TIME: '文件时间格式',
  FILENAME_DATE_TIME_DESC: '设置文件名的时间前缀',
  EMBED_LINK_SETTING: '嵌入链接设置',
  SHEET_HEIGHT: '表格高度',
  SHEET_HEIGHT_DESC: '设置嵌入表格渲染的默认高度',
  SHEET_SETTING: '表格设置',
  ROW_HEIGHT: '行高',
  ROW_HEIGHT_DESC: '设置表格的默认行高',
  COLUMN_WIDTH: '列宽',
  COLUMN_WIDTH_DESC: '设置表格的默认列宽',
  DEFAULT_ROWS_LEN: '默认渲染行数',
  DEFAULT_ROWS_LEN_DESC: '创建表格时默认渲染最大行数',
  DEFAULT_COLS_LEN: '默认渲染列数',
  DEFAULT_COLS_LEN_DESC: '创建表格时默认渲染最大列数',
  SHOW_SHEET_BUTTON: '跳转原文按钮',
  SHOW_SHEET_BUTTON_DESC: '此选项控制是否显示一个按钮，用于通过嵌入链接跳转到原文内容',
  SHOW_SHEET_FOOTER: '显示表格底部内容',
  SHOW_SHEET_FOOTER_DESC: '启用该选项后，嵌入的表格链接会自动显示表格底部内容',

  UNIVER_SETTING: 'Univer 配置',

  NUMBER_FORMAT_LOCALE: '数字格式区域设置',
  NUMBER_FORMAT_LOCALE_DESC: '设置数字格式的区域',

  MOBILE_RENDER_MODE: '渲染模式',
  MOBILE_RENDER_MODE_DESC: '渲染模式, 选择 mobile 渲染成手机端样式, desktop 渲染成客户端样式',

  AUTHORIZATION_CODE: '授权码',
  AUTHORIZATION_CODE_GET: '获取授权码',
  AUTHORIZATION_CODE_DESC: '输入授权码，激活高级功能',
  AUTHORIZATION_CODE_SUBMIT: '提交',
  AUTHORIZATION_CODE_SUCCESS: '激活成功',
  AUTHORIZATION_CODE_FAILED: '激活失败，请检查激活码是否正确',

  COMMAND_LINK_UNIVER: '生成 表格 嵌入链接',
  COMMAND_LINK_HTML: '生成 HTML 嵌入链接',
  COMMAND_LINK_CHARTS_BAR: '生成 柱状图 嵌入链接',
  COMMAND_LINK_CHARTS_BAR_RACING: '生成 条形图 嵌入链接',
  COMMAND_LINK_CHARTS_LINE: '生成 条形图 嵌入链接',
  COMMAND_LINK_CHARTS_AREA: '生成 面积图 嵌入链接',
  COMMAND_LINK_CHARTS_PIE: '生成 饼图 嵌入链接',
  COMMAND_LINK_CHARTS_RING_PIE: '生成 圆环图 嵌入链接',

  LOADING: '加载中...',

  TAB_TYPE_SHEET: '表格',
  TAB_TYPE_KANBAN: '看板',
  TAB_TYPE_CALENDAR: '日历',
  TAB_TYPE_GROUP: '分组',
  TAB_TYPE_BI: 'BI分析',
  TAB_TYPE_PIVOT: '透视表',

  TAB_MENU_DEFAULT: '默认显示',
  TAB_MENU_DELETE: '删除',
  TAB_MENU_RENAME: '重命名',
  CANNOT_DELETE_SHEET: '不能删除默认表格',

  TAB_HELP_TITLE: '帮助中心',
  TAB_HELP_CONTENT: '使用教程',

  TAB_RENAME_CANCEL: '取消',
  TAB_RENAME_OK: '确定',
  TAB_RENAME_TITLE: '重命名',
  TAB_RENAME_PLACEHOLDER: '请输入重命名',

  KANBAN_NOT_GROUP: '未分组',
  KANBAN_GROUP_BY: '分组依据',
  KANBAN_SETTING: '看板设置',
  KANBAN_SETTING_SHEET_ID: '数据源',
  KANBAN_SETTING_SHEET_ID_DESC: '选择看板的数据源',
  KANBAN_SETTING_GROUP_BY: '分组字段',
  KANBAN_SETTING_GROUP_BY_DESC: '选择看板的分组字段',
  KANBAN_SETTING_SUBMIT: '确定',

  SHEET_NAME_NOT_MATCH: '自动保存文件失败',
  SAVING_DATA: '数据保存中...',
  SAVE_IS_TAKING_LONG: '保存您之前的文件花费的时间较长，请稍候…',
  SAVE_IS_TAKING_VERY_LONG: '为了更好的性能，请考虑将文件拆分成几个较小的文件。',

  BIG_SHEET: '大表格',
  BIG_SHEET_DESC: '开启后，可以解决大文件导致 Obsdian 索引失败的问题，但是会影响搜索功能，自动更新外链功能. <a href="https://github.com/ljcoder2015/obsidian-sheet-plus/wiki/What-is-Big-Sheet%3F">更多说明</a>',

  IMPORTING: '导入中...',

  FONT_FOLDER_NOT_FOUND: '字体目录不存在',
  FONT_FOLDER: '字体目录',
  FONT_FOLDER_DESC: '扫描该目录下所有 .woff/.woff2/.ttf 字体',

  // Auto Save
  AUTO_SAVE: '自动保存',
  AUTO_SAVE_IDLE: '自动保存: 空闲',
  AUTO_SAVE_WAITING: '自动保存: 等待中',
  AUTO_SAVE_SAVING: '自动保存: 保存中',
  AUTO_SAVE_SAVED: '自动保存: 已保存 {{time}}',
  AUTO_SAVE_FAILED: '自动保存: 保存失败',
  AUTO_SAVE_FAILED_MSG: '自动保存: 保存失败 {{error}}',

  // AI Assistant settings
  AI_ASSISTANT_SETTINGS: 'AI助手设置',
  AI_PLATFORM: 'AI平台',
  AI_PLATFORM_DESC: '选择要使用的AI平台',
  AI_MODEL: '模型',
  AI_MODEL_DESC: '选择要使用的模型',
  AI_API_KEY: 'API密钥',
  AI_API_KEY_DESC: '输入您的AI模型API密钥',
  AI_BASE_URL: '基础URL',
  AI_BASE_URL_DESC: '输入AI模型的基础URL',
  AI_OPENAI: 'OpenAI',
  AI_QWEN_CHINA: '通义千问(中国)',
  AI_QWEN: '通义千问(新加坡)',
  AI_GPT_5: 'GPT-5',
  AI_GPT_5_MINI: 'GPT-5 mini',
  AI_GPT_5_NANO: 'GPT-5 nano',
  AI_QWEN3_MAX: 'qwen3-max',
  AI_QWEN_PLUS: 'qwen-plus',
  AI_QWEN_FLASH: 'qwen-flash',
  
  // Render Mode
  CHANGE_RENDER_MODE: '切换渲染模式',
}
