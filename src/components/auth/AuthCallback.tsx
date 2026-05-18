import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../hooks/useStore';
import { createOrUpdateProfile, isAdminEmail } from '../../lib/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate('/');
          return;
        }

        const authUser = session.user;
        const email = authUser.email || '';
        const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || null;
        const avatar = authUser.user_metadata?.avatar_url || null;

        // Check stored role preference — Login.tsx stores under 'selectedRole'
        const storedRole = (localStorage.getItem('selectedRole') || localStorage.getItem('ride_mitra_role')) as 'student' | 'driver' | 'admin' | 'both' | null;
        
        let role: string = storedRole || 'student';
        
        // Admin approval check
        if (role === 'admin') {
          if (!isAdminEmail(email)) {
            role = 'pending_admin';
          }
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (existingUser) {
          // Always sync profile photo and role from latest login if different
          const updates: Record<string, any> = {};
          if (avatar && existingUser.profile_photo !== avatar) updates.profile_photo = avatar;
          
          // If existing user is admin and they chose admin again, don't overwrite with pending
          if (role === 'admin' && !existingUser.admin_approved && !isAdminEmail(email)) {
            role = 'pending_admin';
          } else if (existingUser.user_type === 'admin' && existingUser.admin_approved && role === 'admin') {
             role = 'admin';
          }

          if (storedRole && existingUser.user_type !== role) updates.user_type = role;
          if (fullName && !existingUser.full_name) updates.full_name = fullName;

          let finalUser = existingUser;
          if (Object.keys(updates).length > 0) {
            const { data: updated } = await supabase.from('users').update(updates).eq('id', authUser.id).select().single();
            if (updated) finalUser = updated;
          }

          setUser(finalUser);
          if (finalUser.user_type === 'admin') navigate('/admin');
          else if (finalUser.user_type === 'pending_admin') navigate('/pending-admin');
          else if (finalUser.user_type === 'both') navigate('/unified');
          else if (finalUser.user_type === 'driver') navigate('/driver');
          else navigate('/student');
        } else {
          // Create new profile
          const profile = await createOrUpdateProfile(authUser.id, email, fullName, role);
          if (avatar) {
            await supabase.from('users').update({ profile_photo: avatar }).eq('id', authUser.id);
            profile.profile_photo = avatar;
          }
          setUser(profile);

          if (profile.user_type === 'admin') navigate('/admin');
          else if (profile.user_type === 'pending_admin') navigate('/pending-admin');
          else if (profile.user_type === 'both') navigate('/unified');
          else if (profile.user_type === 'driver') navigate('/driver');
          else navigate('/student');
        }

        localStorage.removeItem('selectedRole');
        localStorage.removeItem('ride_mitra_role');
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate, setUser, setLoading]);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-bold font-display text-gray-900">Signing you in...</h2>
        <p className="text-gray-500 mt-2">Just a moment while we set things up</p>
      </div>
    </div>
  );
}
