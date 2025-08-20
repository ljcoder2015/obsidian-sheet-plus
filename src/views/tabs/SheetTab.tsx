import { FUniver } from '@univerjs/core/facade'
import React, { useEffect, useRef, useState } from 'react'
import type { IWorkbookData, Univer } from '@univerjs/core'
import { createUniver } from '../univer/setup-univer'
import { usePluginContext } from '../../context/pluginContext'
import type { ExcelProView } from '../excelProView'
import { randomString } from '../../utils/uuid'

export function SheetTab({ data }: { data: IWorkbookData }) {
  const pluginContext: ExcelProView = usePluginContext()
  const { plugin } = pluginContext
  const containerRef = useRef<HTMLDivElement>(null)
  const [univer, setUniver] = useState<Univer>()
  const [univerAPI, setUniverAPI] = useState<FUniver>()
  const [univerId, setUniverId] = useState<string>(randomString(6))

  useEffect(() => {
    const options = {
      header: true,
      footer: true,
    }

    const darkMode = plugin.settings.darkModal === 'dark'
    const mobileRenderMode = plugin.settings.mobileRenderMode

    const univerId = randomString(6)
    setUniverId(univerId)
    const univer = createUniver(options, containerRef.current, mobileRenderMode, darkMode)
    setUniver(univer)
    setUniverAPI(FUniver.newAPI(univer))

    return () => {
      univerAPI?.dispose()
    }
  }, [])

  useEffect(() => {
    if (univerAPI) {
      univerAPI.createWorkbook(data)
    }
  }, [univerAPI])

  return (
    <div id="sheet-box">
      <div ref={containerRef} id={univerId} className="my-univer" />
    </div>
  )
}
