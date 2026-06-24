import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useAppTheme = () => useContext(ThemeContext);

// Inner provider — lives inside AuthProvider so it can read currentUser
const ThemeProviderInner = ({ children }) => {
  const { currentUser } = useAuth();
  // Key is per-user: each account has its own preference
  const storageKey = currentUser?._id ? `theme_${currentUser._id}` : 'theme_guest';

  const [mode, setMode] = useState(() => localStorage.getItem(storageKey) || 'light');

  // When user changes (login / logout / switch account), load that user's preference
  useEffect(() => {
    const saved = localStorage.getItem(storageKey) || 'light';
    setMode(saved);
  }, [storageKey]);

  const toggleMode = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem(storageKey, next);
  };

  const isDark = mode === 'dark';

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      ...(isDark ? {
        primary: { main: '#6366f1' },
        background: { default: '#0f172a', paper: '#1e293b' },
        text: { primary: '#f1f5f9', secondary: '#94a3b8' },
        divider: '#334155',
      } : {
        primary: { main: '#4f46e5' },
        background: { default: '#f8fafc', paper: '#ffffff' },
        text: { primary: '#0f172a', secondary: '#64748b' },
        divider: '#e2e8f0',
      }),
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none' } } },
    },
  }), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, isDark }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Outer wrapper — exported. Must be placed INSIDE AuthProvider.
export const ThemeProvider = ({ children }) => <ThemeProviderInner>{children}</ThemeProviderInner>;
