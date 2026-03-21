import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import { removeSavedFileByUrl,saveUploadedFile } from "../../src/lib/server/storage-utils";

test("saveUploadedFile writes a file that removeSavedFileByUrl can clean up", async () => {
  const file = new File(["backend regression"], "notes.pdf", {
    type: "application/pdf",
  });

  const savedFile = await saveUploadedFile(file, ["test-backend"], "pdf");
  const absolutePath = join(process.cwd(), "public", ...savedFile.fileUrl.split("/").filter(Boolean));

  await access(absolutePath);
  assert.match(savedFile.fileUrl, /^\/uploads\/test-backend\/.+\.pdf$/);

  await removeSavedFileByUrl(savedFile.fileUrl);

  await assert.rejects(access(absolutePath));
});

test("removeSavedFileByUrl ignores non-upload paths", async () => {
  await removeSavedFileByUrl("/not-an-upload/example.pdf");
  await removeSavedFileByUrl(null);
});
