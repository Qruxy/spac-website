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
  Menu,
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
  alpha,
} from '@mui/material';
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
        paper: {
          background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a2e 100%)',
          borderRight: '1px solid rgba(129, 140, 248, 0.15)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
            borderLeft: '3px solid #818cf8',
          },
          '&:hover': {
            background: 'rgba(129, 140, 248, 0.1)',
          },
        },
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
}) => (
  <Card
    sx={{
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: gradient || `linear-gradient(90deg, ${adminTheme.palette[color].main}, ${adminTheme.palette[color].light})`,
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
          <Typography variant="h3" sx={{ fontWeight: 700, mt: 1, color: 'text.primary' }}>
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
            background: `linear-gradient(135deg, ${alpha(adminTheme.palette[color].main, 0.2)}, ${alpha(adminTheme.palette[color].main, 0.05)})`,
            border: `1px solid ${alpha(adminTheme.palette[color].main, 0.3)}`,
            width: 56,
            height: 56,
            color: adminTheme.palette[color].main,
          }}
        >
          <Icon sx={{ fontSize: 28 }} />
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

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
}

const Dashboard = () => {
  const redirect = useRedirect();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
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
        <Card sx={{ mt: 4, borderColor: 'warning.main', borderWidth: 1 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, color: 'warning.main' }}>
              ⚠️ Items Requiring Attention
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {stats.pendingMedia > 0 && (
                <Chip
                  label={`${stats.pendingMedia} Media Pending Review`}
                  color="warning"
                  onClick={() => redirect('/media?filter=%7B%22status%22%3A%22PENDING%22%7D')}
                  sx={{ cursor: 'pointer' }}
                />
              )}
              {stats.pendingListings > 0 && (
                <Chip
                  label={`${stats.pendingListings} Listings Pending Approval`}
                  color="warning"
                  onClick={() => redirect('/listings?filter=%7B%22status%22%3A%22PENDING_APPROVAL%22%7D')}
                  sx={{ cursor: 'pointer' }}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ mt: 4, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TrendingIcon sx={{ color: 'primary.main' }} />
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { label: 'Create New Event', icon: <EventsIcon />, path: '/events/create' },
                { label: 'View All Members', icon: <UsersIcon />, path: '/users' },
                { label: 'Manage Memberships', icon: <MembershipIcon />, path: '/memberships' },
                { label: 'Review Media', icon: <MediaIcon />, path: '/media' },
                { label: 'View Registrations', icon: <RegistrationIcon />, path: '/registrations' },
              ].map((action) => (
                <Chip
                  key={action.path}
                  label={action.label}
                  onClick={() => redirect(action.path)}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 3,
                    px: 1,
                    fontSize: '0.95rem',
                    background: 'rgba(129, 140, 248, 0.05)',
                    border: '1px solid rgba(129, 140, 248, 0.15)',
                    '&:hover': {
                      background: 'rgba(129, 140, 248, 0.15)',
                      borderColor: 'rgba(129, 140, 248, 0.3)',
                    },
                  }}
                  icon={action.icon}
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <StarIcon sx={{ color: 'secondary.main' }} />
              Membership Breakdown
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {stats?.membershipsByType && Object.entries(stats.membershipsByType).map(([type, count]) => (
                <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary">{type}</Typography>
                  <Chip label={count} color="primary" size="small" variant="outlined" />
                </Box>
              ))}
              {stats && (
                <>
                  <Box sx={{ borderTop: '1px solid rgba(129, 140, 248, 0.2)', pt: 2, mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography color="text.secondary">New Users (30 days)</Typography>
                      <Chip label={stats.newUsersThisMonth} color="success" size="small" />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="text.secondary">Confirmed Registrations</Typography>
                    <Chip label={stats.confirmedRegistrations} color="info" size="small" />
                  </Box>
                </>
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

const CustomAppBar = () => (
  <AppBar>
    <TitlePortal />
    <Box sx={{ flex: 1 }} />
    <Tooltip title="Back to Main Site">
      <IconButton color="inherit" href="/dashboard" sx={{ mr: 1 }}>
        <HomeIcon />
      </IconButton>
    </Tooltip>
  </AppBar>
);

// ============================================
// Custom Menu
// ============================================

const CustomMenu = () => (
  <Menu>
    <Menu.DashboardItem primaryText="Dashboard" leftIcon={<DashboardIcon />} />
    <Menu.ResourceItem name="users" primaryText="Members" leftIcon={<UsersIcon />} />
    <Menu.ResourceItem name="events" primaryText="Events" leftIcon={<EventsIcon />} />
    <Menu.ResourceItem name="memberships" primaryText="Memberships" leftIcon={<MembershipIcon />} />
    <Menu.ResourceItem name="registrations" primaryText="Registrations" leftIcon={<RegistrationIcon />} />
    <Menu.ResourceItem name="media" primaryText="Media Gallery" leftIcon={<MediaIcon />} />
    <Menu.ResourceItem name="listings" primaryText="Classifieds" leftIcon={<ListingsIcon />} />
    <Menu.ResourceItem name="board-members" primaryText="Board of Directors" leftIcon={<BoardIcon />} />
  </Menu>
);

// ============================================
// Custom Layout
// ============================================

const CustomLayout = (props: object) => (
  <Layout {...props} appBar={CustomAppBar} menu={CustomMenu} />
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
  <List filters={<UserFilter />} sort={{ field: 'createdAt', order: 'DESC' }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <FunctionField
        label="Member"
        render={(record: { firstName?: string; lastName?: string; email?: string; isValidated?: boolean }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
              {record.firstName?.[0] || record.email?.[0] || '?'}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {record.firstName} {record.lastName}
                {record.isValidated && (
                  <Chip label="Verified" size="small" color="info" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {record.email}
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
        source="membershipStatus"
        label="Status"
        render={(record: { membershipStatus?: string }) =>
          record.membershipStatus ? (
            <StatusChip status={record.membershipStatus} />
          ) : (
            <Chip label="No Membership" size="small" variant="outlined" />
          )
        }
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
          <TextInput source="email" disabled fullWidth />
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
    </SimpleForm>
  </Edit>
);

const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="firstName" label="First Name" />
      <TextField source="lastName" label="Last Name" />
      <TextField source="email" />
      <TextField source="role" />
      <TextField source="membershipStatus" />
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
  <List filters={<EventFilter />} sort={{ field: 'startDate', order: 'DESC' }}>
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

// Sticky toolbars positioned above the GlobalDock (fixed bottom nav ~80px)
const CreateEventToolbar = () => (
  <Toolbar sx={{ position: 'sticky', bottom: '80px', zIndex: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
    <SaveButton label="Create Event" alwaysEnable />
  </Toolbar>
);

const EditEventToolbar = () => (
  <Toolbar sx={{ position: 'sticky', bottom: '80px', zIndex: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
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
            <DateInput source="startDate" required fullWidth />
            <DateInput source="endDate" fullWidth />
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
  <List filters={<MembershipFilter />}>
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
      <DateField source="paypalCurrentPeriodEnd" label="Expires" emptyText="Never" />
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
  <List filters={<ListingFilter />} sort={{ field: 'createdAt', order: 'DESC' }}>
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
