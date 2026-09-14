import { inputClass, labelClass } from "@/lib/form-styles";
import type { Profile, WorkAuthorization } from "@/types";

type Props = {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
};

const WORK_AUTHORIZATION_OPTIONS: { value: WorkAuthorization; label: string }[] = [
  { value: "citizen", label: "Citizen" },
  { value: "permanent_resident", label: "Permanent Resident" },
  { value: "visa_required", label: "Visa Required" },
];

export function PersonalInfoSection({ profile, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-semibold text-text-primary">Personal Info</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="fullName" className={labelClass}>
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={profile.fullName}
            onChange={(event) => onChange({ fullName: event.target.value })}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={profile.email}
            disabled
            className={`${inputClass} cursor-not-allowed bg-surface-secondary text-text-secondary`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className={labelClass}>
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            value={profile.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
            placeholder="+1 (555) 000-0000"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="location" className={labelClass}>
            Location
          </label>
          <input
            id="location"
            type="text"
            value={profile.location}
            onChange={(event) => onChange({ location: event.target.value })}
            placeholder="City, Country"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="linkedinUrl" className={labelClass}>
            LinkedIn URL
          </label>
          <input
            id="linkedinUrl"
            type="url"
            value={profile.linkedinUrl}
            onChange={(event) => onChange({ linkedinUrl: event.target.value })}
            placeholder="https://linkedin.com/in/username"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="portfolioUrl" className={labelClass}>
            Portfolio / GitHub
          </label>
          <input
            id="portfolioUrl"
            type="url"
            value={profile.portfolioUrl}
            onChange={(event) => onChange({ portfolioUrl: event.target.value })}
            placeholder="https://github.com/username"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="workAuthorization" className={labelClass}>
            Work Authorization
          </label>
          <select
            id="workAuthorization"
            value={profile.workAuthorization}
            onChange={(event) =>
              // Native <select> onChange always yields a plain string — narrowing to the
              // union is safe because `value` on every <option> below is one of these exact strings.
              onChange({ workAuthorization: event.target.value as WorkAuthorization })
            }
            className={inputClass}
          >
            {WORK_AUTHORIZATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
