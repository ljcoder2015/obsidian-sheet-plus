// 日本語

export default {
  // Main.ts
  CREATE_EXCEL: 'Excel ファイルを作成',
  OPEN_AS_EXCEL: 'Excel として開く',

  // ExcelView.ts
  GET_FILE_FAILED: 'ファイルの取得に失敗しました',
  READ_FILE_FAILED: 'ファイルの読み込みエラー',
  DATA_PARSING_ERROR: 'データの解析エラー',
  COPY_EMBED_LINK: '埋め込みリンクをコピー',
  COPY_EMBED_LINK_SUCCESS: '埋め込みリンクをクリップボードにコピーしました',
  COPY_EMBED_LINK_FAILED: '埋め込みリンクのコピーに失敗しました',

  COPY_TO_HTML_FAILED: 'HTML のコピーに失敗しました',
  COPY_TO_HTML_SUCCESS: 'HTML をコピーしました',
  COPY_TO_HTML: 'HTML としてコピー',

  PLEASE_SELECT_DATA: '先にコピーするデータを選択してください',

  IMPORT_XLSX_FILE: 'xlsx ファイルをインポート',
  EXPORT_XLSX_FILE: 'xlsx ファイルをエクスポート',

  SAVE_DATA_ERROR: 'データの保存エラー',

  // ExcelSettingTab.ts
  BASE_COLOR: 'ベースのカラースキーム',
  BASE_COLOR_DESC: 'デフォルトのカラースキームを選択します',
  BASE_COLOR_AUTO: 'Obsidian に従う',
  FILE_SETTING: 'ファイル',
  FILE_LOCATION_MODE: 'ファイルの保存場所',
  FILE_LOCATION_MODE_DESC: '新しい Univer ファイルを作成する場所を選択します',
  FILE_LOCATION_MODE_ROOT: '保管庫のルート',
  FILE_LOCATION_MODE_CURRENT: '現在のファイルと同じフォルダ',
  FILE_LOCATION_MODE_CURRENT_SUB: '現在のファイルのフォルダ内のサブフォルダ',
  FILE_LOCATION_MODE_SPECIFIED: '指定したフォルダ',
  FILE_SUB_FOLDER: 'サブフォルダ名',
  FILE_SUB_FOLDER_DESC: '現在のファイルのフォルダ内に作成するサブフォルダの名前',
  FOLDER: 'フォルダ',
  FOLDER_DESC: 'ファイルをデフォルトで作成するフォルダ',
  FILENAME_PREFIX: 'ファイル名の接頭辞',
  FILENAME_PREFIX_DESC: 'ファイル名の先頭に付ける文字列',
  FILENAME_DATE_TIME: 'ファイル名の日時形式',
  FILENAME_DATE_TIME_DESC: 'ファイル名に付ける日時の書式',
  EMBED_LINK_SETTING: '埋め込みリンク',
  SHEET_HEIGHT: 'シートの高さ',
  SHEET_HEIGHT_DESC: 'スプレッドシートを表示するときのデフォルトの高さ',
  SHEET_HEIGHT_MODE: 'シートの高さのモード',
  SHEET_HEIGHT_MODE_DESC: '埋め込みシートの高さの決め方を選択します。自動調整、またはカスタムのデフォルトの高さです',
  SHEET_HEIGHT_MODE_AUTO: '自動調整',
  SHEET_HEIGHT_MODE_CUSTOM: 'カスタム',
  SHEET_SETTING: 'シート',
  ROW_HEIGHT: '行の高さ',
  ROW_HEIGHT_DESC: 'デフォルトの行の高さ',
  COLUMN_WIDTH: '列の幅',
  COLUMN_WIDTH_DESC: 'デフォルトの列の幅',
  DEFAULT_ROWS_LEN: 'デフォルトの表示行数',
  DEFAULT_ROWS_LEN_DESC: '表示する行数のデフォルト値',
  DEFAULT_COLS_LEN: 'デフォルトの表示列数',
  DEFAULT_COLS_LEN_DESC: '表示する列数のデフォルト値',
  SHOW_SHEET_BUTTON: '元の文書へ移動するボタン',
  SHOW_SHEET_BUTTON_DESC: '埋め込みリンクから元の内容へ移動するボタンを表示するかどうかを設定します。',
  SHOW_SHEET_FOOTER: 'シートのフッターを表示',
  SHOW_SHEET_FOOTER_DESC: '有効にすると、埋め込まれた表のリンクがシートの下部に内容を自動的に表示します。',
  EMBED_LINK_OPEN_MODE: '埋め込みリンクの開き方',
  EMBED_LINK_OPEN_MODE_DESC: '埋め込みリンクのボタンをクリックしたときに、ファイルをどのように開くかを選択します',
  OPEN_MODE_SPLIT_RIGHT: '右に分割して開く',
  OPEN_MODE_CURRENT_TAB: '現在のタブで開く',

  UNIVER_SETTING: 'Univer の設定',

  MOBILE_RENDER_MODE: '表示モード',
  MOBILE_RENDER_MODE_DESC: '表示モード: モバイルを選ぶとモバイル向けのスタイルで、デスクトップを選ぶとデスクトップ版のスタイルで表示します。',

  RTL_DIRECTION: 'レイアウトの方向',
  RTL_DIRECTION_DESC: 'レイアウトの方向を設定します。右から左(RTL)は UI 部分にのみ適用されます。反映するにはシートを開き直してください。',

  DEFAULT_FONT_FAMILY: 'デフォルトのフォント',
  DEFAULT_FONT_FAMILY_DESC: 'セルの内容に使うデフォルトのフォントです。すでに開いているシートに反映するには、シートを開き直してください。個別にフォントを指定したセルには影響しません。',
  DEFAULT_FONT_FAMILY_NONE: 'デフォルト',

  NUMBER_FORMAT_LOCALE: '数値形式のロケール設定',
  NUMBER_FORMAT_LOCALE_DESC: '数値の書式に使うロケールを設定します',

  AUTHORIZATION_CODE: '認証コード',
  AUTHORIZATION_CODE_GET: '認証コードを取得',
  AUTHORIZATION_CODE_DESC: '認証コードを入力して、高度な機能を有効にします',
  AUTHORIZATION_CODE_SUBMIT: '送信',
  AUTHORIZATION_CODE_SUCCESS: '有効化に成功しました',
  AUTHORIZATION_CODE_FAILED: '有効化に失敗しました。認証コードが正しいか確認してください',

  COMMAND_LINK_UNIVER: 'スプレッドシートの埋め込みリンクを生成',
  COMMAND_LINK_HTML: 'HTML の埋め込みリンクを生成',
  COMMAND_LINK_CHARTS_BAR: '縦棒グラフの埋め込みリンクを生成',
  COMMAND_LINK_CHARTS_BAR_RACING: '横棒グラフ(バーチャートレース)の埋め込みリンクを生成',
  COMMAND_LINK_CHARTS_LINE: '折れ線グラフの埋め込みリンクを生成',
  COMMAND_LINK_CHARTS_AREA: '面グラフの埋め込みリンクを生成',
  COMMAND_LINK_CHARTS_PIE: '円グラフの埋め込みリンクを生成',
  COMMAND_LINK_CHARTS_RING_PIE: 'ドーナツグラフの埋め込みリンクを生成',

  LOADING: '読み込み中...',

  TAB_TYPE_SHEET: 'シート',
  TAB_TYPE_KANBAN: 'カンバン',
  TAB_TYPE_CALENDAR: 'カレンダー',
  TAB_TYPE_GROUP: 'グループ',
  TAB_TYPE_BI: 'BI',
  TAB_TYPE_PIVOT: 'ピボット',
  TAB_TYPE_DASHBOARD: 'ダッシュボード',

  TAB_MENU_DEFAULT: 'デフォルト',
  TAB_MENU_DELETE: '削除',
  TAB_MENU_RENAME: '名前を変更',
  CANNOT_DELETE_SHEET: 'デフォルトのシートは削除できません',

  TAB_HELP_TITLE: 'ヘルプセンター',
  TAB_HELP_CONTENT: 'ユーザーガイド',

  TAB_RENAME_CANCEL: 'キャンセル',
  TAB_RENAME_OK: 'OK',
  TAB_RENAME_TITLE: '名前を変更',
  TAB_RENAME_PLACEHOLDER: '新しい名前を入力してください',

  KANBAN_NOT_GROUP: 'グループ化しない',
  KANBAN_GROUP_BY: 'グループ化の基準',
  KANBAN_SETTING: 'カンバンの設定',
  KANBAN_SETTING_SHEET_ID: 'データソース',
  KANBAN_SETTING_SHEET_ID_DESC: 'カンバンのデータソースを選択します',
  KANBAN_SETTING_GROUP_BY: 'グループ化するフィールド',
  KANBAN_SETTING_GROUP_BY_DESC: 'カンバンのグループ化に使うフィールドを選択します',
  KANBAN_SETTING_SUBMIT: 'OK',

  SHEET_NAME_NOT_MATCH: 'ファイルの自動保存に失敗しました',
  SAVING_DATA: 'データを保存中...',
  SAVE_IS_TAKING_LONG: '直前のファイルの保存に時間がかかっています。しばらくお待ちください...',
  SAVE_IS_TAKING_VERY_LONG: 'パフォーマンス向上のため、大きなファイルは小さなファイルに分割することをおすすめします。',

  BIG_SHEET: '大きなシート',
  BIG_SHEET_DESC: '有効にすると、大きなファイルが原因で Obsidian のインデックス作成に失敗する問題を解消できますが、検索機能と外部リンクの自動更新に影響します。<a href="https://github.com/ljcoder2015/obsidian-sheet-plus/wiki/What-is-Big-Sheet%3F">詳細はこちら</a>',

  IMPORTING: 'インポート中...',
  EXPORTING: 'エクスポート中...',
  EXPORTED: 'エクスポートしました',

  FONT_FOLDER_NOT_FOUND: 'フォントフォルダが見つかりません',
  FONT_FOLDER: 'フォントフォルダ',
  FONT_FOLDER_DESC: 'このフォルダ内のすべての .woff/.woff2/.ttf フォントを読み込みます',

  // Auto Save
  AUTO_SAVE: '自動保存',
  AUTO_SAVE_IDLE: '自動保存: 待機中',
  AUTO_SAVE_WAITING: '自動保存: 保存待ち',
  AUTO_SAVE_SAVING: '自動保存: 保存中',
  AUTO_SAVE_SAVED: '自動保存: {{time}} に保存しました',
  AUTO_SAVE_FAILED: '自動保存: 失敗',
  AUTO_SAVE_FAILED_MSG: '自動保存: 失敗しました {{error}}',

  // AI Assistant settings
  AI_ASSISTANT_SETTINGS: 'AI アシスタントの設定',
  AI_PLATFORM: 'AI プラットフォーム',
  AI_PLATFORM_DESC: '使用する AI プラットフォームを選択します',
  AI_MODEL: 'モデル',
  AI_MODEL_DESC: '使用するモデルを選択します',
  AI_API_KEY: 'API キー',
  AI_API_KEY_DESC: 'AI モデルの API キーを入力してください',
  AI_BASE_URL: 'ベース URL',
  AI_BASE_URL_DESC: 'AI モデルのベース URL を入力してください',
  AI_OPENAI: 'OpenAI',
  AI_QWEN_CHINA: 'QWen(中国)',
  AI_QWEN: 'QWen(シンガポール)',
  AI_GPT_5: 'GPT-5',
  AI_GPT_5_MINI: 'GPT-5 mini',
  AI_GPT_5_NANO: 'GPT-5 nano',
  AI_QWEN3_MAX: 'qwen3-max',
  AI_QWEN_PLUS: 'qwen-plus',
  AI_QWEN_FLASH: 'qwen-flash',

  // Render Mode
  CHANGE_RENDER_MODE: '表示モードを変更',

  // Help Menu
  HELP_MENU_DOCS: 'ドキュメント',
  HELP_MENU_TUTORIALS: '動画チュートリアル',

  // Image Picker
  IMAGE_PICKER_TITLE: '保管庫から画像を選択',
  IMAGE_PICKER_EMPTY: '保管庫に画像ファイルが見つかりません。',
  IMAGE_PICKER_CONFIRM: '確定',
  IMAGE_PICKER_CANCEL: 'キャンセル',
}
