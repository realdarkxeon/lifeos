import GoalPool from './GoalPool'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <GoalPool areaId={id} />
}
