import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import type { MenuProps } from 'antd'
import { Button, Card, ConfigProvider, Dropdown, Flex, Popover, Splitter, Tabs, Typography, theme } from 'antd'
import { Notice } from 'obsidian'
import type { IKanbanConfig } from '@ljcoder/smart-sheet'
import { AIAssistant, KanbanTab, emitEvent, useClearEvents } from '@ljcoder/smart-sheet'
import { createStyles } from 'antd-style'
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
import { RenameModal } from './components/RenameModal'

const helpContent = (
  <div style={{ width: '300px' }}>
    <h3>{t('TAB_HELP_TITLE')}</h3>
    <ul>
      <li>
        <a href="https://docs.ljcoder.com/guide/installation.html" target="_blank">{t('TAB_HELP_CONTENT')}</a>
      </li>
    </ul>
  </div>
)

export interface ContainerViewRef {
  copyToHTML: () => void
}

export interface ContainerViewProps {
  dataService: DataService
}

const useStyle = createStyles(({ prefixCls, css }) => ({
  linearGradientButton: css`
    &.${prefixCls}-btn-primary:not([disabled]):not(.${prefixCls}-btn-dangerous) {
      > span {
        position: relative;
        color: #fff;
      }

      &::before {
        content: '';
        background: linear-gradient(135deg, #6253e1, #04befe);
        position: absolute;
        inset: -1px;
        opacity: 1;
        transition: all 0.3s;
        border-radius: inherit;
      }

      &:hover::before {
        opacity: 0;
      }
    }
  `,
}))

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
  const [AIPanelSize, setAIPanelSize] = useState('0') // AI 面板大小
  const { styles } = useStyle()

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

  const saveDataToFile = async (data: any, key: string) => {
    log('[ContainerView]', '调用 saveDataToFile', key)
    editor.saveData(data, key)
  }
  const deleteFileData = (key: string) => {
    editor.deleteData(key)
  }
  // 保存数据
  const saveData = async (data: any, key: string) => {
    log('[ContainerView]', 'ContainerView 准备保存数据', key)
    if (key !== 'multiSheet' && key !== 'sheet') {
      emitEvent('saveData', { key })
    }
    saveDataToFile(data, key)
  }

  const onSheetRender = (isToRange: boolean) => {
    if (tabsData && tabsData.defaultActiveKey !== 'sheet' && !isToRange) {
      setActiveKey(tabsData.defaultActiveKey)
    }
  }

  useClearEvents()

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
      log('[ContentView]', 'ContentView卸载', univerApi)
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
    <div className="lj-content-view" data-theme={plugin.settings.darkModal === 'dark' ? 'sheet-plus-dark' : ''}>
      <ConfigProvider
        button={{
          className: styles.linearGradientButton,
        }}
        theme={{
          algorithm,
          components: {
            Spin: {
              contentHeight: '100%',
            },
            Tabs: {
              horizontalMargin: '0',
            },
          },
        }}
      >
        <Splitter>
          <Splitter.Panel>
            <Tabs
              size="small"
              type="card"
              items={tabsData.tabs.map((item) => {
                let children = <div />
                switch (item.type) {
                  case TabType.SHEET:
                    children = (
                      <SheetTab
                        data={dataService.getSheet()}
                        dataService={dataService}
                        saveData={saveData}
                        onRender={onSheetRender}
                        file={dataService.file}
                      />
                    )
                    break
                  case TabType.KANBAN:
                    children = (
                      <KanbanTab
                        id={item.key}
                        data={dataService.getBlock<IKanbanConfig>(item.key)}
                        univerApi={univerApi}
                        saveData={saveData}
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
                    <Button
                      type="primary"
                      onClick={
                        () => {
                          setAIPanelSize(AIPanelSize === '0' ? '30%' : '0')
                        }
                      }
                    >
                      AI
                    </Button>
                  </Flex>
                ),
              }}
              onChange={(key) => {
                setActiveKey(key)
              }}
            />
          </Splitter.Panel>
          <Splitter.Panel defaultSize="0" size={AIPanelSize}>
            <AIAssistant
              style={{ height: '100%', overflowY: 'hidden' }}
              univerApi={univerApi}
              aiConfig={{
                platform: plugin.settings.aiModePlatform,
                model: plugin.settings.aiModel,
                apiKey: plugin.settings.aiApiKey,
                baseUrl: plugin.settings.aiBaseUrl,
              }}
            />
          </Splitter.Panel>
        </Splitter>
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
