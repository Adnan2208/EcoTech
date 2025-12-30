import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '@/services/api';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Chip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  alpha,
  FormHelperText,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  MyLocation,
  Send,
  ArrowForward,
  ArrowBack,
  CheckCircle,
  Image,
  LocationOn,
  Description,
  Category,
  Warning,
} from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} icon={customIcon} /> : null;
};

const steps = ['Details', 'Location', 'Images', 'Review'];

const categories = [
  { value: 'plastic', label: 'Plastic Waste', emoji: '🥤', description: 'Bottles, bags, packaging' },
  { value: 'organic', label: 'Organic Waste', emoji: '🌿', description: 'Food scraps, garden waste' },
  { value: 'hazardous', label: 'Hazardous Waste', emoji: '☢️', description: 'Chemicals, batteries' },
  { value: 'electronic', label: 'Electronic Waste', emoji: '📱', description: 'Gadgets, appliances' },
  { value: 'construction', label: 'Construction Debris', emoji: '🏗️', description: 'Rubble, materials' },
  { value: 'other', label: 'Other', emoji: '📦', description: 'Mixed or unclassified' },
];

const severityLevels = [
  { value: 'low', label: 'Low', color: 'success', description: 'Minor issue, small amount' },
  { value: 'medium', label: 'Medium', color: 'warning', description: 'Moderate issue, needs attention' },
  { value: 'high', label: 'High', color: 'error', description: 'Urgent, significant hazard' },
];

const ReportForm = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    severity: 'medium',
    address: '',
  });

  const [position, setPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    const newImages = [...images, ...acceptedFiles].slice(0, 5);
    setImages(newImages);
    const newPreviews = newImages.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  }, [images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024,
  });

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    URL.revokeObjectURL(previews[index]);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const getLocation = () => {
    setLocationLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPos);
        setMapCenter(newPos);
        setLocationLoading(false);
      },
      () => {
        setError('Unable to get your location. Please click on the map.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return formData.title.trim() && formData.description.trim() && formData.category;
      case 1:
        return position !== null;
      case 2:
        return true; // Images are optional
      case 3:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
      setError('');
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('severity', formData.severity);
      submitData.append('address', formData.address);
      submitData.append('latitude', position[0]);
      submitData.append('longitude', position[1]);

      images.forEach((image) => {
        submitData.append('images', image);
      });

      await api.post('/reports', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('Report submitted successfully!');
      setTimeout(() => navigate('/my-reports'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Describe the Issue
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Provide details about the waste issue you've found
            </Typography>

            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Brief title describing the issue"
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              multiline
              rows={4}
              placeholder="Describe the waste issue in detail..."
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Category *
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 3 }}>
              {categories.map((cat) => (
                <Grid item xs={6} sm={4} key={cat.value}>
                  <Paper
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      textAlign: 'center',
                      border: '2px solid',
                      borderColor: formData.category === cat.value ? 'primary.main' : 'grey.200',
                      bgcolor: formData.category === cat.value ? alpha('#059669', 0.05) : 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Typography variant="h5" sx={{ mb: 0.5 }}>{cat.emoji}</Typography>
                    <Typography variant="body2" fontWeight={600}>{cat.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{cat.description}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Severity Level
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {severityLevels.map((level) => (
                <Chip
                  key={level.value}
                  label={level.label}
                  color={formData.severity === level.value ? level.color : 'default'}
                  variant={formData.severity === level.value ? 'filled' : 'outlined'}
                  onClick={() => setFormData({ ...formData, severity: level.value })}
                  sx={{ 
                    px: 2, 
                    py: 2.5,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                />
              ))}
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Pin the Location
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Click on the map to mark the exact location of the issue
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={locationLoading ? <CircularProgress size={18} /> : <MyLocation />}
                onClick={getLocation}
                disabled={locationLoading}
              >
                Use My Location
              </Button>
              {position && (
                <Chip
                  icon={<CheckCircle />}
                  label="Location selected"
                  color="success"
                  variant="outlined"
                />
              )}
            </Box>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
              <Box sx={{ height: 350 }}>
                <MapContainer
                  center={mapCenter}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  <LocationPicker position={position} setPosition={setPosition} />
                </MapContainer>
              </Box>
            </Paper>

            <TextField
              fullWidth
              label="Address (Optional)"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter a nearby landmark or address"
              helperText="This helps authorities find the location faster"
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Upload Photos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add up to 5 photos to help illustrate the issue (optional)
            </Typography>

            <Paper
              {...getRootProps()}
              sx={{
                p: 4,
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                bgcolor: isDragActive ? alpha('#059669', 0.05) : 'grey.50',
                borderRadius: 3,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                mb: 3,
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: alpha('#059669', 0.05),
                },
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to browse • Max 5 images, 5MB each
              </Typography>
            </Paper>

            {previews.length > 0 && (
              <Grid container spacing={2}>
                {previews.map((preview, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Box sx={{ position: 'relative' }}>
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        style={{
                          width: '100%',
                          height: 140,
                          objectFit: 'cover',
                          borderRadius: 12,
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeImage(index)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'background.paper',
                          boxShadow: 2,
                          '&:hover': { bgcolor: 'error.light', color: 'white' },
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Review Your Report
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please review all details before submitting
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Description color="primary" />
                      <Typography variant="subtitle2" color="text.secondary">Details</Typography>
                    </Box>
                    <Typography variant="h6" gutterBottom>{formData.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{formData.description}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Chip
                        label={categories.find(c => c.value === formData.category)?.label || formData.category}
                        size="small"
                      />
                      <Chip
                        label={formData.severity}
                        size="small"
                        color={
                          formData.severity === 'high' ? 'error' :
                          formData.severity === 'medium' ? 'warning' : 'success'
                        }
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <LocationOn color="primary" />
                      <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                    </Box>
                    {position && (
                      <Typography variant="body2">
                        {position[0].toFixed(6)}, {position[1].toFixed(6)}
                      </Typography>
                    )}
                    {formData.address && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {formData.address}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Image color="primary" />
                      <Typography variant="subtitle2" color="text.secondary">Images</Typography>
                    </Box>
                    <Typography variant="body2">
                      {images.length} image{images.length !== 1 ? 's' : ''} attached
                    </Typography>
                    {previews.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 2, overflowX: 'auto' }}>
                        {previews.map((preview, index) => (
                          <img
                            key={index}
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: 'calc(100vh - 72px)', py: 4 }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Report Waste Issue
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Help keep your community clean by reporting waste hotspots
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    '&.Mui-completed': { color: 'primary.main' },
                    '&.Mui-active': { color: 'primary.main' },
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Alerts */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        {/* Step Content */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          {renderStepContent(activeStep)}
        </Paper>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            startIcon={<ArrowBack />}
            variant="outlined"
            sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}
          >
            Back
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              variant="contained"
              size="large"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={20} /> : <Send />}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
            >
              Continue
            </Button>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default ReportForm;
