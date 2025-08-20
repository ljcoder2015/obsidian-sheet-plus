import React, { useEffect, useState } from 'react'
import { ConfigProvider, Dropdown, Menu, Tabs, theme } from 'antd'
import type { IWorkbookData } from '@univerjs/core'
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

  useEffect(() => {
    if (data) {
      setMarkdownData(parseMarkdown(data))
    }
    return () => {
      setMarkdownData(null)
    }
  }, [data])

  useEffect(() => {
    if (markdownData) {
      const tabsData = getData<MultiSheet>(markdownData, 'multiSheet')
      if (tabsData) {
        setTabs(tabsData.tabs)
        setActiveKey(tabsData.defaultActiveKey)
      }
      else {
        setData(markdownData, 'multiSheet', {
          tabs,
          defaultActiveKey: activeKey,
        })
        const data = stringifyMarkdown(markdownData)
        pluginContext.data = data
        pluginContext.save(false)
      }
    }
  }, [markdownData])

  useEffect(() => {
    if (markdownData) {
      setItems(tabs.map((item) => {
        let children = <div />
        if (item.type === TabType.SHEET) {
          children = <SheetTab data={getData<IWorkbookData>(markdownData, item.key)} />
        }
        return {
          key: item.key,
          label: item.label,
          children,
        }
      }))
    }
  }, [tabs, markdownData])

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
    <div>
      <ConfigProvider
        theme={{
          algorithm: [theme.darkAlgorithm],
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
