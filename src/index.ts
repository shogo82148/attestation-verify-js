import { Client, Attestation } from "./attestations";
import { calculateDigest } from "./digest";
import { verifyBundle } from "./verification";
export interface VerifyOptions {
  algorithm?: string;
  githubToken?: string;
  owner?: string;
  repository?: string;
}

export async function verify(
  filename: string,
  opts: VerifyOptions
): Promise<void> {
  const algorithm = opts.algorithm || "sha256";
  const digest = await calculateDigest(filename, algorithm);

  const client = new Client({
    githubToken: opts.githubToken,
  });
  const attestations = await getRemoteAttestations(client, digest, opts);

  for (const attestation of attestations) {
    await verifyBundle(attestation.bundle);
  }
}

async function getRemoteAttestations(
  client: Client,
  digest: string,
  opts: VerifyOptions
): Promise<Attestation[]> {
  // check if `repository` is set first because if `repository` has been set,
  // `owner` will be set using the value of `repository`.
  // If `repository` is not set, the field will remain empty.
  // It will not be populated using the value of `owner`.
  if (opts.repository) {
    return await client.getByRepoAndDigest(opts.repository, digest);
  }
  if (opts.owner) {
    return await client.getByOwnerAndDigest(opts.owner, digest);
  }
  throw new Error("either owner or repository must be set");
}
