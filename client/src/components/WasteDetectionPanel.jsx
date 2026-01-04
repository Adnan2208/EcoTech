import { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Chip,
    LinearProgress,
    Card,
    CardContent,
    Grid,
    IconButton,
    Tooltip,
    Collapse,
    Divider,
} from '@mui/material';
import {
    Psychology,
    Refresh,
    ExpandMore,
    ExpandLess,
    CheckCircle,
    Warning,
    Info,
} from '@mui/icons-material';
import { wasteDetectionApi } from '@/services/api';

// Color palette for different waste classes
const CLASS_COLORS = {
    plastic: '#3b82f6',
    bottle: '#3b82f6',
    plastic_bottle: '#3b82f6',
    organic: '#22c55e',
    food: '#22c55e',
    hazardous: '#ef4444',
    battery: '#ef4444',
    electronic: '#8b5cf6',
    metal: '#f59e0b',
    glass: '#06b6d4',
    paper: '#84cc16',
    cardboard: '#a3a3a3',
    default: '#6b7280',
};

const getClassColor = (className) => {
    const lowerClass = className?.toLowerCase() || '';
    for (const [key, color] of Object.entries(CLASS_COLORS)) {
        if (lowerClass.includes(key)) return color;
    }
    return CLASS_COLORS.default;
};

const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.8) return { label: 'High', color: 'success', icon: CheckCircle };
    if (confidence >= 0.5) return { label: 'Medium', color: 'warning', icon: Warning };
    return { label: 'Low', color: 'error', icon: Info };
};

// Component to render bounding boxes over an image
const ImageWithDetections = ({ imageUrl, detections, imageWidth, imageHeight }) => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width, height: rect.width * 0.75 }); // Maintain aspect ratio
            }
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Calculate scale factors
    const scaleX = dimensions.width / (imageWidth || 1);
    const scaleY = dimensions.height / (imageHeight || 1);

    return (
        <Box
            ref={containerRef}
            sx={{
                position: 'relative',
                width: '100%',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: '#1a1a2e',
            }}
        >
            <Box
                component="img"
                src={imageUrl}
                alt="Waste detection"
                sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                }}
            />
            {/* Bounding boxes overlay */}
            <svg
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                }}
            >
                {detections.map((det, idx) => {
                    const color = getClassColor(det.class);
                    const x = (det.bbox.x - det.bbox.width / 2) * scaleX;
                    const y = (det.bbox.y - det.bbox.height / 2) * scaleY;
                    const w = det.bbox.width * scaleX;
                    const h = det.bbox.height * scaleY;

                    return (
                        <g key={idx}>
                            {/* Bounding box */}
                            <rect
                                x={x}
                                y={y}
                                width={w}
                                height={h}
                                fill="none"
                                stroke={color}
                                strokeWidth="3"
                                strokeDasharray="8,4"
                            />
                            {/* Label background */}
                            <rect
                                x={x}
                                y={y - 24}
                                width={Math.max(det.class.length * 8 + 50, 80)}
                                height="24"
                                fill={color}
                                rx="4"
                            />
                            {/* Label text */}
                            <text
                                x={x + 6}
                                y={y - 7}
                                fill="white"
                                fontSize="12"
                                fontWeight="600"
                                fontFamily="system-ui"
                            >
                                {det.class} ({Math.round(det.confidence * 100)}%)
                            </text>
                        </g>
                    );
                })}
            </svg>
        </Box>
    );
};

// Detection result card
const DetectionCard = ({ detection, index }) => {
    const confidenceInfo = getConfidenceLevel(detection.confidence);
    const ConfidenceIcon = confidenceInfo.icon;

    return (
        <Card
            sx={{
                mb: 1,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                    borderColor: getClassColor(detection.class),
                    transform: 'translateX(4px)',
                },
            }}
        >
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={detection.class}
                        size="small"
                        sx={{
                            bgcolor: getClassColor(detection.class),
                            color: 'white',
                            fontWeight: 600,
                        }}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <Tooltip title={`${confidenceInfo.label} confidence`}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ConfidenceIcon
                                sx={{ fontSize: 16, color: `${confidenceInfo.color}.main` }}
                            />
                            <Typography variant="body2" fontWeight="600">
                                {Math.round(detection.confidence * 100)}%
                            </Typography>
                        </Box>
                    </Tooltip>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={detection.confidence * 100}
                    color={confidenceInfo.color}
                    sx={{ mt: 1, height: 4, borderRadius: 2 }}
                />
            </CardContent>
        </Card>
    );
};

// Main Panel Component
const WasteDetectionPanel = ({ report, onAnalysisComplete }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [detectionResults, setDetectionResults] = useState(null);
    const [expanded, setExpanded] = useState(true);

    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    // Fetch existing detection results on mount
    useEffect(() => {
        if (report?.detectionResults?.length > 0) {
            setDetectionResults({
                detections: report.detectionResults,
                summary: report.detectionSummary,
            });
        }
    }, [report]);

    const handleAnalyze = async () => {
        if (!report?._id) return;

        setLoading(true);
        setError(null);

        try {
            const response = await wasteDetectionApi.analyzeReport(report._id);
            const data = response.data.data;

            console.log('Detection response:', data); // Debug log

            // The backend returns: { report, detectionResults }
            // detectionResults has: { success, totalImages, analyzedImages, totalDetections, detections, imageResults }
            const detections = data.detectionResults?.detections || [];
            const imageResult = data.detectionResults?.imageResults?.[0];

            setDetectionResults({
                detections: detections,
                imageWidth: imageResult?.imageWidth || 640,
                imageHeight: imageResult?.imageHeight || 480,
                summary: {
                    totalDetections: data.detectionResults?.totalDetections || detections.length,
                    analyzedAt: new Date(),
                    success: data.detectionResults?.success,
                },
            });

            if (onAnalysisComplete) {
                onAnalysisComplete(data);
            }
        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.response?.data?.message || 'Failed to analyze images');
        } finally {
            setLoading(false);
        }
    };

    const hasDetections = detectionResults?.detections?.length > 0;
    const imageUrl = report?.images?.[0]?.url
        ? `${API_BASE}${report.images[0].url}`
        : null;

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                background: 'linear-gradient(145deg, rgba(139,92,246,0.03) 0%, rgba(59,130,246,0.03) 100%)',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Psychology sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="700">
                            AI Waste Detection
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            YOLO-powered analysis via Roboflow
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                        {expanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
                        onClick={handleAnalyze}
                        disabled={loading || !report?.images?.length}
                        sx={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        {loading ? 'Analyzing...' : hasDetections ? 'Re-analyze' : 'Analyze'}
                    </Button>
                </Box>
            </Box>

            <Collapse in={expanded}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3, justifyContent: 'center' }}>
                        <CircularProgress size={32} />
                        <Typography color="text.secondary">Analyzing waste in image...</Typography>
                    </Box>
                )}

                {!hasDetections && !loading && !error && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        Click "Analyze" to run AI-powered waste detection on the report images.
                    </Alert>
                )}

                {hasDetections && !loading && (
                    <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                        Found {detectionResults.detections.length} object(s) in the image!
                    </Alert>
                )}

                {hasDetections && (
                    <Grid container spacing={2}>
                        {/* Image with detections */}
                        <Grid size={{ xs: 12, md: 7 }}>
                            {imageUrl && (
                                <ImageWithDetections
                                    imageUrl={imageUrl}
                                    detections={detectionResults.detections.filter(d =>
                                        d.imageIndex === 0 || d.imageIndex === undefined || d.imageIndex === null
                                    )}
                                    imageWidth={detectionResults.imageWidth || 640}
                                    imageHeight={detectionResults.imageHeight || 480}
                                />
                            )}
                        </Grid>

                        {/* Detection results list */}
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Detected Objects ({detectionResults.detections.length})
                                </Typography>
                                <Divider sx={{ mb: 1.5 }} />
                                <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                                    {detectionResults.detections.map((det, idx) => (
                                        <DetectionCard key={idx} detection={det} index={idx} />
                                    ))}
                                </Box>
                            </Box>

                            {/* Summary stats */}
                            {detectionResults.summary && (
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'action.hover',
                                        borderRadius: 2,
                                        mt: 2,
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        Analysis Summary
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                        <Box>
                                            <Typography variant="h5" fontWeight="700" color="primary">
                                                {detectionResults.summary.totalDetections || detectionResults.detections.length}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Objects Found
                                            </Typography>
                                        </Box>
                                        {detectionResults.summary.analyzedAt && (
                                            <Box>
                                                <Typography variant="body2" fontWeight="600">
                                                    {new Date(detectionResults.summary.analyzedAt).toLocaleTimeString()}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Analyzed At
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                )}
            </Collapse>
        </Paper>
    );
};

export default WasteDetectionPanel;
