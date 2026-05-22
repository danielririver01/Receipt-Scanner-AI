export async function extractTextWithGoogleVision(buffer: Buffer): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_VISION_API_KEY is not configured');
  }

  const base64Image = buffer.toString('base64');

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[OCR] Google Vision API error:', response.status, errorText);
    throw new Error(`Google Vision API error: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.responses?.[0]?.fullTextAnnotation?.text) {
    return result.responses[0].fullTextAnnotation.text;
  }
  
  if (result.responses?.[0]?.textAnnotations?.[0]?.description) {
    return result.responses[0].textAnnotations[0].description;
  }

  return '';
}
