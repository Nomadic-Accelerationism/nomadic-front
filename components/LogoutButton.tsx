import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const { logout } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Perform any API logout calls if needed
      await api.logout();
      
      // Clear the user context
      logout();
      
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
}
