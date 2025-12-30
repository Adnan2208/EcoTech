import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
  Button,
  alpha,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  FilterList,
  MyLocation,
  Add,
  Warning,
  CheckCircle,
  Schedule,
  TrendingUp,
  LocationOn,
  Close,
  Layers,
  ZoomIn,
  ZoomOut,
  Fullscreen,
} from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers by severity
const createCustomIcon = (severity, status) => {
  const colors = {
    low: { bg: '#10b981', border: '#059669' },
    medium: { bg: '#f59e0b', border: '#d97706' },
    high: { bg: '#ef4444', border: '#dc2626' },
  };
  
  const color = colors[severity] || colors.medium;
  const isResolved = status === 'resolved';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
      ">
        <div style="
          background: ${isResolved ? '#10b981' : color.bg};
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          position: absolute;
          left: 4px;
          top: 0;
          border: 3px solid ${isResolved ? '#059669' : color.border};
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          ${isResolved ? 'opacity: 0.7;' : ''}
        "></div>
        <div style="
          position: absolute;
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          left: 13px;
          top: 9px;
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// Component to handle map view changes
const MapController = ({ center, focusReport }) => {
  const map = useMap();
  
  useEffect(() => {
    if (focusReport) {
      map.flyTo(
        [focusReport.location.coordinates[1], focusReport.location.coordinates[0]],
        16,
        { duration: 1.5 }
      );
    }
  }, [focusReport, map]);

  useEffect(() => {
    if (center && !focusReport) {
      map.setView(center, 12);
    }
  }, [center, map, focusReport]);

  return null;
};

const statusConfig = {
  open: { color: 'error', icon: Warning, label: 'Open' },
  'in-progress': { color: 'warning', icon: Schedule, label: 'In Progress' },
  resolved: { color: 'success', icon: CheckCircle, label: 'Resolved' },
};

const MapView = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [center, setCenter] = useState([20.5937, 78.9629]);
  const [focusReport, setFocusReport] = useState(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const fetchReports = async () => {
    try {
      let url = '/dashboard/map?';
      if (statusFilter) url += `status=${statusFilter}&`;
      if (categoryFilter) url += `category=${categoryFilter}`;
      
      const response = await api.get(url);
      const data = response.data.data;
      setReports(data);

      // Calculate stats
      const statsData = {
        open: data.filter(r => r.status === 'open').length,
        inProgress: data.filter(r => r.status === 'in-progress').length,
        resolved: data.filter(r => r.status === 'resolved').length,
        total: data.length,
      };
      setStats(statsData);

      // Auto-focus on highest severity open issue if exists
      const highSeverityOpen = data.find(r => r.severity === 'high' && r.status === 'open');
      if (highSeverityOpen && !statusFilter && !categoryFilter) {
        setFocusReport(highSeverityOpen);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => console.log('Could not get user location')
      );
    }
  }, []);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
          setFocusReport(null);
        }
      );
    }
  };

  const FilterContent = () => (
    <Box sx={{ p: isMobile ? 2 : 0 }}>
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Status</InputLabel>
        <Select
          value={statusFilter}
          label="Status"
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setFocusReport(null);
          }}
        >
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="open">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning fontSize="small" color="error" /> Open
            </Box>
          </MenuItem>
          <MenuItem value="in-progress">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule fontSize="small" color="warning" /> In Progress
            </Box>
          </MenuItem>
          <MenuItem value="resolved">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle fontSize="small" color="success" /> Resolved
            </Box>
          </MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth size="small">
        <InputLabel>Category</InputLabel>
        <Select
          value={categoryFilter}
          label="Category"
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setFocusReport(null);
          }}
        >
          <MenuItem value="">All Categories</MenuItem>
          <MenuItem value="plastic">🥤 Plastic</MenuItem>
          <MenuItem value="organic">🌿 Organic</MenuItem>
          <MenuItem value="hazardous">☢️ Hazardous</MenuItem>
          <MenuItem value="electronic">📱 Electronic</MenuItem>
          <MenuItem value="construction">🏗️ Construction</MenuItem>
          <MenuItem value="other">📦 Other</MenuItem>
        </Select>
      </FormControl>

      {(statusFilter || categoryFilter) && (
        <Button
          variant="text"
          size="small"
          onClick={() => {
            setStatusFilter('');
            setCategoryFilter('');
            setFocusReport(null);
          }}
          sx={{ mt: 2 }}
        >
          Clear Filters
        </Button>
      )}
    </Box>
  );

  return (
    <Box sx={{ height: 'calc(100vh - 72px)', display: 'flex', position: 'relative' }}>
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <Box
          sx={{
            width: 340,
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'grey.200',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Stats Header */}
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'grey.100' }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Waste Hotspots
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Real-time community waste reports
            </Typography>

            <Grid container spacing={1.5}>
              {[
                { label: 'Open', value: stats.open, color: 'error.main', bgColor: 'error.light' },
                { label: 'In Progress', value: stats.inProgress, color: 'warning.main', bgColor: 'warning.light' },
                { label: 'Resolved', value: stats.resolved, color: 'success.main', bgColor: 'success.light' },
              ].map((stat) => (
                <Grid item xs={4} key={stat.label}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette[stat.color.split('.')[0]].main, 0.08),
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h5" fontWeight={700} color={stat.color}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Filters */}
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'grey.100' }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList fontSize="small" /> Filters
            </Typography>
            <FilterContent />
          </Box>

          {/* Legend */}
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'grey.100' }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
              Severity Legend
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { label: 'High Priority', color: '#ef4444' },
                { label: 'Medium Priority', color: '#f59e0b' },
                { label: 'Low Priority', color: '#10b981' },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: item.color,
                      boxShadow: `0 2px 4px ${alpha(item.color, 0.4)}`,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* CTA */}
          <Box sx={{ p: 3, mt: 'auto' }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<Add />}
              onClick={() => navigate(user ? '/report' : '/login')}
              sx={{ py: 1.5 }}
            >
              {user ? 'Report New Issue' : 'Sign In to Report'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Map Container */}
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              bgcolor: 'background.paper',
              borderRadius: 3,
              p: 3,
              boxShadow: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CircularProgress size={28} />
            <Typography>Loading reports...</Typography>
          </Box>
        )}

        {/* Mobile Floating Controls */}
        {isMobile && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              right: 16,
              zIndex: 1000,
              display: 'flex',
              gap: 1,
            }}
          >
            <Paper
              sx={{
                p: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexGrow: 1,
              }}
            >
              <Chip 
                label={`${stats.total} reports`} 
                size="small" 
                color="primary"
                sx={{ fontWeight: 600 }}
              />
              <Chip 
                label={`${stats.open} open`} 
                size="small" 
                color="error"
                variant="outlined"
              />
            </Paper>
            <Button
              variant="contained"
              onClick={() => setFilterDrawerOpen(true)}
              sx={{ minWidth: 48, px: 0 }}
            >
              <FilterList />
            </Button>
          </Box>
        )}

        {/* Map Controls */}
        <Box
          sx={{
            position: 'absolute',
            right: 16,
            top: isMobile ? 80 : 16,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Tooltip title="My Location" placement="left">
              <IconButton onClick={handleLocateMe} sx={{ borderRadius: 0 }}>
                <MyLocation />
              </IconButton>
            </Tooltip>
          </Paper>
        </Box>

        {/* Mobile Report Button */}
        {isMobile && (
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => navigate(user ? '/report' : '/login')}
            sx={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              borderRadius: 4,
              px: 4,
              py: 1.5,
              boxShadow: '0 8px 24px rgba(5, 150, 105, 0.3)',
            }}
          >
            Report Issue
          </Button>
        )}

        <MapContainer
          center={center}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          <MapController center={center} focusReport={focusReport} />
          
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={60}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
            iconCreateFunction={(cluster) => {
              const count = cluster.getChildCount();
              return L.divIcon({
                html: `<div style="
                  background: linear-gradient(135deg, #059669 0%, #047857 100%);
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: 700;
                  font-size: 14px;
                  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
                  border: 3px solid white;
                ">${count}</div>`,
                className: 'custom-cluster',
                iconSize: [40, 40],
              });
            }}
          >
            {reports.map((report) => (
              <Marker
                key={report._id}
                position={[
                  report.location.coordinates[1],
                  report.location.coordinates[0],
                ]}
                icon={createCustomIcon(report.severity, report.status)}
                eventHandlers={{
                  click: () => setSelectedReport(report),
                }}
              >
                <Popup maxWidth={320}>
                  <Box sx={{ minWidth: 260, p: 1 }}>
                    {report.images && report.images.length > 0 && (
                      <Box
                        sx={{
                          width: '100%',
                          height: 140,
                          borderRadius: 2,
                          overflow: 'hidden',
                          mb: 2,
                        }}
                      >
                        <img
                          src={`${API_BASE}${report.images[0].url}`}
                          alt={report.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </Box>
                    )}
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      {report.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={report.category}
                        size="small"
                        sx={{ 
                          textTransform: 'capitalize',
                          bgcolor: alpha('#059669', 0.1),
                          color: 'primary.dark',
                        }}
                      />
                      <Chip
                        label={report.status.replace('-', ' ')}
                        size="small"
                        color={statusConfig[report.status]?.color || 'default'}
                        sx={{ textTransform: 'capitalize' }}
                      />
                      <Chip
                        label={report.severity}
                        size="small"
                        variant="outlined"
                        color={
                          report.severity === 'high' ? 'error' :
                          report.severity === 'medium' ? 'warning' : 'success'
                        }
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>
                    {report.address && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 1 }}>
                        <LocationOn fontSize="small" color="action" sx={{ mt: 0.2 }} />
                        <Typography variant="body2" color="text.secondary">
                          {report.address}
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Reported {new Date(report.createdAt).toLocaleDateString()}
                    </Typography>
                    {user && (
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={() => navigate(`/report/${report._id}`)}
                      >
                        View Details
                      </Button>
                    )}
                  </Box>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </Box>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="bottom"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '70vh',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>Filters</Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <FilterContent />
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
              Severity Legend
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {[
                { label: 'High', color: '#ef4444' },
                { label: 'Medium', color: '#f59e0b' },
                { label: 'Low', color: '#10b981' },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      bgcolor: item.color,
                    }}
                  />
                  <Typography variant="body2">{item.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default MapView;
