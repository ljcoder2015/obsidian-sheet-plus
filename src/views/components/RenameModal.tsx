import React, { useEffect, useRef, useState } from 'react'
import type { InputRef } from 'antd'
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
  const inputRef = useRef<InputRef>(null)

  // 🔑 同步 props.name 到本地 state
  useEffect(() => {
    if (props.visible) {
      setName(props.name)
      // 等 modal 渲染完再聚焦 & 选中
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [props.name, props.visible])

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
      <Input ref={inputRef} value={name} onChange={e => setName(e.target.value)} placeholder={t('TAB_RENAME_PLACEHOLDER')} />
    </Modal>
  )
}
