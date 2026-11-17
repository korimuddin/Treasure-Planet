import { createHash } from "crypto";

/**
 * STARTER TEXT - NOT LEGAL ADVICE.
 *
 * This is a plain-English placeholder so the click-to-sign flow works end to
 * end. Before real users sign it, replace NDA_TEXT with a template you are
 * entitled to use (for example the UK Intellectual Property Office's example
 * mutual NDA on gov.uk) or solicitor-reviewed wording, and bump NDA_VERSION.
 *
 * Every signature stores NDA_VERSION and a SHA-256 of the exact text shown, so
 * changing the text never alters what earlier signers agreed to.
 */
export const NDA_VERSION = "2026-11-starter-1";

export const NDA_TEXT = `MUTUAL CONFIDENTIALITY AGREEMENT

This agreement is between the Buyer and the Seller of the listing named in the signature record below (each a "party"). Treasure Planet provides the software used to record this agreement. It is not a party to it and gives no advice about it.

1. Purpose. The parties wish to share information with each other so they can decide whether to buy, sell, co-found or merge the software project in the listing (the "Purpose").

2. Confidential information. "Confidential Information" means anything one party discloses to the other for the Purpose that is not public, including the project's name, source code, designs, documentation, data, finances and plans, and the other party's identity, budget and intentions.

3. Obligations. Each party will: (a) use the other's Confidential Information only for the Purpose; (b) keep it secure and not disclose it to anyone else, except professional advisers who need it for the Purpose and are bound to keep it confidential; and (c) not copy, reverse engineer or build on it except as needed for the Purpose.

4. Exceptions. These obligations do not apply to information that: (a) is or becomes public other than through a breach of this agreement; (b) the receiving party already lawfully held or independently developed; (c) the receiving party lawfully receives from someone else without restriction; or (d) must be disclosed by law, in which case the receiving party will give notice where it lawfully can.

5. No licence or obligation. Nothing in this agreement transfers ownership of, or grants any licence to, any intellectual property. Neither party is obliged to proceed with any transaction.

6. Return. If either party asks, the other will promptly delete or return the Confidential Information it holds, except copies it must keep by law.

7. Term. These obligations last for three years from the date of signature.

8. Law. This agreement is governed by the law of England and Wales, and the courts of England and Wales have jurisdiction.

9. Signature. The Buyer signs by typing their full legal name and confirming agreement. The Seller signs by accepting these terms when publishing the listing and by approving the Buyer's request. Each party confirms they have authority to sign.`;

export function ndaTextHash() {
  return createHash("sha256").update(NDA_TEXT).digest("hex");
}
