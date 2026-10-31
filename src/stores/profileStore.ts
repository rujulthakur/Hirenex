import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileState {
  /** Profile photo as a small data URL. The server copy is the real one; this is a cache so the photo shows instantly. */
  photo: string | null;
  setPhoto: (photo: string | null) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist((set) => ({ photo: null, setPhoto: (photo) => set({ photo }) }), { name: 'trusthire-photo-cache' }),
);
