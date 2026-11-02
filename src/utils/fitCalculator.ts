import { FitResult, Job, Profile } from "../types";

export const splitKeywords = (value: string): string[] =>
  value
    .split(",")
    .map(v => v.trim().toLowerCase())
    .filter(Boolean);

export function calculateFit(job: Job, profile: Profile): FitResult {
  const roles = splitKeywords(profile.roles);
  const regions = splitKeywords(profile.regions);
  const userSkills = splitKeywords(profile.skills);
  const major = profile.major.toLowerCase();

  // 1. 직무 매칭 (40점 만점)
  const roleMatch = roles.some(r =>
    job.title.toLowerCase().includes(r) ||
    job.description.toLowerCase().includes(r)
  );

  // 2. 지역 매칭 (20점 만점)
  const regionMatch = regions.some(r =>
    job.region.toLowerCase().includes(r) ||
    r.includes(job.region.toLowerCase())
  );

  // 3. 기술 매칭 (30점 만점)
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  job.skills.forEach(skill => {
    const sLower = skill.toLowerCase();
    const isMatched = userSkills.some(v =>
      sLower.includes(v) || v.includes(sLower)
    );
    if (isMatched) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // 4. 전공 매칭 (10점 만점)
  const majorMatch = job.majors.some(m => major.includes(m.toLowerCase()) || m.toLowerCase().includes(major));

  const roleScore = roleMatch ? 40 : 0;
  const skillScore = job.skills.length
    ? Math.round((30 * matchedSkills.length) / job.skills.length)
    : 0;
  const regionScore = regionMatch ? 20 : 0;
  const majorScore = majorMatch ? 10 : 0;

  const score = Math.min(100, roleScore + skillScore + regionScore + majorScore);

  return {
    score,
    roleScore,
    skillScore,
    regionScore,
    majorScore,
    matchedSkills,
    missingSkills,
  };
}
