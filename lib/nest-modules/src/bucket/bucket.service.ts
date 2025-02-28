import { Storage } from '@google-cloud/storage';
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid'; // Import the uuid package
import fetch from 'node-fetch';
import { IImage } from '@helpers';

@Injectable()
export class BucketService {
  logger = new Logger(BucketService.name);

  constructor(private readonly storage: Storage) {}

  async uploadImageToBucket(
    imageUrl?: string,
    bufferFile?: ArrayBuffer
  ): Promise<Pick<IImage, 'url'>> {
    let buffer: ArrayBuffer;

    if (!imageUrl && !bufferFile) {
      this.logger.error('Either imageUrl or bufferFile must be provided');
      throw new Error('No image URL or buffer file provided');
    }

    if (imageUrl) {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      buffer = await response.arrayBuffer();
    } else {
      if (!bufferFile) {
        throw new Error('Buffer file is undefined');
      }
      buffer = bufferFile;
    }

    const bucketName = 'sshift-gpt-bucket';
    const filename = `images/${uuidv4()}-generated-image.png`;
    const bucket = this.storage.bucket(bucketName);
    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
      resumable: false,
      gzip: true,
      metadata: {
        contentType: 'image/png',
      },
    });

    const response = (await new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        this.logger.error('Upload error:', err);
        reject(err);
      });

      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        this.logger.log('Upload successful:', publicUrl);
        resolve({ url: publicUrl });
      });

      blobStream.end(Buffer.from(buffer));
    })) as Pick<IImage, 'url'>;

    return response;
  }

  async uploadMaskToBucket(bufferFile: ArrayBuffer): Promise<Pick<IImage, 'url'>> {
    const bucketName = 'sshift-gpt-bucket';
    const filename = `masks/${uuidv4()}-image-mask.png`;
    const bucket = this.storage.bucket(bucketName);
    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
      resumable: false,
      gzip: true,
      metadata: {
        contentType: 'image/png',
      },
    });

    const response = (await new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        this.logger.error('Upload error:', err);
        reject(err);
      });

      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        this.logger.log('Mask upload successful:', publicUrl);
        resolve({ url: publicUrl });
      });

      blobStream.end(Buffer.from(bufferFile));
    })) as Pick<IImage, 'url'>;

    return response;
  }

  async downloadImageFromBucket(filename: string): Promise<NodeJS.ReadableStream> {
    const bucketName = 'sshift-gpt-bucket';
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(filename);
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error('File not found');
    }
    return file.createReadStream();
  }
}
