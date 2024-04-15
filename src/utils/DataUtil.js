import MarkdownIt from "markdown-it";

class JSONRenderer {
	constructor() {
		// 初始化渲染规则
		this.rules = {
			heading_open: (tokens, idx, json, stack) => {
				// h1, h2, h3, h4, h5, h6 解析，创建元素
				// # workbook, ## sheet ### row #### col
				const last = stack.last();
				const token = tokens[idx];
				const contentToken = tokens[idx + 1];
				if (last) {
					if (last.markup.length < token.markup.length) {
						// 小于，表示 token 为 last 的子节点
						const obj = {
							tag: token.tag,
							markup: token.markup,
						};
						last[contentToken.content] = obj;

						stack.push(obj);
					} else if (last.markup.length == token.markup.length) {
						// 等于，表示 token 为 last 兄弟节点
						stack.pop();

						const newLast = stack.last();
						if (newLast) {
							const obj = {
								tag: token.tag,
								markup: token.markup,
							};

							newLast[contentToken.content] = obj;

							stack.push(obj);
						}
					} else {
						// 大于，表示 token 为 last 的父节点/祖父节点
						var newLast = last;

						do {
							// 寻找到父节点
							stack.pop();
							newLast = stack.last();
							if (newLast == undefined || newLast == null) {
								break;
							}
						} while (newLast.markup.length >= token.markup.length); // while 条件为真执行循环体

						const obj = {
							tag: token.tag,
							markup: token.markup,
						};

						newLast[contentToken.content] = obj;

						stack.push(obj);
					}
				} else {
					// 第一个元素
					if (contentToken.content) {
						const obj = {
							tag: token.tag,
							markup: token.markup,
						};
						json[contentToken.content] = obj;

						stack.push(obj);
					}
				}
			},
			paragraph_open: (tokens, idx, json, stack) => {
				var last = stack.last();
				const contentToken = tokens[idx + 1];
				if (last) {
					const obj = JSON.parse(contentToken.content);

					Object.entries(obj).forEach(([key, value]) => {
						last[key] = value;
					});
				}
			},
			text: (tokens, idx) => {
				const token = tokens[idx];
				return token.content;
			},
			strong_open: () => ({ type: "strong", content: "" }),
			strong_close: () => ({ type: "strong", content: "" }),
			em_open: () => ({ type: "emphasis", content: "" }),
			em_close: () => ({ type: "emphasis", content: "" }),
		};
	}

	render(tokens, options, env) {
		const json = {};
		const stack = [];
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			if (token.type && this.rules[token.type]) {
				this.rules[token.type](tokens, i, json, stack);
			}
		}
		return JSON.stringify(json, null, 2);
	}

	renderInline(tokens, start) {
		let result = "";
		for (let i = start; i < tokens.length; i++) {
			const token = tokens[i];
			if (token.type === "text") {
				result += token.content;
			} else if (token.nesting === 1 && token.type === "strong") {
				result += "**" + this.renderInline(tokens, i + 1) + "**";
				i++; // 跳过关闭标签
			} else if (token.nesting === 1 && token.type === "em") {
				result += "*" + this.renderInline(tokens, i + 1) + "*";
				i++; // 跳过关闭标签
			}
		}
		return result;
	}
}

export function markdownToJSON(markdownText) {
	const md = MarkdownIt();
	const tokens = md.parse(markdownText, {});
	const renderer = new JSONRenderer();
	const jsonOutput = renderer.render(tokens);

	return jsonOutput;
}

export function jsonToMarkdown(json) {
	let markdown = "";

	function copyRemoveSheetsField(json, key) {
		var newJson = { ...json };
		if (newJson.hasOwnProperty(key)) {
			delete newJson[key];
		}
		return newJson;
	}

	function removeSheetsField(json, key) {
		if (json.hasOwnProperty(key)) {
			delete json[key];
		}
		return json;
	}

	removeSheetsField(json, "tag");
	removeSheetsField(json, "markup");

	markdown += "# workbook\n";
	var workbookJson = copyRemoveSheetsField(json, "sheets");

	markdown += JSON.stringify(workbookJson) + "\n";

	for (const sheetKey in json.sheets) {
		markdown += "## sheets\n";
		const sheet = json.sheets[sheetKey];
		removeSheetsField(sheet, "tag");
		removeSheetsField(sheet, "markup");

		markdown += "### " + sheetKey + "\n";

		var sheetJson = copyRemoveSheetsField(sheet, "cellData");

		markdown += JSON.stringify(sheetJson) + "\n";

		if (sheet.cellData) {
			const cellData = sheet.cellData;
			removeSheetsField(cellData, "tag");
			removeSheetsField(cellData, "markup");

			markdown += "#### cellData\n";
			for (const rowKey in cellData) {
				const rowData = cellData[rowKey];
				removeSheetsField(rowData, "tag");
				removeSheetsField(rowData, "markup");

				for (const colKey in rowData) {
					markdown += "##### " + rowKey + "\n";
					markdown += "###### " + colKey + "\n";

					removeSheetsField(rowData[colKey], "tag");
					removeSheetsField(rowData[colKey], "markup");

					markdown += JSON.stringify(rowData[colKey]) + "\n";
				}
			}
		}
	}

	return markdown;
}

export function splitYAML(str) {
	const match = str.match(/^-{3}\n([\s\S]*?)-{3}\n([\s\S]*)/);
	if (match) {
		const yamlPart = match[1].trim();
		const restPart = match[2].trim();
		return { yaml: yamlPart, rest: restPart };
	} else {
		return null;
	}
}
