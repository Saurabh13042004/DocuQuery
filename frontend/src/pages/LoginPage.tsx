import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import { Alert, AuthHeading, Field, PasswordField, SubmitButton } from '../components/auth/fields';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';

const schema = z.object({
  email: z.string().min(1, 'Enter your email').email('That doesn’t look like an email address'),
  password: z.string().min(1, 'Enter your password'),
});
type FormData = z.infer<typeof schema>;

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  const state = location.state as { from?: { pathname: string }; notice?: string } | null;
  const destination = state?.from?.pathname ?? '/app';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!loading && isAuthenticated) return <Navigate to={destination} replace />;

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await login(data.email.trim(), data.password);
      navigate(destination, { replace: true });
    } catch (e) {
      setError(errorMessage(e, 'Sign in failed. Please try again.'));
    }
  };

  return (
    <AuthShell variant="login">
      <AuthHeading kicker="Sign in" title="Welcome back." subtitle="Sign in to open your registry." />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
        {state?.notice && <Alert tone="success">{state.notice}</Alert>}
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
        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password?.message}
          labelAside={
            <Link to="/forgot-password" className="text-xs font-bold text-primary transition-colors hover:text-[#1d4ed8]">
              Forgot password?
            </Link>
          }
          {...register('password')}
        />

        <SubmitButton loading={isSubmitting} loadingText="Signing in…" className="mt-1">
          Sign in <ArrowRight />
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-[13px] text-muted-foreground">
        New to DocuQuery?{' '}
        <Link to="/signup" className="font-bold text-primary hover:underline">
          Create a free account
        </Link>
      </p>
    </AuthShell>
  );
};

export default LoginPage;
