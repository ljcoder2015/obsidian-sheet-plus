import React, { useEffect, useState } from 'react'
import { ConfigProvider, Dropdown, Menu, Tabs, theme } from 'antd'
import type { IWorkbookData } from '@univerjs/core'
import { Notice } from 'obsidian'
import { randomString } from '../utils/uuid'
import { usePluginContext } from '../context/pluginContext'
import type { ParsedMarkdown } from '../utils/data'
import { getData, parseMarkdown, setData, stringifyMarkdown } from '../utils/data'
import type { MultiSheet } from '../common/constants'
import { TabType } from '../common/constants'
import { t } from '../lang/helpers'
import { SheetTab } from './tabs/SheetTab'
import type { ExcelProView } from './excelProView'

export function ContentView() {
  const pluginContext: ExcelProView = usePluginContext()
  const { data, plugin } = pluginContext
  const [activeKey, setActiveKey] = useState('sheet')
  const [tabs, setTabs] = useState<MultiSheet>([
    {
      key: 'sheet',
      type: TabType.SHEET,
      label: t('TAB_TYPE_SHEET'),
    },
  ])
  const [items, setItems] = useState([])
  const [markdownData, setMarkdownData] = useState<ParsedMarkdown | null>(null)
  const [algorithm, setAlgorithm] = useState([])

  useEffect(() => {
    if (data) {
      setMarkdownData(parseMarkdown(data))
    }
    return () => {
      setMarkdownData(null)
    }
  }, [data])

  // 保存数据
  const saveData = (data: any, key: string) => {
    setData(markdownData, key, data)
    const markdown = stringifyMarkdown(markdownData)
    if (markdown) {
      pluginContext.data = markdown
      pluginContext.save(false)
        .then(() => {
          // console.log('save data success', pluginContext.file.path)
        })
        .catch(() => {
          new Notice(t('SAVE_DATA_ERROR'))
          // console.log("save data error", e);
        })
    }
  }

  useEffect(() => {
    if (markdownData) {
      const tabsData = getData<MultiSheet>(markdownData, 'multiSheet')
      if (tabsData) {
        setTabs(tabsData.tabs)
        setActiveKey(tabsData.defaultActiveKey)
      }
      else {
        saveData({
          tabs,
          defaultActiveKey: activeKey,
        }, 'multiSheet')
      }
    }
  }, [markdownData])

  useEffect(() => {
    if (markdownData) {
      setItems(tabs.map((item) => {
        let children = <div />
        if (item.type === TabType.SHEET) {
          children = <SheetTab id={item.key} data={getData<IWorkbookData>(markdownData, item.key)} saveData={saveData} />
        }
        return {
          key: item.key,
          label: item.label,
          children,
        }
      }))
    }
  }, [tabs, markdownData])

  useEffect(() => {
    if (plugin.settings.darkModal === 'dark') {
      setAlgorithm([theme.darkAlgorithm])
    }
    else {
      setAlgorithm([])
    }
  }, [plugin.settings.darkModal])

  // 定义标签类型
  const tabTypes = [
    { type: 'group', name: '分组' },
    { type: 'kanban', name: '看板' },
    { type: 'bi', name: 'BI分析' },
    { type: 'pivot', name: '透视表' },
  ]

  // 处理删除标签
  const onEdit = (key: string, action: 'delete') => {
    if (action === 'delete') {
      setItems(items.filter(item => item.key !== key))
    }
  }

  // 处理添加新标签
  const handleAddTab = (type: string) => {
    const typeToName = tabTypes.reduce((acc, curr) => {
      acc[curr.type] = curr.name
      return acc
    }, {} as Record<string, string>)

    setItems([
      ...items,
      {
        key: randomString(6),
        label: typeToName[type] || '新标签',
        children: `${typeToName[type] || '新标签'} 内容`,
      },
    ])
  }

  // 自定义添加按钮
  const renderAddButton = () => {
    const menu = (
      <Menu>
        {tabTypes.map(item => (
          <Menu.Item key={item.type} onClick={() => handleAddTab(item.type)}>
            {item.name}
          </Menu.Item>
        ))}
      </Menu>
    )

    return (
      <Dropdown overlay={menu} trigger={['click']}>
        <button
          type="button"
          className="ant-tabs-btn ant-tabs-btn-add"
          aria-label="Add tab"
        >
        </button>
      </Dropdown>
    )
  }

  const onChange = (key: string) => {
    setActiveKey(key)
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
          type="editable-card"
          size="small"
          items={items}
          activeKey={activeKey}
          onChange={onChange}
          onEdit={onEdit}
        />
      </ConfigProvider>
    </div>
  )
}
