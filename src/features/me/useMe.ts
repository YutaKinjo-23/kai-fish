import { useContext } from 'react';
import { MeContext } from './MeProvider';

export function useMe() {
  const ctx = useContext(MeContext);
  if (!ctx) {
    throw new Error('useMe must be used within MeProvider');
  }
  return ctx;
}
