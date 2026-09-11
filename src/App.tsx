import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout, Page } from './components/Layout'
import { ResultCard } from './components/ResultCard'
import { RequireAuth } from './lib/auth'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Users, UserDetail, UserActionApplied } from './pages/Users'
import { Hosts, HostDetail, HostActionApplied } from './pages/Hosts'
import { Kyc, KycDetail, KycActionApplied } from './pages/Kyc'
import {
  Withdrawals,
  WithdrawalDetail,
  WithdrawalActionApplied,
} from './pages/Withdrawals'
import { Pricing } from './pages/Pricing'
import {
  CommissionConfig,
  ConfigurationUpdated,
  BeansEarnRate,
  NumericConfig,
  ConfigUpdatedGeneric,
  HostCommissionOverride,
  WithdrawalSlabs,
  GiftCatalog,
  EditGift,
} from './pages/PricingConfig'
import {
  Moderation,
  ModerationDetail,
  ModerationActionApplied,
} from './pages/Moderation'
import { AgeMode } from './pages/AgeMode'
import { AuditLogs } from './pages/AuditLogs'
import { Broadcast, BroadcastNew, BroadcastSent } from './pages/Broadcast'

function NotFound() {
  return (
    <Page title="Not found">
      <ResultCard
        title="Page not found"
        body="The page you were looking for does not exist."
        actions={[{ label: 'Back to Dashboard', to: '/' }]}
      />
    </Page>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />

        <Route path="/users" element={<Users />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/users/:id/applied" element={<UserActionApplied />} />

        <Route path="/hosts" element={<Hosts />} />
        <Route path="/hosts/:id" element={<HostDetail />} />
        <Route path="/hosts/:id/applied" element={<HostActionApplied />} />

        <Route path="/kyc" element={<Kyc />} />
        <Route path="/kyc/:id" element={<KycDetail />} />
        <Route path="/kyc/:id/applied" element={<KycActionApplied />} />

        <Route path="/withdrawals" element={<Withdrawals />} />
        <Route path="/withdrawals/:id" element={<WithdrawalDetail />} />
        <Route
          path="/withdrawals/:id/applied"
          element={<WithdrawalActionApplied />}
        />

        <Route path="/pricing" element={<Pricing />} />
        <Route path="/pricing/commission" element={<CommissionConfig />} />
        <Route
          path="/pricing/commission/success"
          element={<ConfigurationUpdated />}
        />
        <Route path="/pricing/beans-earn-rate" element={<BeansEarnRate />} />
        <Route
          path="/pricing/beans-earn-rate/success"
          element={<ConfigUpdatedGeneric />}
        />
        <Route path="/pricing/host-override" element={<HostCommissionOverride />} />
        <Route path="/pricing/withdrawal-slabs" element={<WithdrawalSlabs />} />
        <Route path="/pricing/gift-catalog" element={<GiftCatalog />} />
        <Route path="/pricing/gift-catalog/:id/edit" element={<EditGift />} />
        <Route
          path="/pricing/minimum-withdrawal"
          element={<NumericConfig configKey="minimum-withdrawal" />}
        />
        <Route
          path="/pricing/auto-approval"
          element={<NumericConfig configKey="auto-approval" />}
        />
        <Route path="/pricing/config-updated" element={<ConfigUpdatedGeneric />} />

        <Route path="/moderation" element={<Moderation />} />
        <Route path="/moderation/:id" element={<ModerationDetail />} />
        <Route
          path="/moderation/:id/applied"
          element={<ModerationActionApplied />}
        />

        <Route path="/age-mode" element={<AgeMode />} />
        <Route path="/audit-logs" element={<AuditLogs />} />

        <Route path="/broadcast" element={<Broadcast />} />
        <Route path="/broadcast/new" element={<BroadcastNew />} />
        <Route path="/broadcast/sent" element={<BroadcastSent />} />

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  )
}

export default App
