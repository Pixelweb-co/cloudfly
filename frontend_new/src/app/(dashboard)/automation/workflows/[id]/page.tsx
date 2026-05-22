'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import WorkflowEditor from '@/views/automation/workflows/Editor/WorkflowEditor'

export default function EditWorkflowPage() {
  const params = useParams()
  const id = params.id ? parseInt(params.id as string, 10) : undefined

  return <WorkflowEditor isNew={false} workflowId={id} />
}
