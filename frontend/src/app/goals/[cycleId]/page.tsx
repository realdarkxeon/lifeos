import ActiveGoalDetail from './ActiveGoalDetail'

export default async function Page({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params
  return <ActiveGoalDetail cycleId={cycleId} />
}
