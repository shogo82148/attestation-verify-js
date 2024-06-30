import * as crypto from "crypto";
import * as fs from "fs";

export async function calculateDigest(
  filename: string,
  algorithm: string
): Promise<string> {
  const hash = await new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filename);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", (err) => reject(err));
  });
  return `${algorithm}:${hash}`;
}
