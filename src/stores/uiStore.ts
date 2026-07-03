import { create } from 'zustand';

interface UIState {
  // True selama proses navigasi/pengambilan data halaman berlangsung.
  navLoading: boolean;
  setNavLoading: (v: boolean) => void;
  // True selama proses logout berlangsung (sampai diarahkan ke /login).
  // Mencegah klik logout berkali-kali & menampilkan overlay loading.
  signingOut: boolean;
  setSigningOut: (v: boolean) => void;
  // Collapse/expand sidebar desktop. Dikontrol dari Header (tombol menggantikan
  // label "Admin Panel"/"Kasir") sekaligus dibaca oleh Sidebar.
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

// Store ringan untuk status loading global (overlay saat pindah menu).
export const useUIStore = create<UIState>((set) => ({
  navLoading: false,
  setNavLoading: (v) => set({ navLoading: v }),
  signingOut: false,
  setSigningOut: (v) => set({ signingOut: v }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
