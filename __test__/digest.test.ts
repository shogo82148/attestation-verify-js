import { calculateDigest } from "../src/digest";
import * as path from "path";

describe("calculateDigest", () => {
  it("should calculate sha256 digest", async () => {
    const digest = await calculateDigest(
      path.join(__dirname, "sigstore-js-2.1.0.tgz"),
      "sha256"
    );
    expect(digest).toBe(
      "sha256:f0c641fce0310cb43208f4272dc1423153630e44ba8cdc0b5ce8466f724e0eed"
    );
  });

  it("should calculate sha512 digest", async () => {
    const digest = await calculateDigest(
      path.join(__dirname, "sigstore-js-2.1.0.tgz"),
      "sha512"
    );
    expect(digest).toBe(
      "sha512:90f223f992e4c88dd068cd2a5fc57f9d2b30798343dd6e38f29c240e04ba090ef831f84490847c4e82b9232c78e8a258463b1e55c0f7469f730265008fa6633f"
    );
  });
});
