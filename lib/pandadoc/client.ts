type MutualNdaParams = {
  buyerName: string;
  buyerEmail: string;
  sellerEmail: string;
  listingTitle: string;
  ndaRequestId: string;
};

type PandaDocDocument = {
  id: string;
  status?: string;
  name?: string;
};

const baseUrl = "https://api.pandadoc.com/public/v1";

export async function createMutualNDA(params: MutualNdaParams): Promise<PandaDocDocument> {
  const templateUuid = process.env.PANDADOC_NDA_TEMPLATE_ID;

  if (!templateUuid) {
    throw new Error("PandaDoc NDA template is not configured.");
  }

  return pandaDocRequest<PandaDocDocument>("/documents", {
    method: "POST",
    body: JSON.stringify({
      name: `Treasure Planet Mutual NDA - ${params.listingTitle}`,
      template_uuid: templateUuid,
      recipients: [
        {
          email: params.buyerEmail,
          first_name: params.buyerName,
          role: "Buyer",
        },
        {
          email: params.sellerEmail,
          role: "Seller",
        },
      ],
      tokens: [
        { name: "BuyerName", value: params.buyerName },
        { name: "ListingTitle", value: params.listingTitle },
        { name: "Date", value: new Date().toLocaleDateString("en-GB") },
        { name: "RequestId", value: params.ndaRequestId },
      ],
      metadata: {
        nda_request_id: params.ndaRequestId,
      },
    }),
  });
}

export async function sendNDAForSigning(documentId: string) {
  return pandaDocRequest<{ id: string }>(`/documents/${documentId}/send`, {
    method: "POST",
    body: JSON.stringify({
      subject: "Treasure Planet mutual NDA ready for signature",
      message: "Please review and sign the mutual NDA to continue the access request.",
      silent: false,
    }),
  });
}

export async function getDocumentStatus(documentId: string) {
  return pandaDocRequest<PandaDocDocument>(`/documents/${documentId}`, {
    method: "GET",
  });
}

async function pandaDocRequest<T>(path: string, init: RequestInit): Promise<T> {
  const apiKey = process.env.PANDADOC_API_KEY;

  if (!apiKey) {
    throw new Error("PandaDoc API key is not configured.");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `API-Key ${apiKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`PandaDoc request failed with status ${response.status}.`);
  }

  return response.json() as Promise<T>;
}
