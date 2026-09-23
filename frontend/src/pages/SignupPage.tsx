import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Check } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import { Alert, AuthHeading, Field, PasswordField, PasswordStrength, SubmitButton } from '../components/auth/fields';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().min(1, 'Enter your email').email('That doesn’t look like an email address'),
  password: z.string().min(8, 'Use at least 8 characters'),
});
type FormData = z.infer<typeof schema>;

const SignupPage: React.FC = () => {
  const { signup, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!loading && isAuthenticated) return <Navigate to="/app" replace />;

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await signup(data.email.trim(), data.password, data.name.trim());
      navigate('/app', { replace: true });
    } catch (e) {
      setError(errorMessage(e, 'Couldn’t create your account. Please try again.'));
    }
  };

  return (
    <AuthShell variant="signup">
      <AuthHeading
        kicker="Create account"
        title="Start filing."
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <Check className="h-4 w-4 text-success" aria-hidden /> 20 free credits
            <span aria-hidden className="h-[3px] w-[3px] rounded-full bg-[#b8c7d9]" /> No card needed
          </span>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
        {error && <Alert>{error}</Alert>}

        <Field
          label="Full name"
          autoComplete="name"
          placeholder="Jane Doe"
          autoFocus
          error={errors.name?.message}
          {...register('name')}
        />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="grid gap-3">
          <PasswordField
            label="Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordStrength value={watch('password') ?? ''} />
        </div>

        <SubmitButton loading={isSubmitting} loadingText="Creating account…" className="mt-1">
          Create account <ArrowRight />
        </SubmitButton>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          By creating an account you agree to our{' '}
          <Link to="/terms-of-service" className="font-bold text-foreground hover:text-primary">
            Terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy-policy" className="font-bold text-foreground hover:text-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <p className="mt-8 text-center text-[13px] text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
};

export default SignupPage;
