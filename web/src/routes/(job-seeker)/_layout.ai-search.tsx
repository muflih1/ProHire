import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(job-seeker)/_layout/ai-search')({
  component: AiSearch,
})

function AiSearch() {
  return <div>Hello "/(job-seeker)/_layout/ai-search"!</div>
}
