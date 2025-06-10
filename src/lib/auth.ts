import { supabase } from './supabase';
import { toast } from 'react-hot-toast';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const signUp = async ({ email, password, firstName, lastName }: SignUpData) => {
  try {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (signUpError) {
      throw signUpError;
    }

    if (!authData.user) {
      throw new Error('No user data returned');
    }

    // Sign in immediately after signup to create the profile
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw signInError;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw profileError;
    }

    // Sign out after profile creation
    await supabase.auth.signOut();
    toast.success('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
    return { success: true };

  } catch (error: any) {
    console.error('Error signing up:', error);
    
    if (error.message?.includes('User already registered')) {
      toast.error('Un compte existe déjà avec cet email');
    } else if (error.message?.includes('Password should be')) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
    } else {
      toast.error('Erreur lors de la création du compte. Veuillez réessayer.');
    }
    
    return { success: false, error };
  }
};

export const signIn = async ({ email, password }: SignInData) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('No user data returned');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              first_name: data.user.user_metadata?.first_name || '',
              last_name: data.user.user_metadata?.last_name || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        toast.success('Connexion réussie !');
        return { success: true, user: data.user, profile: newProfile };
      }
      throw profileError;
    }

    toast.success('Connexion réussie !');
    return { success: true, user: data.user, profile };

  } catch (error: any) {
    console.error('Error in signIn:', error);
    
    if (error.message?.includes('Invalid login credentials')) {
      toast.error('Email ou mot de passe incorrect');
    } else {
      toast.error('Erreur de connexion. Veuillez réessayer.');
    }
    
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: true };
    }

    localStorage.removeItem('supabase.auth.token');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    const { data: { session: checkSession } } = await supabase.auth.getSession();
    if (checkSession || localStorage.getItem('supabase.auth.token')) {
      throw new Error('La déconnexion a échoué');
    }
    
    toast.success('Déconnexion réussie !');
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    toast.error('Erreur lors de la déconnexion.');
    return { success: false, error };
  }
};

export const deleteAccount = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete account');
    }

    toast.success('Votre compte a été supprimé avec succès.');
    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    toast.error('Erreur lors de la suppression du compte.');
    return { success: false, error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw userError;
    }

    if (!user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        return { user, profile: newProfile };
      }
      throw profileError;
    }

    return { user, profile };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};