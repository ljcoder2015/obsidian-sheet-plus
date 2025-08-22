import React, { useState } from 'react'
import { Button, Input, Modal, message } from 'antd'
import { t } from '../../lang/helpers'

interface RenameModalProps {
  visible: boolean
  name: string
  onCancel: () => void
  onOk: (name: string) => void
}

export function RenameModal(props: RenameModalProps) {
  const [name, setName] = useState(props.name)
  return (
    <Modal
      centered
      open={props.visible}
      closable={false}
      footer={[
        <Button key="cancel" onClick={props.onCancel}>{t('TAB_RENAME_CANCEL')}</Button>,
        <Button
          key="ok"
          color="blue"
          variant="solid"
          onClick={() => {
            if (name.trim()) {
              props.onOk(name.trim())
            }
            else {
              message.error(t('TAB_RENAME_PLACEHOLDER'))
            }
          }}
        >
          {t('TAB_RENAME_OK')}
        </Button>,
      ]}
      title={t('TAB_RENAME_TITLE')}
    >
      <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('TAB_RENAME_PLACEHOLDER')} />
    </Modal>
  )
}
