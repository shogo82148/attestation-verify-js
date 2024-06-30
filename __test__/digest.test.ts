import { calculateDigest } from "../src/digest";

describe("calculateDigest", () => {
  it("should calculate sha256 digest", async () => {
    const digest = await calculateDigest(
      "__test__/sigstore-js-2.1.0.tgz",
      "sha256"
    );
    expect(digest).toBe(
      "sha256:f0c641fce0310cb43208f4272dc1423153630e44ba8cdc0b5ce8466f724e0eed"
    );
  });
});
