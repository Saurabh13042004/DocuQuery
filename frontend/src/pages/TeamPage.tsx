import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../context/AuthContext';
import {
  getMyTeam, createTeam, inviteMember, acceptInvite, cancelInvite, changeMemberRole, removeMember,
  getTeamUsage, getTeamPrompts, addTeamPrompt, deleteTeamPrompt,
} from '../services/api';
import { PendingInvite, TeamInfo, TeamRole, MemberUsage, TeamPrompt } from '../types';

const CATEGORIES = ['General', 'HR', 'Legal', 'Finance'];
const selectClass = 'h-9 rounded-md border border-input bg-background px-2 text-sm';

export default function TeamPage() {
  const { user, refreshUser, refreshTeam } = useAuth();
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [usage, setUsage] = useState<MemberUsage[]>([]);
  const [prompts, setPrompts] = useState<TeamPrompt[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const [teamName, setTeamName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('editor');
  const [pTitle, setPTitle] = useState('');
  const [pText, setPText] = useState('');
  const [pCat, setPCat] = useState('General');

  const canManage = team?.role === 'owner' || team?.role === 'admin';
  const isOwner = team?.role === 'owner';

  const load = useCallback(async () => {
    const data = await getMyTeam();
    setTeam(data.team);
    setPending(data.pending_invites);
    if (data.team) {
      const t = data.team;
      setPrompts(await getTeamPrompts(t.id));
      setUsage(t.role === 'owner' || t.role === 'admin' ? await getTeamUsage(t.id) : []);
    }
    setLoaded(true);
    refreshTeam();
  }, [refreshTeam]);

  useEffect(() => { load().catch(() => setLoaded(true)); }, [load]);

  // Runs a mutation, surfaces the API error, then reloads.
  const run = async (fn: () => Promise<unknown>, after?: () => void) => {
    setError('');
    try {
      await fn();
      after?.();
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Something went wrong. Please try again.');
    }
  };

  if (!loaded) return <div className="p-8 text-muted-foreground">Loading team…</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 overflow-y-auto h-full">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6" />
        <h1 className="text-3xl font-bold text-foreground">Team</h1>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">{error}</div>
      )}

      {pending.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between border border-primary/40 bg-primary/5 rounded-xl p-4">
          <p className="text-sm">
            You've been invited to join <b>{inv.team_name}</b> as <b>{inv.role}</b>.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => run(() => acceptInvite(inv.id), refreshUser)}>Accept</Button>
            <Button size="sm" variant="ghost" onClick={() => run(() => cancelInvite(inv.id))}>Decline</Button>
          </div>
        </div>
      ))}

      {!team && (
        <div className="border border-border rounded-xl p-6 space-y-3">
          {user?.plan === 'team' ? (
            <>
              <h2 className="font-semibold">Create your workspace</h2>
              <div className="flex gap-2">
                <Input placeholder="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                <Button disabled={!teamName.trim()} onClick={() => run(() => createTeam(teamName), () => setTeamName(''))}>
                  Create
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-semibold">Work together on documents</h2>
              <p className="text-sm text-muted-foreground">
                The Team plan gives you a shared document library, roles and a usage dashboard for 5 seats.
              </p>
              <Link to="/app/plans"><Button>See plans</Button></Link>
            </>
          )}
        </div>
      )}

      {team && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{team.name}</h2>
              <p className="text-sm text-muted-foreground">
                {team.members.length + team.invites.length} of {team.seats} seats used
              </p>
            </div>
            <Badge variant="outline" className="capitalize">{team.role}</Badge>
          </div>

          {/* Members */}
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Member</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {team.members.map((m) => {
                  const isMe = m.user_id === user?.id;
                  const editable = canManage && m.role !== 'owner' && (isOwner || m.role !== 'admin');
                  return (
                    <tr key={m.user_id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{m.name}{isMe && ' (you)'}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {editable ? (
                          <select
                            className={selectClass}
                            value={m.role}
                            onChange={(e) => run(() => changeMemberRole(team.id, m.user_id, e.target.value as TeamRole))}
                          >
                            {(isOwner ? ['admin', 'editor', 'viewer'] : ['editor', 'viewer']).map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="capitalize">{m.role}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(editable || (isMe && m.role !== 'owner')) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => run(() => removeMember(team.id, m.user_id))}
                          >
                            {isMe ? 'Leave' : 'Remove'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {team.invites.map((i) => (
                  <tr key={`inv-${i.id}`} className="border-t border-border text-muted-foreground">
                    <td className="px-4 py-3">{i.email} <Badge variant="outline">Invited</Badge></td>
                    <td className="px-4 py-3 capitalize">{i.role}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => run(() => cancelInvite(i.id))}>Revoke</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {canManage && (
            <form
              className="flex flex-wrap gap-2"
              onSubmit={(e) => { e.preventDefault(); run(() => inviteMember(team.id, email, inviteRole), () => setEmail('')); }}
            >
              <Input className="flex-1 min-w-[220px]" type="email" required placeholder="teammate@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
              <select className={selectClass} value={inviteRole} onChange={(e) => setInviteRole(e.target.value as TeamRole)}>
                {(isOwner ? ['admin', 'editor', 'viewer'] : ['editor', 'viewer']).map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <Button type="submit">Invite</Button>
              <p className="w-full text-xs text-muted-foreground">
                They'll see the invite on this page after signing in with that email. Each seat comes with 1,500 credits.
              </p>
            </form>
          )}

          {/* Usage */}
          {canManage && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Usage</h2>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Member</th>
                      <th className="text-right px-4 py-3 font-medium">Credits used</th>
                      <th className="text-right px-4 py-3 font-medium">Docs shared</th>
                      <th className="text-right px-4 py-3 font-medium">Last active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...usage].sort((a, b) => b.credits_used - a.credits_used).map((u) => (
                      <tr key={u.user_id} className="border-t border-border">
                        <td className="px-4 py-3">{u.name}</td>
                        <td className="px-4 py-3 text-right">{u.credits_used}</td>
                        <td className="px-4 py-3 text-right">{u.docs_uploaded}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {u.last_active ? new Date(u.last_active).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Shared prompts */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Shared prompts</h2>
            <p className="text-xs text-muted-foreground mb-3">Shared prompts appear as quick actions in every team member's chat.</p>
            <div className="space-y-2">
              {prompts.length === 0 && <p className="text-sm text-muted-foreground">No shared prompts yet.</p>}
              {prompts.map((p) => (
                <div key={p.id} className="flex items-start justify-between border border-border rounded-lg p-3">
                  <div>
                    <div className="text-sm font-medium">{p.title} <Badge variant="outline">{p.category}</Badge></div>
                    <div className="text-xs text-muted-foreground mt-1">{p.prompt}</div>
                  </div>
                  {canManage && (
                    <Button size="sm" variant="ghost" onClick={() => run(() => deleteTeamPrompt(team.id, p.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {canManage && (
              <form
                className="mt-3 grid gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => addTeamPrompt(team.id, pTitle, pText, pCat), () => { setPTitle(''); setPText(''); });
                }}
              >
                <div className="flex gap-2">
                  <Input required placeholder="Title" value={pTitle} onChange={(e) => setPTitle(e.target.value)} />
                  <select className={selectClass} value={pCat} onChange={(e) => setPCat(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <Input required placeholder="Prompt, e.g. List all payment terms and due dates" value={pText}
                  onChange={(e) => setPText(e.target.value)} />
                <Button type="submit" className="justify-self-start">Publish to team</Button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
