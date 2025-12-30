import { useState, useEffect } from 'react';
import api from '@/services/api';
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
} from '@mui/material';
import { Visibility, Close, CloudUpload } from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#f44336', '#ff9800', '#4caf50'];
const CATEGORY_COLORS = {
  plastic: '#2196f3',
  organic: '#4caf50',
  hazardous: '#f44336',
  electronic: '#9c27b0',
  construction: '#ff9800',
  other: '#607d8b',
};

const statusColors = {
  open: 'error',
  'in-progress': 'warning',
  resolved: 'success',
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
      
      // Add resolution images if any
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
    
    // Create preview URLs
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const statusData = [
    { name: 'Open', value: stats.statusStats.open },
    { name: 'In Progress', value: stats.statusStats['in-progress'] },
    { name: 'Resolved', value: stats.statusStats.resolved },
  ];

  const categoryData = Object.entries(stats.categoryStats).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: value,
  }));

  const severityData = [
    { name: 'Low', value: stats.severityStats.low, fill: '#4caf50' },
    { name: 'Medium', value: stats.severityStats.medium, fill: '#ff9800' },
    { name: 'High', value: stats.severityStats.high, fill: '#f44336' },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Authority Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e3f2fd' }}>
            <Typography variant="h3" color="primary">
              {stats.totalReports}
            </Typography>
            <Typography color="text.secondary">Total Reports</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#ffebee' }}>
            <Typography variant="h3" color="error">
              {stats.statusStats.open}
            </Typography>
            <Typography color="text.secondary">Open</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e8f5e9' }}>
            <Typography variant="h3" color="success.main">
              {stats.resolutionRate}%
            </Typography>
            <Typography color="text.secondary">Resolution Rate</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fff3e0' }}>
            <Typography variant="h3" color="warning.main">
              {stats.avgResolutionHours}h
            </Typography>
            <Typography color="text.secondary">Avg Resolution Time</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Status Pie Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Reports by Status
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Category Bar Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Reports by Category
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2e7d32" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Severity Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Reports by Severity
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={severityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Trend Line Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Reports Trend (Last 7 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2e7d32"
                  strokeWidth={2}
                  name="Reports"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Reports Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Reports
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Reporter</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.recentReports.map((report) => (
                <TableRow key={report._id}>
                  <TableCell>{report.title}</TableCell>
                  <TableCell>{report.userId?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Chip label={report.category} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.severity}
                      size="small"
                      color={
                        report.severity === 'high'
                          ? 'error'
                          : report.severity === 'medium'
                          ? 'warning'
                          : 'success'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.status}
                      size="small"
                      color={statusColors[report.status]}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => openViewDialog(report)}
                        title="View Details"
                      >
                        <Visibility />
                      </IconButton>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => openUpdateDialog(report)}
                      >
                        Update
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* View Report Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Report Details</Typography>
          <IconButton onClick={() => setViewDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedReport && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom>
                  {selectedReport.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={selectedReport.category} />
                  <Chip 
                    label={selectedReport.severity} 
                    color={
                      selectedReport.severity === 'high' ? 'error' :
                      selectedReport.severity === 'medium' ? 'warning' : 'success'
                    }
                  />
                  <Chip 
                    label={selectedReport.status} 
                    color={statusColors[selectedReport.status]}
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {selectedReport.description}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Reported By
                </Typography>
                <Typography variant="body1">
                  {selectedReport.userId?.name || 'Unknown'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Reported On
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedReport.createdAt).toLocaleString()}
                </Typography>
              </Grid>

              {selectedReport.address && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Address
                  </Typography>
                  <Typography variant="body1">
                    {selectedReport.address}
                  </Typography>
                </Grid>
              )}

              {selectedReport.images && selectedReport.images.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Uploaded Images ({selectedReport.images.length})
                  </Typography>
                  <ImageList cols={3} gap={8}>
                    {selectedReport.images.map((image, index) => (
                      <ImageListItem key={index}>
                        <img
                          src={`${API_BASE}${image.url}`}
                          alt={`Report image ${index + 1}`}
                          loading="lazy"
                          style={{ 
                            borderRadius: 8, 
                            cursor: 'pointer',
                            maxHeight: 200,
                            objectFit: 'cover'
                          }}
                          onClick={() => window.open(`${API_BASE}${image.url}`, '_blank')}
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Grid>
              )}

              {selectedReport.resolutionNotes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Resolution Notes
                  </Typography>
                  <Typography variant="body1">
                    {selectedReport.resolutionNotes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
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
        <DialogTitle>Update Report Status</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            {selectedReport?.title}
          </Typography>
          
          {/* Show images in update dialog too */}
          {selectedReport?.images && selectedReport.images.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Uploaded Images
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, overflowX: 'auto' }}>
                {selectedReport.images.map((image, index) => (
                  <img
                    key={index}
                    src={`${API_BASE}${image.url}`}
                    alt={`Report ${index + 1}`}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                    onClick={() => window.open(`${API_BASE}${image.url}`, '_blank')}
                  />
                ))}
              </Box>
            </Box>
          )}

          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
          {newStatus === 'resolved' && (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Resolution Notes"
                multiline
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how the issue was resolved..."
              />
              
              {/* Resolution Images Upload */}
              <Box sx={{ mt: 2 }}>
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
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
                
                {imagePreview.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {imagePreview.map((preview, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 4,
                          }}
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
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdateStatus}
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
