import { inputClass, labelClass } from "@/lib/form-styles";
import type { Profile } from "@/types";

type Props = {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
};

const DEGREE_OPTIONS = [
  "High School",
  "Associate",
  "Bachelor's",
  "Master's",
  "PhD",
  "Other",
];

export function EducationSection({ profile, onChange }: Props) {
  const education = profile.education;

  function updateEducation(patch: Partial<Profile["education"]>) {
    onChange({ education: { ...education, ...patch } });
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-semibold text-text-primary">Education</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="degree" className={labelClass}>
            Highest Degree
          </label>
          <select
            id="degree"
            value={education.degree}
            onChange={(event) => updateEducation({ degree: event.target.value })}
            className={inputClass}
          >
            {DEGREE_OPTIONS.map((degree) => (
              <option key={degree} value={degree}>
                {degree}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="fieldOfStudy" className={labelClass}>
            Field of Study
          </label>
          <input
            id="fieldOfStudy"
            type="text"
            value={education.fieldOfStudy}
            onChange={(event) => updateEducation({ fieldOfStudy: event.target.value })}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="institution" className={labelClass}>
            Institution Name
          </label>
          <input
            id="institution"
            type="text"
            value={education.institution}
            onChange={(event) => updateEducation({ institution: event.target.value })}
            placeholder="E.g. State University"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="graduationYear" className={labelClass}>
            Graduation Year
          </label>
          <input
            id="graduationYear"
            type="text"
            inputMode="numeric"
            value={education.graduationYear}
            onChange={(event) => updateEducation({ graduationYear: event.target.value })}
            placeholder="YYYY"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
