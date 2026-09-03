#!/usr/bin/env node
import fs from 'node:fs'

const file = process.argv[2]
if (!file) {
  console.error('usage: node scripts/patch-built-render-idle.mjs <main.js>')
  process.exit(1)
}

const source = fs.readFileSync(file, 'utf8')
const pattern = /function FYi\(t,e\)\{const n=e\.ownerDocument\.defaultView\?\.IntersectionObserver;if\(!n\)return\(\)=>\{\};const r=new n\(i=>\{const a=i\.find\(o=>o\.target===e\);a&&\(a\.isIntersecting\?t\.activate\(\):t\.deactivate\(\)\)\}\);return r\.observe\(e\),\(\)=>r\.disconnect\(\)\}/
const replacement = 'function FYi(t,e){const n=e.ownerDocument.defaultView?.IntersectionObserver;if(!n)return()=>{};const r=e.ownerDocument.defaultView;let i=null,a=!1;const o=()=>{i!==null&&(clearTimeout(i),i=null)},s=()=>{o(),t.deactivate()},l=()=>{if(!a)return;t.activate(),o(),i=setTimeout(s,2e3)},c=new n(d=>{const f=d.find(u=>u.target===e);f&&(a=f.isIntersecting,a?l():s())});c.observe(e);const u=["pointerdown","pointermove","keydown","wheel","touchstart"];return u.forEach(d=>e.addEventListener?.(d,l,{passive:!0})),r?.addEventListener?.("blur",s),r?.addEventListener?.("focus",l),i=setTimeout(s,2e3),()=>{c.disconnect(),u.forEach(d=>e.removeEventListener?.(d,l)),r?.removeEventListener?.("blur",s),r?.removeEventListener?.("focus",l),o()}}'

if (!pattern.test(source)) {
  console.error('expected unpatched FYi function exactly once')
  process.exit(1)
}
const patched = source.replace(pattern, replacement)
fs.writeFileSync(file, patched)
console.log(`patched ${file}`)
