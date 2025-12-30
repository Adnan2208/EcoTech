import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  ImageList,
  ImageListItem,
  Card,
  CardContent,
  alpha,
  Avatar,
  IconButton,
  Dialog,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  CheckCircle,
  Warning,
  Schedule,
  CalendarToday,
  Person,
  Category,
  PriorityHigh,
  Close,
  ZoomIn,
} from '@mui/icons-material';

const statusConfig = {
  open: { color: 'error', icon: Warning, label: 'Open', bgColor: '#fef2f2', borderColor: '#fecaca' },
  'in-progress': { color: 'warning', icon: Schedule, label: 'In Progress', bgColor: '#fffbeb', borderColor: '#fde68a' },
  resolved: { color: 'success', icon: CheckCircle, label: 'Resolved', bgColor: '#f0fdf4', borderColor: '#bbf7d0' },
};

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await api.get(`/reports/${id}`);
        setReport(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const openImageDialog = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={48} />
        <Typography color="text.secondary">Loading report details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  const StatusIcon = statusConfig[report.status]?.icon || Schedule;

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: 'calc(100vh - 72px)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Back to Reports
        </Button>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
              {/* Header Image */}
              {report.images && report.images.length > 0 && (
                <Box
                  sx={{
                    height: 300,
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={() => openImageDialog(`${API_BASE}${report.images[0].url}`)}
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
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <ZoomIn fontSize="small" />
                    <Typography variant="body2">Click to enlarge</Typography>
                  </Box>
                </Box>
              )}

              <Box sx={{ p: 4 }}>
                {/* Title and Status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h4" fontWeight={700}>
                    {report.title}
                  </Typography>
                  <Chip
                    icon={<StatusIcon />}
                    label={statusConfig[report.status]?.label || report.status}
                    color={statusConfig[report.status]?.color || 'default'}
                    size="medium"
                    sx={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 600,
                      py: 2.5,
                      px: 1,
                    }}
                  />
                </Box>

                {/* Tags */}
                <Box sx={{ display: 'flex', gap: 1, mb: 4, flexWrap: 'wrap' }}>
                  <Chip
                    label={report.category}
                    sx={{ textTransform: 'capitalize' }}
                  />
                  <Chip
                    label={`${report.severity} severity`}
                    color={
                      report.severity === 'high' ? 'error' :
                      report.severity === 'medium' ? 'warning' : 'success'
                    }
                    variant="outlined"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>

                {/* Description */}
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
                  {report.description}
                </Typography>

                {/* Location */}
                {report.address && (
                  <>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Location
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 4 }}>
                      <LocationOn color="primary" />
                      <Typography variant="body1" color="text.secondary">
                        {report.address}
                      </Typography>
                    </Box>
                  </>
                )}

                {/* All Images */}
                {report.images && report.images.length > 1 && (
                  <>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      All Images ({report.images.length})
                    </Typography>
                    <ImageList cols={3} rowHeight={160} gap={12} sx={{ mb: 4 }}>
                      {report.images.map((image, index) => (
                        <ImageListItem 
                          key={index}
                          sx={{ 
                            cursor: 'pointer',
                            borderRadius: 2,
                            overflow: 'hidden',
                            '&:hover': { opacity: 0.9 },
                          }}
                          onClick={() => openImageDialog(`${API_BASE}${image.url}`)}
                        >
                          <img
                            src={`${API_BASE}${image.url}`}
                            alt={`Report image ${index + 1}`}
                            loading="lazy"
                            style={{
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </ImageListItem>
                      ))}
                    </ImageList>
                  </>
                )}

                {/* Resolution Section */}
                {report.status === 'resolved' && (
                  <Box
                    sx={{
                      bgcolor: statusConfig.resolved.bgColor,
                      border: '1px solid',
                      borderColor: statusConfig.resolved.borderColor,
                      borderRadius: 3,
                      p: 3,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CheckCircle color="success" />
                      <Typography variant="h6" fontWeight={600} color="success.dark">
                        Issue Resolved
                      </Typography>
                    </Box>

                    {report.resolvedAt && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Resolved on {new Date(report.resolvedAt).toLocaleDateString()} at {new Date(report.resolvedAt).toLocaleTimeString()}
                      </Typography>
                    )}

                    {report.resolvedBy && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'success.main' }}>
                          {report.resolvedBy.name?.charAt(0) || 'A'}
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          Resolved by {report.resolvedBy.name}
                        </Typography>
                      </Box>
                    )}

                    {report.resolutionNotes && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          Resolution Notes
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {report.resolutionNotes}
                        </Typography>
                      </>
                    )}

                    {/* Cleaned Area Images */}
                    {report.resolutionImages && report.resolutionImages.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom color="success.dark">
                          Cleaned Area Photos
                        </Typography>
                        <ImageList cols={3} rowHeight={140} gap={8}>
                          {report.resolutionImages.map((image, index) => (
                            <ImageListItem 
                              key={index}
                              sx={{ 
                                cursor: 'pointer',
                                borderRadius: 2,
                                overflow: 'hidden',
                                border: '3px solid',
                                borderColor: 'success.main',
                              }}
                              onClick={() => openImageDialog(`${API_BASE}${image.url}`)}
                            >
                              <img
                                src={`${API_BASE}${image.url}`}
                                alt={`Cleaned area ${index + 1}`}
                                loading="lazy"
                                style={{
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            </ImageListItem>
                          ))}
                        </ImageList>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Status Card */}
            <Card
              sx={{
                mb: 3,
                bgcolor: statusConfig[report.status]?.bgColor || 'grey.50',
                border: '1px solid',
                borderColor: statusConfig[report.status]?.borderColor || 'grey.200',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <StatusIcon color={statusConfig[report.status]?.color} />
                  <Typography variant="h6" fontWeight={600}>
                    Status: {statusConfig[report.status]?.label || report.status}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {report.status === 'open' && 'This issue is awaiting review by authorities.'}
                  {report.status === 'in-progress' && 'Authorities are currently working on this issue.'}
                  {report.status === 'resolved' && 'This issue has been successfully resolved!'}
                </Typography>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Report Details
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CalendarToday fontSize="small" color="action" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Reported On</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {new Date(report.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Category fontSize="small" color="action" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Category</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                        {report.category}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: report.severity === 'high' ? alpha('#ef4444', 0.1) :
                                report.severity === 'medium' ? alpha('#f59e0b', 0.1) : alpha('#10b981', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PriorityHigh 
                        fontSize="small" 
                        sx={{ 
                          color: report.severity === 'high' ? 'error.main' :
                                report.severity === 'medium' ? 'warning.main' : 'success.main' 
                        }} 
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Severity</Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={500} 
                        sx={{ 
                          textTransform: 'capitalize',
                          color: report.severity === 'high' ? 'error.main' :
                                report.severity === 'medium' ? 'warning.main' : 'success.main'
                        }}
                      >
                        {report.severity}
                      </Typography>
                    </Box>
                  </Box>

                  {report.userId && (
                    <>
                      <Divider />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                          {report.userId.name?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Reported By</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {report.userId.name || 'Anonymous'}
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Location Card */}
            {report.location && (
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Coordinates
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      {report.location.coordinates[1].toFixed(6)}, {report.location.coordinates[0].toFixed(6)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* Image Dialog */}
        <Dialog
          open={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={() => setImageDialogOpen(false)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              }}
            >
              <Close />
            </IconButton>
            <img
              src={selectedImage}
              alt="Full size"
              style={{
                width: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
              }}
            />
          </Box>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ReportDetail;
