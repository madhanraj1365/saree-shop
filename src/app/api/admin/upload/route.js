import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getCloudinary } from "@/lib/cloudinary";

function uploadBuffer(buffer, folder) {
  const cloudinary = getCloudinary();

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    upload.end(buffer);
  });
}

export async function POST(request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Please choose an image file." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "saree-shop";
    const result = await uploadBuffer(Buffer.from(arrayBuffer), folder);

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch {
    return NextResponse.json({ error: "Image upload failed." }, { status: 500 });
  }
}
