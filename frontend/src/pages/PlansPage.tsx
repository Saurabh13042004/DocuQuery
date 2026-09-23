import React, { useEffect, useState } from 'react';
import { Check, Zap, Star, Crown, Users, ArrowRight, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { getPlans, upgradePlan, getCreditHistory } from '../services/api';
import { PlansResponse, CreditTransaction } from '../types';
import { PlanId } from '../types';

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="h-5 w-5" />,
  starter: <Star className="h-5 w-5" />,
  pro: <Crown className="h-5 w-5" />,
  team: <Users className="h-5 w-5" />,
};

const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'team'];

const REASON_LABELS: Record<string, string> = {
  signup_bonus: 'Signup bonus',
  upload: 'Upload PDF',
  ask: 'Q&A',
  edit: 'PDF edit',
  plan_upgrade_starter: 'Starter plan upgrade',
  plan_upgrade_pro: 'Pro plan upgrade',
  plan_upgrade_team: 'Team plan upgrade',
  team_seat: 'Team seat credits',
};

export default function PlansPage() {
  const { user, refreshUser } = useAuth();
  const [plansData, setPlansData] = useState<PlansResponse | null>(null);
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getPlans().then(setPlansData).catch(console.error);
    getCreditHistory().then(setHistory).catch(console.error);
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
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Upgrade failed. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  if (!plansData) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-muted-foreground">Loading plans…</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Plans & Credits</h1>
        <p className="text-muted-foreground mt-1">
          You have <span className="font-semibold text-foreground">{user?.credits ?? 0} credits</span> remaining on the{' '}
          <span className="font-semibold capitalize">{user?.plan}</span> plan.
        </p>
      </div>

      {/* Credit costs reference */}
      <div className="bg-muted/40 border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Coins className="h-4 w-4" /> Credit costs per operation
        </h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {Object.entries(plansData.costs).map(([op, cost]) => (
            <div key={op} className="flex justify-between">
              <span className="text-muted-foreground capitalize">{op}</span>
              <Badge variant="outline">{cost} credit{cost !== 1 ? 's' : ''}</Badge>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLAN_ORDER.map((planId) => {
          const plan = plansData.plans[planId];
          if (!plan) return null;
          const isCurrent = user?.plan === planId;
          const isUpgrade = PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(user?.plan as PlanId ?? 'free');
          const isDowngrade = PLAN_ORDER.indexOf(planId) < PLAN_ORDER.indexOf(user?.plan as PlanId ?? 'free');

          return (
            <div
              key={planId}
              className={`relative rounded-2xl border p-6 flex flex-col gap-4 transition-all ${
                planId === 'pro'
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border bg-card'
              }`}
            >
              {planId === 'pro' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3">Most Popular</Badge>
                </div>
              )}

              {/* Plan header */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${planId === 'pro' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {PLAN_ICONS[planId]}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{plan.name}</div>
                  <div className="text-xs text-muted-foreground">{plan.description}</div>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-foreground">
                  {plan.price_usd === 0 ? 'Free' : `$${plan.price_usd}`}
                </span>
                {plan.price_usd > 0 && <span className="text-muted-foreground text-sm mb-1">/month</span>}
              </div>

              {/* Credits */}
              <div className="text-sm text-muted-foreground">
                {plan.monthly_credits > 0
                  ? `${plan.monthly_credits.toLocaleString()} credits / month${planId === 'team' ? ' / seat' : ''}`
                  : '50 credits one-time'}
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-2">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    className="w-full gap-2"
                    variant={planId === 'pro' ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(planId)}
                    disabled={upgrading === planId}
                  >
                    {upgrading === planId ? 'Upgrading…' : `Upgrade to ${plan.name}`}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : isDowngrade ? (
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => handleUpgrade(planId)}
                    disabled={upgrading === planId}
                  >
                    {upgrading === planId ? 'Switching…' : `Switch to ${plan.name}`}
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Credit history */}
      {history.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Credit History</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Operation</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Credits</th>
                </tr>
              </thead>
              <tbody>
                {history.map((tx) => (
                  <tr key={tx.id} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground">
                      {REASON_LABELS[tx.reason] ?? tx.reason}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
