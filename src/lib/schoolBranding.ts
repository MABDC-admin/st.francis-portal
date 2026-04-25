export const DEFAULT_SCHOOL_LOGO = '/assets/sfxsai-school-logo.png';

export const resolveSchoolLogo = (logoUrl?: string | null) => {
  return logoUrl || DEFAULT_SCHOOL_LOGO;
};

export const loadImageAsDataUrl = async (src: string) => {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Failed to load image: ${response.status}`);
  }

  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image as data URL'));
    reader.readAsDataURL(blob);
  });
};
