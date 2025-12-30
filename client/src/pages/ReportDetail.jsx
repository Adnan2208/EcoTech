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
} from '@mui/material';
import { ArrowBack, LocationOn, CheckCircle } from '@mui/icons-material';

const statusColors = {
  open: 'error',
  'in-progress': 'warning',
  resolved: 'success',
};

const severityColors = {
  low: 'success',
  medium: 'warning',
  high: 'error',
};

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
        Back
      </Button>

      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {report.title}
          </Typography>
          <Chip
            label={report.status.toUpperCase()}
            color={statusColors[report.status]}
            size="medium"
          />
        </Box>

        <Grid container spacing={3}>
          {/* Basic Info */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Category
            </Typography>
            <Chip label={report.category} sx={{ mt: 0.5 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Severity
            </Typography>
            <Chip
              label={report.severity}
              color={severityColors[report.severity]}
              sx={{ mt: 0.5 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
              {report.description}
            </Typography>
          </Grid>

          {/* Location */}
          {report.address && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Location
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {report.address}
              </Typography>
            </Grid>
          )}

          {/* Report Images */}
          {report.images && report.images.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Report Images
              </Typography>
              <ImageList cols={3} rowHeight={200} gap={12}>
                {report.images.map((image, index) => (
                  <ImageListItem key={index}>
                    <img
                      src={`${API_BASE}${image.url}`}
                      alt={`Report image ${index + 1}`}
                      loading="lazy"
                      style={{
                        borderRadius: 8,
                        cursor: 'pointer',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onClick={() => window.open(`${API_BASE}${image.url}`, '_blank')}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Grid>
          )}

          {/* Resolution Section - Only for resolved reports */}
          {report.status === 'resolved' && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ bgcolor: 'success.light', p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: 'success.dark' }}>
                  <CheckCircle sx={{ mr: 1 }} />
                  Issue Resolved
                </Typography>
                {report.resolvedAt && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Resolved on {new Date(report.resolvedAt).toLocaleDateString()} at{' '}
                    {new Date(report.resolvedAt).toLocaleTimeString()}
                  </Typography>
                )}
                {report.resolvedBy && (
                  <Typography variant="body2" color="text.secondary">
                    By: {report.resolvedBy.name}
                  </Typography>
                )}
              </Box>

              {/* Resolution Notes */}
              {report.resolutionNotes && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Resolution Notes
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {report.resolutionNotes}
                  </Typography>
                </Box>
              )}

              {/* Cleaned Area Images */}
              {report.resolutionImages && report.resolutionImages.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: 'success.main' }}>
                    Cleaned Area Images
                  </Typography>
                  <ImageList cols={3} rowHeight={200} gap={12}>
                    {report.resolutionImages.map((image, index) => (
                      <ImageListItem key={index}>
                        <img
                          src={`${API_BASE}${image.url}`}
                          alt={`Cleaned area ${index + 1}`}
                          loading="lazy"
                          style={{
                            borderRadius: 8,
                            cursor: 'pointer',
                            height: '100%',
                            objectFit: 'cover',
                            border: '3px solid #4caf50',
                          }}
                          onClick={() => window.open(`${API_BASE}${image.url}`, '_blank')}
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Box>
              )}
            </Grid>
          )}

          {/* Dates */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary">
              Reported on {new Date(report.createdAt).toLocaleDateString()} at{' '}
              {new Date(report.createdAt).toLocaleTimeString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ReportDetail;
