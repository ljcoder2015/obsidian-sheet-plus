import React from 'react'
import { Button, Drawer, Form, Select } from 'antd'
import { t } from '../../../lang/helpers'
import { useUniver } from '../../../context/UniverContext'
import { log } from '../../../utils/log'
import type { IKanbanConfig } from './KanbanTab'

const { Option } = Select

interface ISettingDrawerProps {
  data: IKanbanConfig
  header: string[]
  open: boolean
  onClose: () => void
  onFinish: (values: IKanbanConfig) => void
}

export function SettingDrawer(props: ISettingDrawerProps) {
  log('[SettingDrawer]', 'props', props)
  const { open, onClose, data, header, onFinish } = props
  const { univerApi } = useUniver()

  const sheets = univerApi.getActiveWorkbook().getSheets()

  return (
    <Drawer
      title={t('KANBAN_SETTING')}
      placement="right"
      onClose={onClose}
      open={open}
      getContainer={false}
    >
      <Form
        initialValues={data}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item name="sheetId" label={t('KANBAN_SETTING_SHEET_ID')} rules={[{ required: true }]}>
          <Select
            placeholder={t('KANBAN_SETTING_SHEET_ID_DESC')}
            allowClear
          >
            {sheets.map((sheet) => {
              const sheetId = sheet.getSheetId()
              const name = sheet.getSheetName()
              log('[SettingDrawer]', 'sheetId', sheetId, 'name', name)
              return (
                <Option key={sheetId} value={sheetId}>
                  {name}
                </Option>
              )
            })}
          </Select>
        </Form.Item>
        <Form.Item name="groupColumn" label={t('KANBAN_SETTING_GROUP_BY')} rules={[{ required: true }]}>
          <Select
            placeholder={t('KANBAN_SETTING_GROUP_BY_DESC')}
            allowClear
          >
            {header.map((title, index) => (
              <Option key={`${index}`} value={`${index}`}>
                {title}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item>
          <Button color="blue" variant="solid" htmlType="submit">
            {t('KANBAN_SETTING_SUBMIT')}
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  )
}
