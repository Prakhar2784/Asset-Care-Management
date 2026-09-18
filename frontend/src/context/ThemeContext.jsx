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
    primaryColor: '#7777C7',
    secondaryColor: '#6464B8'
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
      setBranding({ name: 'IAssetCare', logoUrl: null, primaryColor: '#7777C7', secondaryColor: '#6464B8' });
      setBrandingLoading(false);
      return;
    }
    fetchBranding();
    window.addEventListener('tenant-branding-changed', fetchBranding);
    return () => window.removeEventListener('tenant-branding-changed', fetchBranding);
  }, [currentUser?.tenantId]);

  const mode = 'light';
  const toggleMode = () => {};
  const isDark = false;

  const theme = useMemo(() => createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#7777C7', contrastText: '#FFFFFF' },
      secondary: { main: '#6464B8', contrastText: '#FFFFFF' },
      background: { default: '#F0F2F1', paper: '#FFFFFF' },
      text: { primary: '#0A0A0A', secondary: '#5F6865' },
      divider: '#D9E0DF',
      action: { hover: 'rgba(119, 119, 199, 0.05)', selected: 'rgba(119, 119, 199, 0.10)' },
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
            background: '#F0F2F1',
            color: '#0A0A0A',
            minHeight: '100vh',
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
          },
          '*': {
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(100, 116, 139, 0.25) transparent',
          },
          '*::-webkit-scrollbar': { width: 8, height: 8 },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': {
            background: 'rgba(100, 116, 139, 0.2)',
            borderRadius: 8,
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(100, 116, 139, 0.35)',
          },
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: '#FFFFFF',
            border: '1px solid #D9E0DF',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            borderRadius: 20,
            color: '#0A0A0A',
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: '#FFFFFF',
            border: '1px solid #D9E0DF',
            borderRadius: 20,
            color: '#0A0A0A',
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            background: '#FFFFFF',
            border: '1px solid #D9E0DF',
            color: '#0A0A0A',
            borderRadius: 24,
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: '#FFFFFF',
            color: '#0A0A0A',
            borderBottom: '1px solid #D9E0DF',
            boxShadow: 'none',
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: 12,
            transition: 'all 150ms ease-in-out',
          },
          containedPrimary: {
            background: '#7777C7',
            color: '#FFFFFF',
            boxShadow: 'none',
            '&:hover': {
              background: '#6969B8',
              boxShadow: 'none',
            },
            '&:active': {
              background: '#5D5DA8',
            }
          },
          containedSecondary: {
            background: '#1A1A1A',
            color: '#FFFFFF',
            border: '1px solid #383838',
            boxShadow: 'none',
            '&:hover': {
              background: '#252525',
              boxShadow: 'none',
            },
          },
          outlined: {
            borderColor: '#D9E0DF',
            color: '#0A0A0A',
            '&:hover': {
              borderColor: '#7777C7',
              background: '#F6F6FD',
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 700 }
        }
      },
      MuiMenu: {
        defaultProps: {
          variant: 'menu',
          anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
          transformOrigin: { vertical: 'top', horizontal: 'left' },
          transitionDuration: { enter: 150, exit: 150 },
          slotProps: {
            paper: {
              style: {
                maxHeight: 300,
                overflowY: 'auto',
                background: '#FFFFFF',
                border: '1px solid #D9E0DF',
                color: '#0A0A0A',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                borderRadius: 14,
              }
            },
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: '#0A0A0A',
            fontSize: 13,
            fontWeight: 600,
            '&:hover': {
              background: '#F6F6FD',
            },
            '&.Mui-selected': {
              background: '#EEEEFA',
              color: '#5D5DA8',
              '&:hover': {
                background: '#EEEEFA',
              }
            }
          }
        }
      },
      MuiSelect: {
        defaultProps: {
          MenuProps: {
            variant: 'menu',
            anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
            transformOrigin: { vertical: 'top', horizontal: 'left' },
            transitionDuration: { enter: 150, exit: 150 },
            slotProps: {
              paper: {
                style: {
                  maxHeight: 300,
                  overflowY: 'auto',
                  background: '#FFFFFF',
                  border: '1px solid #D9E0DF',
                  color: '#0A0A0A',
                  borderRadius: 14,
                }
              },
            },
          },
        },
        styleOverrides: {
          root: {
            background: '#FFFFFF',
            color: '#0A0A0A',
            borderRadius: 12,
            '& .MuiSvgIcon-root': { color: '#61706B' },
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              background: '#FFFFFF',
              color: '#0A0A0A',
              '& fieldset': { borderColor: '#D9E0DF' },
              '&:hover fieldset': { borderColor: '#BCC6C4' },
              '&.Mui-focused fieldset': { borderColor: '#7777C7' },
              '& input': { color: '#0A0A0A' },
            },
            '& .MuiInputLabel-root': { color: '#7C8399' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#7777C7' },
          }
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-root': {
              background: '#F7F9F8',
              borderBottom: '1px solid #D9E0DF',
              color: '#0C1C16',
              fontWeight: 800,
              fontSize: 11.5,
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
                background: '#F6F6FD',
              },
              '&:last-child td, &:last-child th': { border: 0 },
            },
            '& .MuiTableCell-root': {
              borderBottom: '1px solid #E2E7E5',
              color: '#0A0A0A',
            }
          }
        }
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: '20px',
            border: '1px solid #D9E0DF',
            overflow: 'hidden',
            background: '#FFFFFF',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          }
        }
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            background: '#7777C7',
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
            fontSize: 13.5,
            color: '#5F6865',
            '&.Mui-selected': {
              color: '#7777C7',
            }
          }
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: '#D9E0DF',
          }
        }
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: '#E9ECEB',
            borderRadius: 4,
            '& .MuiLinearProgress-bar': { background: '#7777C7', borderRadius: 4 }
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
