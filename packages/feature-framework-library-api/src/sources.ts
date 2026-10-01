/**
 * The official texts the knowledge base points readers to. The Act's address is MeitY's
 * published PDF of Act No. 22 of 2023. The Rules are linked through MeitY's data protection
 * framework page rather than a direct PDF address, which could not be confirmed on 1 Oct 2026.
 */
export const OFFICIAL_SOURCES = {
  act: {
    title: 'The Digital Personal Data Protection Act, 2023 (No. 22 of 2023)',
    publisher: 'Ministry of Electronics and Information Technology',
    href: 'https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf',
  },
  framework: {
    title: 'Data protection framework: the DPDP Act and the DPDP Rules, 2025',
    publisher: 'Ministry of Electronics and Information Technology',
    href: 'https://www.meity.gov.in/data-protection-framework',
  },
} as const

/** The official source for a provision: Act sections go to the Act, the rest to MeitY's page. */
export const officialSourceFor = (kind: string) =>
  kind === 'section' ? OFFICIAL_SOURCES.act : OFFICIAL_SOURCES.framework
