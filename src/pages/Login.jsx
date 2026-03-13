function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}

export default function Login() {
  const params = new URLSearchParams(window.location.search)
  const authError = params.get('auth_error')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-xl bg-suzy-pink flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-lg font-bold">FQ</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Feedback Queue</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Sign in with your Suzy account to continue
        </p>

        {authError === 'unauthorized_domain' && (
          <p className="text-sm text-red-500 mb-4">
            This app is only available to Suzy team members.
          </p>
        )}
        {authError && authError !== 'unauthorized_domain' && (
          <p className="text-sm text-red-500 mb-4">Sign in failed. Please try again.</p>
        )}

        <a
          href="/api/auth/google"
          className="inline-flex items-center gap-3 w-full justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <GoogleIcon />
          Sign in with Google
        </a>
      </div>
    </div>
  )
}
