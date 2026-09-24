import { useEffect, useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageContainer, PageHeader, SectionLabel, Skeleton } from '../components/app/ui';
import { useAuth } from '../context/AuthContext';
import { getPlans, upgradePlan, getCreditHistory, errorMessage, PlansResponse } from '../services/api';
import { CreditTransaction, PlanId } from '../types';

const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'team'];
const CREDIT_CAP: Record<PlanId, number> = { free: 20, starter: 500, pro: 2000, team: 1500 };
const FEATURED: PlanId = 'starter';

const REASON_LABELS: Record<string, string> = {
  signup_bonus: 'Signup bonus',
  upload: 'Filed a PDF',
  ask: 'Asked a question',
  edit: 'Edited a PDF',
  plan_upgrade_starter: 'Starter plan',
  plan_upgrade_pro: 'Pro plan',
  plan_upgrade_team: 'Team plan',
  plan_switch_free: 'Switched to Free plan',
  plan_set_free: 'Plan set to Free',
  plan_set_starter: 'Plan set to Starter',
  plan_set_pro: 'Plan set to Pro',
  plan_set_team: 'Plan set to Team',
  team_seat: 'Team seat credits',
};

const COST_LABELS: Record<string, string> = {
  upload: 'File & index a PDF',
  ask: 'Ask a question',
  edit: 'Edit a PDF',
};

export default function PlansPage() {
  const { user, refreshUser } = useAuth();
  const [plansData, setPlansData] = useState<PlansResponse | null>(null);
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getPlans().then(setPlansData).catch(() => setError('Couldn’t load plans. Refresh to try again.'));
    getCreditHistory().then(setHistory).catch(() => {});
  }, []);

  const handleUpgrade = async (planId: PlanId) => {
    if (planId === user?.plan) return;
    setUpgrading(planId);
    setError('');
    try {
      await upgradePlan(planId);
      await refreshUser();
      const [fresh, freshHistory] = await Promise.all([getPlans(), getCreditHistory()]);
      setPlansData(fresh);
      setHistory(freshHistory);
    } catch (e) {
      setError(errorMessage(e, 'That didn’t go through. Please try again.'));
    } finally {
      setUpgrading(null);
    }
  };

  const currentPlan = (user?.plan ?? 'free') as PlanId;
  const credits = user?.credits ?? 0;
  const pct = Math.min(100, Math.round((credits / CREDIT_CAP[currentPlan]) * 100));

  return (
    <PageContainer wide>
      <PageHeader
        kicker="Membership"
        title="Plans & credits"
        description="Pay only if you file weekly. Credits are spent when you file, ask or edit."
      />

      {error && (
        <div role="alert" className="mb-6 rounded-[9px] border border-destructive/25 bg-destructive/5 px-4 py-3 text-[13px] font-semibold text-destructive">
          {error}
        </div>
      )}

      {/* Balance + tariff */}
      <div className="mb-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="animate-rise rounded-xl border bg-card p-5 sm:p-6">
          <div className="kicker">Your balance</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-4xl font-medium leading-none">{credits}</span>
            <span className="font-mono text-sm text-muted-foreground">/ {CREDIT_CAP[currentPlan].toLocaleString()} credits</span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#dbe8f9]">
            <div
              className={cn('h-full rounded-full transition-[width] duration-700', pct <= 20 ? 'bg-destructive' : 'bg-primary')}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            On the <span className="font-bold capitalize text-foreground">{currentPlan}</span> plan.
          </p>
        </div>

        <div className="animate-rise rounded-xl border bg-card p-5 sm:p-6" style={{ animationDelay: '60ms' }}>
          <div className="kicker">Credit tariff</div>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            {plansData
              ? Object.entries(plansData.costs).map(([op, cost]) => (
                  <div key={op} className="rounded-[9px] bg-secondary px-3.5 py-3">
                    <dt className="text-xs text-muted-foreground">{COST_LABELS[op] ?? op}</dt>
                    <dd className="mt-1 font-mono text-lg font-medium">
                      {cost} <span className="text-xs text-muted-foreground">cr</span>
                    </dd>
                  </div>
                ))
              : [0, 1, 2].map((i) => <Skeleton key={i} className="h-[62px]" />)}
          </dl>
        </div>
      </div>

      <SectionLabel left="Choose a plan" right="Change any time" />

      {/* Plan cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!plansData &&
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[420px] rounded-xl" />)}
        {plansData &&
          PLAN_ORDER.map((planId, i) => {
            const plan = plansData.plans[planId];
            if (!plan) return null;
            const isCurrent = currentPlan === planId;
            const rank = PLAN_ORDER.indexOf(planId) - PLAN_ORDER.indexOf(currentPlan);
            const featured = planId === FEATURED;
            const oneTime = plan.features.find((f) => /one-time/i.test(f));
            // The credit allowance is already the card's headline, so don't repeat it in the list.
            const features = plan.features.filter((f) => !/^[\d\s,]+(one-time\s+)?credits/i.test(f.trim()));

            return (
              <div
                key={planId}
                className={cn(
                  'relative flex animate-rise flex-col rounded-xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(49,93,151,0.1)]',
                  featured && 'border-2 border-primary p-[23px] shadow-[0_15px_35px_rgba(37,99,235,0.07)]',
                  isCurrent && !featured && 'border-primary/50',
                )}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                {featured && (
                  <span className="absolute -top-3 right-5 rounded-full bg-primary px-2.5 py-1 font-mono text-[9px] tracking-wider text-primary-foreground">
                    MOST FILED
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <span className="kicker">{plan.name}</span>
                  {isCurrent && (
                    <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-primary">
                      Current
                    </span>
                  )}
                </div>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-[38px] font-normal leading-none tracking-[-0.06em]">
                    {plan.price_usd === 0 ? 'Free' : `$${plan.price_usd}`}
                  </span>
                  {plan.price_usd > 0 && <span className="text-[13px] text-muted-foreground">/ month</span>}
                </div>
                <p className="mt-2 min-h-[36px] text-[13px] text-muted-foreground">{plan.description}</p>

                <p className="mt-5 border-b pb-5 text-[13px] font-bold">
                  {plan.monthly_credits > 0
                    ? `${plan.monthly_credits.toLocaleString()} credits / month${planId === 'team' ? ' / seat' : ''}`
                    : (oneTime?.replace(/\s*\(.*\)$/, '') ?? 'One-time credits')}
                </p>

                <ul className="my-5 flex-1 space-y-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px] text-[#5b708b]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : rank > 0 ? (
                  <Button
                    className="w-full"
                    variant={featured ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(planId)}
                    disabled={upgrading !== null}
                  >
                    {upgrading === planId ? (
                      <>
                        <Loader2 className="animate-spin" /> Upgrading…
                      </>
                    ) : (
                      <>
                        Upgrade to {plan.name} <ArrowRight />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => handleUpgrade(planId)}
                    disabled={upgrading !== null}
                  >
                    {upgrading === planId ? 'Switching…' : `Switch to ${plan.name}`}
                  </Button>
                )}
              </div>
            );
          })}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-14">
          <SectionLabel left="Credit history" right={`Last ${history.length}`} />
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b bg-secondary/60">
                  <th className="kicker px-4 py-3 text-left font-medium">Operation</th>
                  <th className="kicker px-4 py-3 text-left font-medium">Date</th>
                  <th className="kicker px-4 py-3 text-right font-medium">Credits</th>
                </tr>
              </thead>
              <tbody>
                {history.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0 transition-colors hover:bg-secondary/40">
                    <td className="px-4 py-3 font-bold">{REASON_LABELS[tx.reason] ?? tx.reason}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right font-mono font-medium',
                        tx.amount > 0 ? 'text-success' : 'text-muted-foreground',
                      )}
                    >
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
