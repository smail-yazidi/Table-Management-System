// app/api/upload-tutor-image/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  // Ensure the request is a multipart/form-data containing a file
  const formData = await request.formData();
  const file = formData.get('file') as File; // Get the file from the form data
  // You might also send a tutorId here if you want to name the file based on it
  // const tutorId = formData.get('tutorId') as string;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }

  // Generate a unique filename. Using a timestamp + original name is common.
  // Or if you have the tutorId already, you could use that for organization.
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

  try {
    // Upload the file to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public', // Make the image publicly accessible
      addRandomSuffix: false, // We're handling uniqueness with Date.now()
    });

    console.log('Image uploaded to Vercel Blob:', blob);

    // Return the Blob URL and pathname
    return NextResponse.json({ url: blob.url, pathname: blob.pathname }, { status: 200 });
  } catch (error) {
    console.error('Error uploading image to Vercel Blob:', error);
    return NextResponse.json({ error: 'Failed to upload image.' }, { status: 500 });
  }
}
