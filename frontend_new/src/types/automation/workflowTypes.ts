export interface WorkflowStep {
  type: 'IF' | 'SWITCH' | 'ACTION';
  
  // Logic IF
  condition?: {
    field: string;
    operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS';
    value: any;
  };
  thenStepId?: string | null;
  elseStepId?: string | null;
  
  // Logic SWITCH
  field?: string;
  cases?: Record<string, string>;
  defaultStepId?: string | null;
  
  // Logic ACTION
  actionCode?: string;
  actionParameters?: Record<string, any>;
  nextStepId?: string | null;

  // Metadata visual for structural canvas rendering
  uiMetadata?: {
    position: { x: number; y: number };
    label?: string;
  };
}

export interface Workflow {
  id: number;
  tenantId: number;
  companyId: number;
  name: string;
  description?: string;
  triggerEvent: string;
  cronExpression?: string | null;
  initialStepId: string;
  workflowSteps: Record<string, WorkflowStep>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  executionCount?: number;
}

export interface WorkflowExecutionLog {
  id: number;
  workflowId: number;
  tenantId: number;
  companyId: number;
  status: 'SUCCESS' | 'FAILED' | 'FILTERED';
  triggerPayload: string;
  errorMessage?: string;
  executionTimeMs: number;
  createdAt: string;
}

export interface WorkflowPaginatedResponse {
  items: Workflow[];
  totalItems: number;
  page: number;
  size: number;
}
