import { useState, useEffect } from 'react';
import api from '@/services/api';
import WasteDetectionPanel from '@/components/WasteDetectionPanel';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  ImageList,
  ImageListItem,
  Card,
  CardContent,
  alpha,
  LinearProgress,
  Avatar,
  Tooltip,
  Tabs,
  Tab,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  Close,
  CloudUpload,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Schedule,
  Assignment,
  Search,
  Refresh,
  FilterList,
  MoreVert,
  LocationOn,
  CalendarToday,
  Person,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = {
  open: '#ef4444',
  'in-progress': '#f59e0b',
  resolved: '#10b981',
};

const CATEGORY_COLORS = {
  plastic: '#3b82f6',
  organic: '#22c55e',
  hazardous: '#ef4444',
  electronic: '#8b5cf6',
  construction: '#f97316',
  other: '#6b7280',
};

const statusConfig = {
  open: { color: 'error', icon: Warning, label: 'Open', bgColor: '#fef2f2' },
  'in-progress': { color: 'warning', icon: Schedule, label: 'In Progress', bgColor: '#fffbeb' },
  resolved: { color: 'success', icon: CheckCircle, label: 'Resolved', bgColor: '#f0fdf4' },
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionImages, setResolutionImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('resolutionNotes', resolutionNotes);

      resolutionImages.forEach((file) => {
        formData.append('resolutionImages', file);
      });

      await api.put(`/reports/${selectedReport._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDialogOpen(false);
      setResolutionImages([]);
      setImagePreview([]);
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setResolutionImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  const removeImage = (index) => {
    const newImages = [...resolutionImages];
    newImages.splice(index, 1);
    setResolutionImages(newImages);
    const newPreviews = [...imagePreview];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setImagePreview(newPreviews);
  };

  const openUpdateDialog = (report) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setResolutionNotes('');
    setResolutionImages([]);
    setImagePreview([]);
    setDialogOpen(true);
  };

  const openViewDialog = (report) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={48} />
        <Typography color="text.secondary">Loading dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchStats}>Retry</Button>
        }>{error}</Alert>
      </Container>
    );
  }

  const statusData = [
    { name: 'Open', value: stats.statusStats.open, color: COLORS.open },
    { name: 'In Progress', value: stats.statusStats['in-progress'], color: COLORS['in-progress'] },
    { name: 'Resolved', value: stats.statusStats.resolved, color: COLORS.resolved },
  ];

  const categoryData = Object.entries(stats.categoryStats).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: value,
    fill: CATEGORY_COLORS[name] || '#6b7280',
  }));

  const resolutionRate = stats.totalReports > 0
    ? Math.round((stats.statusStats.resolved / stats.totalReports) * 100)
    : 0;

  const filteredReports = stats.recentReports?.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: 'calc(100vh - 72px)' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Authority Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor and manage waste reports across your jurisdiction
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchStats}
            sx={{ borderColor: 'grey.300' }}
          >
            Refresh Data
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              title: 'Total Reports',
              value: stats.totalReports,
              icon: Assignment,
              color: '#3b82f6',
              bgColor: '#eff6ff',
              change: '+12%',
              trend: 'up'
            },
            {
              title: 'Open Issues',
              value: stats.statusStats.open,
              icon: Warning,
              color: '#ef4444',
              bgColor: '#fef2f2',
              change: '-5%',
              trend: 'down'
            },
            {
              title: 'In Progress',
              value: stats.statusStats['in-progress'],
              icon: Schedule,
              color: '#f59e0b',
              bgColor: '#fffbeb',
              change: '+8%',
              trend: 'up'
            },
            {
              title: 'Resolved',
              value: stats.statusStats.resolved,
              icon: CheckCircle,
              color: '#10b981',
              bgColor: '#f0fdf4',
              change: '+23%',
              trend: 'up'
            },
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: stat.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <stat.icon sx={{ color: stat.color, fontSize: 24 }} />
                    </Box>
                    <Chip
                      size="small"
                      icon={stat.trend === 'up' ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                      label={stat.change}
                      sx={{
                        bgcolor: stat.trend === 'up' ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
                        color: stat.trend === 'up' ? '#059669' : '#dc2626',
                        fontWeight: 600,
                        '& .MuiChip-icon': { color: 'inherit' },
                      }}
                    />
                  </Box>
                  <Typography variant="h3" fontWeight={700} sx={{ mb: 0.5 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Status Distribution */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Status Distribution
                </Typography>
                <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                  {statusData.map((item) => (
                    <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                      <Typography variant="body2" color="text.secondary">
                        {item.name}: {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Category Breakdown */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Reports by Category
                </Typography>
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <RechartsTooltip />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Resolution Rate */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Resolution Rate
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                    <CircularProgress
                      variant="determinate"
                      value={resolutionRate}
                      size={160}
                      thickness={8}
                      sx={{ color: 'primary.main' }}
                    />
                    <CircularProgress
                      variant="determinate"
                      value={100}
                      size={160}
                      thickness={8}
                      sx={{
                        color: 'grey.200',
                        position: 'absolute',
                        left: 0,
                        zIndex: -1,
                      }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h3" fontWeight={700}>
                        {resolutionRate}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Resolved
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    {stats.statusStats.resolved} of {stats.totalReports} reports resolved
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Reports Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'grey.200' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Reports
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ width: 250 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="open">Open</MenuItem>
                      <MenuItem value="in-progress">In Progress</MenuItem>
                      <MenuItem value="resolved">Resolved</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Report</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reporter</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReports.map((report) => {
                    const StatusIcon = statusConfig[report.status]?.icon || Schedule;
                    return (
                      <TableRow key={report._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {report.images && report.images.length > 0 ? (
                              <Avatar
                                variant="rounded"
                                src={`${API_BASE}${report.images[0].url}`}
                                sx={{ width: 48, height: 48 }}
                              />
                            ) : (
                              <Avatar variant="rounded" sx={{ width: 48, height: 48, bgcolor: 'grey.200' }}>
                                <Assignment color="action" />
                              </Avatar>
                            )}
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {report.title}
                              </Typography>
                              {report.address && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LocationOn fontSize="inherit" /> {report.address.substring(0, 30)}...
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={report.category}
                            size="small"
                            sx={{
                              textTransform: 'capitalize',
                              bgcolor: alpha(CATEGORY_COLORS[report.category] || '#6b7280', 0.1),
                              color: CATEGORY_COLORS[report.category] || '#6b7280',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={report.severity}
                            size="small"
                            color={
                              report.severity === 'high' ? 'error' :
                                report.severity === 'medium' ? 'warning' : 'success'
                            }
                            sx={{ textTransform: 'capitalize', fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<StatusIcon fontSize="small" />}
                            label={statusConfig[report.status]?.label || report.status}
                            size="small"
                            color={statusConfig[report.status]?.color || 'default'}
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                              {report.userId?.name?.charAt(0) || 'U'}
                            </Avatar>
                            <Typography variant="body2">
                              {report.userId?.name || 'Unknown'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => openViewDialog(report)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openUpdateDialog(report)}
                            sx={{ ml: 1 }}
                          >
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>Report Details</Typography>
            <IconButton onClick={() => setViewDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedReport && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h5" fontWeight={600}>
                      {selectedReport.title}
                    </Typography>
                    <Chip
                      label={selectedReport.status.replace('-', ' ')}
                      color={statusConfig[selectedReport.status]?.color || 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Category</Typography>
                  <Chip label={selectedReport.category} sx={{ textTransform: 'capitalize' }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Severity</Typography>
                  <Chip
                    label={selectedReport.severity}
                    color={selectedReport.severity === 'high' ? 'error' : selectedReport.severity === 'medium' ? 'warning' : 'success'}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
                  <Typography variant="body1">{selectedReport.description}</Typography>
                </Grid>

                {selectedReport.address && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Location</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn color="action" fontSize="small" />
                      <Typography variant="body1">{selectedReport.address}</Typography>
                    </Box>
                  </Grid>
                )}

                {selectedReport.images && selectedReport.images.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Uploaded Images</Typography>
                    <ImageList cols={3} rowHeight={180} gap={12}>
                      {selectedReport.images.map((image, index) => (
                        <ImageListItem key={index}>
                          <img
                            src={`${API_BASE}${image.url}`}
                            alt={`Report image ${index + 1}`}
                            loading="lazy"
                            style={{ borderRadius: 12, cursor: 'pointer', height: '100%', objectFit: 'cover' }}
                            onClick={() => window.open(`${API_BASE}${image.url}`, '_blank')}
                          />
                        </ImageListItem>
                      ))}
                    </ImageList>
                  </Grid>
                )}

                {/* AI Waste Detection Panel */}
                {selectedReport.images && selectedReport.images.length > 0 && (
                  <Grid item xs={12}>
                    <WasteDetectionPanel
                      report={selectedReport}
                      onAnalysisComplete={(data) => {
                        setSelectedReport(data.report);
                        fetchStats();
                      }}
                    />
                  </Grid>
                )}

                {selectedReport.resolutionNotes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Resolution Notes</Typography>
                    <Typography variant="body1">{selectedReport.resolutionNotes}</Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setViewDialogOpen(false)} variant="outlined">Close</Button>
            <Button
              variant="contained"
              onClick={() => {
                setViewDialogOpen(false);
                openUpdateDialog(selectedReport);
              }}
            >
              Update Status
            </Button>
          </DialogActions>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>Update Report Status</Typography>
            <IconButton onClick={() => setDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="subtitle1" fontWeight={500} gutterBottom>
              {selectedReport?.title}
            </Typography>

            {selectedReport?.images && selectedReport.images.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary">Uploaded Images</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, overflowX: 'auto', pb: 1 }}>
                  {selectedReport.images.map((image, index) => (
                    <img
                      key={index}
                      src={`${API_BASE}${image.url}`}
                      alt={`Report ${index + 1}`}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                      onClick={() => window.open(`${API_BASE}${image.url}`, '_blank')}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={newStatus}
                label="Status"
                onChange={(e) => setNewStatus(e.target.value)}
              >
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

            {newStatus === 'resolved' && (
              <>
                <TextField
                  fullWidth
                  label="Resolution Notes"
                  multiline
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how the issue was resolved..."
                  sx={{ mb: 2 }}
                />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Upload Cleaned Area Images (Optional)
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    sx={{ mb: 2 }}
                  >
                    Select Images
                    <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
                  </Button>

                  {imagePreview.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {imagePreview.map((preview, index) => (
                        <Box key={index} sx={{ position: 'relative' }}>
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              bgcolor: 'background.paper',
                              boxShadow: 1,
                              '&:hover': { bgcolor: 'error.light', color: 'white' },
                            }}
                            onClick={() => removeImage(index)}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDialogOpen(false)} variant="outlined">Cancel</Button>
            <Button variant="contained" onClick={handleUpdateStatus} disabled={updating}>
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Dashboard;
