import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const ThemeContext = createContext();

export const useAppTheme = () => useContext(ThemeContext);

const ThemeProviderInner = ({ children }) => {
  const { currentUser } = useAuth();
  const storageKey = currentUser?._id ? `theme_${currentUser._id}` : 'theme_guest';

  const [mode, setMode] = useState(() => localStorage.getItem(storageKey) || 'dark');
  const [branding, setBranding] = useState({
    name: 'AssetCare',
    logoUrl: null,
    primaryColor: '#141414',
    secondaryColor: '#A855F7'
  });
  const [brandingLoading, setBrandingLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      const res = await api.get('/auth/tenant-branding');
      setBranding(res.data);
    } catch (err) {
      console.error('Failed to load tenant branding:', err);
    } finally {
      setBrandingLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      // Logged out — reset to the generic default instead of keeping a stale tenant's branding
      setBranding({ name: 'AssetCare', logoUrl: null, primaryColor: '#141414', secondaryColor: '#A855F7' });
      setBrandingLoading(false);
      return;
    }
    fetchBranding();
    window.addEventListener('tenant-branding-changed', fetchBranding);
    return () => window.removeEventListener('tenant-branding-changed', fetchBranding);
  }, [currentUser?.tenantId]);

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
        primary: { main: '#A855F7' },
        secondary: { main: '#EC4899' },
        background: { default: '#080812', paper: '#0F0C28' },
        text: { primary: '#FFFFFF', secondary: '#8B8BAA' },
        divider: '#1E1A2E',
        action: { hover: 'rgba(168,85,247,0.08)', selected: 'rgba(168,85,247,0.15)' },
      } : {
        primary: { main: '#7C3AED' },
        secondary: { main: '#A855F7' },
        background: { default: '#F4F0FF', paper: '#FFFFFF' },
        text: { primary: '#1A0B2E', secondary: '#6B5B8A' },
        divider: 'rgba(124,58,237,0.12)',
        action: { hover: 'rgba(124,58,237,0.06)', selected: 'rgba(124,58,237,0.10)' },
      }),
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeightBold: 700,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: isDark ? {
            background: `
              radial-gradient(ellipse at 15% 0%, rgba(124,58,237,0.20) 0%, transparent 55%),
              radial-gradient(ellipse at 85% 100%, rgba(168,85,247,0.14) 0%, transparent 55%),
              #080812
            `,
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
          } : {
            background: `
              radial-gradient(ellipse at 10% 0%, rgba(124,58,237,0.10) 0%, transparent 50%),
              radial-gradient(ellipse at 90% 100%, rgba(168,85,247,0.07) 0%, transparent 50%),
              #F4F0FF
            `,
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
          },
          // Themed scrollbar (WebKit + Firefox) instead of the default browser bar
          '*': {
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? 'rgba(168,85,247,0.35) transparent' : 'rgba(124,58,237,0.30) transparent',
          },
          '*::-webkit-scrollbar': { width: 8, height: 8 },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': {
            background: isDark ? 'rgba(168,85,247,0.35)' : 'rgba(124,58,237,0.30)',
            borderRadius: 8,
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: isDark ? 'rgba(168,85,247,0.55)' : 'rgba(124,58,237,0.50)',
          },
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            ...(isDark ? {
              background: 'rgba(15, 10, 40, 0.65)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(168,85,247,0.12)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            } : {
              background: '#FFFFFF',
              border: '1px solid rgba(124,58,237,0.10)',
              boxShadow: '0 2px 16px rgba(124,58,237,0.08)',
            })
          }
        }
      },
      MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 700 },
          containedPrimary: {
            background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
            color: '#FFFFFF',
            boxShadow: isDark ? '0 4px 20px rgba(124,58,237,0.35)' : '0 4px 16px rgba(124,58,237,0.25)',
            '&:hover': {
              background: 'linear-gradient(135deg, #6D28D9 0%, #9333EA 100%)',
              boxShadow: isDark ? '0 6px 28px rgba(124,58,237,0.5)' : '0 6px 20px rgba(124,58,237,0.35)',
            },
          },
        }
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: isDark ? 'rgba(168,85,247,0.2)' : 'rgba(124,58,237,0.20)' },
              '&:hover fieldset': { borderColor: isDark ? 'rgba(168,85,247,0.4)' : 'rgba(124,58,237,0.40)' },
              '&.Mui-focused fieldset': { borderColor: isDark ? '#A855F7' : '#7C3AED' },
            },
          }
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-root': {
              background: isDark ? 'rgba(124,58,237,0.10)' : 'rgba(124,58,237,0.05)',
              borderBottom: isDark ? '1px solid rgba(168,85,247,0.18)' : '1px solid rgba(124,58,237,0.14)',
              color: isDark ? '#C4B5FD' : '#6D28D9',
              fontWeight: 800,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }
          }
        }
      },
      MuiTableBody: {
        styleOverrides: {
          root: {
            '& .MuiTableRow-root': {
              transition: 'background 0.15s ease',
              '&:hover': {
                background: isDark ? 'rgba(168,85,247,0.06)' : 'rgba(124,58,237,0.04)',
              },
              '&:nth-of-type(even)': {
                background: isDark ? 'rgba(168,85,247,0.03)' : 'rgba(124,58,237,0.02)',
              },
              '&:last-child td, &:last-child th': { border: 0 },
            },
            '& .MuiTableCell-root': {
              borderBottom: isDark ? '1px solid rgba(168,85,247,0.06)' : '1px solid rgba(124,58,237,0.07)',
            }
          }
        }
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            border: isDark ? '1px solid rgba(168,85,247,0.12)' : '1px solid rgba(124,58,237,0.10)',
            overflow: 'hidden',
            ...(isDark ? {
              background: 'rgba(15,10,40,0.55)',
              backdropFilter: 'blur(20px)',
            } : {
              background: '#FFFFFF',
              boxShadow: '0 2px 12px rgba(124,58,237,0.06)',
            })
          }
        }
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            background: isDark ? 'linear-gradient(90deg, #7C3AED, #A855F7)' : 'linear-gradient(90deg, #7C3AED, #A855F7)',
            height: 3,
            borderRadius: 2,
          }
        }
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontWeight: 700,
            textTransform: 'none',
            fontSize: 14,
            '&.Mui-selected': {
              color: isDark ? '#A855F7' : '#7C3AED',
            }
          }
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark ? 'rgba(168,85,247,0.10)' : 'rgba(124,58,237,0.10)',
          }
        }
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(168,85,247,0.15)' : 'rgba(124,58,237,0.10)',
            borderRadius: 4,
            '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #7C3AED, #A855F7)', borderRadius: 4 }
          }
        }
      },
    },
  }), [mode, branding]);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, isDark, branding, brandingLoading }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const ThemeProvider = ({ children }) => <ThemeProviderInner>{children}</ThemeProviderInner>;
