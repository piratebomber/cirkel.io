import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

export class CDNManager {
  private s3 = new S3Client({ region: process.env.AWS_REGION });

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  async optimizeImage(buffer: Buffer, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}) {
    const { width = 1200, height, quality = 80, format = 'webp' } = options;
    
    let pipeline = sharp(buffer)
      .resize(width, height, { 
        fit: 'inside',
        withoutEnlargement: true 
      });

    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality });
        break;
      case 'png':
        pipeline = pipeline.png({ quality });
        break;
    }

    return pipeline.toBuffer();
  }

  async uploadToCloudinary(buffer: Buffer, options: {
    folder?: string;
    public_id?: string;
  } = {}) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: options.folder || 'cirkel-io',
          public_id: options.public_id,
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' },
            { format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });
  }

  generateResponsiveImageUrls(publicId: string) {
    const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    return {
      thumbnail: `${baseUrl}/w_150,h_150,c_fill,f_auto,q_auto/${publicId}`,
      small: `${baseUrl}/w_400,h_400,c_limit,f_auto,q_auto/${publicId}`,
      medium: `${baseUrl}/w_800,h_800,c_limit,f_auto,q_auto/${publicId}`,
      large: `${baseUrl}/w_1200,h_1200,c_limit,f_auto,q_auto/${publicId}`,
      original: `${baseUrl}/f_auto,q_auto/${publicId}`
    };
  }
}

export const cdnManager = new CDNManager();