import React, { useState } from 'react'
import { ConfigProvider, Dropdown, Menu, Tabs, theme } from 'antd'
import { randomString } from '../utils/uuid'

export function ContentView() {
  // 定义标签类型
  const tabTypes = [
    { type: 'sheet', name: '表格' },
    { type: 'group', name: '分组' },
    { type: 'kanban', name: '看板' },
    { type: 'bi', name: 'BI分析' },
    { type: 'pivot', name: '透视表' },
  ]

  const [activeKey, setActiveKey] = useState('1')
  const [items, setItems] = useState([
    {
      key: '1',
      label: '表格',
      children: '表格内容',
    },
    {
      key: '2',
      label: '分组',
      children: '分组内容',
    },
  ])

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
          algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
        }}
      >
        <Tabs
          type="editable-card"
          size="small"
          items={items}
          activeKey={activeKey}
          onChange={onChange}
          onEdit={onEdit}
          renderAddButton={renderAddButton}
        />
      </ConfigProvider>
    </div>
  )
}
