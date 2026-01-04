import React, { useMemo, useState, useEffect } from 'react'
import type { MenuProps, TabsProps } from 'antd'
import { Button, Card, ConfigProvider, Dropdown, Flex, Popover, Splitter, Tabs, Typography, theme } from 'antd'
import { Notice } from 'obsidian'
import { AIAssistant, KanbanTab, useEventBus } from '@ljcoder/smart-sheet'
import { createStyles } from 'antd-style'
import { randomString } from '../utils/uuid'
import { TabType } from '../services/type'
import { t } from '../lang/helpers'
import { log } from '../utils/log'
import { useEditorContext } from '../context/editorContext'
import { useUniver } from '../context/UniverContext'
import { useSheetStore } from '../context/SheetStoreProvider'
import { TAB_DEFAULT_ACTION, TAB_RENAME_ACTION, VIEW_ADD_ACTION, VIEW_CONFIG_ADD_ACTION, VIEW_REMOVE_ACTION, VIEW_UPDATE_ACTION } from '../services/reduce'
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

export const ContainerView = function ContainerView() {
  const { state, dispatch } = useSheetStore()
  const { univerApi } = useUniver()
  const { editor } = useEditorContext()
  const { plugin } = editor
  const [algorithm, setAlgorithm] = useState([]) // 设置主题
  const [triggerSource, setTriggerSource] = useState<string | null>(null) // 记录是点击哪个 tab 触发的下拉菜单
  const [renameModalVisible, setRenameModalVisible] = useState(false) // 重命名
  const [renameModalName, setRenameModalName] = useState('') // 重命名的名称
  const [AIPanelSize, setAIPanelSize] = useState('0') // AI 面板大小
  const { styles } = useStyle()

  const tabs = state.tabs.tabs || []
  const [activeKey, setActiveKey] = useState('sheet')

  const switchTab = () => {
    if (state.tabs.defaultActiveKey !== 'sheet') {
      setActiveKey(state.tabs.defaultActiveKey)
    }
  }
  const items: TabsProps['items'] = tabs.map((tab) => {
    if (tab.type === TabType.SHEET) {
      return {
        key: tab.key,
        label: tab.label,
        children: <SheetTab switchTab={switchTab} />,
        forceRender: true,
      }
    }
    else if (tab.type === TabType.KANBAN) {
      return {
        key: tab.key,
        label: tab.label,
        children: (
          <KanbanTab
            key={tab.key}
            id={tab.key}
            univerApi={univerApi}
            config={state.views?.get(tab.key) ?? {}}
            workbook={state.sheet}
            dispatch={dispatch}
          />
        ),
        forceRender: true,
      }
    }
    else {
      return {
        key: tab.key,
        label: tab.label,
        children: null,
        forceRender: true,
      }
    }
  })

  log('[ContainerView]', 'items', items)
  useEventBus('fileRenamed', (payload) => {
    if (!payload) {
      return // 防止 undefined
    }
    const { oldPath, newPath } = payload
    const activeWorkbook = univerApi?.getActiveWorkbook()
    if (activeWorkbook && activeWorkbook.getName() === oldPath) {
      activeWorkbook.setName(newPath)
    }
  })

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

  const tabDropdownClick: MenuProps['onClick'] = (item) => {
    const { key } = item
    if (key === 'delete') {
      if (!triggerSource || triggerSource === 'sheet') {
        new Notice(t('CANNOT_DELETE_SHEET'))
        return
      }
      dispatch({ type: VIEW_REMOVE_ACTION, key: triggerSource })
      setTriggerSource(null)
    }
    if (key === 'default') {
      dispatch({ type: TAB_DEFAULT_ACTION, key: triggerSource || 'sheet' })
      setTriggerSource(null)
    }
    if (key === 'rename') {
      if (triggerSource) {
        const tab = tabs.find((t) => t.key === triggerSource)
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
    const sheet = univerApi.getActiveWorkbook()?.getActiveSheet()
    if (sheet === null || sheet === undefined) {
      return {}
    }
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
      dispatch({
        type: VIEW_ADD_ACTION,
        key: id,
        payload: {
          key: id,
          type: key as TabType,
          label: t(`TAB_TYPE_${key.toUpperCase()}` as any),
        },
      })
      if (key === TabType.KANBAN) {
        const kanbanData = createKanbanConfig()
        dispatch({
          type: VIEW_CONFIG_ADD_ACTION,
          key: id,
          payload: kanbanData,
        })
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
                  {state.tabs.defaultActiveKey === node.key ? <span>★</span> : null}
                  {tabs.find(tab => tab.key === node.key)?.label || ''}
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
              items={items}
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
            dispatch({
              type: TAB_RENAME_ACTION,
              key: triggerSource,
              payload: name,
            })
          }}
        />
      </ConfigProvider>
    </div>
  )
}
