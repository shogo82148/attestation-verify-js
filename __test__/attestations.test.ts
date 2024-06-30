import * as attestations from "../src/attestations";

describe("attestations", () => {
  it("should get attestations", async () => {
    const client = new attestations.Client();
    const list = await client.getByRepoAndDigest(
      "shogo82148/s3cli-mini",
      "sha256:7452a6cd31d8a5588919c8806f425e37ad95752a4c148f2247e91d4451a91021"
    );
    console.log(list);
  });
});
