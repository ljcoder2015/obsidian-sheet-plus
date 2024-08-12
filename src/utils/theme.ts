export function updateSheetTheme(isDark: boolean) {
  const root = document.documentElement
  if (isDark) {
    root.style.setProperty('--sheet-iframe-background-color', '#363636')
    root.style.setProperty('--sheet-iframe-border-color', '#666666')
    root.style.setProperty('--sheet-border-color', '#393939')
    root.style.setProperty('--sheet-toolbar-background-color', '#a5a0f8')
    root.style.setProperty('--sheet-toolbar-divider-color', '#a5a0f8')
    root.style.setProperty(
      '--sheet-dropdown-content-background-color',
      '#857fe6',
    )
    root.style.setProperty('--sheet-dropdown-content-color', '#dcdcdc')
    root.style.setProperty('--sheet-dropdown-title-color', 'rgba(0,0,0,0.9)')
    root.style.setProperty('--sheet-menu-color', '#000')
    root.style.setProperty('--sheet-menu-active-background-color', '#bdb9f9')
    root.style.setProperty('--sheet-header-background-color', '#bdb9f9')
    root.style.setProperty('--sheet-checked-before', '#025492')
  }
  else {
    root.style.setProperty('--sheet-iframe-border-color', '#f5f6f7')
    root.style.setProperty('--sheet-border-color', '#f5f6f7')
    root.style.setProperty('--sheet-iframe-background-color', '#fff')
    root.style.setProperty('--sheet-toolbar-background-color', '#f5f6f7')
    root.style.setProperty('--sheet-toolbar-divider-color', '#e0e2e4')
    root.style.setProperty('--sheet-dropdown-content-background-color', '#fff')
    root.style.setProperty('--sheet-dropdown-content-color', 'rgba(0,0,0,0.9)')
    root.style.setProperty('--sheet-dropdown-title-color', 'rgba(0,0,0,0.9)')
    root.style.setProperty('--sheet-menu-color', '#80868b')
    root.style.setProperty('--sheet-menu-active-background-color', '#fff')
    root.style.setProperty('--sheet-header-background-color', '#f8f8f9')
    root.style.setProperty('--sheet-checked-before', '#4b89ff')
  }
}
