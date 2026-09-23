import React, { useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowRight, FileText, Plus, UploadCloud, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DocumentBrowser from '../components/app/DocumentBrowser';
import { EmptyState, PageContainer, PageHeader } from '../components/app/ui';
import type { AppOutletContext } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { usePdf } from '../context/PdfContext';
import { PlanId } from '../types';

const CREDIT_CAP: Record<PlanId, number> = { free: 20, starter: 500, pro: 2000, team: 1500 };
const PLAN_LABEL: Record<PlanId, string> = { free: 'Free', starter: 'Starter', pro: 'Pro', team: 'Team' };

const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const Stat: React.FC<{ label: string; children: React.ReactNode; foot?: React.ReactNode; delay: number }> = ({
  label,
  children,
  foot,
  delay,
}) => (
  <div
    className="animate-rise rounded-xl border bg-card p-4 sm:p-5"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="kicker">{label}</div>
    <div className="mt-3">{children}</div>
    {foot && <div className="mt-3 text-xs text-muted-foreground">{foot}</div>}
  </div>
);

const Dashboard: React.FC = () => {
  const { documents, isLoading, fetchUserDocuments } = usePdf();
  const { user, team } = useAuth();
  const { openUpload } = useOutletContext<AppOutletContext>();
  const location = useLocation();
  const navigate = useNavigate();
  const canUpload = team?.role !== 'viewer';

  // Other pages can send people here with { openUploadModal: true }.
  useEffect(() => {
    const state = location.state as { openUploadModal?: boolean } | null;
    if (state?.openUploadModal) {
      openUpload();
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate, openUpload]);

  useEffect(() => {
    fetchUserDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plan = (user?.plan ?? 'free') as PlanId;
  const credits = user?.credits ?? 0;
  const pct = Math.min(100, Math.round((credits / CREDIT_CAP[plan]) * 100));
  const firstName = user?.name?.split(' ')[0] ?? '';
  const starred = useMemo(() => documents.filter((d) => d.starred).length, [documents]);

  return (
    <PageContainer wide>
      <PageHeader
        kicker="Your registry"
        title={
          <>
            {greeting()}
            {firstName && (
              <>
                , <span className="text-primary">{firstName}.</span>
              </>
            )}
          </>
        }
        description={
          isLoading
            ? 'Loading your documents…'
            : documents.length === 0
              ? 'Nothing filed yet. Upload a PDF to ask it questions or edit it.'
              : `${documents.length} document${documents.length === 1 ? '' : 's'} filed. Open one to ask a question or make an edit.`
        }
        actions={
          canUpload && (
            <Button onClick={openUpload} size="lg" className="w-full sm:w-auto">
              <Plus /> Upload PDF
            </Button>
          )
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Documents" delay={40} foot="Filed in your registry">
          <div className="font-mono text-3xl font-medium leading-none">{documents.length}</div>
        </Stat>
        <Stat label="Starred" delay={80} foot="Pinned for quick access">
          <div className="font-mono text-3xl font-medium leading-none">{starred}</div>
        </Stat>
        <Stat
          label="Credits"
          delay={120}
          foot={
            <Link to="/app/plans" className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
              {plan === 'free' ? 'Get more credits' : 'Manage credits'} <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-medium leading-none">{credits}</span>
            <span className="font-mono text-xs text-muted-foreground">/ {CREDIT_CAP[plan].toLocaleString()}</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#dbe8f9]">
            <div
              className={cn('h-full rounded-full transition-[width] duration-700', pct <= 20 ? 'bg-destructive' : 'bg-primary')}
              style={{ width: `${pct}%` }}
            />
          </div>
        </Stat>
        <Stat
          label="Plan"
          delay={160}
          foot={
            plan === 'free' ? (
              <span className="inline-flex items-center gap-1">
                <Zap className="h-3 w-3 text-primary" /> Starter is $9/mo
              </span>
            ) : (
              'Renews monthly'
            )
          }
        >
          <div className="text-3xl font-extrabold leading-none tracking-[-0.05em]">{PLAN_LABEL[plan]}</div>
        </Stat>
      </div>

      <DocumentBrowser
        documents={documents}
        isLoading={isLoading}
        tabs
        empty={
          <EmptyState
            icon={<UploadCloud className="h-6 w-6" />}
            title="File your first PDF"
            description="Drop in a contract, offer letter or statement. It’s indexed in seconds, then ask it anything or tell it what to change."
            action={
              canUpload ? (
                <Button onClick={openUpload} size="lg">
                  <FileText /> Upload a PDF
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Your team role is view-only, so uploads are turned off.</p>
              )
            }
          />
        }
      />
    </PageContainer>
  );
};

export default Dashboard;
