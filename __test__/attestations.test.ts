import * as http from "@actions/http-client";
import * as attestations from "../src/attestations";

describe("attestations", () => {
  it("should get attestations", async () => {
    let url = "";
    const getJson = jest
      .spyOn(http.HttpClient.prototype, "getJson")
      .mockImplementation(async (u: string): Promise<any> => {
        url = u;
        const result: attestations.Attestation = {
          bundle: {
            foo: "bar",
          },
        };
        return {
          result: {
            attestations: [result],
          },
        };
      });

    const client = new attestations.Client();
    const list = await client.getByRepoAndDigest(
      "shogo82148/s3cli-mini",
      "sha256:7452a6cd31d8a5588919c8806f425e37ad95752a4c148f2247e91d4451a91021"
    );
    expect(url).toBe(
      "https://api.github.com/repos/shogo82148/s3cli-mini/attestations/sha256:7452a6cd31d8a5588919c8806f425e37ad95752a4c148f2247e91d4451a91021"
    );
    expect(list).toEqual([
      {
        bundle: {
          foo: "bar",
        },
      },
    ]);
  });
});
