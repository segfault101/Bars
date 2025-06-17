import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

export const useRequireAuth = () => {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session) {
        navigation.navigate('Profile');
      }
    };

    checkAuth();
  }, []);
};
