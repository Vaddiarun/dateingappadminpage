import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Card, Button } from '../components/ui'
import { pricingCards } from '../data'

export function Pricing() {
  const navigate = useNavigate()
  return (
    <Page title="Pricing & Economics">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pricingCards.map((c) => (
          <Card key={c.key} className="flex flex-col gap-3 p-5">
            <div className="text-[11px] font-semibold tracking-[0.13em] text-ink uppercase">
              {c.title}
            </div>
            <div className={`text-[11px] ${c.accent ? 'text-amber' : 'text-muted'}`}>
              {c.summary}
            </div>
            <div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => c.to && navigate(c.to)}
              >
                {c.action}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  )
}
