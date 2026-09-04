import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

const auth = () => ({ id: "fakeId" }); // Fake auth for now

export const ourFileRouter = {
  imageManager: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 5, // Allows multiple files
    },
  })
  .middleware(async () => {
    const user = await auth();
    if (!user) throw new UploadThingError("Unauthorized");
    return { userId: user.id };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    // This runs on server after upload. 
    // Return the data you want sent to the client.
    return { uploadedBy: metadata.userId, url: file.ufsUrl, key: file.key };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;