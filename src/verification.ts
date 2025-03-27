import { toSignedEntity, toTrustMaterial, Verifier } from "@sigstore/verify";
import { bundleFromJSON } from "@sigstore/bundle";
import * as tuf from "@sigstore/tuf";
import * as asn1js from "asn1js";

export interface Result {
  statement: Statement;
  extensions: Extensions;
}

export interface Statement {
  _type: string;
  subject: Subject[];
  predicateType: string;
  predicate: Map<string, any>;
}

export interface Subject {
  name: string;
  digest: Digest;
}

export type Digest = Map<string, string>;

const GitHubOidcIssuer = "https://token.actions.githubusercontent.com";

const oidIssuer = "1.3.6.1.4.1.57264.1.1";
const oidIssuerV2 = "1.3.6.1.4.1.57264.1.8";

// CI extensions
const oidBuildSignerURI = "1.3.6.1.4.1.57264.1.9";
const oidBuildSignerDigest = "1.3.6.1.4.1.57264.1.10";
const oidRunnerEnvironment = "1.3.6.1.4.1.57264.1.11";
const oidSourceRepositoryURI = "1.3.6.1.4.1.57264.1.12";
const oidSourceRepositoryDigest = "1.3.6.1.4.1.57264.1.13";
const oidSourceRepositoryRef = "1.3.6.1.4.1.57264.1.14";
const oidSourceRepositoryIdentifier = "1.3.6.1.4.1.57264.1.15";
const oidSourceRepositoryOwnerURI = "1.3.6.1.4.1.57264.1.16";
const oidSourceRepositoryOwnerIdentifier = "1.3.6.1.4.1.57264.1.17";
const oidBuildConfigURI = "1.3.6.1.4.1.57264.1.18";
const oidBuildConfigDigest = "1.3.6.1.4.1.57264.1.19";
const oidBuildTrigger = "1.3.6.1.4.1.57264.1.20";
const oidRunInvocationURI = "1.3.6.1.4.1.57264.1.21";
const oidSourceRepositoryVisibilityAtSigning = "1.3.6.1.4.1.57264.1.22";

// Extensions contains all custom x509 extensions defined by Fulcio
interface Extensions {
  // The OIDC issuer. Should match `iss` claim of ID token or, in the case of
  // a federated login like Dex it should match the issuer URL of the
  // upstream issuer. The issuer is not set the extensions are invalid and
  // will fail to render.
  issuer?: string; // OID 1.3.6.1.4.1.57264.1.8 and 1.3.6.1.4.1.57264.1.1 (Deprecated)

  // Reference to specific build instructions that are responsible for signing.
  buildSignerURI?: string; // OID 1.3.6.1.4.1.57264.1.9

  // Immutable reference to the specific version of the build instructions that is responsible for signing.
  buildSignerDigest?: string; // OID 1.3.6.1.4.1.57264.1.10

  // Specifies whether the build took place in platform-hosted cloud infrastructure or customer/self-hosted infrastructure.
  runnerEnvironment?: string; // OID 1.3.6.1.4.1.57264.1.11

  // Source repository URL that the build was based on.
  sourceRepositoryURI?: string; // OID 1.3.6.1.4.1.57264.1.12

  // Immutable reference to a specific version of the source code that the build was based upon.
  sourceRepositoryDigest?: string; // OID 1.3.6.1.4.1.57264.1.13

  // Source Repository Ref that the build run was based upon.
  sourceRepositoryRef?: string; // OID 1.3.6.1.4.1.57264.1.14

  // Immutable identifier for the source repository the workflow was based upon.
  sourceRepositoryIdentifier?: string; // OID 1.3.6.1.4.1.57264.1.15

  // Source repository owner URL of the owner of the source repository that the build was based on.
  sourceRepositoryOwnerURI?: string; // OID 1.3.6.1.4.1.57264.1.16

  // Immutable identifier for the owner of the source repository that the workflow was based upon.
  sourceRepositoryOwnerIdentifier?: string; // OID 1.3.6.1.4.1.57264.1.17

  // Build Config URL to the top-level/initiating build instructions.
  buildConfigURI?: string; // OID 1.3.6.1.4.1.57264.1.18

  // Immutable reference to the specific version of the top-level/initiating build instructions.
  buildConfigDigest?: string; // OID 1.3.6.1.4.1.57264.1.19

  // Event or action that initiated the build.
  buildTrigger?: string; // OID 1.3.6.1.4.1.57264.1.20

  // Run Invocation URL to uniquely identify the build execution.
  runInvocationURI?: string; // OID 1.3.6.1.4.1.57264.1.21

  // Source repository visibility at the time of signing the certificate.
  sourceRepositoryVisibilityAtSigning?: string; // OID 1.3.6.1.4.1.57264.1.22
}

export async function verifyBundle(obj: unknown): Promise<Result> {
  const bundle = bundleFromJSON(obj);
  const signedEntity = toSignedEntity(bundle);

  const trustedRoot = await tuf.getTrustedRoot();
  const trustMaterial = toTrustMaterial(trustedRoot);
  const verifier = new Verifier(trustMaterial);

  verifier.verify(signedEntity, {
    extensions: { issuer: GitHubOidcIssuer },
  });

  // validate the bundle
  const content = bundle.content;
  if (content.$case !== "dsseEnvelope") {
    throw new Error("bundle content is not a dsse envelope");
  }
  const dsseEnvelope = content.dsseEnvelope;
  if (dsseEnvelope.payloadType !== "application/vnd.in-toto+json") {
    throw new Error("dsse envelope payload type is not in-toto");
  }
  const statement = JSON.parse(
    dsseEnvelope.payload.toString("utf-8")
  ) as Statement;

  // validate the certificate
  if (signedEntity.key.$case !== "certificate") {
    throw new Error("signed entity key is not a x509 certificate");
  }
  const certificate = signedEntity.key.certificate;
  const extensions = {
    issuer:
      parseDERString(certificate.extension(oidIssuerV2)?.value) ||
      certificate.extension(oidIssuer)?.value.toString("utf-8"),
    buildSignerURI: parseDERString(
      certificate.extension(oidBuildSignerURI)?.value
    ),
    buildSignerDigest: parseDERString(
      certificate.extension(oidBuildSignerDigest)?.value
    ),
    runnerEnvironment: parseDERString(
      certificate.extension(oidRunnerEnvironment)?.value
    ),
    sourceRepositoryURI: parseDERString(
      certificate.extension(oidSourceRepositoryURI)?.value
    ),
    sourceRepositoryDigest: parseDERString(
      certificate.extension(oidSourceRepositoryDigest)?.value
    ),
    sourceRepositoryRef: parseDERString(
      certificate.extension(oidSourceRepositoryRef)?.value
    ),
    sourceRepositoryIdentifier: parseDERString(
      certificate.extension(oidSourceRepositoryIdentifier)?.value
    ),
    sourceRepositoryOwnerURI: parseDERString(
      certificate.extension(oidSourceRepositoryOwnerURI)?.value
    ),
    sourceRepositoryOwnerIdentifier: parseDERString(
      certificate.extension(oidSourceRepositoryOwnerIdentifier)?.value
    ),
    buildConfigURI: parseDERString(
      certificate.extension(oidBuildConfigURI)?.value
    ),
    buildConfigDigest: parseDERString(
      certificate.extension(oidBuildConfigDigest)?.value
    ),
    buildTrigger: parseDERString(certificate.extension(oidBuildTrigger)?.value),
    runInvocationURI: parseDERString(
      certificate.extension(oidRunInvocationURI)?.value
    ),
    sourceRepositoryVisibilityAtSigning: parseDERString(
      certificate.extension(oidSourceRepositoryVisibilityAtSigning)?.value
    ),
  };
  return { statement, extensions };
}

function parseDERString(val?: Buffer): string | undefined {
  if (!val) {
    return undefined;
  }
  const asn1 = asn1js.fromBER(val);
  if (asn1.offset === -1 || !asn1.result) {
    throw new Error("unexpected error unmarshalling DER-encoded string");
  }

  if (asn1.result.blockLength !== val.byteLength) {
    throw new Error("unexpected trailing bytes in DER-encoded string");
  }

  if (
    !(
      asn1.result instanceof asn1js.PrintableString ||
      asn1.result instanceof asn1js.Utf8String
    )
  ) {
    throw new Error("unsupported string type in DER-encoded data");
  }

  return asn1.result.valueBlock.value;
}
