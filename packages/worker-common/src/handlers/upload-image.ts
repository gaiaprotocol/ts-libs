import { z } from 'zod';

const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

async function handleUploadImage(request: Request, env: { IMGBB_API_KEY: string }): Promise<Response> {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Invalid content-type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!(imageFile instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'Invalid image file' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 업로드
    const uploadResponse = await fetch(`${IMGBB_API_URL}?key=${env.IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      return new Response(
        JSON.stringify({ error: `Upload failed: ${errorText}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await uploadResponse.json();

    const schema = z.object({
      data: z.object({
        url: z.url(),
        thumb: z.object({ url: z.url() }).optional(),
      }),
    });

    const parsed = schema.parse(data);

    return new Response(
      JSON.stringify({
        imageUrl: parsed.data.url,
        thumbnailUrl: parsed.data.thumb?.url || null,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export { handleUploadImage };
