import * as http from "@actions/http-client";

export type Bundle = { [key: string]: any };
export type Attestation = {
  bundle: Bundle;
};

type AttestationsResponse = {
  attestations: Attestation[];
};

export interface ClientOptions {
  userAgent?: string;
  githubToken?: string;
}

const nextPattern = /(?<=<)([\S]*)(?=>; rel="Next")/i;

export class Client {
  private httpClient: http.HttpClient;
  constructor(opts?: ClientOptions) {
    const userAgent = opts?.userAgent || "@shogo82148/attestation-verify";
    const headers: { [key: string]: string } = {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    };
    if (opts?.githubToken) {
      headers.authorization = `Bearer ${opts.githubToken}`;
    }
    this.httpClient = new http.HttpClient(userAgent, [], {
      headers: headers,
    });
  }

  async getByRepoAndDigest(
    repo: string,
    digest: string
  ): Promise<Attestation[]> {
    const url = `https://api.github.com/repos/${repo}/attestations/${digest}`;
    return await this.get(url);
  }

  async getByOwnerAndDigest(
    owner: string,
    digest: string
  ): Promise<Attestation[]> {
    const url = `https://api.github.com/orgs/${owner}/attestations/${digest}`;
    return await this.get(url);
  }

  private async get(url: string): Promise<Attestation[]> {
    let pagesRemaining = true;
    let result: Attestation[] = [];
    while (pagesRemaining) {
      console.log(`get ${url}`);
      const response = await this.httpClient.getJson<AttestationsResponse>(url);
      if (response.statusCode !== 200) {
        throw new Error(`failed to get ${url}: ${response.statusCode}`);
      }

      if (response.result?.attestations) {
        result = result.concat(response.result.attestations);
      }

      // paging
      const linkHeader =
        typeof response.headers.link === "string"
          ? response.headers.link
          : response.headers.link?.join(", ");
      pagesRemaining = !!(linkHeader && linkHeader.includes('rel="next"'));
      if (pagesRemaining) {
        const match = linkHeader?.match(nextPattern);
        if (!match || !match[0]) {
          throw new Error(
            "Failed to extract the next URL from the link header"
          );
        }
        url = match[0];
      }
    }
    return result;
  }
}
