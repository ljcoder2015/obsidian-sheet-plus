import MarkdownIt from "markdown-it";

class JSONRenderer {
	constructor() {
		// 初始化渲染规则
		this.rules = {
			heading_open: (tokens, idx, json, stack) => {
				// h1, h2, h3, h4, h5, h6 解析，创建元素
				const last = stack.last();
				const token = tokens[idx];
				const contentToken = tokens[idx + 1];
				if (last) {
					if (last.markup.length < token.markup.length) {
						// 小于，表示 token 为 last 的子节点
						const key = contentToken.content

						if (last.hasOwnProperty(key)) {
							// 父节点已存在当前key的属性，无需添加新对象，只需要把当前节点添加到已有属性中
							stack.push(last[key])
							return
						}

						const obj = {
							tag: token.tag,
							markup: token.markup
						};
						last[key] = obj;

						stack.push(obj);
					} else if (last.markup.length == token.markup.length) {
						// 等于，表示 token 为 last 兄弟节点

						const key = contentToken.content
				
						stack.pop();
						// pop 后当前节点为父节点
						const newLast = stack.last(); 

						if (newLast.hasOwnProperty(key)) {
							// 父节点已存在当前key的属性，无需添加新对象，只需要把当前节点添加到已有属性中
							stack.push(newLast[key])
							return
						}

						if (newLast) {
							const obj = {
								tag: token.tag,
								markup: token.markup
							};
							newLast[key] = obj;

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

						// 已存在，不需要重新创建
						const key = contentToken.content
						if (newLast.hasOwnProperty(key)) {
							// 父节点已存在当前key的属性，无需添加新对象，只需要把当前节点添加到已有属性中
							stack.push(newLast[key])
							return
						}
							
						const obj = {
							tag: token.tag,
							markup: token.markup
						};
						newLast[key] = obj;

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

	render(tokens) {
		const json = {};
		const stack = [];
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			if (token.type && this.rules[token.type]) {
				this.rules[token.type](tokens, i, json, stack);
			}
		}
		return json
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

function removeTagAndMarkup(obj) {
	for (const key in obj) {
		if (typeof obj[key] === "object") {
			removeTagAndMarkup(obj[key]);
		}
		if (key === "tag" || key === "markup") {
			delete obj[key];
		}
	}
}

export function markdownToJSON(markdownText) {
	const md = MarkdownIt();
	const tokens = md.parse(markdownText, {});
	const renderer =  new JSONRenderer()
	const json = renderer.render(tokens)

	// 2. 递归删除字段
    removeTagAndMarkup(json);

    return JSON.stringify(json, null, 2);
}

// 从 json 中移除指定 key 的字段，并返回新的json，不改动原josn
function copyRemoveField(json, key) {
	var newJson = { ...json };
	if (newJson.hasOwnProperty(key)) {
		delete newJson[key];
	}
	return newJson;
}

// 从 json 中移除指定 key 的字段
function removeField(json, key) {
	if (json.hasOwnProperty(key)) {
		delete json[key];
	}
	return json;
}


function removeFields(obj) {
    removeField(obj, "tag");
    removeField(obj, "markup");
    // 在这里可以添加其他要移除的字段
}

export function jsonToMarkdown(json) {

	let markdown = "";

	removeFields(json);

	markdown += "# workbook\n";
	markdown += JSON.stringify(copyRemoveField(json, "sheets")) + "\n";

	for (const sheetKey in json.sheets) {
		markdown += "## sheets\n";
		const sheet = json.sheets[sheetKey];
		removeFields(sheet);

		markdown += `### ${sheetKey}\n`;

		var sheetJson = copyRemoveField(sheet, "cellData");
		markdown += JSON.stringify(sheetJson) + "\n";

		if (sheet.cellData) {
			const cellData = sheet.cellData;
			removeFields(cellData);

			markdown += "#### cellData\n";
			for (const rowKey in cellData) {
				const rowData = cellData[rowKey];
				removeFields(rowData);

				for (const colKey in rowData) {
					markdown += `##### ${rowKey}\n`;
					markdown += `###### ${colKey}\n`;

					removeFields(rowData[colKey]);

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

export function extractYAML(str) {
	const match = str.match(/^-{3}\n([\s\S]*?)-{3}/);
	return match ? match[1].trim() : null;
}
