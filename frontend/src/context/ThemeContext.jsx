import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const ThemeContext = createContext();

export const useAppTheme = () => useContext(ThemeContext);

const ThemeProviderInner = ({ children }) => {
  const { currentUser } = useAuth();
  const [branding, setBranding] = useState({
    name: 'IAssetCare',
    logoUrl: null,
    primaryColor: '#051C12',
    secondaryColor: '#B4F105'
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
      setBranding({ name: 'IAssetCare', logoUrl: null, primaryColor: '#051C12', secondaryColor: '#B4F105' });
      setBrandingLoading(false);
      return;
    }
    fetchBranding();
    window.addEventListener('tenant-branding-changed', fetchBranding);
    return () => window.removeEventListener('tenant-branding-changed', fetchBranding);
  }, [currentUser?.tenantId]);

  // Mode is strictly locked to light for Spark Admin theme
  const mode = 'light';
  const toggleMode = () => {
    // No-op since dark mode is removed
  };
  const isDark = false;

  const theme = useMemo(() => createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#051C12', contrastText: '#FFFFFF' },
      secondary: { main: '#B4F105', contrastText: '#051C12' },
      background: { default: '#F4F6F5', paper: '#FFFFFF' },
      text: { primary: '#0B130F', secondary: '#6C7E75' },
      divider: '#E9EFEF',
      action: { hover: 'rgba(5, 28, 18, 0.04)', selected: 'rgba(180, 241, 5, 0.12)' },
    },
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeightBold: 700,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '@import': "url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap')",
          body: {
            background: '#F4F6F5',
            color: '#0B130F',
            minHeight: '100vh',
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
          },
          '*': {
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(5, 28, 18, 0.2) transparent',
          },
          '*::-webkit-scrollbar': { width: 8, height: 8 },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': {
            background: 'rgba(5, 28, 18, 0.15)',
            borderRadius: 8,
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(5, 28, 18, 0.3)',
          },
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: '#FFFFFF',
            border: '1.5px solid #E9EFEF',
            boxShadow: '0 10px 30px rgba(11, 19, 15, 0.03)',
            borderRadius: 16,
          }
        }
      },
      MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 800, borderRadius: 12 },
          containedPrimary: {
            background: '#051C12',
            color: '#FFFFFF',
            boxShadow: 'none',
            '&:hover': {
              background: '#072F1F',
              boxShadow: 'none',
            },
          },
          containedSecondary: {
            background: '#B4F105',
            color: '#051C12',
            boxShadow: 'none',
            '&:hover': {
              background: '#c1f824',
              boxShadow: 'none',
            },
          },
        }
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
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
              '& fieldset': { borderColor: '#E5E7EB' },
              '&:hover fieldset': { borderColor: '#D1D5DB' },
              '&.Mui-focused fieldset': { borderColor: '#051C12' },
            },
          }
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-root': {
              background: '#051C12',
              borderBottom: '1px solid #E9EFEF',
              color: '#FFFFFF',
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
                background: 'rgba(5, 28, 18, 0.02)',
              },
              '&:last-child td, &:last-child th': { border: 0 },
            },
            '& .MuiTableCell-root': {
              borderBottom: '1px solid #F1F2F4',
              color: '#0B130F',
            }
          }
        }
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            border: '1.5px solid #E9EFEF',
            overflow: 'hidden',
            background: '#FFFFFF',
            boxShadow: 'none',
          }
        }
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            background: '#051C12',
            height: 3,
            borderRadius: 3,
          }
        }
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontWeight: 800,
            textTransform: 'none',
            fontSize: 14,
            '&.Mui-selected': {
              color: '#051C12',
            }
          }
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: '#E9EFEF',
          }
        }
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: '#E5E7EB',
            borderRadius: 4,
            '& .MuiLinearProgress-bar': { background: '#051C12', borderRadius: 4 }
          }
        }
      },
    },
  }), [branding]);

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
