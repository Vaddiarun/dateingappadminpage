import { useNavigate } from 'react-router-dom'
import { Card, Button } from './ui'

export function ResultCard({
  title,
  body,
  actions,
}: {
  title: string
  body: string
  actions: { label: string; to: string; variant?: 'primary' | 'outline' }[]
}) {
  const navigate = useNavigate()
  return (
    <div className="flex justify-center pt-24">
      <Card className="w-[520px] max-w-full px-10 py-9 text-center">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        <p className="mx-auto mt-2.5 max-w-[380px] text-[11px] leading-5 text-muted">
          {body}
        </p>
        <div className="mt-6 flex justify-center gap-2.5">
          {actions.map((a, i) => (
            <Button
              key={a.label}
              size="sm"
              variant={a.variant ?? (i === actions.length - 1 ? 'primary' : 'outline')}
              onClick={() => navigate(a.to)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}
