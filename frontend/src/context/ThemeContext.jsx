import { createContext, useContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const ThemeContext = createContext();

export const useAppTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem('theme') || 'light');

  const toggleMode = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem('theme', next);
  };

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      ...(mode === 'dark' ? {
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
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
    },
  }), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, isDark: mode === 'dark' }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
