import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['**/data/**.ts'],
}, {
  rules: {
    'no-new': 'off',
    'ts/ban-ts-comment': 'off',
    'style/no-tabs': 'off',
    'style/no-mixed-spaces-and-tabs': 'off',
    'ts/no-this-alias': 'warn',
    'eqeqeq': 'warn',
    'unused-imports/no-unused-vars': 'warn',
    // Obsidian 插件规范：日志用 console.debug 而非 console.log
    'no-console': ['error', { allow: ['warn', 'error', 'debug'] }],
  },
})
