import { redirect } from 'next/navigation';

// Root route: middleware handles auth guard; this just redirects to the dashboard
export default function RootPage() {
  redirect('/dashboard');
}
