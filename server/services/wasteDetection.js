const fs = require('fs');
const path = require('path');

// Roboflow API configuration
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
const ROBOFLOW_MODEL_ID = process.env.ROBOFLOW_MODEL_ID || 'waste-hsysm';
const ROBOFLOW_VERSION = process.env.ROBOFLOW_VERSION || '4'; // Updated default version

// CRITICAL: Use serverless.roboflow.com endpoint (not detect.roboflow.com)
const ROBOFLOW_API_URL = `https://serverless.roboflow.com/${ROBOFLOW_MODEL_ID}/${ROBOFLOW_VERSION}`;

/**
 * Convert image file to base64
 * @param {string} imagePath - Path to the image file
 * @returns {string} Base64 encoded image
 */
const imageToBase64 = (imagePath) => {
  const absolutePath = path.isAbsolute(imagePath)
    ? imagePath
    : path.join(__dirname, '..', imagePath);

  const imageBuffer = fs.readFileSync(absolutePath);
  return imageBuffer.toString('base64');
};

/**
 * Call Roboflow API to detect waste in an image
 * @param {string} imagePathOrBase64 - Path to image file or base64 string
 * @param {boolean} isBase64 - Whether input is already base64
 * @returns {Promise<Object>} Detection results
 */
const detectWaste = async (imagePathOrBase64, isBase64 = false) => {
  if (!ROBOFLOW_API_KEY) {
    throw new Error('ROBOFLOW_API_KEY not configured. Please add it to your .env file.');
  }

  try {
    const base64Image = isBase64 ? imagePathOrBase64 : imageToBase64(imagePathOrBase64);

    console.log('=== Roboflow API Request ===');
    console.log('Image base64 length:', base64Image.length);
    console.log('API URL:', ROBOFLOW_API_URL);

    // Build URL with API key and lower confidence threshold to detect more objects
    // Default confidence is often 40% (0.4), lowering to 25% (0.25) to catch more detections
    const url = `${ROBOFLOW_API_URL}?api_key=${ROBOFLOW_API_KEY}&confidence=25&overlap=30`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: base64Image, // Send base64 string directly
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 403) {
        throw new Error(`Roboflow API access denied. Please check:\n1. Your API key is correct\n2. You have access to model: ${ROBOFLOW_MODEL_ID}\n3. The model version ${ROBOFLOW_VERSION} exists`);
      }
      if (response.status === 404) {
        throw new Error(`Model not found: ${ROBOFLOW_MODEL_ID}/${ROBOFLOW_VERSION}. Please verify your model ID and version number in Roboflow.`);
      }
      if (response.status === 405) {
        throw new Error(`Method not allowed. This usually means the endpoint URL is incorrect. Current URL: ${url}`);
      }
      throw new Error(`Roboflow API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Debug: Log raw Roboflow response
    console.log('=== Roboflow API Response ===');
    console.log('Image dimensions:', data.image?.width, 'x', data.image?.height);
    console.log('Predictions count:', data.predictions?.length || 0);
    if (data.predictions?.length > 0) {
      console.log('First prediction:', JSON.stringify(data.predictions[0], null, 2));
    }

    return formatDetectionResults(data);
  } catch (error) {
    console.error('Waste detection error:', error.message);
    throw error;
  }
};

/**
 * Format Roboflow API response into standardized detection results
 * @param {Object} roboflowResponse - Raw response from Roboflow API
 * @returns {Object} Formatted detection results
 */
const formatDetectionResults = (roboflowResponse) => {
  const predictions = roboflowResponse.predictions || [];

  const detections = predictions.map((pred) => ({
    class: pred.class,
    confidence: Math.round(pred.confidence * 100) / 100, // Round to 2 decimals
    bbox: {
      x: pred.x,
      y: pred.y,
      width: pred.width,
      height: pred.height,
    },
  }));

  // Get unique detected classes with counts
  const classCounts = detections.reduce((acc, det) => {
    acc[det.class] = (acc[det.class] || 0) + 1;
    return acc;
  }, {});

  // Calculate average confidence
  const avgConfidence = detections.length > 0
    ? Math.round((detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length) * 100) / 100
    : 0;

  return {
    success: true,
    imageWidth: roboflowResponse.image?.width,
    imageHeight: roboflowResponse.image?.height,
    detectionCount: detections.length,
    detections,
    summary: {
      classCounts,
      avgConfidence,
      dominantClass: Object.keys(classCounts).length > 0
        ? Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0][0]
        : null,
    },
  };
};

/**
 * Map Roboflow waste classes to application categories
 * @param {string} roboflowClass - Class name from Roboflow
 * @returns {string} Application category
 */
const mapToCategory = (roboflowClass) => {
  const classLower = roboflowClass.toLowerCase();

  // Mapping based on common waste detection classes
  const categoryMap = {
    // Plastic items
    'plastic': 'plastic',
    'plastic_bottle': 'plastic',
    'bottle': 'plastic',
    'plastic_bag': 'plastic',
    'container': 'plastic',

    // Organic items
    'organic': 'organic',
    'food': 'organic',
    'food_waste': 'organic',
    'biodegradable': 'organic',

    // Hazardous items
    'hazardous': 'hazardous',
    'battery': 'hazardous',
    'chemical': 'hazardous',
    'medical': 'hazardous',

    // Electronic items
    'electronic': 'electronic',
    'e-waste': 'electronic',
    'electronics': 'electronic',

    // Construction items
    'construction': 'construction',
    'debris': 'construction',
    'rubble': 'construction',

    // Metal/recyclables
    'metal': 'other',
    'can': 'other',
    'glass': 'other',
    'paper': 'other',
    'cardboard': 'other',
  };

  // Try to find a matching category
  for (const [key, category] of Object.entries(categoryMap)) {
    if (classLower.includes(key)) {
      return category;
    }
  }

  return 'other';
};

/**
 * Analyze multiple images and aggregate results
 * @param {Array<string>} imagePaths - Array of image paths
 * @returns {Promise<Object>} Aggregated detection results
 */
const analyzeMultipleImages = async (imagePaths) => {
  const results = [];

  for (let i = 0; i < imagePaths.length; i++) {
    try {
      const result = await detectWaste(imagePaths[i]);
      // Add image index to each detection
      result.detections = result.detections.map(det => ({
        ...det,
        imageIndex: i,
      }));
      results.push(result);
    } catch (error) {
      console.error(`Failed to analyze image ${i}:`, error.message);
      results.push({
        success: false,
        error: error.message,
        imageIndex: i,
        detections: [],
      });
    }
  }

  // Aggregate all detections
  const allDetections = results.flatMap(r => r.detections || []);
  const successfulResults = results.filter(r => r.success);

  return {
    success: successfulResults.length > 0,
    totalImages: imagePaths.length,
    analyzedImages: successfulResults.length,
    totalDetections: allDetections.length,
    detections: allDetections,
    imageResults: results,
  };
};

module.exports = {
  detectWaste,
  imageToBase64,
  mapToCategory,
  analyzeMultipleImages,
  formatDetectionResults,
};