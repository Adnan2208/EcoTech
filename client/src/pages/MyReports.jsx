import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Pagination,
  Button,
  alpha,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Delete,
  Visibility,
  Add,
  Assignment,
  Warning,
  CheckCircle,
  Schedule,
  LocationOn,
  CalendarToday,
  Search,
  FilterList,
} from '@mui/icons-material';

const statusConfig = {
  open: { color: 'error', icon: Warning, label: 'Open', bgColor: '#fef2f2' },
  'in-progress': { color: 'warning', icon: Schedule, label: 'In Progress', bgColor: '#fffbeb' },
  resolved: { color: 'success', icon: CheckCircle, label: 'Resolved', bgColor: '#f0fdf4' },
};

const MyReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const fetchReports = async () => {
    try {
      const response = await api.get(`/reports/user/my-reports?page=${page}&limit=9`);
      setReports(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page]);

  const handleDelete = async () => {
    if (!reportToDelete) return;
    setDeleting(true);

    try {
      await api.delete(`/reports/${reportToDelete._id}`);
      setReports(reports.filter((r) => r._id !== reportToDelete._id));
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete report');
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === 'open').length,
    inProgress: reports.filter((r) => r.status === 'in-progress').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={48} />
        <Typography color="text.secondary">Loading your reports...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: 'calc(100vh - 72px)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              My Reports
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track the status of your submitted waste reports
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/report')}
          >
            New Report
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: 'Total', value: stats.total, color: 'primary.main', bgColor: '#eff6ff' },
            { label: 'Open', value: stats.open, color: 'error.main', bgColor: '#fef2f2' },
            { label: 'In Progress', value: stats.inProgress, color: 'warning.main', bgColor: '#fffbeb' },
            { label: 'Resolved', value: stats.resolved, color: 'success.main', bgColor: '#f0fdf4' },
          ].map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: stat.bgColor }}>
                <Typography variant="h4" fontWeight={700} color={stat.color}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
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
        </Paper>

        {/* Reports Grid */}
        {filteredReports.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Assignment sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {reports.length === 0 ? "You haven't submitted any reports yet" : 'No reports match your filters'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {reports.length === 0 ? 'Start making a difference by reporting waste in your area' : 'Try adjusting your search or filters'}
            </Typography>
            {reports.length === 0 && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/report')}
              >
                Submit Your First Report
              </Button>
            )}
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              {filteredReports.map((report) => {
                const StatusIcon = statusConfig[report.status]?.icon || Schedule;
                return (
                  <Grid item xs={12} sm={6} md={4} key={report._id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {report.images && report.images.length > 0 ? (
                        <CardMedia
                          component="img"
                          height="180"
                          image={`${API_BASE}${report.images[0].url}`}
                          alt={report.title}
                          sx={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: 180,
                            bgcolor: 'grey.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Assignment sx={{ fontSize: 48, color: 'grey.400' }} />
                        </Box>
                      )}
                      
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" fontWeight={600} noWrap sx={{ flexGrow: 1 }}>
                            {report.title}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
                          <Chip
                            icon={<StatusIcon fontSize="small" />}
                            label={statusConfig[report.status]?.label || report.status}
                            size="small"
                            color={statusConfig[report.status]?.color || 'default'}
                          />
                          <Chip
                            label={report.category}
                            size="small"
                            variant="outlined"
                            sx={{ textTransform: 'capitalize' }}
                          />
                          <Chip
                            label={report.severity}
                            size="small"
                            color={
                              report.severity === 'high' ? 'error' :
                              report.severity === 'medium' ? 'warning' : 'success'
                            }
                            variant="outlined"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </Box>

                        {report.address && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {report.address}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </CardContent>

                      <CardActions sx={{ px: 2, pb: 2 }}>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => navigate(`/report/${report._id}`)}
                        >
                          View Details
                        </Button>
                        {report.status === 'open' && (
                          <Tooltip title="Delete Report">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => confirmDelete(report)}
                              sx={{ ml: 'auto' }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Report?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{reportToDelete?.title}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default MyReports;
