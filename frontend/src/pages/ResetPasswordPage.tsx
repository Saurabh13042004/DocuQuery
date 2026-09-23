import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, KeyRound } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import { Alert, AuthHeading, PasswordField, PasswordStrength, SubmitButton } from '../components/auth/fields';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { errorMessage, resetPassword } from '../services/api';

const schema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string().min(1, 'Type your new password again'),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords don’t match' });
type FormData = z.infer<typeof schema>;

const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [linkDead, setLinkDead] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!token || linkDead) {
    return (
      <AuthShell variant="recovery">
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <KeyRound className="h-7 w-7" aria-hidden />
        </div>
        <AuthHeading
          kicker="Link problem"
          title="This link has expired."
          subtitle="Reset links work once and last 30 minutes. Request a fresh one and we’ll email it right over."
        />
        <Button asChild size="lg" className="w-full">
          <Link to="/forgot-password">
            Request a new link <ArrowRight />
          </Link>
        </Button>
        <p className="mt-6 text-center text-[13px]">
          <Link to="/login" className="font-bold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </AuthShell>
    );
  }

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const message = await resetPassword(token, data.password);
      navigate('/login', { replace: true, state: { notice: message } });
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 400) setLinkDead(true);
      else setError(errorMessage(e, 'Couldn’t update your password. Please try again.'));
    }
  };

  return (
    <AuthShell variant="recovery">
      <AuthHeading
        kicker="Password reset"
        title="Choose a new password."
        subtitle="Pick something you don’t use anywhere else."
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
        {error && <Alert>{error}</Alert>}
        <div className="grid gap-3">
          <PasswordField
            label="New password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            autoFocus
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordStrength value={watch('password') ?? ''} />
        </div>
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Type it once more"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        <SubmitButton loading={isSubmitting} loadingText="Updating…" className="mt-1">
          Update password <ArrowRight />
        </SubmitButton>
      </form>
    </AuthShell>
  );
};

export default ResetPasswordPage;
