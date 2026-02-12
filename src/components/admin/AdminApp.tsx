/**
 * React Admin Application
 *
 * Main admin panel component with all resources configured.
 * This component is dynamically imported to avoid SSR issues.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Admin,
  Resource,
  List,
  Datagrid,
  TextField,
  DateField,
  BooleanField,
  NumberField,
  ReferenceField,
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  AutocompleteInput,
  DateInput,
  DateTimeInput,
  BooleanInput,
  NumberInput,
  Create,
  Show,
  SimpleShowLayout,
  Filter,
  SearchInput,
  FunctionField,
  TopToolbar,
  CreateButton,
  ExportButton,
  Layout,
  AppBar,
  TitlePortal,
  useRedirect,
  FormDataConsumer,
  useNotify,
  useUpdate,
  useRefresh,
  useRecordContext,
  Toolbar,
  SaveButton,
  required,
} from 'react-admin';
import { dataProvider } from './data-provider';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  alpha,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import {
  People as UsersIcon,
  Event as EventsIcon,
  CardMembership as MembershipIcon,
  HowToReg as RegistrationIcon,
  PhotoLibrary as MediaIcon,
  Store as ListingsIcon,
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Groups as BoardIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  OpenInNew as ExternalLinkIcon,
  Language as WebIcon,
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// ============================================
// Custom Theme - Matching Frontend Aesthetic
// ============================================

const adminTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#818cf8', // Indigo-400
      light: '#a5b4fc', // Indigo-300
      dark: '#6366f1', // Indigo-500
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f59e0b', // Amber-500
      light: '#fbbf24', // Amber-400
      dark: '#d97706', // Amber-600
    },
    background: {
      default: '#0f0f23', // Deep space blue-black
      paper: '#1a1a2e', // Slightly lighter
    },
    success: {
      main: '#22c55e',
      light: '#4ade80',
    },
    warning: {
      main: '#f59e0b',
    },
    error: {
      main: '#ef4444',
    },
    info: {
      main: '#3b82f6',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    divider: 'rgba(148, 163, 184, 0.12)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 600,
      color: '#a5b4fc',
    },
    body2: {
      color: '#cbd5e1',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16162a 100%)',
          minHeight: '100vh',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(129, 140, 248, 0.05) 0%, rgba(99, 102, 241, 0.02) 100%)',
          border: '1px solid rgba(129, 140, 248, 0.15)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'rgba(129, 140, 248, 0.3)',
            boxShadow: '0 8px 30px rgba(129, 140, 248, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1a1a2e',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
          boxShadow: '0 4px 14px rgba(129, 140, 248, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)',
            boxShadow: '0 6px 20px rgba(129, 140, 248, 0.4)',
          },
        },
        outlined: {
          borderColor: 'rgba(129, 140, 248, 0.5)',
          '&:hover': {
            borderColor: '#818cf8',
            backgroundColor: 'rgba(129, 140, 248, 0.1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 6,
        },
        colorSuccess: {
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#4ade80',
        },
        colorWarning: {
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#fbbf24',
        },
        colorError: {
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(15, 15, 35, 0.5)',
            borderRadius: 8,
            '& fieldset': {
              borderColor: 'rgba(129, 140, 248, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(129, 140, 248, 0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#818cf8',
              borderWidth: 2,
            },
          },
          '& .MuiInputLabel-root': {
            color: '#94a3b8',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#a5b4fc',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(129, 140, 248, 0.1)',
          padding: '16px',
        },
        head: {
          backgroundColor: 'rgba(129, 140, 248, 0.05)',
          fontWeight: 600,
          color: '#a5b4fc',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(129, 140, 248, 0.05) !important',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #0f0f23 0%, #1a1a2e 100%)',
          borderBottom: '1px solid rgba(129, 140, 248, 0.15)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        root: { display: 'none' },
        paper: { display: 'none' },
      },
    },
  },
});

// ============================================
// Custom Dashboard
// ============================================

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'primary',
  subtitle,
  gradient,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
  gradient?: string;
}) => {
  const colorMain = adminTheme.palette[color].main;
  const colorLight = adminTheme.palette[color].light;
  const grad = gradient || `linear-gradient(135deg, ${colorMain}, ${colorLight})`;
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${alpha(colorMain, 0.06)} 0%, rgba(26, 26, 46, 0.9) 100%)`,
        border: `1px solid ${alpha(colorMain, 0.15)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          border: `1px solid ${alpha(colorMain, 0.35)}`,
          boxShadow: `0 0 20px ${alpha(colorMain, 0.1)}`,
          transform: 'translateY(-2px)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: grad,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              color="text.secondary"
              variant="overline"
              sx={{ fontWeight: 600, letterSpacing: '0.1em', fontSize: '0.7rem' }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mt: 1,
                background: grad,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              background: `linear-gradient(135deg, ${alpha(colorMain, 0.2)}, ${alpha(colorMain, 0.05)})`,
              border: `1px solid ${alpha(colorMain, 0.3)}`,
              width: 56,
              height: 56,
              color: colorMain,
            }}
          >
            <Icon sx={{ fontSize: 28 }} />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  user: string;
  createdAt: string;
}

interface TopEvent {
  id: string;
  title: string;
  startDate: string;
  registrations: number;
}

interface DashboardStats {
  totalUsers: number;
  upcomingEvents: number;
  activeMemberships: number;
  activeListings: number;
  pendingMedia: number;
  recentRegistrations: number;
  pendingListings: number;
  newUsersThisMonth: number;
  confirmedRegistrations: number;
  membershipsByType: Record<string, number>;
  analytics?: {
    recentActivity: ActivityEntry[];
    topEvents: TopEvent[];
    registrationsByStatus: Record<string, number>;
  };
}

const Dashboard = () => {
  const redirect = useRedirect();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats?detailed=true', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '--';
    return num.toLocaleString();
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
            background: 'linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Admin Dashboard
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: '1.1rem' }}>
          Welcome to the SPAC administration panel
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
        }}
      >
        <Box onClick={() => redirect('/users')} sx={{ cursor: 'pointer' }}>
          <StatCard
            title="TOTAL MEMBERS"
            value={loading ? '...' : formatNumber(stats?.totalUsers)}
            icon={UsersIcon}
            color="primary"
            subtitle="Registered users"
            gradient="linear-gradient(90deg, #818cf8, #a5b4fc)"
          />
        </Box>
        <Box onClick={() => redirect('/events')} sx={{ cursor: 'pointer' }}>
          <StatCard
            title="UPCOMING EVENTS"
            value={loading ? '...' : formatNumber(stats?.upcomingEvents)}
            icon={EventsIcon}
            color="secondary"
            subtitle="Next 30 days"
            gradient="linear-gradient(90deg, #f59e0b, #fbbf24)"
          />
        </Box>
        <Box onClick={() => redirect('/memberships')} sx={{ cursor: 'pointer' }}>
          <StatCard
            title="ACTIVE MEMBERSHIPS"
            value={loading ? '...' : formatNumber(stats?.activeMemberships)}
            icon={MembershipIcon}
            color="success"
            subtitle="Paid members"
            gradient="linear-gradient(90deg, #22c55e, #4ade80)"
          />
        </Box>
        <Box onClick={() => redirect('/listings')} sx={{ cursor: 'pointer' }}>
          <StatCard
            title="ACTIVE LISTINGS"
            value={loading ? '...' : formatNumber(stats?.activeListings)}
            icon={ListingsIcon}
            color="info"
            subtitle="For sale items"
            gradient="linear-gradient(90deg, #3b82f6, #60a5fa)"
          />
        </Box>
      </Box>

      {/* Pending Items Alert */}
      {stats && (stats.pendingMedia > 0 || stats.pendingListings > 0) && (
        <Card
          sx={{
            mt: 4,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(26, 26, 46, 0.9) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, color: 'warning.main' }}>
              <span style={{ fontSize: '1.2rem' }}>!</span> Items Requiring Attention
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {stats.pendingMedia > 0 && (
                <Chip
                  label={`${stats.pendingMedia} Media Pending Review`}
                  color="warning"
                  onClick={() => redirect('/media?filter=%7B%22status%22%3A%22PENDING%22%7D')}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                />
              )}
              {stats.pendingListings > 0 && (
                <Chip
                  label={`${stats.pendingListings} Listings Pending Approval`}
                  color="warning"
                  onClick={() => redirect('/listings?filter=%7B%22status%22%3A%22PENDING_APPROVAL%22%7D')}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ mt: 4, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.04) 0%, rgba(26, 26, 46, 0.95) 100%)',
            border: '1px solid rgba(129, 140, 248, 0.12)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, color: '#a5b4fc' }}>
              <TrendingIcon sx={{ color: '#818cf8' }} />
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { label: 'Create New Event', icon: <EventsIcon />, path: '/events/create' },
                { label: 'OBS Event Settings', icon: <StarIcon />, path: '/obs-admin/settings', external: true },
                { label: 'View All Members', icon: <UsersIcon />, path: '/users' },
                { label: 'Manage Memberships', icon: <MembershipIcon />, path: '/memberships' },
                { label: 'Review Media', icon: <MediaIcon />, path: '/media' },
                { label: 'View Registrations', icon: <RegistrationIcon />, path: '/registrations' },
                { label: 'Manage Board Members', icon: <BoardIcon />, path: '/board-members' },
              ].map((action) => (
                <Chip
                  key={action.path}
                  label={action.label}
                  onClick={() => {
                    if ('external' in action && action.external) {
                      window.location.href = action.path;
                    } else {
                      redirect(action.path);
                    }
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 3,
                    px: 1,
                    fontSize: '0.95rem',
                    background: 'external' in action && action.external
                      ? 'rgba(245, 158, 11, 0.06)'
                      : 'rgba(129, 140, 248, 0.04)',
                    border: 'external' in action && action.external
                      ? '1px solid rgba(245, 158, 11, 0.2)'
                      : '1px solid rgba(129, 140, 248, 0.12)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: 'rgba(129, 140, 248, 0.12)',
                      borderColor: 'rgba(129, 140, 248, 0.3)',
                      transform: 'translateX(4px)',
                    },
                  }}
                  icon={action.icon}
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.04) 0%, rgba(26, 26, 46, 0.95) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.12)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, color: '#fbbf24' }}>
              <StarIcon sx={{ color: '#f59e0b' }} />
              Membership Breakdown
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {stats?.membershipsByType && Object.entries(stats.membershipsByType).map(([type, count]) => (
                <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary">{type}</Typography>
                  <Chip
                    label={count}
                    size="small"
                    sx={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      color: '#fbbf24',
                      fontWeight: 600,
                    }}
                  />
                </Box>
              ))}
              {stats && (
                <>
                  <Box sx={{ borderTop: '1px solid rgba(129, 140, 248, 0.15)', pt: 2, mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography color="text.secondary">New Users (30 days)</Typography>
                      <Chip label={stats.newUsersThisMonth} color="success" size="small" sx={{ fontWeight: 600 }} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="text.secondary">Confirmed Registrations</Typography>
                    <Chip label={stats.confirmedRegistrations} color="info" size="small" sx={{ fontWeight: 600 }} />
                  </Box>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Activity & Top Events */}
      <Box sx={{ mt: 4, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.04) 0%, rgba(26, 26, 46, 0.95) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.12)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TrendingIcon sx={{ color: '#22c55e' }} />
              Recent Activity
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {stats?.analytics?.recentActivity?.length ? (
                stats.analytics.recentActivity.map((entry) => (
                  <Box
                    key={entry.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: 1.5,
                      background: 'rgba(34, 197, 94, 0.03)',
                      border: '1px solid rgba(34, 197, 94, 0.08)',
                      transition: 'all 0.2s ease',
                      '&:hover': { background: 'rgba(34, 197, 94, 0.08)' },
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {entry.user} {entry.action.toLowerCase()}d {entry.entityType}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Chip
                      label={entry.action}
                      size="small"
                      color={entry.action === 'CREATE' ? 'success' : entry.action === 'DELETE' ? 'error' : 'default'}
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No recent activity</Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(26, 26, 46, 0.95) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.12)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <EventsIcon sx={{ color: '#3b82f6' }} />
              Top Upcoming Events
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {stats?.analytics?.topEvents?.length ? (
                stats.analytics.topEvents.map((event) => (
                  <Box
                    key={event.id}
                    onClick={() => redirect(`/events/${event.id}`)}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      background: 'rgba(59, 130, 246, 0.03)',
                      border: '1px solid rgba(59, 130, 246, 0.08)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {event.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(event.startDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${event.registrations} reg`}
                      size="small"
                      sx={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        color: '#60a5fa',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No upcoming events</Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

// ============================================
// Custom App Bar
// ============================================

const navItems = [
  { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/users', label: 'Members', icon: <UsersIcon /> },
  { path: '/events', label: 'Events', icon: <EventsIcon /> },
  { path: '/memberships', label: 'Memberships', icon: <MembershipIcon /> },
  { path: '/registrations', label: 'Registrations', icon: <RegistrationIcon /> },
  { path: '/media', label: 'Media', icon: <MediaIcon /> },
  { path: '/listings', label: 'Classifieds', icon: <ListingsIcon /> },
  { path: '/board-members', label: 'Board', icon: <BoardIcon /> },
];

const CustomAppBar = () => {
  const location = useLocation();
  const redirect = useRedirect();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <AppBar>
      <TitlePortal />
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          flex: 1,
          overflowX: 'auto',
          mx: 2,
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
      >
        {navItems.map((item) => (
          <Button
            key={item.path}
            startIcon={item.icon}
            onClick={() => redirect(item.path)}
            size="small"
            sx={{
              color: isActive(item.path) ? '#fff' : 'rgba(255,255,255,0.7)',
              background: isActive(item.path)
                ? 'linear-gradient(135deg, rgba(129, 140, 248, 0.3), rgba(99, 102, 241, 0.2))'
                : 'transparent',
              borderRadius: 2,
              px: 1.5,
              py: 0.75,
              minWidth: 'auto',
              whiteSpace: 'nowrap',
              fontSize: '0.8rem',
              fontWeight: isActive(item.path) ? 600 : 400,
              '&:hover': {
                background: 'rgba(129, 140, 248, 0.15)',
              },
            }}
          >
            {item.label}
          </Button>
        ))}
      </Box>
      {/* Divider */}
      <Box sx={{ width: '1px', height: 24, bgcolor: 'rgba(255,255,255,0.2)', mx: 1 }} />

      {/* Main Site Links */}
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
        <Button
          size="small"
          href="/obs-admin/settings"
          startIcon={<StarIcon />}
          sx={{
            color: '#fbbf24',
            fontSize: '0.75rem',
            minWidth: 'auto',
            whiteSpace: 'nowrap',
            px: 1,
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 2,
            '&:hover': { background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.5)' },
          }}
        >
          OBS
        </Button>
        <Button
          size="small"
          href="/"
          startIcon={<HomeIcon />}
          sx={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '0.75rem',
            minWidth: 'auto',
            whiteSpace: 'nowrap',
            px: 1,
            '&:hover': { background: 'rgba(255,255,255,0.1)' },
          }}
        >
          Home
        </Button>
        <Button
          size="small"
          href="/events"
          sx={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '0.75rem',
            minWidth: 'auto',
            whiteSpace: 'nowrap',
            px: 1,
            '&:hover': { background: 'rgba(255,255,255,0.1)' },
          }}
        >
          Events
        </Button>
        <Button
          size="small"
          href="/gallery"
          sx={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '0.75rem',
            minWidth: 'auto',
            whiteSpace: 'nowrap',
            px: 1,
            '&:hover': { background: 'rgba(255,255,255,0.1)' },
          }}
        >
          Gallery
        </Button>
        <Button
          size="small"
          href="/dashboard"
          startIcon={<ExternalLinkIcon sx={{ fontSize: '14px !important' }} />}
          sx={{
            color: '#818cf8',
            fontSize: '0.75rem',
            minWidth: 'auto',
            whiteSpace: 'nowrap',
            px: 1,
            border: '1px solid rgba(129, 140, 248, 0.3)',
            borderRadius: 2,
            '&:hover': { background: 'rgba(129, 140, 248, 0.15)', borderColor: 'rgba(129, 140, 248, 0.5)' },
          }}
        >
          Dashboard
        </Button>
      </Box>
    </AppBar>
  );
};

// ============================================
// Custom Menu
// ============================================

const CustomMenu = () => null;

// ============================================
// Custom Layout
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLayout = (props: any) => (
  <Layout
    {...props}
    appBar={CustomAppBar}
    menu={CustomMenu}
    sx={{
      '& .RaSidebar-fixed': { display: 'none' },
      '& .RaSidebar-root': { display: 'none', width: 0 },
      '& .RaLayout-content': { marginLeft: '0 !important' },
    }}
  />
);

// ============================================
// Status Chip Component
// ============================================

const StatusChip = ({ status }: { status: string }) => {
  const colorMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    ACTIVE: 'success',
    PUBLISHED: 'success',
    APPROVED: 'success',
    CONFIRMED: 'success',
    PENDING: 'warning',
    PENDING_APPROVAL: 'warning',
    DRAFT: 'default',
    EXPIRED: 'error',
    CANCELLED: 'error',
    REJECTED: 'error',
    SUSPENDED: 'error',
    SOLD: 'info',
    COMPLETED: 'info',
  };

  return (
    <Chip
      label={status?.replace(/_/g, ' ')}
      color={colorMap[status] || 'default'}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
};

const RoleChip = ({ role }: { role: string }) => {
  const colorMap: Record<string, 'error' | 'warning' | 'default'> = {
    ADMIN: 'error',
    MODERATOR: 'warning',
    MEMBER: 'default',
  };

  return (
    <Chip
      label={role}
      color={colorMap[role] || 'default'}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 500 }}
    />
  );
};

// ============================================
// Quick Action Buttons for Media
// ============================================

// Bulk action buttons for media
const MediaBulkActionButtons = () => {
  const notify = useNotify();
  const refresh = useRefresh();

  const handleBulkApprove = async (selectedIds: string[]) => {
    try {
      const response = await fetch('/api/admin/media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, data: { status: 'APPROVED' } }),
      });
      if (response.ok) {
        notify(`${selectedIds.length} media item(s) approved`, { type: 'success' });
        refresh();
      } else {
        throw new Error('Failed to approve');
      }
    } catch {
      notify('Failed to approve media', { type: 'error' });
    }
  };

  const handleBulkReject = async (selectedIds: string[]) => {
    try {
      const response = await fetch('/api/admin/media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, data: { status: 'REJECTED' } }),
      });
      if (response.ok) {
        notify(`${selectedIds.length} media item(s) rejected`, { type: 'info' });
        refresh();
      } else {
        throw new Error('Failed to reject');
      }
    } catch {
      notify('Failed to reject media', { type: 'error' });
    }
  };

  // Note: React Admin's BulkActionButtons receive selectedIds via context
  // For simplicity, we provide buttons that work with the selection checkboxes
  return null; // Bulk actions handled via the quick actions in the list
};

const MediaQuickActions = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [update, { isPending }] = useUpdate();

  if (!record || record.status !== 'PENDING') {
    return null;
  }

  const handleApprove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await update(
        'media',
        { id: record.id, data: { status: 'APPROVED', category: record.category || 'OTHER' }, previousData: record },
        {
          onSuccess: () => {
            notify('Media approved successfully', { type: 'success' });
            refresh();
          },
          onError: () => {
            notify('Failed to approve media', { type: 'error' });
          },
        }
      );
    } catch {
      notify('Failed to approve media', { type: 'error' });
    }
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await update(
        'media',
        { id: record.id, data: { status: 'REJECTED' }, previousData: record },
        {
          onSuccess: () => {
            notify('Media rejected', { type: 'info' });
            refresh();
          },
          onError: () => {
            notify('Failed to reject media', { type: 'error' });
          },
        }
      );
    } catch {
      notify('Failed to reject media', { type: 'error' });
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title="Approve">
        <IconButton
          size="small"
          onClick={handleApprove}
          disabled={isPending}
          sx={{
            color: 'success.main',
            '&:hover': { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
          }}
        >
          <ApproveIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reject">
        <IconButton
          size="small"
          onClick={handleReject}
          disabled={isPending}
          sx={{
            color: 'error.main',
            '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
          }}
        >
          <RejectIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

// Category choices for gallery photos
const photoCategoryChoices = [
  { id: 'DEEP_SKY', name: 'Deep Sky' },
  { id: 'PLANETS', name: 'Planets' },
  { id: 'MOON', name: 'Moon' },
  { id: 'SUN', name: 'Sun' },
  { id: 'EVENTS', name: 'Events' },
  { id: 'EQUIPMENT', name: 'Equipment' },
  { id: 'NIGHTSCAPE', name: 'Nightscape' },
  { id: 'OTHER', name: 'Other' },
];

// ============================================
// Custom List Actions (Simple - no FilterButton)
// ============================================

const SimpleListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

// ============================================
// Form Section Component
// ============================================

const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box sx={{ mb: 4, width: '100%' }}>
    <Typography
      variant="subtitle1"
      sx={{
        mb: 2,
        pb: 1,
        borderBottom: '1px solid rgba(129, 140, 248, 0.2)',
        color: '#a5b4fc',
        fontWeight: 600,
      }}
    >
      {title}
    </Typography>
    {children}
  </Box>
);

// ============================================
// User Resource
// ============================================

const UserFilter = (props: object) => (
  <Filter {...props}>
    <SearchInput source="q" alwaysOn placeholder="Search members..." />
    <SelectInput
      source="role"
      choices={[
        { id: 'ADMIN', name: 'Admin' },
        { id: 'MODERATOR', name: 'Moderator' },
        { id: 'MEMBER', name: 'Member' },
      ]}
    />
  </Filter>
);

const UserList = () => (
  <List filters={<UserFilter />} sort={{ field: 'createdAt', order: 'DESC' }} perPage={25}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <FunctionField
        label="Member"
        render={(record: { firstName?: string; lastName?: string; email?: string; isValidated?: boolean; isCompanion?: boolean }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{
              width: 36, height: 36,
              bgcolor: record.isCompanion ? 'secondary.main' : 'primary.main',
              fontSize: 14,
            }}>
              {record.firstName?.[0] || record.email?.[0] || '?'}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {record.firstName} {record.lastName}
                {record.isValidated && (
                  <Chip label="Verified" size="small" color="info" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />
                )}
                {record.isCompanion && (
                  <Chip label="Family Companion" size="small" color="warning" variant="outlined" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {record.isCompanion
                  ? record.email?.replace('+companion', '') + ' (companion)'
                  : record.email}
              </Typography>
            </Box>
          </Box>
        )}
      />
      <FunctionField
        source="role"
        label="Role"
        render={(record: { role?: string }) => <RoleChip role={record.role || 'MEMBER'} />}
      />
      <FunctionField
        source="membershipType"
        label="Membership"
        render={(record: { membershipType?: string; membershipStatus?: string }) => {
          if (!record.membershipType) return <Chip label="None" size="small" variant="outlined" />;
          return (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Chip label={record.membershipType} size="small" color="primary" variant="outlined" />
              <StatusChip status={record.membershipStatus || 'PENDING'} />
            </Box>
          );
        }}
      />
      <FunctionField
        label="Banned"
        render={(record: { isBanned?: boolean; bannedFromClassifieds?: boolean; bannedFromMedia?: boolean }) => {
          if (record.isBanned) return <Chip label="BANNED" color="error" size="small" />;
          const bans = [];
          if (record.bannedFromClassifieds) bans.push('Classifieds');
          if (record.bannedFromMedia) bans.push('Media');
          return bans.length > 0 ? <Chip label={bans.join(', ')} color="warning" size="small" variant="outlined" /> : null;
        }}
      />
      <DateField source="createdAt" label="Joined" />
    </Datagrid>
  </List>
);

const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <FormSection title="Personal Information">
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%' }}>
          <TextInput source="firstName" label="First Name" fullWidth />
          <TextInput source="lastName" label="Last Name" fullWidth />
          <FunctionField
            label="Email"
            render={(record: { email?: string; isCompanion?: boolean }) => {
              const email = record.email || '';
              const display = email.replace(/\+companion(@)/, '$1');
              return (
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>{display}</Typography>
                  {record.isCompanion && (
                    <Typography variant="caption" sx={{ color: 'warning.main' }}>
                      Family companion account (synthetic email from migration)
                    </Typography>
                  )}
                </Box>
              );
            }}
          />
          <TextInput source="phone" fullWidth />
        </Box>
      </FormSection>
      <FormSection title="Account Settings">
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%' }}>
          <SelectInput
            source="role"
            choices={[
              { id: 'ADMIN', name: 'Admin' },
              { id: 'MODERATOR', name: 'Moderator' },
              { id: 'MEMBER', name: 'Member' },
            ]}
            fullWidth
          />
          <BooleanInput source="emailVerified" label="Email Verified" />
        </Box>
      </FormSection>
      <FormSection title="Trust Status">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <BooleanInput
            source="isValidated"
            label="Verified Member"
            helperText="Verified members can post without moderation review and display a verified badge"
          />
          <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>
            Enable this for trusted members whose posts and images should bypass the moderation queue.
            A shield badge will appear next to their name in the gallery and classifieds.
          </Typography>
        </Box>
      </FormSection>
      <FormSection title="Restrictions">
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, width: '100%' }}>
          <BooleanInput source="isBanned" label="Ban User" helperText="Completely ban from site" />
          <BooleanInput source="bannedFromClassifieds" label="Ban from Classifieds" helperText="Cannot post listings" />
          <BooleanInput source="bannedFromMedia" label="Ban from Media" helperText="Cannot upload photos" />
        </Box>
      </FormSection>
      <FormSection title="Admin Notes">
        <TextInput source="adminNotes" label="Internal Notes" multiline rows={4} fullWidth helperText="Only visible to admins" />
      </FormSection>
    </SimpleForm>
  </Edit>
);

const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="firstName" label="First Name" />
      <TextField source="lastName" label="Last Name" />
      <FunctionField
        label="Email"
        render={(record: { email?: string; isCompanion?: boolean }) => {
          const email = record.email || '';
          const display = email.replace(/\+companion(@)/, '$1');
          return record.isCompanion ? `${display} (companion)` : display;
        }}
      />
      <TextField source="role" />
      <FunctionField
        label="Membership"
        render={(record: { membershipType?: string; membershipStatus?: string }) =>
          record.membershipType
            ? `${record.membershipType} (${record.membershipStatus})`
            : 'No Membership'
        }
      />
      <DateField source="createdAt" label="Joined" />
      <DateField source="updatedAt" label="Last Updated" />
    </SimpleShowLayout>
  </Show>
);

// ============================================
// Event Resource
// ============================================

const EventFilter = (props: object) => (
  <Filter {...props}>
    <SearchInput source="q" alwaysOn placeholder="Search events..." />
    <SelectInput
      source="status"
      choices={[
        { id: 'DRAFT', name: 'Draft' },
        { id: 'PUBLISHED', name: 'Published' },
        { id: 'CANCELLED', name: 'Cancelled' },
        { id: 'COMPLETED', name: 'Completed' },
      ]}
    />
    <SelectInput
      source="type"
      choices={[
        { id: 'MEETING', name: 'Meeting' },
        { id: 'STAR_PARTY', name: 'Star Party' },
        { id: 'OBS_SESSION', name: 'OBS Session' },
        { id: 'WORKSHOP', name: 'Workshop' },
        { id: 'OUTREACH', name: 'Outreach' },
        { id: 'SOCIAL', name: 'Social' },
      ]}
    />
  </Filter>
);

const EventList = () => (
  <List filters={<EventFilter />} sort={{ field: 'startDate', order: 'DESC' }} perPage={25}>
    <Datagrid rowClick="edit">
      <TextField source="title" />
      <FunctionField
        source="type"
        label="Type"
        render={(record: { type?: string }) => (
          <Chip label={record.type?.replace(/_/g, ' ')} size="small" variant="outlined" />
        )}
      />
      <FunctionField
        source="status"
        label="Status"
        render={(record: { status?: string }) => <StatusChip status={record.status || 'DRAFT'} />}
      />
      <DateField source="startDate" label="Date" />
      <TextField source="locationName" label="Location" />
      <NumberField source="capacity" label="Capacity" />
    </Datagrid>
  </List>
);

const CreateEventToolbar = () => (
  <Toolbar sx={{ position: 'sticky', bottom: 0, zIndex: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
    <SaveButton label="Create Event" alwaysEnable />
  </Toolbar>
);

const EditEventToolbar = () => (
  <Toolbar sx={{ position: 'sticky', bottom: 0, zIndex: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
    <SaveButton label="Save Changes" alwaysEnable />
  </Toolbar>
);

const EventEdit = () => {
  const notify = useNotify();
  const redirect = useRedirect();

  return (
    <Edit
      mutationOptions={{
        onSuccess: () => {
          notify('Event updated successfully', { type: 'success' });
          redirect('list', 'events');
        },
        onError: (error: Error & { body?: { error?: string; details?: string } }) => {
          const message = error?.body?.details || error?.body?.error || error?.message || 'Failed to update event';
          notify(message, { type: 'error' });
          console.error('Update event error:', error);
        },
      }}
    >
      <SimpleForm toolbar={<EditEventToolbar />}>
        <FormSection title="Basic Information">
          <TextInput source="title" fullWidth required sx={{ mb: 2 }} />
          <TextInput source="slug" fullWidth helperText="URL-friendly identifier" sx={{ mb: 2 }} />
          <TextInput
            source="description"
            label="Description"
            multiline
            rows={6}
            fullWidth
            sx={{ mb: 2 }}
          />
        </FormSection>

        <FormSection title="Event Details">
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%' }}>
            <AutocompleteInput
              source="type"
              choices={[
                { id: 'MEETING', name: 'Meeting' },
                { id: 'STAR_PARTY', name: 'Star Party' },
                { id: 'OBS_SESSION', name: 'OBS Session' },
                { id: 'WORKSHOP', name: 'Workshop' },
                { id: 'OUTREACH', name: 'Outreach' },
                { id: 'SOCIAL', name: 'Social' },
                { id: 'SPECIAL', name: 'Special Event' },
                { id: 'EDUCATIONAL', name: 'Educational' },
              ]}
              fullWidth
              onCreate={(value) => ({ id: value?.toUpperCase().replace(/\s+/g, '_'), name: value })}
              helperText="Select or type custom"
            />
            <SelectInput
              source="status"
              choices={[
                { id: 'DRAFT', name: 'Draft' },
                { id: 'PUBLISHED', name: 'Published' },
                { id: 'CANCELLED', name: 'Cancelled' },
                { id: 'COMPLETED', name: 'Completed' },
              ]}
              fullWidth
            />
            <DateInput source="startDate" fullWidth />
            <DateInput source="endDate" fullWidth />
            <TextInput source="locationName" label="Location Name" fullWidth />
            <TextInput source="locationAddress" label="Address" fullWidth />
            <NumberInput source="capacity" label="Max Capacity" fullWidth />
          </Box>
        </FormSection>

        <FormSection title="Pricing">
          <BooleanInput source="isFreeEvent" label="This is a free event" helperText="Toggle to hide pricing fields" />
          <FormDataConsumer>
            {({ formData }) =>
              !formData.isFreeEvent && (
                <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%', mt: 2 }}>
                  <NumberInput source="memberPrice" label="Member Price ($)" fullWidth />
                  <NumberInput source="guestPrice" label="Guest Price ($)" fullWidth />
                </Box>
              )
            }
          </FormDataConsumer>
        </FormSection>

        <FormSection title="Camping Options">
          <BooleanInput source="campingAvailable" label="Camping Available" />
          <FormDataConsumer>
            {({ formData }) =>
              formData.campingAvailable && (
                <NumberInput source="campingPrice" label="Camping Price ($)" fullWidth sx={{ mt: 2 }} />
              )
            }
          </FormDataConsumer>
        </FormSection>

        <FormSection title="Registration Window">
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%' }}>
            <DateTimeInput source="registrationOpens" label="Registration Opens" fullWidth />
            <DateTimeInput source="registrationCloses" label="Registration Closes" fullWidth />
          </Box>
        </FormSection>

        <FormSection title="Recurring Event">
          <BooleanInput source="isRecurring" label="This is a recurring event" />
          <FormDataConsumer>
            {({ formData }) =>
              formData.isRecurring && (
                <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%', mt: 2 }}>
                  <SelectInput
                    source="recurrencePattern"
                    label="Repeat"
                    choices={[
                      { id: 'DAILY', name: 'Daily' },
                      { id: 'WEEKLY', name: 'Weekly' },
                      { id: 'BIWEEKLY', name: 'Every 2 Weeks' },
                      { id: 'MONTHLY', name: 'Monthly' },
                      { id: 'YEARLY', name: 'Yearly' },
                    ]}
                    fullWidth
                  />
                  <DateInput source="recurrenceEndDate" label="Repeat Until" fullWidth />
                </Box>
              )
            }
          </FormDataConsumer>
        </FormSection>
      </SimpleForm>
    </Edit>
  );
};

const EventCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();

  return (
    <Create
      mutationOptions={{
        onSuccess: () => {
          notify('Event created successfully', { type: 'success' });
          redirect('list', 'events');
        },
        onError: (error: Error & { body?: { error?: string; details?: string } }) => {
          const message = error?.body?.details || error?.body?.error || error?.message || 'Failed to create event';
          notify(message, { type: 'error' });
          console.error('Create event error:', error);
        },
      }}
    >
      <SimpleForm toolbar={<CreateEventToolbar />}>
        <FormSection title="Basic Information">
          <TextInput source="title" fullWidth required sx={{ mb: 2 }} />
          <TextInput source="slug" fullWidth helperText="Leave blank to auto-generate from title" sx={{ mb: 2 }} />
          <TextInput
            source="description"
            label="Description"
            multiline
            rows={6}
            fullWidth
            helperText="Describe the event, what to bring, expectations, etc."
            sx={{ mb: 2 }}
          />
          <TextInput
            source="imageUrl"
            label="Cover Image URL"
            fullWidth
            helperText="Paste a URL for the event cover image (uploaded to S3 or external link)"
            sx={{ mb: 2 }}
          />
        </FormSection>

        <FormSection title="Event Details">
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%' }}>
            <AutocompleteInput
              source="type"
              choices={[
                { id: 'MEETING', name: 'Meeting' },
                { id: 'STAR_PARTY', name: 'Star Party' },
                { id: 'OBS_SESSION', name: 'OBS Session' },
                { id: 'WORKSHOP', name: 'Workshop' },
                { id: 'OUTREACH', name: 'Outreach' },
                { id: 'SOCIAL', name: 'Social' },
                { id: 'SPECIAL', name: 'Special Event' },
                { id: 'EDUCATIONAL', name: 'Educational' },
              ]}
              fullWidth
              validate={required('Event type is required')}
              onCreate={(value) => ({ id: value?.toUpperCase().replace(/\s+/g, '_'), name: value })}
              helperText="Select or type custom event type"
            />
            <SelectInput
              source="status"
              choices={[
                { id: 'PUBLISHED', name: 'Published (Visible to public)' },
                { id: 'DRAFT', name: 'Draft (Hidden)' },
              ]}
              defaultValue="PUBLISHED"
              fullWidth
              helperText="Published events show on the website immediately"
            />
            <DateTimeInput source="startDate" required fullWidth />
            <DateTimeInput source="endDate" fullWidth />
            <TextInput source="locationName" label="Location Name" fullWidth />
            <TextInput source="locationAddress" label="Address" fullWidth />
            <NumberInput source="capacity" label="Max Capacity" fullWidth helperText="Leave empty for unlimited" />
          </Box>
        </FormSection>

        <FormSection title="Pricing">
          <BooleanInput
            source="isFreeEvent"
            label="This is a free event"
            defaultValue={true}
            helperText="Uncheck to set pricing"
          />
          <FormDataConsumer>
            {({ formData }) =>
              !formData.isFreeEvent && (
                <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%', mt: 2 }}>
                  <NumberInput source="memberPrice" label="Member Price ($)" fullWidth defaultValue={0} />
                  <NumberInput source="guestPrice" label="Guest Price ($)" fullWidth defaultValue={0} />
                </Box>
              )
            }
          </FormDataConsumer>
        </FormSection>

        <FormSection title="Camping Options">
          <BooleanInput source="campingAvailable" label="Camping Available" defaultValue={false} />
          <FormDataConsumer>
            {({ formData }) =>
              formData.campingAvailable && (
                <NumberInput source="campingPrice" label="Camping Price ($)" fullWidth defaultValue={0} sx={{ mt: 2 }} />
              )
            }
          </FormDataConsumer>
        </FormSection>

        <FormSection title="Registration Window">
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%' }}>
            <DateTimeInput source="registrationOpens" label="Registration Opens" fullWidth />
            <DateTimeInput source="registrationCloses" label="Registration Closes" fullWidth />
          </Box>
        </FormSection>

        <FormSection title="Recurring Event">
          <BooleanInput source="isRecurring" label="This is a recurring event" defaultValue={false} />
          <FormDataConsumer>
            {({ formData }) =>
              formData.isRecurring && (
                <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%', mt: 2 }}>
                  <SelectInput
                    source="recurrencePattern"
                    label="Repeat"
                    choices={[
                      { id: 'DAILY', name: 'Daily' },
                      { id: 'WEEKLY', name: 'Weekly' },
                      { id: 'BIWEEKLY', name: 'Every 2 Weeks' },
                      { id: 'MONTHLY', name: 'Monthly' },
                      { id: 'YEARLY', name: 'Yearly' },
                    ]}
                    fullWidth
                  />
                  <DateInput source="recurrenceEndDate" label="Repeat Until" fullWidth />
                </Box>
              )
            }
          </FormDataConsumer>
        </FormSection>
      </SimpleForm>
    </Create>
  );
};

// ============================================
// Membership Resource
// ============================================

const MembershipFilter = (props: object) => (
  <Filter {...props}>
    <SelectInput
      source="status"
      choices={[
        { id: 'ACTIVE', name: 'Active' },
        { id: 'SUSPENDED', name: 'Suspended' },
        { id: 'EXPIRED', name: 'Expired' },
        { id: 'PENDING', name: 'Pending' },
      ]}
      alwaysOn
    />
    <SelectInput
      source="type"
      choices={[
        { id: 'INDIVIDUAL', name: 'Individual' },
        { id: 'FAMILY', name: 'Family' },
        { id: 'STUDENT', name: 'Student' },
        { id: 'LIFETIME', name: 'Lifetime' },
      ]}
    />
  </Filter>
);

const MembershipList = () => (
  <List filters={<MembershipFilter />} perPage={25}>
    <Datagrid rowClick="edit">
      <ReferenceField source="userId" reference="users" label="Member">
        <FunctionField
          render={(record: { firstName?: string; lastName?: string; email?: string }) => (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {record.firstName} {record.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {record.email}
              </Typography>
            </Box>
          )}
        />
      </ReferenceField>
      <FunctionField
        source="type"
        label="Type"
        render={(record: { type?: string }) => (
          <Chip label={record.type} size="small" color="primary" variant="outlined" />
        )}
      />
      <FunctionField
        source="status"
        label="Status"
        render={(record: { status?: string }) => <StatusChip status={record.status || 'PENDING'} />}
      />
      <DateField source="startDate" label="Start Date" />
      <DateField source="endDate" label="Expires" emptyText="Never" />
      <BooleanField source="obsEligible" label="OBS" />
    </Datagrid>
  </List>
);

const MembershipEdit = () => (
  <Edit>
    <SimpleForm>
      <FormSection title="Membership Details">
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%' }}>
          <SelectInput
            source="type"
            choices={[
              { id: 'FREE', name: 'Free' },
              { id: 'INDIVIDUAL', name: 'Individual' },
              { id: 'FAMILY', name: 'Family' },
              { id: 'STUDENT', name: 'Student' },
              { id: 'LIFETIME', name: 'Lifetime' },
            ]}
            fullWidth
          />
          <SelectInput
            source="status"
            choices={[
              { id: 'ACTIVE', name: 'Active' },
              { id: 'SUSPENDED', name: 'Suspended' },
              { id: 'EXPIRED', name: 'Expired' },
              { id: 'PENDING', name: 'Pending' },
            ]}
            fullWidth
          />
          <DateInput source="startDate" fullWidth />
          <DateInput source="endDate" fullWidth />
        </Box>
      </FormSection>
      <FormSection title="Benefits">
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%' }}>
          <BooleanInput source="obsEligible" label="OBS Eligible" />
          <NumberInput source="discountPercent" label="Discount %" fullWidth />
        </Box>
      </FormSection>
    </SimpleForm>
  </Edit>
);

// ============================================
// Registration Resource
// ============================================

const RegistrationFilter = (props: object) => (
  <Filter {...props}>
    <SelectInput
      source="status"
      choices={[
        { id: 'CONFIRMED', name: 'Confirmed' },
        { id: 'PENDING', name: 'Pending' },
        { id: 'CANCELLED', name: 'Cancelled' },
        { id: 'WAITLISTED', name: 'Waitlisted' },
      ]}
      alwaysOn
    />
  </Filter>
);

// Bulk action buttons for registrations
const RegistrationBulkActions = () => {
  const notify = useNotify();
  const refresh = useRefresh();
  const [updateMany] = useUpdate();

  const handleBulkConfirm = async (selectedIds: string[]) => {
    try {
      await fetch('/api/admin/registrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, data: { status: 'CONFIRMED' } }),
      });
      notify(`${selectedIds.length} registration(s) confirmed`, { type: 'success' });
      refresh();
    } catch {
      notify('Failed to confirm registrations', { type: 'error' });
    }
  };

  const handleBulkCheckIn = async (selectedIds: string[]) => {
    try {
      await fetch('/api/admin/registrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, data: { checkedInAt: true } }),
      });
      notify(`${selectedIds.length} attendee(s) checked in`, { type: 'success' });
      refresh();
    } catch {
      notify('Failed to check in attendees', { type: 'error' });
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Chip
        label="Confirm Selected"
        onClick={() => {
          // This gets the selected IDs from the list context
          const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
          const ids: string[] = [];
          checkboxes.forEach((cb) => {
            const id = (cb as HTMLInputElement).value;
            if (id && id !== 'on') ids.push(id);
          });
          if (ids.length > 0) handleBulkConfirm(ids);
        }}
        color="success"
        variant="outlined"
        sx={{ cursor: 'pointer' }}
      />
      <Chip
        label="Check In Selected"
        onClick={() => {
          const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
          const ids: string[] = [];
          checkboxes.forEach((cb) => {
            const id = (cb as HTMLInputElement).value;
            if (id && id !== 'on') ids.push(id);
          });
          if (ids.length > 0) handleBulkCheckIn(ids);
        }}
        color="primary"
        variant="outlined"
        sx={{ cursor: 'pointer' }}
      />
    </Box>
  );
};

const RegistrationList = () => (
  <List filters={<RegistrationFilter />} sort={{ field: 'createdAt', order: 'DESC' }}>
    <Datagrid rowClick="edit">
      <ReferenceField source="eventId" reference="events" label="Event">
        <TextField source="title" />
      </ReferenceField>
      <ReferenceField source="userId" reference="users" label="Attendee">
        <FunctionField
          render={(record: { firstName?: string; lastName?: string }) =>
            `${record.firstName} ${record.lastName}`
          }
        />
      </ReferenceField>
      <FunctionField
        source="status"
        label="Status"
        render={(record: { status?: string }) => <StatusChip status={record.status || 'PENDING'} />}
      />
      <NumberField source="guestCount" label="Guests" />
      <BooleanField source="campingRequested" label="Camping" />
      <DateField source="createdAt" label="Registered" />
      <FunctionField
        source="checkedInAt"
        label="Checked In"
        render={(record: { checkedInAt?: string }) =>
          record.checkedInAt ? (
            <Chip label="Yes" color="success" size="small" />
          ) : (
            <Chip label="No" size="small" variant="outlined" />
          )
        }
      />
    </Datagrid>
  </List>
);

const RegistrationEdit = () => {
  const notify = useNotify();

  return (
    <Edit
      mutationOptions={{
        onSuccess: () => {
          notify('Registration updated successfully', { type: 'success' });
        },
      }}
    >
      <SimpleForm>
        <FormSection title="Event & Attendee Info">
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%' }}>
            <ReferenceField source="eventId" reference="events" label="Event">
              <TextField source="title" />
            </ReferenceField>
            <ReferenceField source="userId" reference="users" label="Attendee">
              <FunctionField
                render={(record: { firstName?: string; lastName?: string; email?: string }) => (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {record.firstName} {record.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {record.email}
                    </Typography>
                  </Box>
                )}
              />
            </ReferenceField>
          </Box>
        </FormSection>

        <FormSection title="Registration Details">
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%' }}>
            <SelectInput
              source="status"
              choices={[
                { id: 'PENDING', name: 'Pending' },
                { id: 'CONFIRMED', name: 'Confirmed' },
                { id: 'WAITLISTED', name: 'Waitlisted' },
                { id: 'CANCELLED', name: 'Cancelled' },
                { id: 'ATTENDED', name: 'Attended' },
                { id: 'NO_SHOW', name: 'No Show' },
              ]}
              fullWidth
            />
            <NumberInput source="guestCount" label="Number of Guests" fullWidth />
            <BooleanInput source="campingRequested" label="Camping Requested" />
          </Box>
        </FormSection>

        <FormSection title="Additional Info">
          <TextInput source="dietary_restrictions" label="Dietary Restrictions" fullWidth sx={{ mb: 2 }} />
          <TextInput source="notes" label="Notes" multiline rows={3} fullWidth sx={{ mb: 2 }} />
        </FormSection>

        <FormSection title="Check-In">
          <BooleanInput
            source="checkedInAt"
            label="Checked In"
            format={(v: string | boolean | null) => !!v}
            parse={(v: boolean) => (v ? new Date().toISOString() : null)}
            helperText="Toggle to mark attendee as checked in"
          />
          <FormDataConsumer>
            {({ formData }) =>
              formData.checkedInAt && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Checked in at: {new Date(formData.checkedInAt).toLocaleString()}
                </Typography>
              )
            }
          </FormDataConsumer>
        </FormSection>
      </SimpleForm>
    </Edit>
  );
};

const RegistrationShow = () => (
  <Show>
    <SimpleShowLayout>
      <ReferenceField source="eventId" reference="events" label="Event">
        <TextField source="title" />
      </ReferenceField>
      <ReferenceField source="userId" reference="users" label="Attendee">
        <FunctionField
          render={(record: { firstName?: string; lastName?: string; email?: string }) =>
            `${record.firstName} ${record.lastName} (${record.email})`
          }
        />
      </ReferenceField>
      <TextField source="status" />
      <NumberField source="guestCount" label="Guests" />
      <BooleanField source="campingRequested" label="Camping" />
      <TextField source="dietary_restrictions" label="Dietary Restrictions" />
      <TextField source="notes" />
      <DateField source="createdAt" label="Registered At" showTime />
      <DateField source="checkedInAt" label="Checked In At" showTime />
    </SimpleShowLayout>
  </Show>
);

// ============================================
// Media Resource
// ============================================

const MediaFilter = (props: object) => (
  <Filter {...props}>
    <SelectInput
      source="status"
      choices={[
        { id: 'PENDING', name: 'Pending Review' },
        { id: 'APPROVED', name: 'Approved' },
        { id: 'REJECTED', name: 'Rejected' },
      ]}
      alwaysOn
    />
    <SelectInput
      source="type"
      choices={[
        { id: 'IMAGE', name: 'Image' },
        { id: 'VIDEO', name: 'Video' },
        { id: 'DOCUMENT', name: 'Document' },
      ]}
    />
  </Filter>
);

const MediaList = () => (
  <List filters={<MediaFilter />} sort={{ field: 'createdAt', order: 'DESC' }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <FunctionField
        label="Preview"
        render={(record: { thumbnailUrl?: string; url?: string; filename?: string }) => (
          <Box
            component="img"
            src={record.thumbnailUrl || record.url}
            alt={record.filename}
            sx={{
              width: 60,
              height: 60,
              objectFit: 'cover',
              borderRadius: 1,
              border: '1px solid rgba(129, 140, 248, 0.2)',
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      />
      <TextField source="filename" label="Filename" />
      <FunctionField
        source="category"
        label="Category"
        render={(record: { category?: string }) => (
          record.category ? (
            <Chip label={record.category.replace(/_/g, ' ')} size="small" variant="outlined" />
          ) : (
            <Chip label="No Category" size="small" variant="outlined" color="warning" />
          )
        )}
      />
      <FunctionField
        source="status"
        label="Status"
        render={(record: { status?: string }) => <StatusChip status={record.status || 'PENDING'} />}
      />
      <ReferenceField source="uploaded_by_id" reference="users" label="Uploaded By">
        <FunctionField
          render={(record: { firstName?: string; lastName?: string }) =>
            `${record.firstName} ${record.lastName}`
          }
        />
      </ReferenceField>
      <DateField source="createdAt" label="Uploaded" />
      <FunctionField
        label="Actions"
        render={() => <MediaQuickActions />}
      />
    </Datagrid>
  </List>
);

const MediaEdit = () => (
  <Edit>
    <SimpleForm>
      <FormSection title="Image Preview">
        <FormDataConsumer>
          {({ formData }) => (
            <Box sx={{ mb: 2 }}>
              {formData.url && (
                <Box
                  component="img"
                  src={formData.thumbnailUrl || formData.url}
                  alt={formData.filename}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 300,
                    objectFit: 'contain',
                    borderRadius: 2,
                    border: '1px solid rgba(129, 140, 248, 0.2)',
                  }}
                />
              )}
            </Box>
          )}
        </FormDataConsumer>
      </FormSection>
      <FormSection title="Media Details">
        <TextInput source="filename" disabled fullWidth label="Original Filename" sx={{ mb: 2 }} />
        <TextInput source="caption" multiline fullWidth rows={3} sx={{ mb: 2 }} />
        <TextInput source="alt" fullWidth label="Alt Text (for accessibility)" sx={{ mb: 2 }} />
      </FormSection>
      <FormSection title="Gallery Settings">
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%' }}>
          <SelectInput
            source="category"
            choices={photoCategoryChoices}
            fullWidth
            helperText="Required for gallery visibility. Images without a category won't appear in the public gallery."
          />
          <SelectInput
            source="status"
            choices={[
              { id: 'PENDING', name: 'Pending Review' },
              { id: 'APPROVED', name: 'Approved' },
              { id: 'REJECTED', name: 'Rejected' },
            ]}
            fullWidth
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          To approve and display in gallery: Set a category AND change status to Approved.
        </Typography>
      </FormSection>
    </SimpleForm>
  </Edit>
);

// ============================================
// Listing Resource (Classifieds)
// ============================================

const ListingFilter = (props: object) => (
  <Filter {...props}>
    <SearchInput source="q" alwaysOn placeholder="Search listings..." />
    <SelectInput
      source="status"
      choices={[
        { id: 'DRAFT', name: 'Draft' },
        { id: 'PENDING_APPROVAL', name: 'Pending Approval' },
        { id: 'ACTIVE', name: 'Active' },
        { id: 'SOLD', name: 'Sold' },
        { id: 'EXPIRED', name: 'Expired' },
      ]}
    />
    <SelectInput
      source="category"
      choices={[
        { id: 'TELESCOPE', name: 'Telescopes' },
        { id: 'MOUNT', name: 'Mounts' },
        { id: 'EYEPIECE', name: 'Eyepieces' },
        { id: 'CAMERA', name: 'Cameras' },
        { id: 'ACCESSORY', name: 'Accessories' },
        { id: 'OTHER', name: 'Other' },
      ]}
    />
  </Filter>
);

const ListingList = () => (
  <List filters={<ListingFilter />} sort={{ field: 'createdAt', order: 'DESC' }} perPage={25}>
    <Datagrid rowClick="edit">
      <TextField source="title" />
      <FunctionField
        source="category"
        label="Category"
        render={(record: { category?: string }) => (
          <Chip label={record.category} size="small" variant="outlined" />
        )}
      />
      <FunctionField
        source="askingPrice"
        label="Price"
        render={(record: { askingPrice?: number }) => (
          <Typography sx={{ fontWeight: 600, color: 'success.main' }}>
            ${record.askingPrice?.toLocaleString() || '0'}
          </Typography>
        )}
      />
      <FunctionField
        source="status"
        label="Status"
        render={(record: { status?: string }) => <StatusChip status={record.status || 'DRAFT'} />}
      />
      <ReferenceField source="sellerId" reference="users" label="Seller">
        <FunctionField
          render={(record: { firstName?: string; lastName?: string }) =>
            `${record.firstName} ${record.lastName}`
          }
        />
      </ReferenceField>
      <DateField source="createdAt" label="Posted" />
    </Datagrid>
  </List>
);

const ListingEdit = () => (
  <Edit>
    <SimpleForm>
      <FormSection title="Listing Details">
        <TextInput source="title" fullWidth sx={{ mb: 2 }} />
        <TextInput source="description" multiline fullWidth rows={4} sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%' }}>
          <SelectInput
            source="category"
            choices={[
              { id: 'TELESCOPE', name: 'Telescopes' },
              { id: 'MOUNT', name: 'Mounts' },
              { id: 'EYEPIECE', name: 'Eyepieces' },
              { id: 'CAMERA', name: 'Cameras' },
              { id: 'ACCESSORY', name: 'Accessories' },
              { id: 'OTHER', name: 'Other' },
            ]}
            fullWidth
          />
          <SelectInput
            source="status"
            choices={[
              { id: 'DRAFT', name: 'Draft' },
              { id: 'PENDING_APPROVAL', name: 'Pending Approval' },
              { id: 'ACTIVE', name: 'Active' },
              { id: 'SOLD', name: 'Sold' },
              { id: 'EXPIRED', name: 'Expired' },
            ]}
            fullWidth
          />
          <NumberInput source="askingPrice" label="Asking Price ($)" fullWidth />
          <SelectInput
            source="condition"
            choices={[
              { id: 'NEW', name: 'New' },
              { id: 'LIKE_NEW', name: 'Like New' },
              { id: 'EXCELLENT', name: 'Excellent' },
              { id: 'GOOD', name: 'Good' },
              { id: 'FAIR', name: 'Fair' },
              { id: 'FOR_PARTS', name: 'For Parts' },
            ]}
            fullWidth
          />
        </Box>
      </FormSection>
    </SimpleForm>
  </Edit>
);

// ============================================
// Board Member Resource
// ============================================

const BoardMemberFilter = (props: object) => (
  <Filter {...props}>
    <SearchInput source="q" alwaysOn placeholder="Search board members..." />
    <BooleanInput source="isActive" label="Active Only" />
  </Filter>
);

const BoardMemberList = () => (
  <List filters={<BoardMemberFilter />} sort={{ field: 'sortOrder', order: 'ASC' }} actions={<SimpleListActions />}>
    <Datagrid rowClick="edit">
      <FunctionField
        label="Board Member"
        render={(record: { name?: string; imageUrl?: string; title?: string }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={record.imageUrl || undefined}
              sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 14 }}
            >
              {record.name?.[0] || '?'}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {record.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {record.title}
              </Typography>
            </Box>
          </Box>
        )}
      />
      <TextField source="email" />
      <NumberField source="sortOrder" label="Order" />
      <FunctionField
        source="isActive"
        label="Status"
        render={(record: { isActive?: boolean }) => (
          <Chip
            label={record.isActive ? 'Active' : 'Inactive'}
            color={record.isActive ? 'success' : 'default'}
            size="small"
          />
        )}
      />
      <DateField source="updatedAt" label="Last Updated" />
    </Datagrid>
  </List>
);

const BoardMemberEdit = () => {
  const notify = useNotify();

  return (
    <Edit
      mutationOptions={{
        onSuccess: () => {
          notify('Board member updated successfully', { type: 'success' });
        },
      }}
    >
      <SimpleForm>
        <FormSection title="Basic Information">
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%' }}>
            <TextInput source="name" fullWidth required />
            <TextInput source="title" fullWidth required helperText="e.g., Club President, Vice President" />
            <TextInput source="email" fullWidth type="email" />
            <NumberInput source="sortOrder" fullWidth helperText="Lower numbers appear first" />
          </Box>
        </FormSection>
        <FormSection title="Profile">
          <TextInput source="imageUrl" fullWidth label="Photo URL" helperText="URL to profile photo" sx={{ mb: 2 }} />
          <TextInput source="bio" multiline fullWidth rows={4} sx={{ mb: 2 }} />
        </FormSection>
        <FormSection title="Settings">
          <BooleanInput source="isActive" label="Active (visible on website)" />
        </FormSection>
      </SimpleForm>
    </Edit>
  );
};

const BoardMemberCreate = () => {
  const notify = useNotify();

  return (
    <Create
      mutationOptions={{
        onSuccess: () => {
          notify('Board member created successfully', { type: 'success' });
        },
      }}
    >
      <SimpleForm>
        <FormSection title="Basic Information">
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, width: '100%' }}>
            <TextInput source="name" fullWidth required />
            <TextInput source="title" fullWidth required helperText="e.g., Club President, Vice President" />
            <TextInput source="email" fullWidth type="email" />
            <NumberInput source="sortOrder" fullWidth defaultValue={0} helperText="Lower numbers appear first" />
          </Box>
        </FormSection>
        <FormSection title="Profile">
          <TextInput source="imageUrl" fullWidth label="Photo URL" helperText="URL to profile photo" sx={{ mb: 2 }} />
          <TextInput source="bio" multiline fullWidth rows={4} sx={{ mb: 2 }} />
        </FormSection>
        <FormSection title="Settings">
          <BooleanInput source="isActive" label="Active (visible on website)" defaultValue={true} />
        </FormSection>
      </SimpleForm>
    </Create>
  );
};

// ============================================
// Main Admin Component
// ============================================

export function AdminApp() {
  return (
    <ThemeProvider theme={adminTheme}>
      <Admin
        dataProvider={dataProvider}
        theme={adminTheme}
        darkTheme={adminTheme}
        defaultTheme="dark"
        layout={CustomLayout}
        dashboard={Dashboard}
      >
        <Resource
          name="users"
          list={UserList}
          edit={UserEdit}
          show={UserShow}
          icon={UsersIcon}
          options={{ label: 'Members' }}
        />
        <Resource
          name="events"
          list={EventList}
          edit={EventEdit}
          create={EventCreate}
          icon={EventsIcon}
          options={{ label: 'Events' }}
        />
        <Resource
          name="memberships"
          list={MembershipList}
          edit={MembershipEdit}
          icon={MembershipIcon}
          options={{ label: 'Memberships' }}
        />
        <Resource
          name="registrations"
          list={RegistrationList}
          edit={RegistrationEdit}
          show={RegistrationShow}
          icon={RegistrationIcon}
          options={{ label: 'Registrations' }}
        />
        <Resource
          name="media"
          list={MediaList}
          edit={MediaEdit}
          icon={MediaIcon}
          options={{ label: 'Media Gallery' }}
        />
        <Resource
          name="listings"
          list={ListingList}
          edit={ListingEdit}
          icon={ListingsIcon}
          options={{ label: 'Classifieds' }}
        />
        <Resource
          name="board-members"
          list={BoardMemberList}
          edit={BoardMemberEdit}
          create={BoardMemberCreate}
          icon={BoardIcon}
          options={{ label: 'Board of Directors' }}
        />
      </Admin>
    </ThemeProvider>
  );
}
