import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import bcrypt from "bcryptjs";

/**
 * PATCH /api/user/profile
 * Updates the current user's name, email, or avatar.
 * Handles both JSON (name/email) and multipart (avatar upload).
 */
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Avatar upload
      const formData = await request.formData();
      const file = formData.get("avatar");

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image must be under 5MB" },
          { status: 400 }
        );
      }

      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "File must be an image" },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "projectflow/avatars",
            public_id: `avatar_${session.user.id}`,
            overwrite: true,
            transformation: [
              { width: 256, height: 256, crop: "fill", gravity: "face" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });

      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: { image: uploadResult.secure_url },
        select: { id: true, name: true, email: true, image: true },
      });

      return NextResponse.json({ user });
    }

    // JSON update (name or email)
    const body = await request.json();
    const { name, email } = body;

    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: "Name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json(
          { error: "Email cannot be empty" },
          { status: 400 }
        );
      }

      // Check email is not already taken
      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existing && existing.id !== session.user.id) {
        return NextResponse.json(
          { error: "This email is already in use" },
          { status: 409 }
        );
      }

      updateData.email = email.toLowerCase().trim();
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}