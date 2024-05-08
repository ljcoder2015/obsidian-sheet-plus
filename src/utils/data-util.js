// import MarkdownIt from "markdown-it";

// class JSONRenderer {
// 	constructor() {
// 		// 初始化渲染规则
// 		this.rules = {
// 			heading_open: (tokens, idx, json, stack) => {
// 				// h1, h2, h3, h4, h5, h6 解析，创建元素
// 				const last = stack[stack.length - 1];
// 				const token = tokens[idx];
// 				const contentToken = tokens[idx + 1];
// 				if (last) {
// 					if (last.markup.length < token.markup.length) {
// 						// 小于，表示 token 为 last 的子节点
// 						const key = contentToken.content;

// 						if (last.hasOwnProperty(key)) {
// 							// 父节点已存在当前key的属性，无需添加新对象，只需要把当前节点添加到已有属性中
// 							stack.push(last[key]);
// 							return;
// 						}

// 						const obj = {
// 							tag: token.tag,
// 							markup: token.markup,
// 						};
// 						last[key] = obj;

// 						stack.push(obj);
// 					} else if (last.markup.length == token.markup.length) {
// 						// 等于，表示 token 为 last 兄弟节点

// 						const key = contentToken.content;

// 						stack.pop();
// 						// pop 后当前节点为父节点
// 						const newLast = stack[stack.length - 1];

// 						if (newLast.hasOwnProperty(key)) {
// 							// 父节点已存在当前key的属性，无需添加新对象，只需要把当前节点添加到已有属性中
// 							stack.push(newLast[key]);
// 							return;
// 						}

// 						if (newLast) {
// 							const obj = {
// 								tag: token.tag,
// 								markup: token.markup,
// 							};
// 							newLast[key] = obj;

// 							stack.push(obj);
// 						}
// 					} else {
// 						// 大于，表示 token 为 last 的父节点/祖父节点
// 						var newLast = last;

// 						do {
// 							// 寻找到父节点
// 							stack.pop();
// 							newLast = stack[stack.length - 1];
// 							if (newLast == undefined || newLast == null) {
// 								break;
// 							}
// 						} while (newLast.markup.length >= token.markup.length); // while 条件为真执行循环体

// 						// 已存在，不需要重新创建
// 						const key = contentToken.content;
// 						if (newLast.hasOwnProperty(key)) {
// 							// 父节点已存在当前key的属性，无需添加新对象，只需要把当前节点添加到已有属性中
// 							stack.push(newLast[key]);
// 							return;
// 						}

// 						const obj = {
// 							tag: token.tag,
// 							markup: token.markup,
// 						};
// 						newLast[key] = obj;

// 						stack.push(obj);
// 					}
// 				} else {
// 					// 第一个元素
// 					if (contentToken.content) {
// 						const obj = {
// 							tag: token.tag,
// 							markup: token.markup,
// 						};
// 						json[contentToken.content] = obj;

// 						stack.push(obj);
// 					}
// 				}
// 			},
// 			paragraph_open: (tokens, idx, json, stack) => {
// 				var last = stack[stack.length - 1];
// 				const contentToken = tokens[idx + 1];
// 				if (last) {
// 					const obj = JSON.parse(contentToken.content);

// 					Object.entries(obj).forEach(([key, value]) => {
// 						last[key] = value;
// 					});
// 				}
// 			},
// 			text: (tokens, idx) => {
// 				const token = tokens[idx];
// 				return token.content;
// 			},
// 			strong_open: () => ({ type: "strong", content: "" }),
// 			strong_close: () => ({ type: "strong", content: "" }),
// 			em_open: () => ({ type: "emphasis", content: "" }),
// 			em_close: () => ({ type: "emphasis", content: "" }),
// 		};
// 	}

// 	render(tokens) {
// 		const json = {};
// 		const stack = [];
// 		for (let i = 0; i < tokens.length; i++) {
// 			const token = tokens[i];
// 			if (token.type && this.rules[token.type]) {
// 				this.rules[token.type](tokens, i, json, stack);
// 			}
// 		}
// 		return json;
// 	}

// 	renderInline(tokens, start) {
// 		let result = "";
// 		for (let i = start; i < tokens.length; i++) {
// 			const token = tokens[i];
// 			if (token.type === "text") {
// 				result += token.content;
// 			} else if (token.nesting === 1 && token.type === "strong") {
// 				result += "**" + this.renderInline(tokens, i + 1) + "**";
// 				i++; // 跳过关闭标签
// 			} else if (token.nesting === 1 && token.type === "em") {
// 				result += "*" + this.renderInline(tokens, i + 1) + "*";
// 				i++; // 跳过关闭标签
// 			}
// 		}
// 		return result;
// 	}
// }

// function removeTagAndMarkup(obj) {
// 	for (const key in obj) {
// 		if (typeof obj[key] === "object") {
// 			removeTagAndMarkup(obj[key]);
// 		}
// 		if (key === "tag" || key === "markup") {
// 			delete obj[key];
// 		}
// 	}
// }

// export function markdownToJSON(markdownText) {
// 	const md = MarkdownIt();
// 	const tokens = md.parse(markdownText, {});
// 	const renderer = new JSONRenderer();
// 	const json = renderer.render(tokens);

// 	// 2. 递归删除字段
// 	removeTagAndMarkup(json);

// 	return JSON.stringify(json, null, 2);
// }

// // 从 json 中移除指定 key 的字段，并返回新的json，不改动原josn
// function copyRemoveField(json, key) {
// 	var newJson = { ...json };
// 	if (newJson.hasOwnProperty(key)) {
// 		delete newJson[key];
// 	}
// 	return newJson;
// }

// // 从 json 中移除指定 key 的字段
// function removeField(json, key) {
// 	if (json.hasOwnProperty(key)) {
// 		delete json[key];
// 	}
// 	return json;
// }

// function removeFields(obj) {
// 	removeField(obj, "tag");
// 	removeField(obj, "markup");
// 	// 在这里可以添加其他要移除的字段
// }

// export function jsonToMarkdown(json) {
// 	let markdown = "";

// 	removeFields(json);

// 	markdown += "# workbook\n";
// 	markdown += JSON.stringify(copyRemoveField(json, "sheets")) + "\n";

// 	for (const sheetKey in json.sheets) {
// 		markdown += "## sheets\n";
// 		const sheet = json.sheets[sheetKey];
// 		removeFields(sheet);

// 		markdown += `### ${sheetKey}\n`;

// 		var sheetJson = copyRemoveField(sheet, "cellData");
// 		markdown += JSON.stringify(sheetJson) + "\n";

// 		if (sheet.cellData) {
// 			const cellData = sheet.cellData;
// 			removeFields(cellData);

// 			markdown += "#### cellData\n";
// 			for (const rowKey in cellData) {
// 				const rowData = cellData[rowKey];
// 				removeFields(rowData);

// 				for (const colKey in rowData) {
// 					markdown += `##### ${rowKey}\n`;
// 					markdown += `###### ${colKey}\n`;

// 					removeFields(rowData[colKey]);

// 					markdown += JSON.stringify(rowData[colKey]) + "\n";
// 				}
// 			}
// 		}
// 	}

// 	return markdown;
// }

// export function splitYAML(str) {
// 	const match = str.match(/^-{3}\n([\s\S]*?)-{3}\n([\s\S]*)/);
// 	if (match) {
// 		const yamlPart = match[1].trim();
// 		const restPart = match[2].trim();
// 		return { yaml: yamlPart, rest: restPart };
// 	} else {
// 		return null;
// 	}
// }

// export function extractYAML(str) {
// 	const match = str.match(/^-{3}\n([\s\S]*?)-{3}/);
// 	return match ? match[1].trim() : null;
// }

// export function getExcelData(str) {
// 	const markdown = splitYAML(str)?.rest;
// 	if (markdown) {
// 		const data = JSON.parse(markdown);
// 		if (data) {
// 			return data;
// 		}
// 	}
// 	return {};
// }

// /**
//  * data 转换成只显示 range 部分
//  * @param {JSON} data 源数据
//  * @param {string} range 格式为 A1:B6
//  */
// export function getRangeData(data, sheet, range) {
// 	// TODO 后续id改成name
// 	let currentSheet = Object.values(data.sheets).find((item) => {
// 		// console.log("currentSheet", item, item.id)
// 		return item.id === sheet
// 	})
// 	if (currentSheet == undefined) {
// 		return data
// 	}

// 	const [start, end] = range.split(':');
// 	const startResult = splitAlphaNumeric(start)
// 	const startCol = startResult.col
// 	const startRow = startResult.row

// 	const endResult = splitAlphaNumeric(end)
// 	const endCol = endResult.col
// 	const endRow = endResult.row

// 	// 设置渲染行列数量
// 	currentSheet.rowCount = endRow + 1
// 	currentSheet.columnCount = endCol + 1 

// 	// 隐藏行
// 	let rowData = currentSheet.rowData
// 	if (rowData === undefined || rowData === null) {
// 		rowData = {}
// 	}
// 	for (let i = 0; i < startRow; i ++) {
// 		const key = `${i}`
// 		if (rowData[key]) {
// 			rowData[key]["hd"] = 1
// 		} else {
// 			rowData[key] = {
// 				"hd": 1,
// 				"h": data.defaultRowHeight || 19
// 			}
// 		}
// 	}

// 	// 隐藏列
// 	let colData = currentSheet.columnData
// 	if (colData === undefined || colData === null) {
// 		colData = {}
// 	}
// 	for (let i = 0; i < startCol; i ++) {
// 		const key = `${i}`
// 		if (colData[key]) {
// 			colData[key]["hd"] = 1
// 		} else {
// 			colData[key] = {
// 				"hd": 1,
// 				"h": data.defaultColumnWidth || 19
// 			}
// 		}
// 	}

// 	// 更改 sheets
// 	const sheets = {}
// 	sheets[sheet] = currentSheet
// 	data.sheets = sheets

// 	// 更改 sheetOrder
// 	data.sheetOrder = [sheet]

// 	console.log("getRangeData", data)
// 	return data
// }

// /**
//  * 行列索引，拆分字母部分跟数字部分
//  * @param {string} input 行列索引 A10
//  * @returns { col, row } col从 0 开始， row 从 0 开始
//  */
// function splitAlphaNumeric(input) {
//     const match = input.match(/([A-Za-z]+)(\d+)/);
//     if (match) {
//         const alphaPart = match[1];
// 		const colIndex = stringToNumber(alphaPart)
//         const numericPart = parseInt(match[2]) - 1;
//         return { col: colIndex, row: numericPart };
//     } else {
//         return null;
//     }
// }

// /**
//  * 字母转数字 A = 0 为基准
//  * @param {string} str 字母索引
//  * @returns {number} 字母对应的索引
//  */
// // 
// export function stringToNumber(str) {
// 	// 定义字母与数字的映射关系
// 	const map = {};
// 	const base = "A".charCodeAt(0); // 字母'A'的ASCII码值作为基准值
// 	for (let i = 0; i < 26; i++) {
// 		map[String.fromCharCode(i + base)] = i;
// 	}

// 	// 计算数字值
// 	let num = 0;
// 	for (let i = 0; i < str.length; i++) {
// 		num = num * 26 + map[str[i]]; // 使用26进制计算
// 	}

// 	return num;
// }

// /**
//  * 数字转字母 数字以0开始，转换后的字符串以1开始
//  * @param {number} colNumber 列数索引
//  * @param {number} rowNumber 行数索引
//  * @returns 字母数字组合，字母为列，数字为行
//  */
// export function numberToColRowString(colNumber, rowNumber) {
// 	var col = colNumber + 1
// 	var row = rowNumber + 1

// 	// 定义数字与字母的映射关系
// 	const base = "A".charCodeAt(0) - 1; // 字母'A'的ASCII码值减去1作为基准值

// 	// 将列转换为字母
// 	let result = "";
// 	while (col > 0) {
// 		const remainder = col % 26; // 26进制计算余数
// 		result = String.fromCharCode(remainder + base) + result; // 添加字母到结果字符串的开头
// 		col = Math.floor(col / 26); // 除以26取整，继续计算下一位
// 	}

// 	return result + row;
// }
