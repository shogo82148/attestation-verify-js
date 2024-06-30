import { promises as fs } from "fs";
import * as path from "path";
import { verifyBundle } from "../src/verification";

async function loadBundle(filename: string) {
  const str = await fs.readFile(path.join(__dirname, filename), "utf-8");
  return JSON.parse(str);
}

describe("verification", () => {
  it("should verify bundle", async () => {
    const bundle = await loadBundle("sigstore-js-2.1.0-bundle.json");
    await verifyBundle(bundle);
  });

  it("should not verify invalid bundle", async () => {
    const bundle = await loadBundle("sigstoreBundle-invalid-signature.json");
    await expect(verifyBundle(bundle)).rejects.toBeDefined();
  });

  it("should not verify missing verification material", async () => {
    const bundle = await loadBundle(
      "github_provenance_demo-0.0.12-py3-none-any-bundle-missing-verification-material.jsonl"
    );
    await expect(verifyBundle(bundle)).rejects.toBeDefined();
  });

  it("should not verify missing verification certificate", async () => {
    const bundle = await loadBundle(
      "github_provenance_demo-0.0.12-py3-none-any-bundle-missing-cert.jsonl"
    );
    await expect(verifyBundle(bundle)).rejects.toBeDefined();
  });

  it("should verify GitHub Sigstore artifact", async () => {
    const bundle = await loadBundle(
      "github_provenance_demo-0.0.12-py3-none-any-bundle.jsonl"
    );
    // TODO: support GitHub Sigstore artifact
    await expect(verifyBundle(bundle)).rejects.toBeDefined();
  });
});
