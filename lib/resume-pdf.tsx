import { Document, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { GeneratedResumeContent } from "@/lib/resume-generation";
import type { Profile } from "@/types";

// @react-pdf/renderer renders server-side via PDFKit, not the DOM — it has no way
// to resolve `var(--color-*)` custom properties or Tailwind classes, so the literal
// hex values ui-tokens.md's tokens resolve to at build time are used directly here
// instead, as named constants rather than inline strings. See ui-tokens.md's
// "PDF/non-DOM renderers" exception for the full reasoning — same category of
// documented carve-out as the profile page's 3-level border-radius exception.
const PDF_TEXT_PRIMARY = "#101828"; // --color-text-primary
const PDF_TEXT_SECONDARY = "#6a7282"; // --color-text-secondary
const PDF_TEXT_DARK = "#364153"; // --color-text-dark

// Only these CSS properties render in @react-pdf/renderer — anything else (e.g.
// textTransform, borders) is silently ignored, per context/library-docs.md. Section
// headings are typed in caps directly rather than relying on textTransform.
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: PDF_TEXT_PRIMARY, lineHeight: 1.4 },
  header: { marginBottom: 12 },
  name: { fontSize: 20, fontWeight: "bold" },
  contact: { fontSize: 9, color: PDF_TEXT_SECONDARY, marginTop: 4 },
  section: { marginTop: 14 },
  heading: { fontSize: 11, fontWeight: "bold", marginBottom: 6 },
  role: { marginTop: 10 },
  roleHeader: { flexDirection: "row", justifyContent: "space-between" },
  roleTitle: { fontSize: 10, fontWeight: "bold" },
  roleDates: { fontSize: 9, color: PDF_TEXT_SECONDARY },
  roleCompany: { fontSize: 9.5, color: PDF_TEXT_DARK, marginTop: 1 },
  bullet: { fontSize: 9.5, marginTop: 3, marginLeft: 10 },
  paragraph: { fontSize: 9.5, lineHeight: 1.5 },
  eduLine: { fontSize: 9.5, marginTop: 2 },
});

type Props = {
  profile: Profile;
  content: GeneratedResumeContent;
};

function ResumeDocument({ profile, content }: Props) {
  const contactParts = [
    profile.email,
    profile.phone,
    profile.location,
    profile.linkedinUrl,
    profile.portfolioUrl,
  ].filter(Boolean);
  const hasEducation = Boolean(profile.education.degree || profile.education.institution);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{profile.fullName}</Text>
          {contactParts.length > 0 && <Text style={styles.contact}>{contactParts.join("   ·   ")}</Text>}
        </View>

        {content.summary && (
          <View style={styles.section}>
            <Text style={styles.heading}>SUMMARY</Text>
            <Text style={styles.paragraph}>{content.summary}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.heading}>EXPERIENCE</Text>
          {profile.workExperience.map((entry, index) => (
            <View key={index} style={styles.role}>
              <View style={styles.roleHeader}>
                <Text style={styles.roleTitle}>{entry.title}</Text>
                <Text style={styles.roleDates}>
                  {entry.startDate} - {entry.current ? "Present" : entry.endDate}
                </Text>
              </View>
              <Text style={styles.roleCompany}>{entry.company}</Text>
              {(content.workExperience[index]?.bullets ?? []).map((bullet, bulletIndex) => (
                <Text key={bulletIndex} style={styles.bullet}>
                  •   {bullet}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {hasEducation && (
          <View style={styles.section}>
            <Text style={styles.heading}>EDUCATION</Text>
            <Text style={styles.eduLine}>
              {[profile.education.degree, profile.education.fieldOfStudy].filter(Boolean).join(", ")}
            </Text>
            <Text style={styles.eduLine}>
              {[profile.education.institution, profile.education.graduationYear]
                .filter(Boolean)
                .join("   —   ")}
            </Text>
          </View>
        )}

        {profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>SKILLS</Text>
            <Text style={styles.paragraph}>{profile.skills.join(", ")}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function renderResumePdf(profile: Profile, content: GeneratedResumeContent): Promise<Buffer> {
  return renderToBuffer(<ResumeDocument profile={profile} content={content} />);
}
