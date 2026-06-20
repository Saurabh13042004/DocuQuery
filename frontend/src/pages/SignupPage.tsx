import React from 'react';
import AuthPage from './AuthPage';

const SignupPage: React.FC = () => {
  return <AuthPage defaultIsSignIn={false} />;
};

export default SignupPage;
