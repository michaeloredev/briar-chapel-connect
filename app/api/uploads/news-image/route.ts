import { handleFileUpload } from '@/lib/api/upload';

// The R2 folder was set up ahead of the feature under this name.
export async function POST(req: Request) {
  return handleFileUpload(req, 'general-images');
}
