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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #F8F6F1, #EEF2F7)', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, border: '4px solid #1B2B4B', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite', margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#2B2D42', fontFamily: "'Poppins', sans-serif" }}>Signing you in...</h2>
        <p style={{ fontSize: 14, color: '#9CA0AD', marginTop: 8 }}>Just a moment while we set things up</p>
      </div>
    </div>
  );
}
