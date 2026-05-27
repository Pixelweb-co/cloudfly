'use client'

import React from 'react'
import WorkflowListTable from '@/views/automation/workflows/List/WorkflowListTable'
import { Box } from '@mui/material'

export default function WorkflowsListPage() {
  return (
    <Box sx={{ p: 6 }}>
      <WorkflowListTable />
    </Box>
  )
}
