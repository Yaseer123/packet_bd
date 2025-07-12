"use server";

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
  PutObjectCommand,
  S3Client,
  type _Object as S3Object,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

// Define a type to match Cloudinary's UploadApiResponse structure
type UploadApiResponse = {
  public_id: string;
  secure_url: string;
  resource_type?: string;
  [key: string]: unknown;
};

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY!,
    secretAccessKey: process.env.SECRET_KEY!,
  },
});

const bucketName = process.env.BUCKET_NAME!;

export const uploadFile = async (
  data: FormData,
  filter = "",
): Promise<UploadApiResponse | undefined> => {
  const file = data.get("file");

  if (file instanceof File && file.type.startsWith("image")) {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Create a unique file name with appropriate folder structure
    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    const key = filter ? `${filter}/${uniqueFileName}` : uniqueFileName;

    try {
      // Upload to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        }),
      );

      // Generate secure URL
      const url = `https://${bucketName}.s3.${process.env.BUCKET_REGION}.amazonaws.com/${key}`;

      // Return format similar to Cloudinary response
      return {
        public_id: key,
        secure_url: url,
        resource_type: "image",
        original_filename: file.name,
      };
    } catch (error) {
      console.error("Upload Error:", error);
      throw new Error(error instanceof Error ? error.message : "Upload failed");
    }
  } else {
    throw new Error("Invalid file type. Only images are allowed.");
  }
};

export const readImagesBulk = async (imageIds: string[]) => {
  try {
    const results = await Promise.all(
      imageIds.map(async (id) => {
        try {
          const url = `https://${bucketName}.s3.${process.env.BUCKET_REGION}.amazonaws.com/${id}`;
          return { id, secure_url: url };
        } catch (error) {
          console.error(`Error fetching image ${id}:`, error);
          return null;
        }
      }),
    );
    return results.filter(
      (result): result is { id: string; secure_url: string } => result !== null,
    );
  } catch (error) {
    console.error("Bulk fetch error:", error);
    return [];
  }
};

export const readAllImages = async (filter: string) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: filter,
    });

    const { Contents }: ListObjectsV2CommandOutput =
      await s3Client.send(command);

    const safeContents: S3Object[] = Array.isArray(Contents)
      ? Contents.filter(
          (item): item is S3Object => !!item && typeof item.Key === "string",
        )
      : [];

    return safeContents
      .sort((a, b) => (a.Key ?? "").localeCompare(b.Key ?? ""))
      .map((item) => ({
        public_id: item.Key ?? "",
        secure_url: `https://${bucketName}.s3.${process.env.BUCKET_REGION}.amazonaws.com/${item.Key}`,
      }));
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const readImage = async (id: string) => {
  const url = `https://${bucketName}.s3.${process.env.BUCKET_REGION}.amazonaws.com/${id}`;
  return url;
};

export const removeImage = async (id: string) => {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: id,
    }),
  );
};

// remove image with prefix
export const removeImageByPrefix = async (prefix: string) => {
  // List objects with the prefix
  const listCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
    MaxKeys: 100,
  });

  const { Contents }: ListObjectsV2CommandOutput =
    await s3Client.send(listCommand);

  const safeContents: S3Object[] = Array.isArray(Contents)
    ? Contents.filter(
        (item): item is S3Object => !!item && typeof item.Key === "string",
      )
    : [];

  if (safeContents.length === 0) return;

  // Delete objects in batch
  const deleteCommand = new DeleteObjectsCommand({
    Bucket: bucketName,
    Delete: {
      Objects: safeContents.map((item) => ({ Key: item.Key })),
      Quiet: false,
    },
  });

  await s3Client.send(deleteCommand);
};
