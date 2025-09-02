import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import type { MenuProps } from 'antd'
import { Button, ConfigProvider, Dropdown, Flex, Popover, Tabs, theme } from 'antd'
import type { IWorkbookData } from '@univerjs/core'
import { Notice } from 'obsidian'
import { randomString } from '../utils/uuid'
import type { MultiSheet } from '../common/constants'
import { TabType } from '../common/constants'
import { t } from '../lang/helpers'
import type { DataService } from '../services/data.service'
import { log } from '../utils/log'
import { useEditorContext } from '../context/editorContext'
import { rangeToRangeString } from '../utils/data'
import { renderToHtml } from '../post-processor/html'
import { useUniver } from '../context/UniverContext'
import { SheetTab } from './tabs/SheetTab'
import type { IKanbanConfig } from './tabs/kanban/KanbanTab'
import { KanbanTab } from './tabs/kanban/KanbanTab'
import { RenameModal } from './components/RenameModal'

const helpContent = (
  <div>
    <h3>{t('TAB_HELP_TITLE')}</h3>
    <a href="https://github.com/ljcoder2015/obsidian-sheet-plus/wiki/User-Guide" target="_blank">{t('TAB_HELP_CONTENT')}</a>
  </div>
)

export interface ContainerViewRef {
  copyToHTML: () => void
}

export interface ContainerViewProps {
  dataService: DataService
}

// eslint-disable-next-line prefer-arrow-callback
export const ContainerView = forwardRef(function ContainerView(props, ref) {
  const { univerApi } = useUniver()
  const { dataService } = props as ContainerViewProps
  const { editor } = useEditorContext()
  const { plugin } = editor
  const [isInit, setIsInit] = useState(false)
  const [activeKey, setActiveKey] = useState('sheet')
  const [tabsData, setTabsData] = useState<MultiSheet>({
    defaultActiveKey: 'sheet',
    tabs: [{
      key: 'sheet',
      type: TabType.SHEET,
      label: t('TAB_TYPE_SHEET'),
    }],
  })
  const [algorithm, setAlgorithm] = useState([]) // 设置主题
  const [triggerSource, setTriggerSource] = useState<string | null>(null) // 记录是点击哪个 tab 触发的下拉菜单
  const [renameModalVisible, setRenameModalVisible] = useState(false) // 重命名
  const [renameModalName, setRenameModalName] = useState('') // 重命名的名称

  useImperativeHandle(ref, () => ({
    copyToHTML() {
      if (univerApi === null) {
        return
      }
      const workbook = univerApi.getActiveWorkbook()

      const workbookData = workbook?.getSnapshot()
      if (workbookData === undefined)
        return

      const sheet = workbook?.getActiveSheet()
      if (sheet === null || sheet === undefined)
        return

      const range = sheet?.getSelection()?.getActiveRange()
      if (range === null || range === undefined)
        return

      const rangeString = rangeToRangeString(range)
      const html = renderToHtml(workbookData, sheet.getSheetName(), rangeString)
      const htmlString = html.outerHTML
      navigator.clipboard.writeText(htmlString)
      new Notice(t('COPY_TO_HTML_SUCCESS'))
    },
  }))

  const saveDataToFile = (data: any, key: string) => {
    editor.saveData(data, key)
  }
  const deleteFileData = (key: string) => {
    editor.deleteData(key)
  }
  // 保存数据
  const saveData = useCallback((data: any, key: string) => {
    saveDataToFile(data, key)
  }, [editor])

  const onSheetRender = (isToRange: boolean) => {
    log('[ContentView]', 'onSheetRender', tabsData.defaultActiveKey)
    if (tabsData && tabsData.defaultActiveKey !== 'sheet' && !isToRange) {
      setActiveKey(tabsData.defaultActiveKey)
    }
  }

  useEffect(() => {
    log('[ContentView]', 'ContentView初始化')
    if (dataService) {
      const tabs = dataService.getBlock<MultiSheet>('multiSheet')
      if (tabs) {
        setTabsData(tabs)
        if (tabs.defaultActiveKey === 'sheet') {
          setActiveKey(tabs.defaultActiveKey)
        }
      }
      else {
        saveDataToFile(tabsData, 'multiSheet')
      }
    }
    setIsInit(true)
    return () => {
      log('[ContentView]', 'ContentView卸载')
    }
  }, [])

  useEffect(() => {
    if (isInit) {
      log('[ContentView]', 'save tabsData', tabsData)
      saveDataToFile(tabsData, 'multiSheet')
    }
  }, [tabsData, isInit])

  useMemo(() => {
    if (!plugin) {
      return
    }
    log('[ContainerView]', 'darkModal', plugin.settings.darkModal)
    const darkModal = plugin.settings.darkModal
    if (darkModal === 'dark') {
      setAlgorithm([theme.darkAlgorithm])
    }
    else {
      setAlgorithm([])
    }
  }, [plugin])

  const tabMenu: MenuProps['items'] = [
    {
      label: t('TAB_MENU_DEFAULT'),
      key: 'default',
    },
    {
      label: t('TAB_MENU_RENAME'),
      key: 'rename',
    },
    {
      label: t('TAB_MENU_DELETE'),
      key: 'delete',
    },
  ]

  useMemo(() => {
    // console.log('save name', triggerSource)
    if (triggerSource && renameModalName && !renameModalVisible) {
      setTabsData({
        ...tabsData,
        tabs: tabsData.tabs.map((tab) => {
          if (tab.key === triggerSource) {
            return {
              ...tab,
              label: renameModalName,
            }
          }
          return tab
        }),
      })
    }
  }, [renameModalName, renameModalVisible])

  const tabDropdownClick: MenuProps['onClick'] = (item) => {
    const { key } = item
    if (key === 'delete') {
      if (!triggerSource || triggerSource === 'sheet') {
        new Notice(t('CANNOT_DELETE_SHEET'))
        return
      }
      let activeKey = tabsData.defaultActiveKey
      if (tabsData.defaultActiveKey === triggerSource) {
        activeKey = 'sheet'
      }
      // 删除tab数据并保存
      setTabsData({
        ...tabsData,
        tabs: tabsData.tabs.filter(tab => tab.key !== triggerSource),
        defaultActiveKey: activeKey,
      })
      if (triggerSource) {
        deleteFileData(triggerSource)
      }
      setTriggerSource(null)
    }
    if (key === 'default') {
      setTabsData({
        ...tabsData,
        defaultActiveKey: triggerSource,
      })
      setTriggerSource(null)
    }
    if (key === 'rename') {
      if (triggerSource) {
        const tab = tabsData.tabs.find(t => t.key === triggerSource)
        if (tab) {
          setRenameModalName(tab.label)
        }
      }
      setRenameModalVisible(true)
    }
  }

  const createKanbanConfig = () => {
    if (!univerApi) {
      return {}
    }
    const sheet = univerApi.getActiveWorkbook().getActiveSheet()
    return {
      sheetId: sheet.getSheetId(),
      groupColumn: '0',
      hiddenColumns: [],
      order: [],
    }
  }

  // 添加标签页
  const addTabMenu: MenuProps = {
    items: [
      {
        label: t('TAB_TYPE_KANBAN'),
        key: 'kanban',
      },
      // {
      //   label: t('TAB_TYPE_GROUP'),
      //   key: 'group',
      // },
      // {
      //   label: t('TAB_TYPE_BI'),
      //   key: 'bi',
      // },
      // {
      //   label: t('TAB_TYPE_PIVOT'),
      //   key: 'pivot',
      // },
    ],
    onClick: (item) => {
      const { key } = item
      const id = randomString(6)
      // 添加tab数据
      setTabsData({
        ...tabsData,
        tabs: [
          ...tabsData.tabs,
          {
            key: id,
            type: key as TabType,
            label: t(`TAB_TYPE_${key.toUpperCase()}` as any),
          },
        ],
      })
      if (key === TabType.KANBAN) {
        const kanbanData = createKanbanConfig()
        saveDataToFile(kanbanData, id)
      }
    },
  }

  // 自定义 TabBar 渲染函数
  const renderTabBar = (props: any, DefaultTabBar: React.ComponentType) => {
    return (
      <DefaultTabBar
        {...props}
        // 添加自定义的 tabBar 样式类名
        className="my-tab-bar w-full border-t border-l border-r p-2"
      >
        { (node) => {
          return (
            <div className="pr-[10px]">
              <Dropdown
                menu={{
                  items: tabMenu,
                  onClick: tabDropdownClick,
                }}
                trigger={['contextMenu']}
                onOpenChange={
                  (open) => {
                    if (open) {
                      setTriggerSource(node.key)
                    }
                  }
                }
              >
                <Button
                  color="blue"
                  variant={activeKey === node.key ? 'solid' : 'outlined'}
                  onClick={() => {
                    setActiveKey(node.key)
                  }}
                >
                  {tabsData.defaultActiveKey === node.key ? <span>★</span> : null}
                  {tabsData.tabs?.find(tab => tab.key === node.key)?.label || ''}
                </Button>
              </Dropdown>
            </div>
          )
        }}
      </DefaultTabBar>
    )
  }

  return (
    <div className="lj-content-view">
      <ConfigProvider
        theme={{
          algorithm,
          components: {
            Spin: {
              contentHeight: '100%',
            },
            Tabs: {
              horizontalMargin: 0,
            },
          },
        }}
      >
        <Tabs
          size="small"
          type="card"
          items={tabsData.tabs.map((item) => {
            let children = <div />
            switch (item.type) {
              case TabType.SHEET:
                children = (
                  <SheetTab
                    id={item.key}
                    data={dataService.getBlock<IWorkbookData>(item.key)}
                    saveData={saveData}
                    onRender={onSheetRender}
                  />
                )
                break
              case TabType.KANBAN:
                children = (
                  <KanbanTab
                    data={dataService.getBlock<IKanbanConfig>(item.key)}
                  />
                )
                break
            }
            return {
              key: item.key,
              label: item.label,
              children,
              forceRender: true,
            }
          })}
          activeKey={activeKey}
          renderTabBar={renderTabBar}
          tabBarExtraContent={{
            right: (
              <Flex gap="small">
                <Dropdown menu={addTabMenu} trigger={['click']}>
                  <Button color="default" variant="outlined">+</Button>
                </Dropdown>
                <Popover content={helpContent} trigger="hover">
                  <Button>?</Button>
                </Popover>
              </Flex>
            ),
          }}
          onChange={(key) => {
            setActiveKey(key)
          }}
        />
        <RenameModal
          visible={renameModalVisible}
          name={renameModalName}
          onCancel={() => setRenameModalVisible(false)}
          onOk={(name) => {
            setRenameModalVisible(false)
            setRenameModalName(name)
          }}
        />
      </ConfigProvider>
    </div>
  )
})
