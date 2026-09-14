import { inputClass, labelClass } from "@/lib/form-styles";
import type { Profile, RemotePreference } from "@/types";

type Props = {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
};

const REMOTE_PREFERENCE_OPTIONS: { value: RemotePreference; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "onsite", label: "Onsite" },
  { value: "hybrid", label: "Hybrid" },
  { value: "any", label: "Any" },
];

export function JobPreferencesSection({ profile, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-semibold text-text-primary">Job Preferences</h3>

      <div className="flex flex-col gap-2">
        <label htmlFor="jobTitlesSeeking" className={labelClass}>
          Job Titles Seeking
        </label>
        <input
          id="jobTitlesSeeking"
          type="text"
          value={profile.jobTitlesSeeking}
          onChange={(event) => onChange({ jobTitlesSeeking: event.target.value })}
          placeholder="E.g. Frontend Engineer, React Developer"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="remotePreference" className={labelClass}>
            Remote Preference
          </label>
          <select
            id="remotePreference"
            value={profile.remotePreference}
            onChange={(event) =>
              // Native <select> onChange always yields a plain string — narrowing to the
              // union is safe because `value` on every <option> below is one of these exact strings.
              onChange({ remotePreference: event.target.value as RemotePreference })
            }
            className={inputClass}
          >
            {REMOTE_PREFERENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="salaryExpectation" className={labelClass}>
            Salary Expectation (Optional)
          </label>
          <input
            id="salaryExpectation"
            type="text"
            value={profile.salaryExpectation}
            onChange={(event) => onChange({ salaryExpectation: event.target.value })}
            placeholder="E.g. $120k+"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="preferredLocations" className={labelClass}>
          Preferred Locations (Optional)
        </label>
        <input
          id="preferredLocations"
          type="text"
          value={profile.preferredLocations}
          onChange={(event) => onChange({ preferredLocations: event.target.value })}
          placeholder="E.g. New York, London"
          className={inputClass}
        />
      </div>
    </div>
  );
}
