// import { markdownToJSON, jsonToMarkdown, extractYAML, splitYAML } from "../utils/data-util";


// // eslint-disable-next-line no-undef
// onmessage = (e) => {
//     const { name, options } = e.data
//     console.log("xxxxxxxxxxx worker", e.data)
//     if (name === 'save-data') {
//         const markdown = jsonToMarkdown(options)
//         postMessage({
//             name: "save-data",
//             options: markdown
//         })
//     } else if (name === 'load-data') {
//         const markdown = splitYAML(options)?.rest || "";
// 		const data = markdownToJSON(markdown);
//         postMessage({
//             name: "load-data",
//             options: data
//         })
//     }
// }
