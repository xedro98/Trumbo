import type { ReactNode } from "react";
import {
	GridShellProvider,
	marketingGridPadClass,
	marketingGridStackClass,
} from "@/components/grid-shell-context";
import { MarketingShell } from "@/components/MarketingShell";
import { MarketingFooter } from "@/components/sections/FooterWatermark";
import { GridBoxStack, GridBoxStackCell } from "@/components/ui/grid-box";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Shared legal page shell                                                     */
/* -------------------------------------------------------------------------- */

interface LegalPageProps {
	title: string;
	kicker?: string;
	children: ReactNode;
}

function LegalPage({ title, kicker, children }: LegalPageProps) {
	return (
		<MarketingShell>
			<GridShellProvider>
				<GridBoxStack className={marketingGridStackClass}>
					<GridBoxStackCell className={cn(marketingGridPadClass, "pt-4 md:pt-6 last:border-b-0")}>
						{kicker ? <p className="marketing-kicker mb-4">{kicker}</p> : null}
						<h1 className="marketing-heading mb-8">{title}</h1>
						<div className="max-w-5xl space-y-6 text-muted-foreground">{children}</div>
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0 last:border-b-0">
						<MarketingFooter />
					</GridBoxStackCell>
				</GridBoxStack>
			</GridShellProvider>
		</MarketingShell>
	);
}

function LegalSection({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<section className="space-y-2">
			<h2 className="font-heading text-xl font-semibold leading-snug text-foreground">
				{title}
			</h2>
			<div className="space-y-3 text-base leading-relaxed md:text-[1.0625rem]">{children}</div>
		</section>
	);
}

function LegalP({ children }: { children: ReactNode }) {
	return <p>{children}</p>;
}

const lastUpdated = "July 5, 2026";
const entity = "Maxfense, Inc.";
const domain = "trumbo.dev";
const platform = "platform.trumbo.dev";

/* -------------------------------------------------------------------------- */
/* Privacy Policy                                                              */
/* -------------------------------------------------------------------------- */

export function PrivacyPage() {
	return (
		<LegalPage title="Privacy Policy" kicker="Legal">
			<p className="font-stat text-xs uppercase tracking-[0.08em] text-muted-foreground">
				Last updated: {lastUpdated}
			</p>
			<p>
				This Privacy Policy ("Policy") describes how {entity} ("Trumbo," "we," "us," or "our")
				collects, uses, discloses, and protects personal information when you use the Trumbo
				command-line interface (the "CLI"), {platform} (the "Platform"), the Trumbo Quartz
				reasoning model, hosted open models, and any related tools, documentation, and services
				(collectively, the "Services"). This Policy is a legally binding document and forms
				part of our Terms of Service. By accessing or using the Services, you acknowledge that
				you have read, understood, and agree to the practices described in this Policy. If you
				do not agree with this Policy, you must not access or use the Services.
			</p>
			<p>
				{entity} is the data controller responsible for your personal information within the
				meaning of the General Data Protection Regulation (GDPR), the California Consumer
				Privacy Act (CCPA), and other applicable data protection laws. This Policy is designed
				to comply with the requirements of these laws and to provide you with clear, transparent
				information about our data practices.
			</p>

			<LegalSection title="1. Definitions">
				<LegalP>
					For the purposes of this Policy, the following terms have the following meanings:
				</LegalP>
				<ul className="ml-4 space-y-1.5">
					<li><strong className="text-foreground">Personal information</strong> means any information that identifies, relates to, describes, is reasonably capable of being associated with, or could reasonably be linked, directly or indirectly, with a particular individual or household.</li>
					<li><strong className="text-foreground">Processing</strong> means any operation or set of operations performed on personal information, whether or not by automated means, such as collection, recording, organization, structuring, storage, adaptation, retrieval, consultation, use, disclosure, transmission, erasure, or destruction.</li>
					<li><strong className="text-foreground">Data subject</strong> means an identified or identifiable individual to whom personal information relates.</li>
					<li><strong className="text-foreground">Service provider</strong> means a third party that processes personal information on our behalf under a written contract.</li>
					<li><strong className="text-foreground">Third party</strong> means a person or entity other than you, us, or our service providers.</li>
					<li><strong className="text-foreground">Business purposes</strong> means the collection, use, retention, or disclosure of personal information for our operational objectives, as described in this Policy.</li>
					<li><strong className="text-foreground">Sale</strong> means selling, renting, releasing, disclosing, disseminating, making available, transferring, or otherwise communicating personal information for monetary or other valuable consideration. We do not sell personal information as defined by the CCPA.</li>
				</ul>
			</LegalSection>

			<LegalSection title="2. Categories of Personal Information We Collect">
				<LegalP>
					We collect the following categories of personal information, each described in
					detail below. The collection is limited to what is necessary and proportionate to
					the purposes described in Section 3.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">2.1 Account information.</strong> When you
					create a Trumbo account, we collect your email address, a hashed password, and an
					optional display name. If you subscribe to a paid plan, we additionally collect
					your legal name, billing address, country of residence, and payment method
					identifier (e.g., last four digits of card, Stripe customer ID). We do not collect,
					store, or transmit full credit card numbers, card verification codes (CVVs), card
					expiry dates, or banking routing numbers. All payment card data is handled entirely
					by Stripe, our payment processor, and is governed by Stripe's privacy policy and
					PCI-DSS compliance. We receive only a tokenized reference to your payment method.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">2.2 Usage and telemetry data.</strong> When
					you use the Platform or send requests to hosted models, we collect: the number of
					requests sent per rate-limit window (5-hour, daily, weekly); timestamps of each
					request; the model ID requested (e.g., "deepseek-v3", "trumbo-quartz"); the
					provider route used; HTTP response status codes; token counts (input and output)
					for our own cost monitoring and capacity planning; and the CLI version you are
					running. We do not store the content of your prompts, the code you are editing, or
					the responses generated by models on our servers after the request is completed
					and the response is returned to your CLI. Request and response payloads are
					transient and exist in server memory only for the duration of the inference call.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">2.3 Session data.</strong> When you use
					session persistence features on the Platform, we store: your session history
					(messages, tool calls, and agent actions); checkpoint snapshots of file state;
					permission configurations (allow/deny rules per tool); MCP tool configurations;
					environment variables set for the session; and session metadata (creation date,
					last accessed, tags). Session data is encrypted at rest and is associated solely
					with your account. It is not accessible to other users unless you explicitly create
					a team session and grant access. You can delete any session at any time from the
					Platform dashboard or via the CLI.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">2.4 Technical and device data.</strong> We
					automatically collect: IP address (used for rate-limit enforcement and fraud
					prevention); browser type and version (for the Platform web interface); operating
					system and architecture (for CLI compatibility); CLI version and installation
					method (npm, pnpm, bun, curl); and approximate geographic location derived from IP
					address (country and region level, not city or street). We do not collect device
					fingerprints, hardware identifiers, screen resolution, installed fonts, or other
					browser fingerprinting data.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">2.5 CLI local telemetry.</strong> The Trumbo
					CLI collects opt-in telemetry data that is stored locally on your machine in a
					hidden directory within your Trumbo configuration folder. This data includes:
					aggregate usage patterns (number of sessions, average session duration, tools
					used); error and crash logs (stack traces, error messages, without file paths or
					code content); and performance metrics (response latency, time to first token,
					token throughput). This data is stored locally and is never transmitted to Trumbo
					servers unless you explicitly enable sharing by setting{" "}
					<code className="font-stat rounded bg-muted/30 px-1.5 py-0.5 text-xs">
						telemetry.share: true
					</code>{" "}
					in your Trumbo config file. You can disable all telemetry collection by setting{" "}
					<code className="font-stat rounded bg-muted/30 px-1.5 py-0.5 text-xs">
						telemetry: false
					</code>
					. You can inspect and delete locally stored telemetry data at any time from the
					CLI's config directory.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">2.6 Communications.</strong> When you contact
					us by email, through the Platform's support interface, or through GitHub issues,
					we collect the content of your communication, your email address, and any
					attachments. This information is used solely to respond to your inquiry and is
					retained for the duration necessary to resolve the matter.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">2.7 Marketing and product updates.</strong> If
					you opt in to receive product updates or marketing communications (which is
					separate from essential service notifications), we collect your email address and
					tracking which emails you open and which links you click. This tracking is used
					solely to measure engagement and improve our communications. You can unsubscribe at
					any time using the link in any email or by contacting{" "}
					<a href="mailto:privacy@trumbo.dev" className="text-brand underline-offset-2 hover:underline">
						privacy@trumbo.dev
					</a>
					.
				</LegalP>
			</LegalSection>

			<LegalSection title="3. Purposes and Legal Basis for Processing">
				<LegalP>
					We process personal information for the following purposes, each with its legal
					basis under the GDPR (Article 6) and the CCPA's business purposes exception:
				</LegalP>
				<ul className="ml-4 space-y-1.5">
					<li><strong className="text-foreground">Service delivery</strong> (GDPR Art. 6(1)(b) — contract): authenticating your account, routing requests to hosted models, enforcing rate limits, persisting sessions, and providing the features described on our pricing and product pages.</li>
					<li><strong className="text-foreground">Billing and subscription management</strong> (GDPR Art. 6(1)(b) — contract): processing subscription payments, managing upgrades and downgrades, issuing refunds, and maintaining billing records.</li>
					<li><strong className="text-foreground">Security and fraud prevention</strong> (GDPR Art. 6(1)(f) — legitimate interests): detecting and preventing unauthorized access, rate-limit circumvention, payment fraud, and abuse of the Services. IP addresses and usage patterns are processed for this purpose.</li>
					<li><strong className="text-foreground">Service improvement</strong> (GDPR Art. 6(1)(f) — legitimate interests): monitoring aggregate usage patterns, error rates, and performance metrics to optimize model routing, improve CLI stability, and plan capacity. This processing uses anonymized or pseudonymized data only.</li>
					<li><strong className="text-foreground">Legal compliance</strong> (GDPR Art. 6(1)(c) — legal obligation): retaining billing records as required by financial regulations, responding to lawful government requests, and cooperating with law enforcement investigations.</li>
					<li><strong className="text-foreground">Communication</strong> (GDPR Art. 6(1)(a) — consent for marketing; Art. 6(1)(b) — contract for essential notifications): sending security alerts, service status notifications, and product updates. Marketing emails require your explicit opt-in consent.</li>
				</ul>
				<LegalP>
					<strong className="text-foreground">Explicit commitments:</strong> We do not use
					your personal information, session data, or prompt content to train, fine-tune, or
					evaluate AI models. We do not sell your personal information to any third party. We
					do not share your personal information with third parties for their advertising or
					marketing purposes. We do not use your personal information for behavioral
					targeting, retargeting, or profile building.
				</LegalP>
			</LegalSection>

			<LegalSection title="4. Subprocessors and Third-Party Service Providers">
				<LegalP>
					We engage the following categories of third-party service providers (subprocessors)
					to process personal information on our behalf. Each subprocessor is bound by a
					written data processing agreement that requires confidentiality, security, and
					compliance with applicable data protection laws:
				</LegalP>
				<ul className="ml-4 space-y-1.5">
					<li><strong className="text-foreground">Stripe, Inc.</strong> — payment processing. Receives: billing name, address, payment method token, subscription plan, charge amounts. Processes payments under Stripe's PCI-DSS compliance. See stripe.com/privacy.</li>
					<li><strong className="text-foreground">Infrastructure hosting provider</strong> — web hosting, CDN, DDoS protection, DNS. Receives: IP addresses, HTTP request metadata, TLS connection data.</li>
					<li><strong className="text-foreground">Model Inference Provider</strong> — model inference infrastructure. Receives: model ID, token counts, request metadata for inference execution. This provider does not have access to session data or account information.</li>
					<li><strong className="text-foreground">GitHub, Inc.</strong> — source code hosting, issue tracking. Receives: GitHub username and email (if you file issues or contribute to the open source CLI). See github.com/privacy.</li>
					<li><strong className="text-foreground">npm, Inc. (GitHub)</strong> — package registry for CLI distribution. Receives: download metadata (package name, version, IP address for CDN routing). See npmjs.com/policies/privacy.</li>
				</ul>
				<LegalP>
					When you use your own API keys with the CLI (e.g., Anthropic, OpenAI, Google
					Gemini, OpenRouter, Groq, Together AI, Mistral, or any of the 50+ providers
					supported by the Trumbo SDK), requests are sent directly from your machine to the
					provider's API endpoint. Trumbo does not intercept, route, proxy, log, or store
					these requests or their content. Your relationship with the provider is governed by
					the provider's own terms of service and privacy policy. Trumbo has no access to the
					content of requests made with your own keys, and those requests do not count
					against Trumbo rate limits.
				</LegalP>
				<LegalP>
					We will notify you at least 30 days before engaging a new subprocessor that will
					process your personal information. You may object to a new subprocessor by
					contacting{" "}
					<a href="mailto:privacy@trumbo.dev" className="text-brand underline-offset-2 hover:underline">
						privacy@trumbo.dev
					</a>{" "}
					before the engagement date. If we cannot reasonably accommodate your objection, you
					may terminate your subscription with a prorated refund.
				</LegalP>
			</LegalSection>

			<LegalSection title="5. Data Retention and Deletion">
				<LegalP>
					We retain personal information only for as long as necessary to fulfill the purposes
					described in this Policy, comply with legal obligations, resolve disputes, and
					enforce our agreements. Specific retention periods by data category:
				</LegalP>
				<ul className="ml-4 space-y-1.5">
					<li><strong className="text-foreground">Account data</strong> (email, name, password hash): retained until you request account deletion. Upon deletion, account data is purged within 30 days.</li>
					<li><strong className="text-foreground">Session data</strong> (history, checkpoints, permissions, tool config): retained until you delete the session or close your account. Sessions are not automatically deleted unless you enable an auto-cleanup policy.</li>
					<li><strong className="text-foreground">Usage logs</strong> (request counts, timestamps, model IDs, token counts): retained for 90 days for rate-limit auditing and capacity planning, then automatically purged.</li>
					<li><strong className="text-foreground">Billing records</strong> (invoices, payment references, refund records): retained for 7 years as required by U.S. financial regulations (IRC Section 6001 and state tax codes).</li>
					<li><strong className="text-foreground">Security logs</strong> (IP addresses, access attempts, authentication events): retained for 1 year for security investigation purposes.</li>
					<li><strong className="text-foreground">Support communications</strong> (emails, tickets): retained for 2 years after resolution.</li>
					<li><strong className="text-foreground">Marketing engagement data</strong> (email opens, clicks): retained for 24 months, then automatically purged.</li>
				</ul>
				<LegalP>
					When you delete your account, we initiate a deletion process that removes your
					personal data from all production systems within 30 days, and from backup systems
					within 90 days. Data that must be retained for legal compliance (e.g., billing
					records) is retained in an anonymized form that cannot be associated with your
					identity. If you request account deletion while a billing investigation or legal
					dispute is pending, deletion may be delayed until the matter is resolved.
				</LegalP>
			</LegalSection>

			<LegalSection title="6. Data Security Measures">
				<LegalP>
					We implement and maintain industry-standard technical and organizational security
					measures designed to protect personal information against unauthorized access,
					disclosure, alteration, and destruction:
				</LegalP>
				<ul className="ml-4 space-y-1.5">
					<li><strong className="text-foreground">Encryption in transit:</strong> all data transmitted between the CLI, Platform, and our servers is encrypted using TLS 1.2 or higher. HSTS is enforced on all Platform domains.</li>
					<li><strong className="text-foreground">Encryption at rest:</strong> session data, API keys, and other personal information stored on our servers is encrypted using AES-256.</li>
					<li><strong className="text-foreground">Password hashing:</strong> user passwords are hashed using bcrypt with a work factor of 12. We never store plaintext passwords.</li>
					<li><strong className="text-foreground">Access controls:</strong> production database and server access is restricted to authorized engineering personnel using role-based access control (RBAC). All access is logged and audited monthly.</li>
					<li><strong className="text-foreground">Network security:</strong> all services run behind edge WAF and DDoS protection. Internal services are isolated in private networks with no public internet access.</li>
					<li><strong className="text-foreground">Key management:</strong> encryption keys are managed through Trumbo's managed secrets infrastructure and rotated on a regular schedule.</li>
					<li><strong className="text-foreground">Security reviews:</strong> we conduct internal security reviews at least quarterly and engage third-party security auditors annually.</li>
					<li><strong className="text-foreground">Incident response:</strong> we maintain an incident response plan with defined escalation procedures. In the event of a confirmed data breach affecting personal information, we will notify affected users within 72 hours of discovery, as required by GDPR Article 33 and applicable state breach notification laws.</li>
				</ul>
				<LegalP>
					No method of transmission over the internet or electronic storage is completely
					secure. While we strive to use commercially acceptable means to protect your
					personal information, we cannot guarantee absolute security. You are responsible
					for maintaining the security of your Trumbo account credentials, API keys stored
					on your machine, and any session tokens issued by the CLI.
				</LegalP>
			</LegalSection>

			<LegalSection title="7. Your Rights — GDPR (European Economic Area and UK)">
				<LegalP>
					If you are located in the European Economic Area (EEA), the United Kingdom, or
					Switzerland, you have the following rights under the GDPR:
				</LegalP>
				<ul className="ml-4 space-y-1.5">
					<li><strong className="text-foreground">Right of access (Art. 15):</strong> you may request a copy of the personal information we hold about you, in a structured, commonly used, and machine-readable format.</li>
					<li><strong className="text-foreground">Right to rectification (Art. 16):</strong> you may request correction of inaccurate or incomplete personal information.</li>
					<li><strong className="text-foreground">Right to erasure (Art. 17):</strong> you may request deletion of your personal information, subject to legal retention obligations (e.g., billing records).</li>
					<li><strong className="text-foreground">Right to restrict processing (Art. 18):</strong> you may request that we restrict the processing of your personal information under certain circumstances, such as pending verification of accuracy or legal claims.</li>
					<li><strong className="text-foreground">Right to data portability (Art. 20):</strong> you may receive your personal information in a structured, machine-readable format and transmit it to another controller.</li>
					<li><strong className="text-foreground">Right to object (Art. 21):</strong> you may object to the processing of your personal information based on legitimate interests or for direct marketing.</li>
					<li><strong className="text-foreground">Right to withdraw consent (Art. 7(3)):</strong> where processing is based on your consent (e.g., marketing emails, telemetry sharing), you may withdraw consent at any time without affecting the lawfulness of processing before withdrawal.</li>
					<li><strong className="text-foreground">Right to lodge a complaint (Art. 77):</strong> you have the right to lodge a complaint with your local supervisory authority if you believe our processing of your personal information infringes the GDPR.</li>
				</ul>
				<LegalP>
					To exercise any of these rights, email{" "}
					<a href="mailto:privacy@trumbo.dev" className="text-brand underline-offset-2 hover:underline">
						privacy@trumbo.dev
					</a>{" "}
					with the subject line "GDPR Rights Request." We will verify your identity before
					processing the request and respond within 30 days. If the request is complex or
					involves multiple data categories, we may extend the response period by an
					additional 60 days, in which case we will inform you of the extension within the
					initial 30-day period.
				</LegalP>
			</LegalSection>

			<LegalSection title="8. Your Rights — CCPA (California)">
				<LegalP>
					If you are a California resident, you have additional rights under the California
					Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA):
				</LegalP>
				<ul className="ml-4 space-y-1.5">
					<li><strong className="text-foreground">Right to know:</strong> you may request disclosure of the categories and specific pieces of personal information we have collected about you, the purposes for which it was collected, the categories of sources, and the third parties to which it was disclosed.</li>
					<li><strong className="text-foreground">Right to delete:</strong> you may request deletion of your personal information, subject to exceptions for legal compliance, security, and dispute resolution.</li>
					<li><strong className="text-foreground">Right to correct:</strong> you may request correction of inaccurate personal information.</li>
					<li><strong className="text-foreground">Right to opt out of sale:</strong> we do not sell your personal information, so no opt-out is necessary. You do not need to submit a request for this right.</li>
					<li><strong className="text-foreground">Right to opt out of sharing:</strong> we do not share your personal information for cross-context behavioral advertising.</li>
					<li><strong className="text-foreground">Right to limit use of sensitive personal information:</strong> we do not collect sensitive personal information as defined by the CPRA (e.g., Social Security numbers, health data, precise geolocation) except for payment processing, which is handled by Stripe.</li>
					<li><strong className="text-foreground">Right to non-discrimination:</strong> we will not discriminate against you for exercising your CCPA rights.</li>
				</ul>
				<LegalP>
					To submit a CCPA request, email{" "}
					<a href="mailto:privacy@trumbo.dev" className="text-brand underline-offset-2 hover:underline">
						privacy@trumbo.dev
					</a>{" "}
					with the subject line "CCPA Request." We will verify your identity by matching the
					email address on your request to the email address on your Trumbo account.
					Authorized agents may submit requests on your behalf with written authorization.
				</LegalP>
			</LegalSection>

			<LegalSection title="9. Cookies and Tracking Technologies">
				<LegalP>
					The Platform uses only essential cookies necessary for authentication, session
					management, and security. Specifically:
				</LegalP>
				<ul className="ml-4 space-y-1.5">
					<li><strong className="text-foreground">Authentication cookies:</strong> a session token cookie is set when you log in to the Platform. This cookie is HttpOnly, Secure, and SameSite=Lax. It expires when you log out or after 30 days of inactivity.</li>
					<li><strong className="text-foreground">CSRF token cookies:</strong> a CSRF token cookie is set for form submissions on the Platform. This cookie is not HttpOnly (it must be readable by JavaScript) but is Secure and SameSite=Lax.</li>
				</ul>
				<LegalP>
					We do not use: tracking cookies (Google Analytics, Mixpanel, Amplitude, etc.);
					advertising cookies or pixels (Google Ads, Facebook Pixel, LinkedIn Insight Tag,
					etc.); third-party analytics trackers; fingerprinting scripts; or any technology
					that tracks your behavior across other websites. The CLI does not set cookies or
					local storage items for tracking purposes. The only local storage the CLI uses is
					for configuration, session state, and opt-in telemetry data, all of which reside
					on your own machine.
				</LegalP>
			</LegalSection>

			<LegalSection title="10. Children's Privacy">
				<LegalP>
					The Services are not directed to individuals under the age of 16 and are not
					intended for use by children. We do not knowingly collect personal information from
					individuals under 16. If you are under 16, do not create a Trumbo account or use
					the Platform. If we become aware that we have collected personal information from a
					child under 16, we will promptly delete it. If you believe we have collected
					information from a child, contact{" "}
					<a href="mailto:privacy@trumbo.dev" className="text-brand underline-offset-2 hover:underline">
						privacy@trumbo.dev
					</a>
					.
				</LegalP>
			</LegalSection>

			<LegalSection title="11. International Data Transfers">
				<LegalP>
					Your personal information may be processed in countries other than your country of
					residence, including the United States (where {entity} is incorporated and where
					our infrastructure providers operate), Ireland (where Stripe's European operations
					are based), and other locations where our subprocessors maintain infrastructure.
				</LegalP>
				<LegalP>
					For transfers of personal information from the EEA, UK, or Switzerland to countries
					that have not been deemed to provide an adequate level of protection (adequacy
					decision), we rely on Standard Contractual Clauses (SCCs) as adopted by the
					European Commission, the UK's International Data Transfer Agreement (IDTA), or
					other appropriate transfer mechanisms. We have implemented supplementary measures
					where required, including encryption of data in transit and at rest, pseudonymized
					storage of session data, and minimized data exposure to subprocessors.
				</LegalP>
				<LegalP>
					If you would like more information about the specific transfer mechanisms we use,
					contact{" "}
					<a href="mailto:privacy@trumbo.dev" className="text-brand underline-offset-2 hover:underline">
						privacy@trumbo.dev
					</a>
					.
				</LegalP>
			</LegalSection>

			<LegalSection title="12. Data Protection Officer">
				<LegalP>
					{entity} has appointed a data protection officer (DPO) responsible for overseeing
					compliance with this Policy and applicable data protection laws. The DPO can be
					contacted at{" "}
					<a href="mailto:privacy@trumbo.dev" className="text-brand underline-offset-2 hover:underline">
						privacy@trumbo.dev
					</a>
					. The DPO is available for all issues related to the processing of your personal
					information and the exercise of your rights under this Policy.
				</LegalP>
			</LegalSection>

			<LegalSection title="13. Changes to This Privacy Policy">
				<LegalP>
					We may update this Privacy Policy from time to time to reflect changes in our
					practices, legal requirements, or operational needs. When we make material changes,
					we will: notify you by email at least 14 days before the changes take effect; post
					the updated Policy on this page with a revised "Last updated" date; and provide a
					summary of the changes at the top of the updated Policy. Continued use of the
					Services after the effective date of the changes constitutes acceptance of the
					updated Policy.
				</LegalP>
				<LegalP>
					We will not make retroactive changes that reduce your privacy protections without
					your explicit consent. If a change requires your consent under applicable law, we
					will seek your consent before the change takes effect.
				</LegalP>
			</LegalSection>

			<LegalSection title="14. Contact Information">
				<LegalP>
					If you have any questions, concerns, or requests regarding this Privacy Policy or
					our data practices, please contact us using any of the following methods:
				</LegalP>
				<ul className="ml-4 space-y-1.5">
					<li><strong className="text-foreground">Privacy inquiries:</strong>{" "}
						<a href="mailto:privacy@trumbo.dev" className="text-brand underline-offset-2 hover:underline">privacy@trumbo.dev</a>
					</li>
					<li><strong className="text-foreground">Data Protection Officer:</strong>{" "}
						<a href="mailto:privacy@trumbo.dev" className="text-brand underline-offset-2 hover:underline">privacy@trumbo.dev</a>
					</li>
					<li><strong className="text-foreground">Security reports:</strong>{" "}
						<a href="mailto:security@trumbo.dev" className="text-brand underline-offset-2 hover:underline">security@trumbo.dev</a>
					</li>
					<li><strong className="text-foreground">Legal entity:</strong> {entity}</li>
				</ul>
			</LegalSection>
		</LegalPage>
	);
}

/* -------------------------------------------------------------------------- */
/* Terms of Service                                                            */
/* -------------------------------------------------------------------------- */

export function TermsPage() {
	return (
		<LegalPage title="Terms of Service" kicker="Legal">
			<p className="font-stat text-xs uppercase tracking-[0.08em] text-muted-foreground">
				Last updated: {lastUpdated}
			</p>
			<p>
				These Terms of Service ("Terms") constitute a legally binding agreement between you
				("you," "your," or "user") and {entity} ("Trumbo," "we," "us," or "our") governing
				your access to and use of the Trumbo command-line interface (the "CLI"),
				{` ${platform}`} (the "Platform"), the Trumbo Quartz reasoning model, hosted open
				models, session management, team features, and any related tools, documentation,
				application programming interfaces (APIs), and services (collectively, the
				"Services"). By accessing or using the Services, you acknowledge that you have read,
				understood, and agree to be bound by these Terms. If you do not agree to these Terms,
				you must not access or use the Services. Your use of the Services is also subject to
				our Privacy Policy and Refund Policy, which are incorporated by reference into these
				Terms.
			</p>

			<LegalSection title="1. Eligibility and Capacity">
				<LegalP>
					You must be at least 16 years of age to use the Services. If you are between 16 and
					18 years old, you represent that your parent or legal guardian has reviewed and
					agreed to these Terms on your behalf. You must be legally capable of entering into
					a binding contract under the laws of your jurisdiction of residence. By using the
					Services, you represent and warrant that: (a) all information you provide is
					accurate and complete; (b) you have the authority to bind yourself or, if
					applicable, your organization to these Terms; (c) you are not prohibited from using
					the Services under applicable law; and (d) you have not been previously suspended
					or terminated from the Services.
				</LegalP>
				<LegalP>
					If you are using the Services on behalf of an organization, you represent and
					warrant that you have the authority to bind that organization to these Terms, and
					all references to "you" and "your" in these Terms apply to both you individually
					and your organization.
				</LegalP>
			</LegalSection>

			<LegalSection title="2. Description of Services">
				<LegalP>
					Trumbo provides the following Services:
				</LegalP>
				<ul className="ml-4 space-y-1.5">
					<li><strong className="text-foreground">(a) CLI.</strong> An open source command-line interface for AI-assisted software development, including file editing, shell command execution, codebase search, MCP tool integration, session management, checkpoint-based rewind, permission management, and multi-provider model routing. The CLI is published under the MIT license at github.com/xedro98/Trumbo and is available as @trumbodev/cli on npm.</li>
					<li><strong className="text-foreground">(b) Platform.</strong> A web application at {platform} for account registration, subscription management, billing, team administration, session browsing, and rate-limit monitoring.</li>
					<li><strong className="text-foreground">(c) Hosted models.</strong> Access to 210+ open models hosted on our inference infrastructure, including models from DeepSeek, Qwen, Llama, Mistral, Zhipu GLM, Moonshot, MiniMax, and others. The full catalog is available at {domain}/models.</li>
					<li><strong className="text-foreground">(d) Quartz.</strong> Access to the Trumbo Quartz adaptive compound reasoning model, which dynamically scales inference computation based on task complexity, with confidence-guided verification and reflection.</li>
					<li><strong className="text-foreground">(e) Session persistence.</strong> Server-side storage of session history, checkpoints, permissions, and tool configurations, enabling session resume across CLI invocations.</li>
					<li><strong className="text-foreground">(f) Team features.</strong> On Ultra plans: shared team sessions, team-level permission policies, scheduled jobs, headless CI execution, and integrations with Slack, Discord, and Linear.</li>
				</ul>
				<LegalP>
					The CLI is open source software governed by the MIT license. Your use of the CLI
					source code, modifications, and distributions is governed by the MIT license, not
					by these Terms. These Terms govern your use of the Platform, hosted models, Quartz,
					and other server-side Services that require a Trumbo account or subscription. You
					may use the CLI without a Trumbo subscription if you provide your own model
					provider API keys.
				</LegalP>
			</LegalSection>

			<LegalSection title="3. Account Registration and Security">
				<LegalP>
					To access the Platform, hosted models, and Quartz, you must create a Trumbo
					account. You agree to: (a) provide accurate, current, and complete information
					during registration; (b) maintain the security of your password and credentials;
					(c) promptly update your account information if any details change; and (d) accept
					responsibility for all activities that occur under your account, whether or not you
					authorized them.
				</LegalP>
				<LegalP>
					You must not: share your account credentials with others; use another person's
					account without authorization; create multiple accounts to circumvent rate limits;
					or sell, transfer, or assign your account to another party without our written
					consent.
				</LegalP>
				<LegalP>
					If you suspect any unauthorized use of your account, you must notify us immediately
					at{" "}
					<a href="mailto:security@trumbo.dev" className="text-brand underline-offset-2 hover:underline">
						security@trumbo.dev
					</a>
					. We are not liable for any loss or damage arising from unauthorized access to your
					account due to your failure to maintain credential security. We may require
					verification of your identity before processing account changes.
				</LegalP>
			</LegalSection>

			<LegalSection title="4. Acceptable Use Policy">
				<LegalP>
					You agree that you will not, and will not permit any third party to, use the
					Services to:
				</LegalP>
				<ul className="ml-4 space-y-1.5">
					<li>Violate any applicable local, state, national, or international law or regulation, including export control laws, sanctions, and data protection laws;</li>
					<li>Generate, distribute, or facilitate malware, ransomware, phishing content, exploits, or other malicious code;</li>
					<li>Create content that constitutes harassment, defamation, threats, or incitement to violence;</li>
					<li>Infringe upon the intellectual property rights, privacy rights, or other rights of any third party;</li>
					<li>Attempt to bypass, circumvent, manipulate, or disable rate limits, billing systems, authentication mechanisms, or security measures;</li>
					<li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Platform, Quartz model architecture, or any proprietary component of the Services;</li>
					<li>Scrape, crawl, spider, or systematically extract data from the Platform or use bots to automate interactions beyond the CLI's intended API;</li>
					<li>Resell, sublicense, redistribute, or otherwise provide access to the Services to third parties on a commercial basis without our prior written authorization;</li>
					<li>Use the Services to train, fine-tune, evaluate, or benchmark competing AI models or AI services without our express written consent;</li>
					<li>Interfere with, disrupt, or overload the Services, including by submitting requests at a rate that exceeds your rate limits, transmitting viruses or malicious code, or attacking the Platform's infrastructure;</li>
					<li>Submit content that is illegal, harmful, fraudulent, infringing, or otherwise objectionable under applicable law;</li>
					<li>Use the Services in connection with automated voting, fake account creation, social media manipulation, or other forms of platform abuse;</li>
					<li>Probe, scan, or test the vulnerability of the Services or any associated system or network without authorization;</li>
				</ul>
				<LegalP>
					Violations of this Acceptable Use Policy may result in: temporary suspension of
					your account; permanent termination of your account; blocking of your IP address;
					reporting to relevant law enforcement authorities; and forfeiture of any remaining
					subscription period without refund. We reserve the right to determine, at our sole
					discretion, whether a violation has occurred and what remedial action is
					appropriate.
				</LegalP>
				<LegalP>
					We reserve the right to modify, suspend, or discontinue any feature of the Services
					at any time, with or without notice. We will use commercially reasonable efforts to
					provide advance notice of material changes or discontinuations.
				</LegalP>
			</LegalSection>

			<LegalSection title="5. Subscriptions, Billing, and Rate Limits">
				<LegalP>
					<strong className="text-foreground">5.1 Plans and pricing.</strong> Paid
					subscriptions are billed monthly in advance through Stripe. Current plans (Pro, Max,
					Ultra) and their prices are described at {domain}/pricing. All prices are in U.S.
					dollars (USD). We may change pricing at any time, but price changes will not affect
					your current billing cycle. New pricing takes effect at the next renewal date after
					the change is announced.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">5.2 Rate limits.</strong> Each plan includes
					three rate-limit windows: a 5-hour window, a daily window, and a weekly window.
					When any window's request count reaches its limit, the CLI pauses new requests to
					hosted models until the window resets. The 5-hour window resets 5 hours after the
					first request in that window. The daily window resets at 00:00 UTC. The weekly
					window resets 7 days after your subscription start date. Rate limits are enforced
					server-side per account and cannot be bypassed, extended, or manipulated through
					CLI modifications, configuration changes, or any other client-side method. Unused
					requests do not roll over to the next window. Rate limits are a core design
					decision of our pricing model and are not negotiable.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">5.3 Upgrades.</strong> You may upgrade your
					plan at any time from the Platform dashboard. Upgrades take effect immediately. The
					price difference between your current plan and the new plan is prorated based on
					the number of remaining days in your current billing cycle. The prorated upgrade
					charge is processed at the time of upgrade and is non-refundable (see Refund
					Policy, Section 4). Your new plan's rate limits take effect immediately.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">5.4 Downgrades.</strong> You may downgrade
					your plan at any time. Downgrades take effect at the end of your current billing
					cycle. You retain access to your current (higher) plan's features and rate limits
					until the cycle ends. No partial refund is issued for the remaining days at the
					higher plan rate (see Refund Policy, Section 4).
				</LegalP>
				<LegalP>
					<strong className="text-foreground">5.5 Cancellation.</strong> You may cancel your
					subscription at any time from the Platform dashboard. Cancellation prevents the
					next renewal charge but does not refund the current billing cycle. You retain
					access to your plan's features until the end of the current cycle. After
					cancellation, your account reverts to the free tier (CLI-only with your own keys)
					at the end of the cycle.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">5.6 Automatic renewal.</strong> Unless you
					cancel before the renewal date, your subscription automatically renews on the
					renewal date for the same plan and term, and your payment method is charged the
					then-current monthly price. You authorize Stripe to charge your payment method for
					all recurring subscription fees.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">5.7 Taxes.</strong> Subscription prices
					exclude applicable taxes (sales tax, value-added tax (VAT), goods and services tax
					(GST), digital services tax, and similar levies). You are responsible for paying
					all such taxes associated with your subscription, except for taxes based on
					{` ${entity}'s`} net income. Where required by law, we will collect and remit
					taxes on your behalf and include them in your invoice.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">5.8 Price changes.</strong> We may change our
					subscription prices at any time. We will notify you by email at least 30 days
					before a price increase takes effect. If you do not agree with the price change,
					you may cancel before the effective date to avoid the new price. Price increases do
					not affect the current billing cycle.
				</LegalP>
			</LegalSection>

			<LegalSection title="6. Bring Your Own Keys">
				<LegalP>
					The Trumbo CLI supports 50+ model providers natively through the Trumbo SDK,
					including Anthropic, OpenAI, Google Gemini, Google Vertex AI, AWS Bedrock, Mistral,
					OpenRouter, Groq, Together AI, Cerebras, SambaNova, DeepSeek, xAI, Cohere, AI21
					Labs, Perplexity, Hugging Face, Ollama (local), LM Studio (local), and many more.
					When you configure your own API keys for any of these providers, the CLI sends
					requests directly from your machine to the provider's API endpoint.
				</LegalP>
				<LegalP>
					Trumbo does not intercept, proxy, route, log, cache, or store requests made with
					your own keys. The request and response payloads travel directly between your
					machine and the provider. You are solely responsible for: (a) complying with the
					provider's terms of service, acceptable use policy, and rate limits; (b) managing
					your API key security and rotation; (c) paying all charges incurred with the
					provider; and (d) ensuring your use of the provider's models complies with
					applicable law. Requests made with your own keys do not count against Trumbo rate
					limits.
				</LegalP>
				<LegalP>
					You may use the CLI with your own keys without a Trumbo subscription. The CLI's
					core features (file editing, shell, search, MCP tools, sessions, checkpoints,
					permissions) work identically regardless of whether you use Trumbo-hosted models or
					your own provider keys.
				</LegalP>
			</LegalSection>

			<LegalSection title="7. Intellectual Property Rights">
				<LegalP>
					<strong className="text-foreground">7.1 CLI (open source).</strong> The Trumbo CLI
					is open source software licensed under the MIT License. Under the MIT License, you
					are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
					copies of the CLI, subject to the condition that the copyright notice and
					permission notice are included in all copies or substantial portions of the
					software. The CLI is provided "as is" without warranty of any kind, as stated in
					the MIT License. Your use of the CLI source code is governed by the MIT License,
					not by these Terms. The full text of the MIT License is available in the repository
					at github.com/xedro98/Trumbo.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">7.2 Platform and Quartz (proprietary).</strong>
					The Trumbo Platform (including all web interfaces, APIs, server-side logic,
					database schemas, billing infrastructure, rate-limit enforcement, and
					administrative tools), the Trumbo Quartz reasoning model (including its
					architecture, training data, model weights, inference engine, and related
					software), and all associated documentation, designs, logos, brand assets, and
					content are proprietary and owned exclusively by {entity}. No license, express or
					implied, is granted to use any of these except as expressly provided in these
					Terms. You may not copy, modify, distribute, reverse engineer, or create
					derivative works of the Platform or Quartz without our prior written consent.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">7.3 Your content.</strong> You retain all
					ownership rights in and to any code, prompts, data, documents, files, and other
					materials you create, upload, or process through the Services ("Your Content"). By
					using the Services, you grant {entity} a limited, non-exclusive, non-transferable,
					revocable license to process Your Content solely for the purpose of providing and
					operating the Services (e.g., sending prompts to models, storing session history,
					generating checkpoints). We do not use Your Content to train, fine-tune, evaluate,
					or benchmark any AI model. We do not share Your Content with any third party except
					as necessary to provide the Services (e.g., transmitting prompts to our inference provider
					for inference). Your Content stored in sessions is encrypted at rest and is
					accessible only to you (and, for team sessions, to team members you have
					authorized).
				</LegalP>
				<LegalP>
					<strong className="text-foreground">7.4 Feedback.</strong> If you provide feedback,
					suggestions, ideas, or feature requests regarding the Services ("Feedback"), you
					grant {entity} a perpetual, irrevocable, worldwide, royalty-free, fully paid-up
					license to use, implement, commercialize, and exploit such Feedback without any
					obligation to compensate you. Feedback is provided voluntarily and is not
					confidential.
				</LegalP>
			</LegalSection>

			<LegalSection title="8. Disclaimers and Warranties">
				<LegalP>
					<strong className="text-foreground">8.1 As-is.</strong> The Services are provided
					"as is" and "as available," without warranties of any kind, whether express,
					implied, statutory, or otherwise. To the maximum extent permitted by applicable
					law, {entity} disclaims all implied warranties, including but not limited to
					implied warranties of merchantability, fitness for a particular purpose, title,
					and non-infringement. We do not warrant that the Services will be uninterrupted,
					error-free, secure, or available at all times. We do not warrant that the results
					obtained from using the Services will be accurate, reliable, or suitable for any
					particular purpose.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">8.2 AI output accuracy.</strong> The Services
					generate responses using AI models that may produce inaccurate, incomplete, biased,
					or misleading outputs. AI-generated code may contain bugs, security
					vulnerabilities, or logic errors. You are solely responsible for reviewing,
					verifying, testing, and validating all AI-generated outputs before using them in
					any production environment, submitting them to any repository, or distributing them
					to any third party. {entity} is not liable for any damages or losses resulting from
					your reliance on AI-generated content.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">8.3 Third-party models.</strong> When you use
					hosted open models (e.g., DeepSeek, Qwen, Llama) or your own provider keys, the
					model outputs are governed by the respective model provider's terms and licenses.
					{entity} does not warrant the accuracy, safety, or fitness of any third-party
					model's outputs.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">8.4 No professional advice.</strong> The
					Services are not intended to provide legal, medical, financial, or professional
					advice. Outputs generated by the Services should not be relied upon as a substitute
					for professional advice from a qualified practitioner.
				</LegalP>
			</LegalSection>

			<LegalSection title="9. Limitation of Liability">
				<LegalP>
					<strong className="text-foreground">9.1 Exclusion of indirect damages.</strong> To
					the maximum extent permitted by applicable law, in no event shall {entity}, its
					directors, officers, employees, contractors, affiliates, or service providers be
					liable for any indirect, incidental, special, consequential, exemplary, or
					punitive damages, including but not limited to damages for loss of profits, revenue,
					data, business opportunities, goodwill, anticipated savings, or data corruption,
					arising out of or in any way related to the Services, these Terms, or your use of
					or inability to use the Services, whether based on warranty, contract, tort
					(including negligence), strict liability, or any other legal theory, and whether or
					not {entity} has been advised of the possibility of such damages.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">9.2 Aggregate liability cap.</strong> To the
					maximum extent permitted by applicable law, the total aggregate liability of
					{entity} for all claims arising out of or related to these Terms or the Services,
					whether in contract, tort (including negligence), or any other legal theory, shall
					not exceed the greater of: (a) the total amount you paid to {entity} for the
					Services in the 12-month period immediately preceding the event giving rise to the
					claim; or (b) $50 USD.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">9.3 Essential basis.</strong> The limitations
					and exclusions in this Section 9 apply even if any remedy fails of its essential
					purpose. You acknowledge and agree that the limitations of liability set forth in
					this Section 9 are a reasonable allocation of risk between you and {entity} and are
					an essential basis of the bargain between the parties.
				</LegalP>
			</LegalSection>

			<LegalSection title="10. Indemnification">
				<LegalP>
					You agree to indemnify, defend, and hold harmless {entity}, its affiliates,
					directors, officers, employees, contractors, and service providers from and
					against any and all claims, lawsuits, damages, losses, liabilities, settlements,
					judgments, costs, and expenses (including reasonable attorneys' fees and court
					costs) arising out of or relating to: (a) your use of the Services; (b) your
					violation of these Terms; (c) your violation of any applicable law or third-party
					rights (including intellectual property rights and privacy rights); (d) any
					content you submit, process, or generate through the Services; (e) your use of
					third-party models via your own API keys; or (f) any inaccurate or misleading
					information you provide to us.
				</LegalP>
				<LegalP>
					We reserve the right, at our own expense, to assume the exclusive defense and
					control of any matter otherwise subject to indemnification by you, in which case
					you will cooperate with us in asserting any available defenses. You may not settle
					any matter without our prior written consent.
				</LegalP>
			</LegalSection>

			<LegalSection title="11. Termination and Suspension">
				<LegalP>
					<strong className="text-foreground">11.1 Termination by you.</strong> You may
					terminate your account at any time by canceling your subscription from the Platform
					dashboard and requesting account deletion. Upon termination, your right to use the
					Services ceases immediately, except for the free CLI with your own model keys,
					which is governed by the MIT License and remains available to you.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">11.2 Termination by us.</strong> We may
					suspend or terminate your account immediately, without prior notice, if: (a) you
					violate these Terms or our Acceptable Use Policy; (b) we suspect fraudulent,
					abusive, or unlawful activity associated with your account; (c) you fail to pay
					subscription fees when due; (d) your continued use of the Services poses a risk to
					the security, integrity, or availability of the Services or other users; or (e)
					required by law or government order.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">11.3 Effect of termination.</strong> Upon
					termination for any reason: (a) your subscription ends and no further charges are
					processed (except for charges already incurred); (b) your rate-limited access to
					hosted models and Quartz ceases; (c) your session data remains accessible for 30
					days, after which it is permanently deleted (unless you request earlier deletion);
					(d) we will delete your personal data in accordance with our Privacy Policy's
					retention schedule; and (e) no refunds are provided for termination due to
					violation of these Terms (see Refund Policy, Section 6).
				</LegalP>
				<LegalP>
					<strong className="text-foreground">11.4 Survival.</strong> Sections 7
					(Intellectual Property), 8 (Disclaimers), 9 (Limitation of Liability), 10
					(Indemnification), 12 (Governing Law), and any other provisions that by their
					nature should survive termination will remain in effect after account termination.
				</LegalP>
			</LegalSection>

			<LegalSection title="12. Governing Law, Jurisdiction, and Dispute Resolution">
				<LegalP>
					<strong className="text-foreground">12.1 Governing law.</strong> These Terms and
					any dispute arising out of or related to them or the Services shall be governed by
					and construed in accordance with the laws of the State of Delaware, United States
					of America, without giving effect to its conflict of laws principles. The United
					Nations Convention on Contracts for the International Sale of Goods (CISG) does not
					apply.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">12.2 Binding arbitration.</strong> Any dispute,
					claim, or controversy arising out of or relating to these Terms or the Services
					("Dispute") shall be resolved through final and binding arbitration administered by
					the American Arbitration Association (AAA) under its Consumer Arbitration Rules
					then in effect. The arbitration shall be conducted in Wilmington, Delaware, USA,
					in the English language, by a single arbitrator appointed in accordance with the
					AAA rules. The arbitrator's award shall be final and binding, and judgment on the
					award may be entered in any court of competent jurisdiction.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">12.3 Class action waiver.</strong> You and
					{entity} agree that each party may bring claims against the other only in an
					individual capacity, and not as a plaintiff or class member in any purported class,
					consolidated, or representative proceeding. You and {entity} expressly waive any
					right to participate in a class action lawsuit or class-wide arbitration.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">12.4 Statute of limitations.</strong> You must
					bring any claim within one (1) year after the cause of action arises, or the claim
					is permanently barred.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">12.5 Informal dispute resolution.</strong>
					Before initiating arbitration, you and {entity} agree to attempt to resolve the
					Dispute informally. The party initiating the dispute must notify the other party in
					writing of the nature of the dispute and the requested resolution. The parties have
					60 days from the date of notification to resolve the dispute informally. If the
					dispute is not resolved within 60 days, either party may initiate arbitration.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">12.6 Small claims court.</strong> Notwithstanding
					the arbitration requirement above, either party may bring an action in small claims
					court for disputes within the jurisdictional limits of that court.
				</LegalP>
			</LegalSection>

			<LegalSection title="13. Changes to These Terms">
				<LegalP>
					We may modify these Terms at any time. If we make material changes, we will: (a)
					notify you by email at least 14 days before the changes take effect; (b) post the
					updated Terms at {domain}/terms with a revised "Last updated" date; and (c) provide
					a summary of the material changes. Continued use of the Services after the
					effective date constitutes acceptance of the updated Terms.
				</LegalP>
				<LegalP>
					If a material change is detrimental to you and you do not agree with it, you may
					cancel your subscription before the effective date to avoid being bound by the new
					Terms. We will issue a prorated refund for the unused portion of your billing cycle
					in such cases.
				</LegalP>
			</LegalSection>

			<LegalSection title="14. General Provisions">
				<LegalP>
					<strong className="text-foreground">14.1 Entire agreement.</strong> These Terms,
					together with the Privacy Policy and Refund Policy, constitute the entire agreement
					between you and {entity} regarding the Services and supersede all prior or
					contemporaneous agreements, communications, and understandings, whether written or
					oral.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">14.2 Severability.</strong> If any provision of
					these Terms is held by a court or arbitrator to be invalid, illegal, or
					unenforceable, the remaining provisions will remain in full force and effect, and
					the invalid provision will be modified to the minimum extent necessary to make it
					enforceable.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">14.3 Waiver.</strong> Our failure to enforce
					any right or provision in these Terms will not constitute a waiver of our right to
					enforce that right or provision in the future. No waiver will be effective unless in
					writing and signed by an authorized representative of {entity}.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">14.4 Assignment.</strong> You may not assign,
					transfer, or sublicense these Terms or your account without our prior written
					consent. We may assign these Terms to a successor entity in connection with a
					merger, acquisition, or asset sale without your consent, provided we notify you of
					the assignment.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">14.5 Force majeure.</strong> We are not liable
					for any failure or delay in performance due to events beyond our reasonable
					control, including acts of God, natural disasters, war, terrorism, civil unrest,
					pandemics, government actions, labor disputes, internet or telecommunications
					failures, and outages of third-party service providers (e.g., infrastructure
					hosts, Stripe).
				</LegalP>
				<LegalP>
					<strong className="text-foreground">14.6 Electronic communications.</strong> You
					consent to receive communications from us electronically, including by email and
					through the Platform. You agree that all agreements, notices, disclosures, and
					other communications we provide electronically satisfy any legal requirement that
					such communications be in writing.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">14.7 No third-party beneficiaries.</strong>{" "}
					These Terms are for the benefit of you and {entity} only and do not create any
					rights for any third party.
				</LegalP>
			</LegalSection>

			<LegalSection title="15. Contact">
				<LegalP>
					If you have questions, concerns, or legal inquiries about these Terms, contact us
					at{" "}
					<a href="mailto:legal@trumbo.dev" className="text-brand underline-offset-2 hover:underline">
						legal@trumbo.dev
					</a>
					. For security reports, contact{" "}
					<a href="mailto:security@trumbo.dev" className="text-brand underline-offset-2 hover:underline">
						security@trumbo.dev
					</a>
					.
				</LegalP>
			</LegalSection>
		</LegalPage>
	);
}

/* -------------------------------------------------------------------------- */
/* Refund Policy                                                               */
/* -------------------------------------------------------------------------- */

export function RefundPage() {
	return (
		<LegalPage title="Refund Policy" kicker="Legal">
			<p className="font-stat text-xs uppercase tracking-[0.08em] text-muted-foreground">
				Last updated: {lastUpdated}
			</p>
			<p>
				This Refund Policy ("Policy") forms part of the Terms of Service between you and
				{` ${entity}`} and describes the terms, conditions, and procedures for refunds on
				Trumbo subscriptions purchased through {platform}. All subscription payments are
				processed by Stripe, our payment processor. By subscribing to any Trumbo plan, you
				acknowledge that you have read, understood, and agree to this Refund Policy. If you do
				not agree with this Policy, you must not purchase a subscription.
			</p>

			<LegalSection title="1. Overview of Billing Model">
				<LegalP>
					Trumbo uses a rate-limited subscription billing model, not a usage-based or
					per-token billing model. This means: (a) you pay a fixed monthly fee that grants
					access to a specific number of requests per rate-limit window (5-hour, daily, and
					weekly); (b) the fee is charged in advance at the beginning of each billing cycle;
					(c) the fee is the same regardless of how many requests you actually use during the
					cycle; and (d) unused requests do not roll over and are not refundable.
				</LegalP>
				<LegalP>
					This billing model is fundamentally different from per-token billing, where you pay
					only for what you consume. With rate-limited billing, you are paying for access to
					a capacity allocation, similar to a gym membership or an all-you-can-eat plan. This
					distinction is important for understanding the refund terms below.
				</LegalP>
			</LegalSection>

			<LegalSection title="2. 14-Day Money-Back Guarantee (New Subscriptions)">
				<LegalP>
					We offer a 14-day money-back guarantee on your first subscription payment. If you
					are not satisfied with the Services for any reason, you may request a full refund
					of your first subscription payment within 14 calendar days of the charge date. No
					questions will be asked, and no justification is required.
				</LegalP>
				<LegalP>
					To request a refund under this guarantee: (a) email{" "}
					<a href="mailto:billing@trumbo.dev" className="text-brand underline-offset-2 hover:underline">
						billing@trumbo.dev
					</a>{" "}
					with the subject line "14-Day Refund Request"; (b) include your Trumbo account email
					address and the date of purchase; and (c) we will process the refund and cancel
					your subscription within 5 to 10 business days. The refund will be credited back to
					your original payment method (the same card or bank account used for the purchase).
				</LegalP>
				<LegalP>
					<strong className="text-foreground">Conditions:</strong> The 14-day money-back
					guarantee applies only to your first subscription payment for a given Trumbo
					account. If you have previously held a Trumbo subscription (on any plan) and
					resubscribe, the new subscription is not eligible for the money-back guarantee.
					The guarantee does not apply to upgrade charges (see Section 4) or to accounts
					terminated for Terms of Service violations (see Section 6).
				</LegalP>
				<LegalP>
					Upon refund under this guarantee, your subscription is immediately canceled, your
					access to hosted models and Quartz is revoked, and your session data is scheduled
					for deletion after 30 days (unless you request earlier deletion).
				</LegalP>
			</LegalSection>

			<LegalSection title="3. Renewal Payments">
				<LegalP>
					Automatic renewal payments (i.e., charges processed on your renewal date for
					subsequent billing cycles) are non-refundable once the billing cycle has begun.
					This is because the renewal grants you immediate access to the Services for the
					entire cycle, and the cost is fixed regardless of usage.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">3.1 Billing errors.</strong> If you were
					charged in error, for example: (a) you canceled before the renewal date but were
					still charged; (b) you were charged the wrong amount; (c) you were charged after
					account termination; or (d) a duplicate charge was processed, we will issue a full
					refund within 5 business days of confirming the error. Contact{" "}
					<a href="mailto:billing@trumbo.dev" className="text-brand underline-offset-2 hover:underline">
						billing@trumbo.dev
					</a>{" "}
					immediately if you believe you were charged in error. Include your account email,
					the charge date, and a description of the error.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">3.2 Case-by-case review.</strong> For renewal
					payments that are not billing errors, we evaluate refund requests on a
					case-by-case basis. We may issue a full or partial refund if: (a) you experienced
					a significant service outage during the billing cycle (see Section 7); (b) you were
					unable to use the Services due to a documented medical emergency or other
					extraordinary circumstance; or (c) other extenuating circumstances justify a
					refund. We are not obligated to issue refunds in these cases but will consider each
					request fairly and respond within 5 business days.
				</LegalP>
			</LegalSection>

			<LegalSection title="4. Upgrades and Downgrades">
				<LegalP>
					<strong className="text-foreground">4.1 Upgrade charges.</strong> When you upgrade
					mid-cycle, you are charged the prorated difference between your current plan and
					the new plan for the remaining days in your billing cycle. This upgrade charge is
					non-refundable. If you upgrade and then immediately downgrade, the upgrade charge
					is not refunded, and the downgrade takes effect at the end of the current cycle.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">4.2 Downgrades.</strong> When you downgrade
					mid-cycle, the change takes effect at the end of your current billing cycle. You
					continue to pay the higher plan rate for the remainder of the cycle. No partial
					refund is issued for the difference between the higher and lower plan rates for the
					remaining days. This is because the higher plan's rate limits and features are
					available to you for the entire cycle.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">4.3 Plan changes after the 14-day
					guarantee.</strong> If you are within the 14-day money-back guarantee period and
					you upgrade your plan, the guarantee applies to the total amount paid (original
					subscription plus upgrade charge). If you request a refund during the guarantee
					period, the full amount is refunded.
				</LegalP>
			</LegalSection>

			<LegalSection title="5. Rate Limit Clarification">
				<LegalP>
					Trumbo charges a flat monthly fee for access to a fixed number of requests per
					rate-limit window. The cost is the same whether you use 0% or 100% of your
					allocated requests. Because the cost is not tied to actual usage, we do not issue
					partial refunds for: (a) unused requests in any rate-limit window; (b) days during
					the billing cycle when you did not use the Services; (c) periods of low activity;
					(d) requests that returned errors due to your input or configuration (as opposed
					to platform errors); or (e) requests made to models you did not intend to use.
				</LegalP>
				<LegalP>
					This policy is a fundamental aspect of rate-limited pricing and is clearly
					disclosed on our pricing page, in our FAQ, and at the point of purchase. If you
					prefer to pay only for what you use, you may use the CLI with your own provider API
					keys (e.g., Anthropic, OpenAI), which are billed by the provider on a per-token
					basis and do not involve Trumbo charges.
				</LegalP>
			</LegalSection>

			<LegalSection title="6. Account Termination">
				<LegalP>
					<strong className="text-foreground">6.1 Termination for cause.</strong> If we
					terminate your account for violation of our Terms of Service (including but not
					limited to rate-limit circumvention, abuse, fraud, unacceptable use, or
					intellectual property infringement), no refund will be issued for any portion of
					your current billing cycle. Your access to the Services is immediately revoked, and
					any remaining subscription period is forfeited.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">6.2 Termination by Trumbo without cause.</strong>
					If we terminate your account for reasons unrelated to your conduct (e.g., we
					discontinue the Services entirely, we cease operations, or we discontinue service
					in your region), we will issue a prorated refund for the unused portion of your
					current billing cycle. The prorated amount is calculated as: (monthly fee / 30) x
					(days remaining in cycle). The refund will be processed within 10 business days of
					termination.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">6.3 Voluntary cancellation.</strong> If you
					cancel your subscription voluntarily (not through the 14-day money-back guarantee),
					no refund is issued for the current billing cycle. You retain access to your plan's
					features and rate limits until the end of the current cycle, after which your
					account reverts to the free tier.
				</LegalP>
			</LegalSection>

			<LegalSection title="7. Service Outages and Credits">
				<LegalP>
					<strong className="text-foreground">7.1 Qualifying outages.</strong> If the Trumbo
					Platform or hosted model infrastructure experiences an outage that: (a) lasts more
					than 12 consecutive hours; (b) prevents you from sending any requests to hosted
					models or Quartz; and (c) is not caused by your own configuration, network, or
					provider key issues, we will issue a service credit equal to the prorated value of
					the outage duration. The credit is calculated as: (monthly fee / 720 hours) x
					(outage hours beyond 12). The credit will be applied to your next renewal charge.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">7.2 Non-qualifying events.</strong> The
					following do not qualify for service credits: (a) outages shorter than 12
					consecutive hours; (b) planned maintenance announced at least 48 hours in advance;
					(c) outages caused by your internet service provider, local network, or device;
					(d) outages caused by your own API key configuration (when using BYOK); (e)
					outages caused by force majeure events (see Terms, Section 14.5); and (f)
					outages affecting only the Platform web interface but not the CLI or API access.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">7.3 How to request a credit.</strong> To
					request a service credit, email{" "}
					<a href="mailto:billing@trumbo.dev" className="text-brand underline-offset-2 hover:underline">
						billing@trumbo.dev
					</a>{" "}
					with: (a) your account email; (b) the date and approximate start time of the
					outage; (c) the models or features affected; and (d) a description of the impact.
					We will verify the outage against our monitoring data and issue the credit within
					10 business days if the claim is confirmed.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">7.4 Maximum credits.</strong> The total
					service credits issued in any billing cycle shall not exceed one full month's
					subscription fee. Credits are non-transferable, non-redeemable for cash, and have
					no cash value.
				</LegalP>
			</LegalSection>

			<LegalSection title="8. Chargebacks and Payment Disputes">
				<LegalP>
					<strong className="text-foreground">8.1 Contact us first.</strong> If you believe
					a charge is incorrect or you are dissatisfied with the Services, you must contact
					us at{" "}
					<a href="mailto:billing@trumbo.dev" className="text-brand underline-offset-2 hover:underline">
						billing@trumbo.dev
					</a>{" "}
					before initiating a chargeback with your bank or credit card provider. We will work
					with you to resolve the issue and process any eligible refund within 5 to 10
					business days.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">8.2 Account suspension.</strong> If you
					initiate a chargeback without first contacting us, we reserve the right to suspend
					your account pending resolution. During suspension, you will not have access to
					hosted models, Quartz, or session data. We will cooperate fully with your bank's
					chargeback investigation and provide evidence of service delivery, billing terms,
					communication history, and applicable refund policies.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">8.3 Fraudulent chargebacks.</strong> A
					fraudulent chargeback is one initiated after you received and used the Services
					without a legitimate dispute (e.g., claiming "services not received" when usage
					records show active requests during the billing cycle). Fraudulent chargebacks may
					result in: (a) permanent account termination; (b) reporting to the relevant payment
					processor's fraud database; (c) reporting to consumer fraud databases; and (d)
					collection action for the disputed amount plus applicable fees.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">8.4 Reversal of chargebacks.</strong> If you
					initiate a chargeback and subsequently resolve the issue with us, you must
					immediately contact your bank to withdraw the chargeback. We will reinstate your
					account once the chargeback is withdrawn or reversed.
				</LegalP>
			</LegalSection>

			<LegalSection title="9. Refund Processing">
				<LegalP>
					<strong className="text-foreground">9.1 Processing time.</strong> Approved refunds
					are processed by Stripe within 5 to 10 business days of approval. The time for the
					refund to appear on your statement depends on your bank or card issuer: credit
					card refunds typically appear within 5 to 10 business days, debit card refunds
					within 7 to 14 business days, and bank transfers within 3 to 5 business days.
					{entity} is not responsible for delays caused by your bank or card issuer.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">9.2 Refund method.</strong> All refunds are
					credited back to the original payment method used for the purchase. We cannot
					refund to a different card, bank account, or payment method. If your original
					payment method is no longer active, Stripe will handle the refund according to its
					own policies (typically by issuing a credit to your account or sending a check).
				</LegalP>
				<LegalP>
					<strong className="text-foreground">9.3 Currency.</strong> All refunds are
					processed in U.S. dollars (USD), the same currency as the original charge. If your
					bank converts the refund to a different currency, the exchange rate is determined
					by your bank and may differ from the rate at the time of purchase. {entity} is not
					responsible for currency conversion losses.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">9.4 Tax refunds.</strong> Where applicable,
					refunds include any taxes (sales tax, VAT, GST) that were charged as part of the
					original transaction. If your tax authority requires a specific tax refund
					process, contact{" "}
					<a href="mailto:billing@trumbo.dev" className="text-brand underline-offset-2 hover:underline">
						billing@trumbo.dev
					</a>{" "}
					for assistance.
				</LegalP>
				<LegalP>
					<strong className="text-foreground">9.5 Receipt.</strong> You will receive an
					email receipt from Stripe confirming the refund amount, date, and payment method.
					Keep this receipt for your records.
				</LegalP>
			</LegalSection>

			<LegalSection title="10. Team Plan Refunds">
				<LegalP>
					If you are subscribed to the Ultra plan and have team members associated with your
					account, refunds are calculated based on the account owner's subscription fee
					only. We do not issue separate refunds for individual team members, as team access
					is included in the account owner's subscription. If a team member is removed from
					the account mid-cycle, no refund is issued for the removed member, as team
					members do not have individual subscriptions.
				</LegalP>
			</LegalSection>

			<LegalSection title="11. Promotional and Discounted Pricing">
				<LegalP>
					If you purchased a subscription at a promotional or discounted rate (e.g., a
					launch discount, a coupon code, an annual plan discount), the 14-day money-back
					guarantee applies to the amount you actually paid, not the regular price. Refunds
					for promotional subscriptions are limited to the discounted amount paid.
					Promotional pricing is not available retroactively, and we do not issue
					credits for the difference between promotional and regular pricing.
				</LegalP>
			</LegalSection>

			<LegalSection title="12. Changes to This Refund Policy">
				<LegalP>
					We may update this Refund Policy from time to time. Any changes will be posted on
					this page with a revised "Last updated" date. For material changes that reduce
					your refund rights, we will notify you by email at least 14 days before the changes
					take effect. Changes do not affect refund requests submitted before the change
					date, which are governed by the Policy in effect at the time of the request.
				</LegalP>
			</LegalSection>

			<LegalSection title="13. How to Contact Us">
				<LegalP>
					For any refund-related questions, disputes, or requests, contact us using the
					following methods:
				</LegalP>
				<ul className="ml-4 space-y-1.5">
					<li><strong className="text-foreground">Refund requests:</strong>{" "}
						<a href="mailto:billing@trumbo.dev" className="text-brand underline-offset-2 hover:underline">billing@trumbo.dev</a>
					</li>
					<li><strong className="text-foreground">Response time:</strong> 2 business days for initial response; 5 to 10 business days for refund processing</li>
					<li><strong className="text-foreground">Platform dashboard:</strong>{" "}
						{platform} (for billing history and subscription management)</li>
					<li><strong className="text-foreground">Legal entity:</strong> {entity}</li>
				</ul>
				<LegalP>
					When contacting us about a refund, please include: your Trumbo account email
					address, the date of the charge, the plan name, the amount charged, and the reason
					for your refund request. This information helps us process your request quickly and
					accurately.
				</LegalP>
			</LegalSection>
		</LegalPage>
	);
}
