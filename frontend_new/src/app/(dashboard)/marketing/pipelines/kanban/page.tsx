import PipelineKanbanBoard from '@/views/marketing/pipelines/Kanban/PipelineKanbanBoard'

export default function PipelinesKanbanPage() {
    // For now, loading the first pipeline or a default one
    // In a real scenario, this might come from a selector or URL param
    return <PipelineKanbanBoard pipelineId={1} />
}
