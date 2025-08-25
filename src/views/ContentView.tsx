import React, { useEffect, useMemo, useState } from 'react'
import type { MenuProps } from 'antd'
import { Button, ConfigProvider, Dropdown, Flex, Popover, Tabs, theme } from 'antd'
import type { IWorkbookData } from '@univerjs/core'
import { randomString } from '../utils/uuid'
import { usePluginContext } from '../context/pluginContext'
import type { MultiSheet } from '../common/constants'
import { TabType } from '../common/constants'
import { t } from '../lang/helpers'
import type { DataService } from '../services/data.service'
import { SheetTab } from './tabs/SheetTab'
import type { ExcelProView } from './excelProView'
import { KanbanTab } from './tabs/KanbanTab'
import { RenameModal } from './components/RenameModal'

const helpContent = (
  <div>
    <h3>{t('TAB_HELP_TITLE')}</h3>
    <a href="https://github.com/ljcoder2015/obsidian-sheet-plus/wiki/User-Guide" target="_blank">{t('TAB_HELP_CONTENT')}</a>
  </div>
)

export interface ContentViewProps {
  dataService: DataService
}

export function ContentView(props: ContentViewProps) {
  const { dataService } = props
  const pluginContext: ExcelProView = usePluginContext()
  const { plugin } = pluginContext
  const [activeKey, setActiveKey] = useState('sheet')
  const [tabsData, setTabsData] = useState<MultiSheet>({
    tabs: [
      {
        key: 'sheet',
        type: TabType.SHEET,
        label: t('TAB_TYPE_SHEET'),
      },
    ],
    defaultActiveKey: 'sheet',
  })
  const [items, setItems] = useState([]) // 标签元素
  const [algorithm, setAlgorithm] = useState([])
  const [triggerSource, setTriggerSource] = useState<string | null>(null) // 记录是点击哪个 tab 触发的下拉菜单
  const [renameModalVisible, setRenameModalVisible] = useState(false)
  const [renameModalName, setRenameModalName] = useState('')

  // 保存数据
  const saveData = (data: any, key: string) => {
    pluginContext.saveData(data, key)
  }

  const onSheetRender = (isToRange: boolean) => {
    if (tabsData && tabsData.defaultActiveKey !== 'sheet' && !isToRange) {
      setActiveKey(tabsData.defaultActiveKey)
    }
  }

  useEffect(() => {
    if (dataService) {
      const tabs = dataService.getBlock<MultiSheet>('multiSheet')
      if (tabs) {
        setTabsData(tabs)
        if (tabs.defaultActiveKey === 'sheet') {
          setActiveKey(tabs.defaultActiveKey)
        }
      }
      else {
        saveData({
          tabs: tabsData.tabs,
          defaultActiveKey: activeKey,
        }, 'multiSheet')
      }
    }
  }, [dataService])

  useEffect(() => {
    if (dataService) {
      setItems(tabsData.tabs.map((item) => {
        let children = <div />
        switch (item.type) {
          case TabType.SHEET:
            children = <SheetTab id={item.key} data={dataService.getBlock<IWorkbookData>(item.key)} saveData={saveData} onRender={onSheetRender} />
            break
          case TabType.KANBAN:
            children = <KanbanTab />
            break
        }
        return {
          key: item.key,
          label: item.label,
          children,
        }
      }))
    }
  }, [tabsData.tabs])

  useEffect(() => {
    if (plugin.settings.darkModal === 'dark') {
      setAlgorithm([theme.darkAlgorithm])
    }
    else {
      setAlgorithm([])
    }
  }, [plugin.settings.darkModal])

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
      saveData({
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
      }, 'multiSheet')
    }
  }, [renameModalName, renameModalVisible])

  const tabDropdownClick: MenuProps['onClick'] = (item) => {
    const { key } = item
    if (key === 'delete') {
      // 删除tab数据并保存
      setTabsData({
        ...tabsData,
        tabs: tabsData.tabs.filter(tab => tab.key !== triggerSource),
      })
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

  useMemo(() => {
    if (tabsData) {
      saveData(tabsData, 'multiSheet')
    }
  }, [tabsData])

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
      // 添加tab数据并保存
      setTabsData({
        ...tabsData,
        tabs: [
          ...tabsData.tabs,
          {
            key: randomString(6),
            type: key as TabType,
            label: t(`TAB_TYPE_${key.toUpperCase()}` as any),
          },
        ],
      })
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
                className="mr-[10px]"
                onClick={() => {
                  setActiveKey(node.key)
                }}
              >
                {tabsData.defaultActiveKey === node.key ? <span>★</span> : null}
                {tabsData.tabs?.find(tab => tab.key === node.key)?.label || ''}
              </Button>
            </Dropdown>
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
}
