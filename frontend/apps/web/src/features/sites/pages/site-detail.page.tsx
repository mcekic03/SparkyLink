import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, getRouteApi, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MapPinIcon, PencilIcon, PhoneIcon, RotateCcwIcon, Trash2Icon } from 'lucide-react'
import { Alert, AlertDescription } from '@app/ui/components/alert'
import { Button } from '@app/ui/components/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@app/ui/components/tabs'
import { ConfirmBubble } from '#/components/confirm-bubble'
import { QueryError } from '#/components/query-error'
import { useAuth } from '#/lib/auth-context'
import { getApiErrorMessage } from '#/lib/api-error'
import { formatDay } from '#/lib/format'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { MONEY_DEPENDENT_KEYS } from '#/lib/query-keys'
import { canViewFinances } from '#/types/user'
import { deleteSite, fetchSite, restoreSite } from '../api/sites.api'
import { sitesKeys } from '../api/sites.keys'
import { DocumentsTab } from '../components/documents-tab'
import { ItemsTab } from '../components/items-tab'
import { LaborTab } from '../components/labor-tab'
import { MediaTab } from '../components/media-tab'
import { NotesTab } from '../components/notes-tab'
import { PaymentsTab } from '../components/payments-tab'
import { ReceiptsTab } from '../components/receipts-tab'
import { PaymentStatusBadge, SiteStatusBadge } from '../components/status-badges'
import { SummaryPanel } from '../components/summary-panel'
import { SITE_TABS } from '../config/site-tabs'
import type { SiteTab } from '../config/site-tabs'
import { SiteStatus } from '../types'
import type { Site } from '../types'

const routeApi = getRouteApi('/_authed/gradilista/$siteId/')

/** A worker sees the site, its receipts, photos and notes — never money. */
const WORKER_TABS: ReadonlyArray<SiteTab> = ['overview', 'receipts', 'media', 'notes']

export function SiteDetailPage() {
  const { t } = useTranslation()
  const { siteId } = routeApi.useParams()
  const { tab } = routeApi.useSearch()
  const navigate = useNavigate()
  const { user } = useAuth()
  const finances = canViewFinances(user)
  const id = Number(siteId)

  const { data: site, isError, error, refetch } = useQuery({
    queryKey: sitesKeys.detail(id),
    queryFn: () => fetchSite(id),
  })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch site')
  }, [isError, error])

  const tabs = finances ? SITE_TABS : WORKER_TABS
  const activeTab: SiteTab = tab && tabs.includes(tab) ? tab : 'overview'

  if (isError) {
    return (
      <QueryError
        error={error}
        title={t('sites.detail.loadFailed')}
        onRetry={() => logOnFail(() => refetch(), 'Retry fetching site failed')}
      />
    )
  }

  if (!site) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
  }

  return (
    <div className="min-w-0">
      <SiteHeader site={site} canManage={finances} />
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          logOnFail(
            () => navigate({ to: '.', search: (prev) => ({ ...prev, tab: SITE_TABS.find((name) => name === value) }), replace: true }),
            'Tab navigation failed',
          )
        }
        className="mt-4"
      >
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max">
            {tabs.map((name) => (
              <TabsTrigger key={name} value={name}>
                {t(`sites.detail.tabs.${name}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="overview" className="mt-4">
          <Overview site={site} finances={finances} />
        </TabsContent>
        {finances && (
          <>
            <TabsContent value="items" className="mt-4">
              <ItemsTab site={site} />
            </TabsContent>
            <TabsContent value="labor" className="mt-4">
              <LaborTab site={site} />
            </TabsContent>
            <TabsContent value="payments" className="mt-4">
              <PaymentsTab site={site} />
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <DocumentsTab site={site} />
            </TabsContent>
          </>
        )}
        <TabsContent value="receipts" className="mt-4">
          <ReceiptsTab site={site} canManage={finances} />
        </TabsContent>
        <TabsContent value="media" className="mt-4">
          <MediaTab site={site} />
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
          <NotesTab site={site} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SiteHeader({ site, canManage }: { site: Site; canManage: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const invalidate = () => {
    for (const key of MONEY_DEPENDENT_KEYS) {
      logOnFail(() => queryClient.invalidateQueries({ queryKey: key }), 'Invalidate after site change failed')
    }
  }

  const deleteMutation = useMutation({
    mutationFn: () => deleteSite(site.id),
    onSuccess: async (response) => {
      toast.success(response.message)
      invalidate()
      await navigate({ to: '/gradilista', search: {} })
    },
    onError: (err: unknown) => {
      logger.error({ err }, 'Failed to delete site')
      toast.error(getApiErrorMessage(err, t('sites.delete.failed')))
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => restoreSite(site.id),
    onSuccess: (response) => {
      toast.success(response.message)
      invalidate()
    },
    onError: (err: unknown) => {
      logger.error({ err }, 'Failed to restore site')
      toast.error(getApiErrorMessage(err, t('sites.restore.failed')))
    },
  })

  const location = [site.address, site.city].filter(Boolean).join(', ')

  return (
    <div className="space-y-3">
      {site.is_deleted && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            {t('sites.detail.deleted')}
            {canManage && (
              <Button size="sm" variant="outline" onClick={() => restoreMutation.mutate()} disabled={restoreMutation.isPending}>
                <RotateCcwIcon /> {t('sites.restore.action')}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{site.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SiteStatusBadge status={site.status} />
            {site.financials && site.status !== SiteStatus.Offer && <PaymentStatusBadge status={site.financials.payment_status} />}
          </div>
          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
            {location && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(location)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                <MapPinIcon className="size-4" /> {location}
              </a>
            )}
            {site.investor_name && <span>{site.investor_name}</span>}
            {site.investor_phone && (
              <a href={`tel:${site.investor_phone}`} className="inline-flex items-center gap-1 font-medium text-foreground hover:underline">
                <PhoneIcon className="size-4" /> {site.investor_phone}
              </a>
            )}
          </div>
        </div>
        {canManage && !site.is_deleted && (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/gradilista/$siteId/izmena" params={{ siteId: String(site.id) }}>
                <PencilIcon /> {t('common.edit')}
              </Link>
            </Button>
            <ConfirmBubble message={t('sites.delete.confirm')} onConfirm={() => deleteMutation.mutate()} side="bottom">
              <Button variant="outline" size="sm" className="text-destructive" aria-label={t('sites.delete.action')}>
                <Trash2Icon />
              </Button>
            </ConfirmBubble>
          </div>
        )}
      </div>
    </div>
  )
}

function Overview({ site, finances }: { site: Site; finances: boolean }) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-4">
      {finances && <SummaryPanel site={site} />}
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title={t('sites.form.sectionInvestor')}>
          <InfoRow label={t('sites.form.investorName')} value={site.investor_name} />
          <InfoRow label={t('sites.form.investorPhone')} value={site.investor_phone} href={site.investor_phone ? `tel:${site.investor_phone}` : undefined} />
          <InfoRow label={t('sites.form.investorEmail')} value={site.investor_email} href={site.investor_email ? `mailto:${site.investor_email}` : undefined} />
          <InfoRow label={t('sites.form.investorAddress')} value={site.investor_address} />
        </InfoCard>
        <InfoCard title={t('sites.form.sectionSite')}>
          <InfoRow label={t('sites.form.address')} value={[site.address, site.city].filter(Boolean).join(', ')} />
          <InfoRow label={t('sites.form.startedAt')} value={formatDay(site.started_at)} />
          <InfoRow label={t('sites.form.completedAt')} value={formatDay(site.completed_at)} />
          {site.description && <p className="mt-2 text-sm whitespace-pre-line">{site.description}</p>}
        </InfoCard>
      </div>
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <dl className="grid gap-2 text-sm">{children}</dl>
    </section>
  )
}

function InfoRow({ label, value, href }: { label: string; value: string | null | undefined; href?: string }) {
  if (!value) return null

  return (
    <div className="grid grid-cols-[9rem_1fr] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{href ? <a href={href} className="hover:underline">{value}</a> : value}</dd>
    </div>
  )
}
