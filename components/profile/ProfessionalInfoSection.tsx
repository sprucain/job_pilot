import { TagInput } from "@/components/profile/TagInput";
import { inputClass, labelClass } from "@/lib/form-styles";
import { EXPERIENCE_LEVEL_OPTIONS } from "@/lib/profile-options";
import type { ExperienceLevel, Profile } from "@/types";

type Props = {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
};

export function ProfessionalInfoSection({ profile, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-semibold text-text-primary">Professional Info</h3>

      <div className="flex flex-col gap-2">
        <label htmlFor="currentTitle" className={labelClass}>
          Current/Recent Job Title
        </label>
        <input
          id="currentTitle"
          type="text"
          value={profile.currentTitle}
          onChange={(event) => onChange({ currentTitle: event.target.value })}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="experienceLevel" className={labelClass}>
            Experience Level
          </label>
          <select
            id="experienceLevel"
            value={profile.experienceLevel}
            onChange={(event) =>
              // Native <select> onChange always yields a plain string — narrowing to the
              // union is safe because `value` on every <option> below is one of these exact strings.
              onChange({ experienceLevel: event.target.value as ExperienceLevel })
            }
            className={inputClass}
          >
            {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="yearsExperience" className={labelClass}>
            Years of Experience
          </label>
          <input
            id="yearsExperience"
            type="number"
            min={0}
            value={profile.yearsExperience}
            onChange={(event) => onChange({ yearsExperience: Number(event.target.value) })}
            className={inputClass}
          />
        </div>
      </div>

      <TagInput
        label="Skills"
        placeholder="Add a skill"
        value={profile.skills}
        onChange={(skills) => onChange({ skills })}
      />

      <TagInput
        label="Industries Worked In (Optional)"
        placeholder="E.g. FinTech, Healthcare"
        value={profile.industries}
        onChange={(industries) => onChange({ industries })}
      />
    </div>
  );
}
