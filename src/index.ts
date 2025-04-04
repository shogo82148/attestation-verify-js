import { Client, Attestation } from "./attestations";
import { calculateDigest } from "./digest";
import { verifyBundle, Subject, Result } from "./verification";
import * as core from "@actions/core";

export interface VerifyOptions {
  algorithm?: string;
  githubToken?: string;
  owner?: string;
  repository?: string;
}

export async function verify(
  filename: string,
  opts: VerifyOptions
): Promise<Result> {
  const algorithm = opts.algorithm || "sha256";
  const digest = await calculateDigest(filename, algorithm);

  const client = new Client({
    githubToken: opts.githubToken,
  });
  const attestations = await getRemoteAttestations(client, digest, opts);

  for (const attestation of attestations) {
    try {
      core.debug("verifying attestation...");
      const ret = await verifyBundle(attestation.bundle);

      // verify the digest
      verifyDigest(ret.statement.subject, digest);

      // verify the repository owner
      const owner = opts.owner || opts.repository?.split("/")[0];
      if (
        owner &&
        ret.extensions.sourceRepositoryOwnerURI !==
          `https://github.com/${owner}`
      ) {
        throw new Error(
          `sourceRepositoryOwnerURI ${ret.extensions.sourceRepositoryOwnerURI} does not match ${owner}`
        );
      }

      // verify the repository
      if (
        opts.repository &&
        ret.extensions.sourceRepositoryURI !==
          `https://github.com/${opts.repository}`
      ) {
        throw new Error(
          `sourceRepositoryURI ${ret.extensions.sourceRepositoryURI} does not match ${opts.repository}`
        );
      }

      core.debug("verifying attestation succeeded.");
      core.debug(`sourceRepositoryURI: ${ret.extensions.sourceRepositoryURI}`);
      for (const entry of ret.bundle.verificationMaterial.tlogEntries) {
        core.debug(
          `Log Entry: https://search.sigstore.dev/?logIndex=${entry.logIndex}`
        );
      }
      return ret;
    } catch (e) {
      core.warning(
        `failed to verify attestation: ${e}, continue to next attestation`
      );
    }
  }
  throw new Error(`failed to verify ${filename}`);
}

function verifyDigest(subjects: Subject[], digest: string) {
  for (const subject of subjects) {
    const [algorithm, rawDigest] = digest.split(":");
    if (subject.digest[algorithm] === rawDigest) {
      return;
    }
  }
  throw new Error(`digest ${digest} not found in the attestation`);
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
