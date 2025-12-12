'use client';

import { useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid email or password';
      case 'OAuthSignin':
        return 'Error signing in with OAuth provider';
      case 'OAuthCallback':
        return 'Error processing OAuth callback';
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account';
      case 'EmailCreateAccount':
        return 'Could not create email account';
      case 'Callback':
        return 'Error in callback';
      case 'OAuthAccountNotLinked':
        return 'Account already exists with different provider';
      case 'EmailSignin':
        return 'Error sending email';
      case 'SessionRequired':
        return 'Please sign in to access this page';
      default:
        return 'An authentication error occurred';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Authentication Error
          </h2>
        </div>
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {getErrorMessage(error)}
        </div>
        <div className="text-center">
          <a
            href="/auth/signin"
            className="inline-block px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
