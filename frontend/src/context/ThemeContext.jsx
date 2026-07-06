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
    primaryColor: '#111827',
    secondaryColor: '#111827'
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
      setBranding({ name: 'AssetCare', logoUrl: null, primaryColor: '#111827', secondaryColor: '#111827' });
      setBrandingLoading(false);
      return;
    }
    fetchBranding();
    window.addEventListener('tenant-branding-changed', fetchBranding);
    return () => window.removeEventListener('tenant-branding-changed', fetchBranding);
  }, [currentUser?.tenantId]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey) || 'dark';
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
        primary: { main: '#FBBF24', contrastText: '#111827' },
        secondary: { main: '#9CA3AF' },
        background: { default: '#000000', paper: '#111827' },
        text: { primary: '#FFFFFF', secondary: '#9CA3AF' },
        divider: 'rgba(255,255,255,0.12)',
        action: { hover: 'rgba(255,255,255,0.05)', selected: 'rgba(251,191,36,0.12)' },
      } : {
        primary: { main: '#FBBF24', contrastText: '#111827' },
        secondary: { main: '#111827' },
        background: { default: '#F7F8FA', paper: '#FFFFFF' },
        text: { primary: '#111827', secondary: '#6B7280' },
        divider: '#E5E7EB',
        action: { hover: 'rgba(17,24,39,0.04)', selected: 'rgba(251,191,36,0.12)' },
      }),
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeightBold: 700,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: isDark ? '#000000' : '#F7F8FA',
            minHeight: '100vh',
          },
          // Themed scrollbar (WebKit + Firefox) instead of the default browser bar
          '*': {
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? 'rgba(255,255,255,0.25) transparent' : 'rgba(17,24,39,0.18) transparent',
          },
          '*::-webkit-scrollbar': { width: 8, height: 8 },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': {
            background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(17,24,39,0.18)',
            borderRadius: 8,
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(17,24,39,0.3)',
          },
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            ...(isDark ? {
              background: '#111827',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: 'none',
            } : {
              background: '#FFFFFF',
              border: '1px solid #EEF0F3',
              boxShadow: '0 1px 3px rgba(17,24,39,0.05)',
            })
          }
        }
      },
      MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 700, borderRadius: 12 },
          containedPrimary: {
            background: '#FBBF24',
            color: '#111827',
            boxShadow: 'none',
            '&:hover': {
              background: '#F5A623',
              boxShadow: 'none',
            },
          },
        }
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
      // Force every Select/TextField-select menu to always open directly
      // below its field. Without this, MUI's default behavior tries to
      // align the currently-selected item with the field instead, which can
      // push the menu upward past the viewport top (overlapping the navbar)
      // once a later option in the list is selected.
      // Capping the menu's height (with internal scroll) is just as
      // important: MUI's Popover still repositions the whole panel upward
      // whenever it doesn't fit in the remaining space below the field, so a
      // tall, uncapped list (e.g. 8 department options) reliably triggered
      // that upward jump on any field in the lower half of the page.
      MuiMenu: {
        defaultProps: {
          variant: 'menu',
          anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
          transformOrigin: { vertical: 'top', horizontal: 'left' },
          transitionDuration: { enter: 300, exit: 450 },
          slotProps: {
            paper: { style: { maxHeight: 300, overflowY: 'auto' } },
          },
        },
      },

      MuiSelect: {
        defaultProps: {
          MenuProps: {
            variant: 'menu',
            anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
            transformOrigin: { vertical: 'top', horizontal: 'left' },
            transitionDuration: { enter: 300, exit: 450 },
            slotProps: {
              paper: { style: { maxHeight: 300, overflowY: 'auto' } },
            },
          },
        },
      },

      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB' },
              '&:hover fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.3)' : '#D1D5DB' },
              '&.Mui-focused fieldset': { borderColor: '#FBBF24' },
            },
          }
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-root': {
              background: isDark ? '#111827' : '#F9FAFB',
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E5E7EB',
              color: isDark ? '#9CA3AF' : '#6B7280',
              fontWeight: 700,
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
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(17,24,39,0.02)',
              },
              '&:last-child td, &:last-child th': { border: 0 },
            },
            '& .MuiTableCell-root': {
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F2F4',
            }
          }
        }
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #EEF0F3',
            overflow: 'hidden',
            background: isDark ? '#111827' : '#FFFFFF',
            boxShadow: 'none',
          }
        }
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            background: '#FBBF24',
            height: 2,
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
              color: isDark ? '#FBBF24' : '#111827',
            }
          }
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
          }
        }
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
            borderRadius: 4,
            '& .MuiLinearProgress-bar': { background: '#FBBF24', borderRadius: 4 }
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
