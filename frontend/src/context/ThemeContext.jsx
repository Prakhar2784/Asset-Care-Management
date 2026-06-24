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
        primary: { main: '#CBFA57' },
        background: { default: '#0D0D0D', paper: '#161616' },
        text: { primary: '#F0F0F0', secondary: '#707070' },
        divider: '#252525',
        action: { hover: '#1C1C1C', selected: '#1C1C1C' },
      } : {
        primary: { main: '#141414' },
        background: { default: '#ECEAE3', paper: '#FFFFFF' },
        text: { primary: '#0D0D0D', secondary: '#737373' },
        divider: '#DDD8CE',
        action: { hover: '#F5F2EB', selected: '#EDE8DF' },
      }),
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeightBold: 700,
    },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700 } } },
      MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
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
