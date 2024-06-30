import { toSignedEntity, toTrustMaterial, Verifier } from "@sigstore/verify";
import { bundleFromJSON } from "@sigstore/bundle";
import * as tuf from "@sigstore/tuf";

const GitHubOidcIssuer = "https://token.actions.githubusercontent.com";

export async function verifyBundle(obj: unknown): Promise<void> {
  const bundle = bundleFromJSON(obj);
  const signedEntity = toSignedEntity(bundle);

  const trustedRoot = await tuf.getTrustedRoot();
  const trustMaterial = toTrustMaterial(trustedRoot);
  const verifier = new Verifier(trustMaterial);

  verifier.verify(signedEntity, {
    extensions: { issuer: GitHubOidcIssuer },
  });
}
