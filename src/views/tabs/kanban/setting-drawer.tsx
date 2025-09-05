import React from 'react'
import { Drawer } from 'antd'
import { t } from '../../../lang/helpers'

interface ISettingDrawerProps {
  open: boolean
  onClose: () => void
}

export function SettingDrawer(props: ISettingDrawerProps) {
  const { open, onClose } = props
  return (
    <Drawer
      title={t('KANBAN_SETTING')}
      placement="right"
      onClose={onClose}
      open={open}
      getContainer={false}
    >
      <p>Some contents...</p>
    </Drawer>
  )
}
