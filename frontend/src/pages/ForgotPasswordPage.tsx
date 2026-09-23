import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, MailCheck } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import { Alert, AuthHeading, Field, SubmitButton } from '../components/auth/fields';
import { Button } from '@/components/ui/button';
import { errorMessage, forgotPassword } from '../services/api';

const schema = z.object({
  email: z.string().min(1, 'Enter your email').email('That doesn’t look like an email address'),
});
type FormData = z.infer<typeof schema>;

const RESEND_SECONDS = 30;

const ForgotPasswordPage: React.FC = () => {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const send = async (email: string) => {
    setError('');
    try {
      await forgotPassword(email);
      setSentTo(email);
      setCooldown(RESEND_SECONDS);
    } catch (e) {
      setError(errorMessage(e, 'Couldn’t send the reset link. Please try again.'));
    }
  };

  const onSubmit = (data: FormData) => send(data.email.trim());

  const resend = async () => {
    if (!sentTo || cooldown > 0) return;
    setResending(true);
    await send(sentTo);
    setResending(false);
  };

  if (sentTo) {
    return (
      <AuthShell variant="recovery">
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary">
          <MailCheck className="h-7 w-7" aria-hidden />
        </div>
        <AuthHeading
          kicker="Check your inbox"
          title="Reset link sent."
          subtitle={
            <>
              If an account exists for <strong className="break-words text-foreground">{sentTo}</strong>, a link to choose
              a new password is on its way. It expires in 30 minutes.
            </>
          }
        />
        {error && <Alert className="mb-4">{error}</Alert>}
        <div className="grid gap-3">
          <Button asChild size="lg" className="w-full">
            <Link to="/login">
              Back to sign in <ArrowRight />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="w-full" disabled={cooldown > 0 || resending} onClick={resend}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending…' : 'Resend the email'}
          </Button>
        </div>
        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          Nothing there? Check your spam folder, or make sure you used the email you signed up with.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell variant="recovery">
      <AuthHeading
        kicker="Password reset"
        title="Forgot your password?"
        subtitle="Enter your email and we’ll send you a link to choose a new one."
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
        {error && <Alert>{error}</Alert>}
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          autoFocus
          error={errors.email?.message}
          {...register('email')}
        />
        <SubmitButton loading={isSubmitting} loadingText="Sending link…" className="mt-1">
          Send reset link <ArrowRight />
        </SubmitButton>
      </form>
      <p className="mt-8 text-center text-[13px]">
        <Link to="/login" className="group inline-flex items-center gap-1.5 font-bold text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
